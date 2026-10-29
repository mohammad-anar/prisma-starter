import { StatusCodes } from "http-status-codes";
import prisma from "../../config/prisma.js";
import ApiError from "../../utils/ApiError.js";
import { formatBloodGroupDetails, parseBloodGroupFilter } from "../../utils/bloodGroup.js";
import { calculateCountdown, toBengaliDigits } from "../../utils/countdown.js";
import { validateObjectId } from "../../utils/objectId.js";
import calculatePagination from "../../utils/pagination.js";
import { ICreateDonationRecord, IDonationRecordFilters } from "./donations.interface.js";

const createDonation = async (
  donorId: string,
  payload: ICreateDonationRecord,
  slipFilePath?: string,
) => {
  validateObjectId(donorId, "donorId");

  const donor = await prisma.user.findUnique({
    where: { id: donorId },
  });

  if (!donor) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Donor account not found");
  }

  if (donor.isBlocked) {
    throw new ApiError(StatusCodes.FORBIDDEN, "Your account has been blocked");
  }

  const parsedDate = new Date(payload.donationDate);
  if (isNaN(parsedDate.getTime())) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid donation date provided");
  }

  const now = new Date();
  if (parsedDate.getTime() > now.getTime()) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Donation date cannot be in the future",
    );
  }

  // 120-day interval rule: A donor cannot submit a new donation record within 120 days of their previous donation
  const latestDonation = await prisma.bloodDonateRecord.findFirst({
    where: {
      donorId,
      status: { in: ["APPROVED", "PENDING"] },
    },
    orderBy: { donationDate: "desc" },
  });

  if (latestDonation) {
    const lastDate = new Date(latestDonation.donationDate);
    const msSinceLast = now.getTime() - lastDate.getTime();
    const daysSinceLast = Math.floor(msSinceLast / (1000 * 60 * 60 * 24));
    const daysRemaining = 120 - daysSinceLast;

    if (daysRemaining > 0) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        `পূর্ববর্তী রক্তদানের ১২০ দিন পূর্ণ হওয়ার আগে নতুন রক্তদানের তথ্য জমা দেওয়া যাবে না। আর ${toBengaliDigits(daysRemaining)} দিন বাকি আছে।`,
      );
    }

    const msBetween = parsedDate.getTime() - lastDate.getTime();
    const daysBetween = Math.floor(msBetween / (1000 * 60 * 60 * 24));
    if (daysBetween < 120) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        `নতুন রক্তদানের তারিখটি পূর্ববর্তী রক্তদানের (${lastDate.toISOString().split("T")[0]}) কমপক্ষে ১২০ দিন পরের হতে হবে।`,
      );
    }
  }

  const slipUrl = slipFilePath || payload.slipUrl || null;

  // Security: New submissions default to PENDING status and cannot assign verifier
  const record = await prisma.bloodDonateRecord.create({
    data: {
      donorId,
      donationDate: parsedDate,
      donationAddress: payload.donationAddress.trim(),
      rugirDhoron: payload.rugirDhoron?.trim() || null,
      donationSlipNumber: payload.donationSlipNumber?.trim() || null,
      slipUrl,
      status: "PENDING",
    },
    include: {
      donor: {
        select: {
          id: true,
          name: true,
          phone: true,
          bloodGroup: true,
        },
      },
    },
  });

  return {
    ...record,
    bloodGroupDetails: formatBloodGroupDetails(record.donor.bloodGroup),
    message: "Donation record submitted successfully. It will be verified by an administrator.",
  };
};

const getMyDonations = async (donorId: string) => {
  validateObjectId(donorId, "donorId");

  const records = await prisma.bloodDonateRecord.findMany({
    where: { donorId },
    orderBy: { donationDate: "desc" },
    include: {
      verifiedBy: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
    },
  });

  const now = new Date();
  const latestApproved = records.find((r) => r.status === "APPROVED");
  const countdown = calculateCountdown(latestApproved?.donationDate, now);

  // Find the latest donation record (APPROVED or PENDING) to enforce the 120-day rule for new submissions
  const latestActiveDonation = records.find(
    (r) => r.status === "APPROVED" || r.status === "PENDING",
  );

  let submissionCooldown = {
    canSubmitNewRecord: true,
    daysRemaining: 0,
    daysSinceLast: null as number | null,
    lastDonationDate: null as string | null,
    nextEligibleDate: null as string | null,
    lastStatus: null as string | null,
  };

  if (latestActiveDonation) {
    const lastDate = new Date(latestActiveDonation.donationDate);
    const msSinceLast = now.getTime() - lastDate.getTime();
    const daysSinceLast = Math.floor(msSinceLast / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.max(0, 120 - daysSinceLast);
    const nextEligible = new Date(lastDate.getTime() + 120 * 24 * 60 * 60 * 1000);

    submissionCooldown = {
      canSubmitNewRecord: daysRemaining <= 0,
      daysRemaining,
      daysSinceLast,
      lastDonationDate: lastDate.toISOString(),
      nextEligibleDate: nextEligible.toISOString(),
      lastStatus: latestActiveDonation.status,
    };
  }

  return {
    countdown,
    submissionCooldown,
    summary: {
      totalDonations: records.length,
      approvedDonations: records.filter((r) => r.status === "APPROVED").length,
      pendingDonations: records.filter((r) => r.status === "PENDING").length,
      rejectedDonations: records.filter((r) => r.status === "REJECTED").length,
    },
    records,
    donations: records,
  };
};

const getAllDonationsForAdmin = async (
  filters: IDonationRecordFilters,
  paginationOptions: any,
) => {
  const { page, limit, skip, sortBy, sortOrder } = calculatePagination(paginationOptions);

  const andConditions: any[] = [];

  if (
    filters.status &&
    (filters.status === "PENDING" ||
      filters.status === "APPROVED" ||
      filters.status === "REJECTED")
  ) {
    andConditions.push({ status: filters.status });
  }

  if (filters.donorId) {
    validateObjectId(filters.donorId, "donorId");
    andConditions.push({ donorId: filters.donorId });
  }

  const parsedBg = parseBloodGroupFilter(filters.bloodGroup);
  if (parsedBg) {
    andConditions.push({
      donor: { bloodGroup: parsedBg },
    });
  }

  if (filters.searchQuery && filters.searchQuery.trim() !== "") {
    const q = filters.searchQuery.trim();
    andConditions.push({
      OR: [
        { donationAddress: { contains: q, mode: "insensitive" } },
        { rugirDhoron: { contains: q, mode: "insensitive" } },
        { donationSlipNumber: { contains: q, mode: "insensitive" } },
        { donor: { name: { contains: q, mode: "insensitive" } } },
        { donor: { phone: { contains: q, mode: "insensitive" } } },
      ],
    });
  }

  const whereClause = andConditions.length > 0 ? { AND: andConditions } : {};

  const [total, records] = await Promise.all([
    prisma.bloodDonateRecord.count({ where: whereClause }),
    prisma.bloodDonateRecord.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        donor: {
          select: {
            id: true,
            name: true,
            phone: true,
            bloodGroup: true,
            currentAddress: true,
            profileImage: true,
          },
        },
        verifiedBy: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    }),
  ]);

  const formatted = records.map((r) => ({
    ...r,
    bloodGroupDetails: formatBloodGroupDetails(r.donor.bloodGroup),
  }));

  return {
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
    data: formatted,
  };
};

const approveDonation = async (recordId: string, verifierId: string) => {
  validateObjectId(recordId, "recordId");
  validateObjectId(verifierId, "verifierId");

  const record = await prisma.bloodDonateRecord.findUnique({
    where: { id: recordId },
  });

  if (!record) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Donation record not found");
  }

  const updated = await prisma.bloodDonateRecord.update({
    where: { id: recordId },
    data: {
      status: "APPROVED",
      verifiedById: verifierId,
      verifiedAt: new Date(),
    },
    include: {
      donor: {
        select: {
          id: true,
          name: true,
          phone: true,
          bloodGroup: true,
        },
      },
      verifiedBy: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
    },
  });

  return {
    ...updated,
    bloodGroupDetails: formatBloodGroupDetails(updated.donor.bloodGroup),
    message: "Donation record approved. Donor's countdown has been reset to 120 days.",
  };
};

const rejectDonation = async (recordId: string, verifierId: string) => {
  validateObjectId(recordId, "recordId");
  validateObjectId(verifierId, "verifierId");

  const record = await prisma.bloodDonateRecord.findUnique({
    where: { id: recordId },
  });

  if (!record) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Donation record not found");
  }

  const updated = await prisma.bloodDonateRecord.update({
    where: { id: recordId },
    data: {
      status: "REJECTED",
      verifiedById: verifierId,
      verifiedAt: new Date(),
    },
    include: {
      donor: {
        select: {
          id: true,
          name: true,
          phone: true,
          bloodGroup: true,
        },
      },
      verifiedBy: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
    },
  });

  return {
    ...updated,
    bloodGroupDetails: formatBloodGroupDetails(updated.donor.bloodGroup),
    message: "Donation record marked as rejected.",
  };
};

export const DonationsService = {
  createDonation,
  getMyDonations,
  getAllDonationsForAdmin,
  approveDonation,
  rejectDonation,
};

export default DonationsService;
