import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync.js";
import { getSingleFilePath } from "../../utils/getFilePath.js";
import pick from "../../utils/pick.js";
import sendResponse from "../../utils/sendResponse.js";
import { IDonorFilters } from "./donors.interface.js";
import { DonorsService } from "./donors.service.js";

const getAllDonors = catchAsync(async (req: Request, res: Response) => {
  const filters: IDonorFilters = {
    bloodGroup: typeof req.query.bloodGroup === "string" ? req.query.bloodGroup : undefined,
    location: typeof req.query.location === "string" ? req.query.location : undefined,
    searchQuery:
      typeof req.query.searchQuery === "string"
        ? req.query.searchQuery
        : typeof req.query.searchTerm === "string"
        ? req.query.searchTerm
        : undefined,
    onlyAvailable:
      req.query.onlyAvailable !== undefined
        ? (req.query.onlyAvailable as any)
        : (req.query.isAvailable as any),
  };
  const paginationOptions = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);

  const result = await DonorsService.getAllDonors(filters, paginationOptions);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Approved donors retrieved successfully",
    pagination: {
      page: result.meta.page,
      limit: result.meta.limit,
      total: result.meta.total,
      totalPage: result.meta.totalPage,
    },
    data: result.data,
  });
});

const getDonorById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await DonorsService.getDonorById(id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Donor profile retrieved successfully",
    data: result,
  });
});

const updateMyProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const profileImage =
    getSingleFilePath(req.files, "profileImage") ||
    getSingleFilePath(req.files, "image") ||
    getSingleFilePath(req.files, "avatar");

  const payload = {
    ...req.body,
    ...(profileImage && { profileImage }),
  };

  const result = await DonorsService.updateMyProfile(userId, payload);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Profile updated successfully",
    data: result,
  });
});

const getMyDonations = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const result = await DonorsService.getMyDonations(userId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Donation history and countdown retrieved successfully",
    data: result,
  });
});

export const DonorsController = {
  getAllDonors,
  getDonorById,
  updateMyProfile,
  getMyDonations,
};

export default DonorsController;
