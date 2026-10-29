import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync.js";
import pick from "../../utils/pick.js";
import sendResponse from "../../utils/sendResponse.js";
import { EmergencyService } from "./emergency.service.js";

const createEmergencyRequest = catchAsync(async (req: Request, res: Response) => {
  const creatorId = req.user?.id;
  const result = await EmergencyService.createEmergencyRequest(
    req.body,
    creatorId,
  );

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: result.message,
    data: result,
  });
});

const getAllEmergencyRequests = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ["status", "bloodGroup", "searchQuery", "thikana"]);
  const paginationOptions = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);
  const isAdmin =
    req.user &&
    (req.user.role === "ADMIN" || req.user.role === "SUPERADMIN");

  const result = await EmergencyService.getAllEmergencyRequests(
    filters,
    paginationOptions,
    Boolean(isAdmin),
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Emergency blood requests retrieved successfully",
    pagination: {
      page: result.meta.page,
      limit: result.meta.limit,
      total: result.meta.total,
      totalPage: result.meta.totalPage,
    },
    data: result.data,
  });
});

const getEmergencyRequestById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await EmergencyService.getEmergencyRequestById(id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Emergency blood request retrieved successfully",
    data: result,
  });
});

const updateEmergencyRequest = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await EmergencyService.updateEmergencyRequest(
    id,
    req.body,
    req.user,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.message,
    data: result,
  });
});

const updateStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const result = await EmergencyService.updateRequestStatus(
    id,
    status,
    req.user,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.message,
    data: result,
  });
});

const deleteEmergencyRequest = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await EmergencyService.deleteEmergencyRequest(id, req.user);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.message,
    data: result,
  });
});

export const EmergencyController = {
  createEmergencyRequest,
  getAllEmergencyRequests,
  getEmergencyRequestById,
  updateEmergencyRequest,
  updateStatus,
  deleteEmergencyRequest,
};

export default EmergencyController;
