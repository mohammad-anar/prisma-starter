import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync.js";
import { getSingleFilePath } from "../../utils/getFilePath.js";
import sendResponse from "../../utils/sendResponse.js";
import { UserServices } from "./users.service.js";

const createUser = catchAsync(async (req: Request, res: Response) => {
  const result = await UserServices.createUser(req.body);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "User created successfully",
    data: result,
  });
});

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const result = await UserServices.getAllUsers();
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Users retrieved successfully",
    data: result,
  });
});

const getUserById = catchAsync(async (req: Request, res: Response) => {
  const result = await UserServices.getUserById(req.params.id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "User retrieved successfully",
    data: result,
  });
});

const updateUser = catchAsync(async (req: Request, res: Response) => {
  const result = await UserServices.updateUser(req.params.id, req.body);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "User updated successfully",
    data: result,
  });
});

const deleteUser = catchAsync(async (req: Request, res: Response) => {
  const result = await UserServices.deleteUser(req.params.id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "User deleted successfully",
    data: result,
  });
});

const updateMyEmail = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const result = await UserServices.updateMyEmail(userId, req.body);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.message || "Email updated successfully. Verification email sent.",
    data: result,
  });
});

const updateMyProfileImage = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const uploadedPath =
    getSingleFilePath(req.files, "profileImage") ||
    getSingleFilePath(req.files, "image") ||
    getSingleFilePath(req.files, "avatar");

  const imageFromBody = req.body?.profileImage || req.body?.image || req.body?.avatar;
  const isRemove =
    req.body?.remove === true ||
    req.body?.remove === "true" ||
    req.body?.action === "remove" ||
    req.body?.profileImage === null;

  const targetImage = uploadedPath || imageFromBody;

  const result = await UserServices.updateMyProfileImage(
    userId,
    targetImage,
    isRemove,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.message || "Profile image updated successfully",
    data: result,
  });
});

export const UserController = {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateMyEmail,
  updateMyProfileImage,
};

export default UserController;
