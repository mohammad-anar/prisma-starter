import { StatusCodes } from "http-status-codes";
import prisma from "../../config/prisma.js";
import ApiError from "../../utils/ApiError.js";
import { parseBloodGroupFilter, normalizeBloodGroup, formatBloodGroupDetails } from "../../utils/bloodGroup.js";
import { calculateCountdown } from "../../utils/countdown.js";
import { validateObjectId } from "../../utils/objectId.js";
import calculatePagination from "../../utils/pagination.js";
import { IDonorFilters, IUpdateDonorProfile } from "./donors.interface.js";

const getAllDonors = async (filters: IDonorFilters, paginationOptions: any) => {
  const { page, limit, skip, sortBy, sortOrder } = calculatePagination(paginationOptions);

  const andConditions: any[] = [
    { status: "APPROVED" },
    { isBlocked: false },
    { role: "DONOR" },
  ];

  // Blood group filter
  const parsedBg = parseBloodGroupFilter(filters.bloodGroup);
  if (parsedBg) {
    andConditions.push({ bloodGroup: parsedBg });
  }

  // Location / address search
  if (filters.location && filters.location.trim() !== "") {
    const loc = filters.location.trim();
    andConditions.push({
      OR: [
        { currentAddress: { contains: loc, mode: "insensitive" } },
        { permanentAddress: { contains: loc, mode: "insensitive" } },
      ],
    });
  }

  // General search query
  if (filters.searchQuery && filters.searchQuery.trim() !== "") {
    const q = filters.searchQuery.trim();
    andConditions.push({
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
        { currentAddress: { contains: q, mode: "insensitive" } },
        { permanentAddress: { contains: q, mode: "insensitive" } },
      ],
    });
  }

  const whereClause = andConditions.length > 0 ? { AND: andConditions } : {};

  // Fetch donors with their latest approved donation
  const [total, donors] = await Promise.all([
    prisma.user.count({ where: whereClause }),
    prisma.user.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        bloodGroup: true,
        currentAddress: true,
        permanentAddress: true,
        profileImage: true,
        gender: true,
        createdAt: true,
        donations: {
          where: { status: "APPROVED" },
          orderBy: { donationDate: "desc" },
          take: 1,
          select: {
            donationDate: true,
          },
        },
      },
    }),
  ]);

  // Format donors with calculated availability and frontend-compatible fields
  const formattedDonors = donors.map((donor) => {
    const bgDetails = formatBloodGroupDetails(donor.bloodGroup);
    const lastApprovedDonation = donor.donations[0];
    const countdown = calculateCountdown(lastApprovedDonation?.donationDate);

    return {
      id: donor.id,
      name: donor.name,
      bloodGroup: bgDetails.symbol, // e.g. "O+"
      bloodGroupEnum: donor.bloodGroup,
      bloodGroupDetails: bgDetails,
      location: donor.currentAddress,
      currentAddress: donor.currentAddress,
      permanentAddress: donor.permanentAddress,
      phone: donor.phone,
      gender: donor.gender || "male",
      status: "APPROVED",
      avatarUrl: donor.profileImage || "/images/donors/default.jpg",
      profileImage: donor.profileImage,
      available: countdown.canDonateNow,
      daysRemaining: countdown.daysRemaining,
      lastDonationDate: countdown.lastDonationDate,
      countdown,
      createdAt: donor.createdAt,
    };
  });

  // If onlyAvailable or isAvailable is requested, filter in-memory for accuracy
  const isOnlyAvailable =
    filters.onlyAvailable === true ||
    filters.onlyAvailable === "true" ||
    filters.onlyAvailable === "1" ||
    (filters as any).isAvailable === true ||
    (filters as any).isAvailable === "true" ||
    (filters as any).isAvailable === "1";

  const finalDonors = isOnlyAvailable
    ? formattedDonors.filter((d) => d.available)
    : formattedDonors;

  return {
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
    data: finalDonors,
  };
};

const getDonorById = async (id: string) => {
  validateObjectId(id, "donorId");

  const donor = await prisma.user.findFirst({
    where: {
      id,
      status: "APPROVED",
      isBlocked: false,
    },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      bloodGroup: true,
      currentAddress: true,
      permanentAddress: true,
      profileImage: true,
      gender: true,
      role: true,
      createdAt: true,
      donations: {
        where: { status: "APPROVED" },
        orderBy: { donationDate: "desc" },
        select: {
          id: true,
          donationDate: true,
          donationAddress: true,
          rugirDhoron: true,
        },
      },
    },
  });

  if (!donor) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Approved donor profile not found");
  }

  const bgDetails = formatBloodGroupDetails(donor.bloodGroup);
  const latestApprovedDonation = donor.donations[0];
  const countdown = calculateCountdown(latestApprovedDonation?.donationDate);

  return {
    id: donor.id,
    name: donor.name,
    bloodGroup: bgDetails.symbol,
    bloodGroupEnum: donor.bloodGroup,
    bloodGroupDetails: bgDetails,
    location: donor.currentAddress,
    currentAddress: donor.currentAddress,
    permanentAddress: donor.permanentAddress,
    phone: donor.phone,
    gender: donor.gender || "male",
    avatarUrl: donor.profileImage || "/images/donors/default.jpg",
    profileImage: donor.profileImage,
    available: countdown.canDonateNow,
    daysRemaining: countdown.daysRemaining,
    totalApprovedDonations: donor.donations.length,
    countdown,
    recentDonations: donor.donations.slice(0, 5),
    createdAt: donor.createdAt,
  };
};

const updateMyProfile = async (userId: string, payload: IUpdateDonorProfile) => {
  validateObjectId(userId, "userId");

  const existing = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!existing) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User profile not found");
  }

  if (existing.isBlocked) {
    throw new ApiError(StatusCodes.FORBIDDEN, "Your account is blocked");
  }

  const updateData: any = {};
  if (payload.name) updateData.name = payload.name.trim();
  if (payload.currentAddress) updateData.currentAddress = payload.currentAddress.trim();
  if (payload.permanentAddress) updateData.permanentAddress = payload.permanentAddress.trim();
  if (payload.profileImage) updateData.profileImage = payload.profileImage;
  if (payload.gender) updateData.gender = payload.gender;
  if (payload.bloodGroup) {
    updateData.bloodGroup = normalizeBloodGroup(payload.bloodGroup);
  }
  if (payload.email) {
    const cleanEmail = payload.email.trim().toLowerCase();
    const emailConflict = await prisma.user.findFirst({
      where: {
        email: cleanEmail,
        id: { not: userId },
      },
    });
    if (emailConflict) {
      throw new ApiError(StatusCodes.CONFLICT, "Email is already taken by another account");
    }
    updateData.email = cleanEmail;
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      bloodGroup: true,
      status: true,
      currentAddress: true,
      permanentAddress: true,
      role: true,
      isBlocked: true,
      profileImage: true,
      gender: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return {
    ...updated,
    bloodGroupDetails: formatBloodGroupDetails(updated.bloodGroup),
  };
};

const getMyDonations = async (userId: string) => {
  validateObjectId(userId, "userId");

  const donations = await prisma.bloodDonateRecord.findMany({
    where: { donorId: userId },
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

  const latestApproved = donations.find((d) => d.status === "APPROVED");
  const countdown = calculateCountdown(latestApproved?.donationDate);

  return {
    countdown,
    summary: {
      totalDonations: donations.length,
      approvedDonations: donations.filter((d) => d.status === "APPROVED").length,
      pendingDonations: donations.filter((d) => d.status === "PENDING").length,
      rejectedDonations: donations.filter((d) => d.status === "REJECTED").length,
    },
    donations,
    records: donations,
  };
};

export const DonorsService = {
  getAllDonors,
  getDonorById,
  updateMyProfile,
  getMyDonations,
};

export default DonorsService;
