import { StatusCodes } from "http-status-codes";
import prisma from "../../config/prisma.js";
import ApiError from "../../utils/ApiError.js";
import { formatBloodGroupDetails, normalizeBloodGroup, parseBloodGroupFilter } from "../../utils/bloodGroup.js";
import { validateObjectId } from "../../utils/objectId.js";
import calculatePagination from "../../utils/pagination.js";
import { EmergencyRequestStatus, UserRole } from "@prisma/client";
import {
  ICreateEmergencyRequest,
  IEmergencyRequestFilters,
  IUpdateEmergencyRequest,
} from "./emergency.interface.js";

const createEmergencyRequest = async (
  payload: ICreateEmergencyRequest,
  creatorId?: string,
) => {
  const normalizedBg = normalizeBloodGroup(payload.bloodGroup);

  if (creatorId) {
    validateObjectId(creatorId, "creatorId");
  }

  const created = await prisma.emergencyBloodRequest.create({
    data: {
      title: payload.title.trim(),
      rugirNam: payload.rugirNam.trim(),
      thikana: payload.thikana.trim(),
      phone: payload.phone.trim(),
      bloodGroup: normalizedBg,
      kotoBag: Number(payload.kotoBag),
      status: EmergencyRequestStatus.ACTIVE,
      createdById: creatorId || null,
    },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },
    },
  });

  return {
    ...created,
    bloodGroupDetails: formatBloodGroupDetails(created.bloodGroup),
    message: "Emergency blood request posted successfully.",
  };
};

const getAllEmergencyRequests = async (
  filters: IEmergencyRequestFilters,
  paginationOptions: any,
  isAdmin = false,
) => {
  const { page, limit, skip, sortBy, sortOrder } = calculatePagination(paginationOptions);

  const andConditions: any[] = [];

  // Public users default to ACTIVE requests only unless specified
  if (filters.status) {
    if (["ACTIVE", "FULFILLED", "CLOSED"].includes(filters.status)) {
      andConditions.push({ status: filters.status as EmergencyRequestStatus });
    }
  } else if (!isAdmin) {
    andConditions.push({ status: EmergencyRequestStatus.ACTIVE });
  }

  const parsedBg = parseBloodGroupFilter(filters.bloodGroup);
  if (parsedBg) {
    andConditions.push({ bloodGroup: parsedBg });
  }

  if (filters.thikana && filters.thikana.trim() !== "") {
    andConditions.push({
      thikana: { contains: filters.thikana.trim(), mode: "insensitive" },
    });
  }

  if (filters.searchQuery && filters.searchQuery.trim() !== "") {
    const q = filters.searchQuery.trim();
    andConditions.push({
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { rugirNam: { contains: q, mode: "insensitive" } },
        { thikana: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
      ],
    });
  }

  const whereClause = andConditions.length > 0 ? { AND: andConditions } : {};

  const [total, requests] = await Promise.all([
    prisma.emergencyBloodRequest.count({ where: whereClause }),
    prisma.emergencyBloodRequest.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    }),
  ]);

  const formatted = requests.map((r) => ({
    ...r,
    bloodGroupDetails: formatBloodGroupDetails(r.bloodGroup),
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

const getEmergencyRequestById = async (id: string) => {
  validateObjectId(id, "requestId");

  const request = await prisma.emergencyBloodRequest.findUnique({
    where: { id },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },
    },
  });

  if (!request) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Emergency blood request not found");
  }

  return {
    ...request,
    bloodGroupDetails: formatBloodGroupDetails(request.bloodGroup),
  };
};

const updateEmergencyRequest = async (
  id: string,
  payload: IUpdateEmergencyRequest,
  authUser?: any,
) => {
  validateObjectId(id, "requestId");

  const existing = await prisma.emergencyBloodRequest.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Emergency blood request not found");
  }

  // Authorization: Only the creator or an Admin/SuperAdmin can update the request
  const isOwner = authUser && existing.createdById === authUser.id;
  const isAdmin =
    authUser &&
    (authUser.role === UserRole.ADMIN || authUser.role === UserRole.SUPERADMIN);

  if (!isOwner && !isAdmin) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      "You are not authorized to update this emergency blood request",
    );
  }

  const updateData: any = {};
  if (payload.title) updateData.title = payload.title.trim();
  if (payload.rugirNam) updateData.rugirNam = payload.rugirNam.trim();
  if (payload.thikana) updateData.thikana = payload.thikana.trim();
  if (payload.phone) updateData.phone = payload.phone.trim();
  if (payload.kotoBag) updateData.kotoBag = Number(payload.kotoBag);
  if (payload.bloodGroup) {
    updateData.bloodGroup = normalizeBloodGroup(payload.bloodGroup);
  }
  if (payload.status) updateData.status = payload.status;

  const updated = await prisma.emergencyBloodRequest.update({
    where: { id },
    data: updateData,
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },
    },
  });

  return {
    ...updated,
    bloodGroupDetails: formatBloodGroupDetails(updated.bloodGroup),
    message: "Emergency request updated successfully.",
  };
};

const updateRequestStatus = async (
  id: string,
  status: EmergencyRequestStatus,
  adminUser: any,
) => {
  validateObjectId(id, "requestId");

  const existing = await prisma.emergencyBloodRequest.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Emergency blood request not found");
  }

  const updated = await prisma.emergencyBloodRequest.update({
    where: { id },
    data: { status },
  });

  return {
    ...updated,
    message: `Emergency request status updated to ${status}.`,
  };
};

const deleteEmergencyRequest = async (id: string, adminUser: any) => {
  validateObjectId(id, "requestId");

  const existing = await prisma.emergencyBloodRequest.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Emergency blood request not found");
  }

  await prisma.emergencyBloodRequest.delete({ where: { id } });

  return {
    id,
    message: "Emergency blood request deleted successfully.",
  };
};

export const EmergencyService = {
  createEmergencyRequest,
  getAllEmergencyRequests,
  getEmergencyRequestById,
  updateEmergencyRequest,
  updateRequestStatus,
  deleteEmergencyRequest,
};

export default EmergencyService;
