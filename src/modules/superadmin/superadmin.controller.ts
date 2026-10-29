import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync.js";
import pick from "../../utils/pick.js";
import sendResponse from "../../utils/sendResponse.js";
import { SuperAdminService } from "./superadmin.service.js";

const getAllAdmins = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ["role", "isBlocked", "searchQuery"]);
  const paginationOptions = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);

  const result = await SuperAdminService.getAllAdmins(filters, paginationOptions);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Administrator accounts retrieved successfully",
    pagination: {
      page: result.meta.page,
      limit: result.meta.limit,
      total: result.meta.total,
      totalPage: result.meta.totalPage,
    },
    data: result.data,
  });
});

const blockAdmin = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const currentSuperAdminId = req.user.id;
  const result = await SuperAdminService.blockAdmin(id, currentSuperAdminId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.message,
    data: result,
  });
});

const unblockAdmin = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const currentSuperAdminId = req.user.id;
  const result = await SuperAdminService.unblockAdmin(id, currentSuperAdminId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.message,
    data: result,
  });
});

const removeAdminRole = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const currentSuperAdminId = req.user.id;
  const result = await SuperAdminService.removeAdminRole(id, currentSuperAdminId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.message,
    data: result,
  });
});

const deleteAdmin = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const currentSuperAdminId = req.user.id;
  const result = await SuperAdminService.deleteAdmin(id, currentSuperAdminId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.message,
    data: result,
  });
});

export const SuperAdminController = {
  getAllAdmins,
  blockAdmin,
  unblockAdmin,
  removeAdminRole,
  deleteAdmin,
};

export default SuperAdminController;
