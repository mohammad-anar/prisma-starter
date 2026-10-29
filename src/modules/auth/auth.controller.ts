import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync.js";
import { getSingleFilePath } from "../../utils/getFilePath.js";
import sendResponse from "../../utils/sendResponse.js";
import { AuthServices } from "./auth.service.js";

const registerUser = catchAsync(async (req: Request, res: Response) => {
  const profileImage =
    getSingleFilePath(req.files, "profileImage") ||
    getSingleFilePath(req.files, "image") ||
    getSingleFilePath(req.files, "avatar");

  const payload = {
    ...req.body,
    ...(profileImage && { profileImage }),
  };

  const result = await AuthServices.registerUser(payload);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Registration successful. Pending administrator approval.",
    data: result,
  });
});

const loginUser = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.loginUser(req.body);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "User logged in successfully",
    data: result,
  });
});

const logoutUser = catchAsync(async (req: Request, res: Response) => {
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Logged out successfully",
    data: null,
  });
});

const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const token =
    req.body.refreshToken ||
    req.headers.authorization?.replace("Bearer ", "");
  const result = await AuthServices.refreshToken({ refreshToken: token });
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Access token retrieved successfully",
    data: result,
  });
});

const changePassword = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const result = await AuthServices.changePassword(userId, req.body);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Password changed successfully",
    data: result,
  });
});

const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.forgotPassword(req.body);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Password reset instructions generated successfully",
    data: result,
  });
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const token =
    req.body.token ||
    req.headers.authorization?.replace("Bearer ", "") ||
    (req.query.token as string);
  const result = await AuthServices.resetPassword({
    token,
    newPassword: req.body.newPassword,
  });
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Password reset successfully",
    data: result,
  });
});

const getMe = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const result = await AuthServices.getMe(userId);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "User profile retrieved successfully",
    data: result,
  });
});

const sendEmailVerification = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const result = await AuthServices.sendEmailVerification(userId);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.message || "Verification email sent successfully",
    data: result,
  });
});

const verifyEmail = catchAsync(async (req: Request, res: Response) => {
  const token =
    req.body.token ||
    (req.query.token as string) ||
    req.headers.authorization?.replace("Bearer ", "");
  const result = await AuthServices.verifyEmail({ token });
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.message || "Email verified successfully",
    data: result,
  });
});

export const AuthController = {
  registerUser,
  loginUser,
  logoutUser,
  refreshToken,
  changePassword,
  forgotPassword,
  resetPassword,
  sendEmailVerification,
  verifyEmail,
  getMe,
};

export default AuthController;
