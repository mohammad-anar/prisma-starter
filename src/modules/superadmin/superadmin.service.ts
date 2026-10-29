import { StatusCodes } from "http-status-codes";
import prisma from "../../config/prisma.js";
import ApiError from "../../utils/ApiError.js";
import { formatBloodGroupDetails } from "../../utils/bloodGroup.js";
import { validateObjectId } from "../../utils/objectId.js";
import calculatePagination from "../../utils/pagination.js";
import { UserRole } from "@prisma/client";

const getAllAdmins = async (filters: any, paginationOptions: any) => {
  const { page, limit, skip, sortBy, sortOrder } = calculatePagination(paginationOptions);

  const andConditions: any[] = [
    {
      role: { in: [UserRole.ADMIN, UserRole.SUPERADMIN] },
    },
  ];

  if (filters.role && (filters.role === "ADMIN" || filters.role === "SUPERADMIN")) {
    andConditions.push({ role: filters.role });
  }

  if (filters.isBlocked !== undefined && filters.isBlocked !== "") {
    const isBlocked = filters.isBlocked === true || filters.isBlocked === "true";
    andConditions.push({ isBlocked });
  }

  if (filters.searchQuery && filters.searchQuery.trim() !== "") {
    const q = filters.searchQuery.trim();
    andConditions.push({
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ],
    });
  }

  const whereClause = { AND: andConditions };

  const [total, admins] = await Promise.all([
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
        role: true,
        status: true,
        bloodGroup: true,
        currentAddress: true,
        permanentAddress: true,
        isBlocked: true,
        profileImage: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            verifiedDonations: true,
            donations: true,
          },
        },
      },
    }),
  ]);

  const formatted = admins.map((a) => ({
    ...a,
    bloodGroupDetails: formatBloodGroupDetails(a.bloodGroup),
    verifiedDonationsCount: a._count.verifiedDonations,
    personalDonationsCount: a._count.donations,
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

const blockAdmin = async (targetId: string, currentSuperAdminId: string) => {
  validateObjectId(targetId, "adminId");

  if (targetId === currentSuperAdminId) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "You cannot block your own Super Admin account");
  }

  const target = await prisma.user.findUnique({ where: { id: targetId } });
  if (!target) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Administrator account not found");
  }

  // Prevent blocking the last active Super Admin
  if (target.role === UserRole.SUPERADMIN) {
    const activeSuperAdminCount = await prisma.user.count({
      where: { role: UserRole.SUPERADMIN, isBlocked: false },
    });
    if (activeSuperAdminCount <= 1) {
      throw new ApiError(
        StatusCodes.FORBIDDEN,
        "Cannot block the only remaining active Super Admin account",
      );
    }
  }

  const updated = await prisma.user.update({
    where: { id: targetId },
    data: { isBlocked: true },
    select: { id: true, name: true, phone: true, role: true, isBlocked: true },
  });

  return {
    ...updated,
    message: "Administrator account blocked successfully.",
  };
};

const unblockAdmin = async (targetId: string, currentSuperAdminId: string) => {
  validateObjectId(targetId, "adminId");

  const target = await prisma.user.findUnique({ where: { id: targetId } });
  if (!target) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Administrator account not found");
  }

  const updated = await prisma.user.update({
    where: { id: targetId },
    data: { isBlocked: false },
    select: { id: true, name: true, phone: true, role: true, isBlocked: true },
  });

  return {
    ...updated,
    message: "Administrator account unblocked successfully.",
  };
};

const removeAdminRole = async (targetId: string, currentSuperAdminId: string) => {
  validateObjectId(targetId, "adminId");

  if (targetId === currentSuperAdminId) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "You cannot remove administrative permissions from your own account",
    );
  }

  const target = await prisma.user.findUnique({ where: { id: targetId } });
  if (!target) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Administrator account not found");
  }

  // Check if target is a SuperAdmin and if it's the last one
  if (target.role === UserRole.SUPERADMIN) {
    const superAdminCount = await prisma.user.count({
      where: { role: UserRole.SUPERADMIN },
    });
    if (superAdminCount <= 1) {
      throw new ApiError(
        StatusCodes.FORBIDDEN,
        "Cannot remove administrative role from the last Super Admin account",
      );
    }
  }

  const updated = await prisma.user.update({
    where: { id: targetId },
    data: { role: UserRole.DONOR },
    select: { id: true, name: true, phone: true, role: true, status: true },
  });

  return {
    ...updated,
    message: "Administrative privileges removed. Account converted to standard DONOR.",
  };
};

const deleteAdmin = async (targetId: string, currentSuperAdminId: string) => {
  validateObjectId(targetId, "adminId");

  if (targetId === currentSuperAdminId) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "You cannot delete your own account");
  }

  const target = await prisma.user.findUnique({ where: { id: targetId } });
  if (!target) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Administrator account not found");
  }

  // Protection: Never delete the last Super Admin
  if (target.role === UserRole.SUPERADMIN) {
    const superAdminCount = await prisma.user.count({
      where: { role: UserRole.SUPERADMIN },
    });
    if (superAdminCount <= 1) {
      throw new ApiError(
        StatusCodes.FORBIDDEN,
        "Cannot delete the only Super Admin account on the platform",
      );
    }
  }

  // Check historical records
  const [personalDonationsCount, verifiedRecordsCount, emergencyRequestsCount] =
    await Promise.all([
      prisma.bloodDonateRecord.count({ where: { donorId: targetId } }),
      prisma.bloodDonateRecord.count({ where: { verifiedById: targetId } }),
      prisma.emergencyBloodRequest.count({ where: { createdById: targetId } }),
    ]);

  // If there are associated records, reject hard delete to preserve audit history
  if (personalDonationsCount > 0 || verifiedRecordsCount > 0 || emergencyRequestsCount > 0) {
    throw new ApiError(
      StatusCodes.CONFLICT,
      `Cannot hard delete administrator account. It has associated history: ${personalDonationsCount} donations, ${verifiedRecordsCount} verified records, ${emergencyRequestsCount} emergency requests. Please demote to DONOR or block the account to preserve audit integrity.`,
    );
  }

  await prisma.user.delete({ where: { id: targetId } });

  return {
    id: targetId,
    message: "Administrator account permanently deleted.",
  };
};

export const SuperAdminService = {
  getAllAdmins,
  blockAdmin,
  unblockAdmin,
  removeAdminRole,
  deleteAdmin,
};

export default SuperAdminService;
