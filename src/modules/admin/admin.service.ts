import { StatusCodes } from "http-status-codes";
import prisma from "../../config/prisma.js";
import ApiError from "../../utils/ApiError.js";
import { formatBloodGroupDetails, parseBloodGroupFilter, BLOOD_GROUP_SYMBOL_MAP } from "../../utils/bloodGroup.js";
import { validateObjectId } from "../../utils/objectId.js";
import calculatePagination from "../../utils/pagination.js";
import { UserRole, UserStatus, BloodGroup } from "@prisma/client";

const getAllDonorsForAdmin = async (filters: any, paginationOptions: any) => {
  const { page, limit, skip, sortBy, sortOrder } = calculatePagination(paginationOptions);

  const andConditions: any[] = [{ role: UserRole.DONOR }];

  if (filters.status && (filters.status === "PENDING" || filters.status === "APPROVED")) {
    andConditions.push({ status: filters.status });
  }

  if (filters.isBlocked !== undefined && filters.isBlocked !== "") {
    const isBlocked = filters.isBlocked === true || filters.isBlocked === "true";
    andConditions.push({ isBlocked });
  }

  const parsedBg = parseBloodGroupFilter(filters.bloodGroup);
  if (parsedBg) {
    andConditions.push({ bloodGroup: parsedBg });
  }

  if (filters.searchQuery && filters.searchQuery.trim() !== "") {
    const q = filters.searchQuery.trim();
    andConditions.push({
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
        { currentAddress: { contains: q, mode: "insensitive" } },
        { permanentAddress: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ],
    });
  }

  const whereClause = andConditions.length > 0 ? { AND: andConditions } : {};

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
        status: true,
        currentAddress: true,
        permanentAddress: true,
        role: true,
        isBlocked: true,
        profileImage: true,
        gender: true,
        createdAt: true,
        updatedAt: true,
        donations: {
          where: { status: "APPROVED" },
          orderBy: { donationDate: "desc" },
          take: 1,
          select: { donationDate: true },
        },
        _count: {
          select: {
            donations: true,
          },
        },
      },
    }),
  ]);

  const formatted = donors.map((d) => ({
    ...d,
    avatarUrl: d.profileImage || "/images/donors/default.jpg",
    bloodGroupDetails: formatBloodGroupDetails(d.bloodGroup),
    totalDonations: d._count.donations,
    lastDonationDate: d.donations[0]?.donationDate || null,
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

const approveDonor = async (id: string, adminUser: any) => {
  validateObjectId(id, "donorId");

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Donor account not found");
  }

  if (target.role !== UserRole.DONOR) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      "Only donor registrations can be approved via this endpoint",
    );
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { status: UserStatus.APPROVED },
    select: {
      id: true,
      name: true,
      phone: true,
      status: true,
      bloodGroup: true,
      role: true,
      updatedAt: true,
    },
  });

  return {
    ...updated,
    bloodGroupDetails: formatBloodGroupDetails(updated.bloodGroup),
    message: "Donor account approved successfully. Donor is now listed in the directory.",
  };
};

const rejectDonor = async (id: string, adminUser: any) => {
  validateObjectId(id, "donorId");

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Donor account not found");
  }

  if (target.role !== UserRole.DONOR) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      "Only donor registrations can be rejected via this endpoint",
    );
  }

  // Check if donor already has donations on record
  const donationCount = await prisma.bloodDonateRecord.count({
    where: { donorId: id },
  });

  if (donationCount > 0) {
    // Soft set to PENDING or blocked rather than deleting
    const updated = await prisma.user.update({
      where: { id },
      data: { status: UserStatus.PENDING, isBlocked: true },
      select: { id: true, name: true, phone: true, status: true, isBlocked: true },
    });
    return {
      ...updated,
      message: "Donor registration status revoked and account blocked due to existing records.",
    };
  }

  // Delete pending registration without records
  await prisma.user.delete({ where: { id } });

  return {
    id,
    message: "Donor registration rejected and removed.",
  };
};

const blockDonor = async (id: string, adminUser: any) => {
  validateObjectId(id, "donorId");

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Account not found");
  }

  // Guard: Admins must not block other Admins or Super Admins!
  if (target.role === UserRole.ADMIN || target.role === UserRole.SUPERADMIN) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      "Admins cannot block other administrators. Use Super Admin management.",
    );
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { isBlocked: true },
    select: {
      id: true,
      name: true,
      phone: true,
      status: true,
      isBlocked: true,
      role: true,
    },
  });

  return {
    ...updated,
    message: "Donor account has been blocked successfully.",
  };
};

const unblockDonor = async (id: string, adminUser: any) => {
  validateObjectId(id, "donorId");

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Account not found");
  }

  if (target.role === UserRole.ADMIN || target.role === UserRole.SUPERADMIN) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      "Administrator accounts must be managed via Super Admin portal.",
    );
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { isBlocked: false },
    select: {
      id: true,
      name: true,
      phone: true,
      status: true,
      isBlocked: true,
      role: true,
    },
  });

  return {
    ...updated,
    message: "Donor account has been unblocked successfully.",
  };
};

const getOperationalReports = async () => {
  const [
    totalDonors,
    approvedDonors,
    pendingDonors,
    blockedDonors,
    totalDonations,
    approvedDonations,
    pendingDonations,
    activeEmergencyRequests,
  ] = await Promise.all([
    prisma.user.count({ where: { role: UserRole.DONOR } }),
    prisma.user.count({ where: { role: UserRole.DONOR, status: UserStatus.APPROVED } }),
    prisma.user.count({ where: { role: UserRole.DONOR, status: UserStatus.PENDING } }),
    prisma.user.count({ where: { role: UserRole.DONOR, isBlocked: true } }),
    prisma.bloodDonateRecord.count(),
    prisma.bloodDonateRecord.count({ where: { status: "APPROVED" } }),
    prisma.bloodDonateRecord.count({ where: { status: "PENDING" } }),
    prisma.emergencyBloodRequest.count({ where: { status: "ACTIVE" } }),
  ]);

  return {
    donors: {
      total: totalDonors,
      approved: approvedDonors,
      pending: pendingDonors,
      blocked: blockedDonors,
    },
    donations: {
      total: totalDonations,
      approved: approvedDonations,
      pending: pendingDonations,
    },
    emergencyRequests: {
      active: activeEmergencyRequests,
    },
  };
};

const getAdminOverview = async () => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalDonors,
    approvedDonors,
    pendingDonors,
    blockedDonors,
    thisMonthDonors,
    totalDonations,
    approvedDonations,
    pendingDonations,
    activeEmergencyRequests,
    pendingReports,
    bloodGroupCounts,
    pendingApprovalsList,
    recentDonorsList,
  ] = await Promise.all([
    prisma.user.count({ where: { role: UserRole.DONOR } }),
    prisma.user.count({ where: { role: UserRole.DONOR, status: UserStatus.APPROVED, isBlocked: false } }),
    prisma.user.count({ where: { role: UserRole.DONOR, status: UserStatus.PENDING } }),
    prisma.user.count({ where: { role: UserRole.DONOR, isBlocked: true } }),
    prisma.user.count({ where: { role: UserRole.DONOR, createdAt: { gte: startOfMonth } } }),
    prisma.bloodDonateRecord.count(),
    prisma.bloodDonateRecord.count({ where: { status: "APPROVED" } }),
    prisma.bloodDonateRecord.count({ where: { status: "PENDING" } }),
    prisma.emergencyBloodRequest.count({ where: { status: "ACTIVE" } }),
    prisma.contactMessage.count({ where: { status: "NEW" } }),
    prisma.user.groupBy({
      by: ["bloodGroup"],
      where: { role: UserRole.DONOR },
      _count: { id: true },
    }),
    prisma.bloodDonateRecord.findMany({
      where: { status: "PENDING" },
      take: 6,
      orderBy: { createdAt: "desc" },
      include: {
        donor: {
          select: {
            id: true,
            name: true,
            phone: true,
            bloodGroup: true,
            profileImage: true,
            currentAddress: true,
          },
        },
      },
    }),
    prisma.user.findMany({
      where: { role: UserRole.DONOR },
      take: 6,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        phone: true,
        bloodGroup: true,
        status: true,
        isBlocked: true,
        currentAddress: true,
        profileImage: true,
        createdAt: true,
      },
    }),
  ]);

  const countMap: Record<string, number> = {};
  bloodGroupCounts.forEach((bg) => {
    countMap[bg.bloodGroup] = bg._count.id;
  });

  const bloodGroupsOrder = [
    { enumKey: BloodGroup.O_POSITIVE, label: "O+", isRare: false },
    { enumKey: BloodGroup.A_POSITIVE, label: "A+", isRare: false },
    { enumKey: BloodGroup.B_POSITIVE, label: "B+", isRare: false },
    { enumKey: BloodGroup.AB_POSITIVE, label: "AB+", isRare: false },
    { enumKey: BloodGroup.O_NEGATIVE, label: "O-", isRare: true },
    { enumKey: BloodGroup.A_NEGATIVE, label: "A-", isRare: true },
    { enumKey: BloodGroup.B_NEGATIVE, label: "B-", isRare: true },
    { enumKey: BloodGroup.AB_NEGATIVE, label: "AB-", isRare: true },
  ];

  const bloodTypeDistribution = bloodGroupsOrder.map((item) => {
    const count = countMap[item.enumKey] || 0;
    const percentageNum = totalDonors > 0 ? Math.round((count / totalDonors) * 100) : 0;
    return {
      type: item.label,
      count,
      countText: `${count} জন`,
      percentage: `${percentageNum}%`,
      percentageNum,
      isRare: item.isRare,
    };
  });

  const formattedPendingApprovals = pendingApprovalsList.map((item) => ({
    id: item.id,
    recordId: item.id,
    donorId: item.donorId,
    donorName: item.donor.name,
    donorPhone: item.donor.phone,
    donorAvatar: item.donor.profileImage,
    bloodGroup: BLOOD_GROUP_SYMBOL_MAP[item.donor.bloodGroup] || item.donor.bloodGroup,
    hospital: item.donationAddress,
    donationDate: item.donationDate,
    slipUrl: item.slipUrl,
    slipNumber: item.donationSlipNumber,
    rugirDhoron: item.rugirDhoron,
    createdAt: item.createdAt,
  }));

  const formattedRecentDonors = recentDonorsList.map((donor) => ({
    id: donor.id,
    name: donor.name,
    phone: donor.phone,
    avatar: donor.profileImage,
    bloodGroup: BLOOD_GROUP_SYMBOL_MAP[donor.bloodGroup] || donor.bloodGroup,
    area: donor.currentAddress,
    status: donor.status,
    isBlocked: donor.isBlocked,
    createdAt: donor.createdAt,
  }));

  return {
    stats: {
      totalDonors,
      approvedDonors,
      pendingDonors,
      blockedDonors,
      thisMonthDonors,
      totalDonations,
      approvedDonations,
      pendingDonations,
      activeEmergencyRequests,
      pendingReports,
    },
    bloodTypeDistribution,
    pendingApprovals: formattedPendingApprovals,
    recentDonors: formattedRecentDonors,
  };
};

export const AdminService = {
  getAllDonorsForAdmin,
  approveDonor,
  rejectDonor,
  blockDonor,
  unblockDonor,
  getOperationalReports,
  getAdminOverview,
};

export default AdminService;
