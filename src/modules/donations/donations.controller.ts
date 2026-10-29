import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync.js";
import { getSingleFilePath } from "../../utils/getFilePath.js";
import pick from "../../utils/pick.js";
import sendResponse from "../../utils/sendResponse.js";
import { DonationsService } from "./donations.service.js";

const createDonation = catchAsync(async (req: Request, res: Response) => {
  const donorId = req.user.id;
  const slipFile =
    getSingleFilePath(req.files, "slip") ||
    getSingleFilePath(req.files, "donationSlip") ||
    getSingleFilePath(req.files, "image");

  const result = await DonationsService.createDonation(
    donorId,
    req.body,
    slipFile,
  );

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: result.message,
    data: result,
  });
});

const getMyDonations = catchAsync(async (req: Request, res: Response) => {
  const donorId = req.user.id;
  const result = await DonationsService.getMyDonations(donorId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Donations history and countdown retrieved successfully",
    data: result,
  });
});

const getAllDonationsForAdmin = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ["status", "bloodGroup", "searchQuery", "donorId"]);
  const paginationOptions = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);

  const result = await DonationsService.getAllDonationsForAdmin(
    filters,
    paginationOptions,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "All donations retrieved successfully",
    pagination: {
      page: result.meta.page,
      limit: result.meta.limit,
      total: result.meta.total,
      totalPage: result.meta.totalPage,
    },
    data: result.data,
  });
});

const approveDonation = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const verifierId = req.user.id;
  const result = await DonationsService.approveDonation(id, verifierId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.message,
    data: result,
  });
});

const rejectDonation = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const verifierId = req.user.id;
  const result = await DonationsService.rejectDonation(id, verifierId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.message,
    data: result,
  });
});

export const DonationsController = {
  createDonation,
  getMyDonations,
  getAllDonationsForAdmin,
  approveDonation,
  rejectDonation,
};

export default DonationsController;
