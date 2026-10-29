import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync.js";
import pick from "../../utils/pick.js";
import sendResponse from "../../utils/sendResponse.js";
import { AdminService } from "./admin.service.js";

const getAllDonors = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ["status", "isBlocked", "bloodGroup", "searchQuery"]);
  const paginationOptions = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);

  const result = await AdminService.getAllDonorsForAdmin(filters, paginationOptions);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Admin donors list retrieved successfully",
    pagination: {
      page: result.meta.page,
      limit: result.meta.limit,
      total: result.meta.total,
      totalPage: result.meta.totalPage,
    },
    data: result.data,
  });
});

const approveDonor = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await AdminService.approveDonor(id, req.user);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.message,
    data: result,
  });
});

const rejectDonor = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await AdminService.rejectDonor(id, req.user);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.message,
    data: result,
  });
});

const blockDonor = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await AdminService.blockDonor(id, req.user);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.message,
    data: result,
  });
});

const unblockDonor = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await AdminService.unblockDonor(id, req.user);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.message,
    data: result,
  });
});

const getOperationalReports = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.getOperationalReports();

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Operational report retrieved successfully",
    data: result,
  });
});

const getAdminOverview = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.getAdminOverview();

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Admin overview data retrieved successfully",
    data: result,
  });
});

export const AdminController = {
  getAllDonors,
  approveDonor,
  rejectDonor,
  blockDonor,
  unblockDonor,
  getOperationalReports,
  getAdminOverview,
};

export default AdminController;
