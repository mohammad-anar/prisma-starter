import bcrypt from "bcryptjs";
import { UserRole, UserStatus } from "@prisma/client";
import { Secret } from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import config from "../../../config/index.js";
import ApiError from "../../../errors/ApiError.js";
import { jwtHelper } from "../../../helpers/jwtHelper.js";
import { prisma } from "../../../db/prisma.js";
import { emailHelper } from "../../../helpers/emailHelper.js";
import { emailTemplate } from "../../shared/emailTemplate.js";
import {
  IChangePassword,
  IForgotPassword,
  ILoginUser,
  IRefreshToken,
  IRegisterUser,
  IResetPassword,
} from "./auth.interface.js";

const userSelectedFields = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  profileImage: true,
  role: true,
  status: true,
  isVerified: true,
  isDeleted: true,
  needPasswordChange: true,
  createdAt: true,
  updatedAt: true,
};

const registerUser = async (payload: IRegisterUser) => {
  const existingEmail = await prisma.user.findUnique({
    where: { email: payload.email },
  });
  if (existingEmail) {
    throw new ApiError(StatusCodes.CONFLICT, "Email already exists");
  }

  if (payload.phone) {
    const existingPhone = await prisma.user.findFirst({
      where: { phone: payload.phone },
    });
    if (existingPhone) {
      throw new ApiError(StatusCodes.CONFLICT, "Phone number already exists");
    }
  }

  const saltRound = config.bcrypt_salt_round || 10;
  const passwordHash = await bcrypt.hash(payload.password, saltRound);

  const newUser = await prisma.user.create({
    data: {
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      phone: payload.phone,
      passwordHash,
      profileImage: payload.profileImage,
      role: payload.role || UserRole.STUDENT,
      isVerified: false,
      needPasswordChange: false,
      status: UserStatus.ACTIVE,
    },
    select: userSelectedFields,
  });

  return newUser;
};

const loginUser = async (payload: ILoginUser) => {
  const { email, password } = payload;

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User does not exist");
  }

  if (user.isDeleted) {
    throw new ApiError(StatusCodes.FORBIDDEN, "Your account has been deleted");
  }

  if (
    user.status === UserStatus.BANNED ||
    user.status === UserStatus.SUSPENDED ||
    user.status === UserStatus.INACTIVE
  ) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      `Your account is ${user.status.toLowerCase()}`,
    );
  }

  const isPasswordMatched = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordMatched) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid password");
  }

  const jwtPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
  };

  const accessToken = jwtHelper.createToken(
    jwtPayload,
    config.jwt.jwt_secret as Secret,
    config.jwt.jwt_expire_in as any,
  );

  const refreshToken = jwtHelper.createToken(
    jwtPayload,
    config.jwt.jwt_secret as Secret,
    config.jwt.jwt_refresh_expire_in as any,
  );

  const { passwordHash: _, ...userData } = user;

  return {
    accessToken,
    refreshToken,
    user: userData,
  };
};

const refreshToken = async (payload: IRefreshToken) => {
  const { refreshToken: token } = payload;

  if (!token) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Refresh token is required");
  }

  let verifyToken;
  try {
    verifyToken = jwtHelper.verifyToken(
      token,
      config.jwt.jwt_secret as Secret,
    );
  } catch (error) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid Refresh Token");
  }

  const user = await prisma.user.findUnique({
    where: { id: verifyToken.id },
  });

  if (!user || user.isDeleted || user.status !== UserStatus.ACTIVE) {
    throw new ApiError(StatusCodes.FORBIDDEN, "User is not authorized");
  }

  const newJwtPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
  };

  const newAccessToken = jwtHelper.createToken(
    newJwtPayload,
    config.jwt.jwt_secret as Secret,
    config.jwt.jwt_expire_in as any,
  );

  return {
    accessToken: newAccessToken,
  };
};

const changePassword = async (userId: string, payload: IChangePassword) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }

  const isPasswordMatched = await bcrypt.compare(
    payload.oldPassword,
    user.passwordHash,
  );
  if (!isPasswordMatched) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Incorrect old password");
  }

  const saltRound = config.bcrypt_salt_round || 10;
  const newHashedPassword = await bcrypt.hash(payload.newPassword, saltRound);

  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash: newHashedPassword,
      needPasswordChange: false,
    },
  });

  return { message: "Password changed successfully" };
};

const forgotPassword = async (payload: IForgotPassword) => {
  const user = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found with this email");
  }

  if (user.isDeleted || user.status !== UserStatus.ACTIVE) {
    throw new ApiError(StatusCodes.FORBIDDEN, "User account is not active");
  }

  const resetTokenPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };

  const resetToken = jwtHelper.createToken(
    resetTokenPayload,
    config.jwt.jwt_secret as Secret,
    "15m",
  );

  try {
    const template = emailTemplate.forgetPassword({
      email: user.email,
      token: resetToken,
    });
    await emailHelper.sendEmail(template);
  } catch (err: any) {
    console.error("Failed to send reset password email:", err?.message || err);
  }

  return {
    message: "Password reset link sent to your email successfully",
    resetToken,
  };
};

const resetPassword = async (payload: IResetPassword) => {
  const { token, newPassword } = payload;

  if (!token) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Reset token is required");
  }

  let verifyToken;
  try {
    verifyToken = jwtHelper.verifyToken(
      token,
      config.jwt.jwt_secret as Secret,
    );
  } catch (error) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid or expired reset token");
  }

  const user = await prisma.user.findUnique({
    where: { id: verifyToken.id },
  });

  if (!user || user.isDeleted || user.status !== UserStatus.ACTIVE) {
    throw new ApiError(StatusCodes.FORBIDDEN, "User not found or inactive");
  }

  const saltRound = config.bcrypt_salt_round || 10;
  const hashedPassword = await bcrypt.hash(newPassword, saltRound);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: hashedPassword,
      needPasswordChange: false,
    },
  });

  return { message: "Password reset successfully" };
};

const getMe = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: userSelectedFields,
  });

  if (!user || user.isDeleted) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }

  return user;
};

export const AuthServices = {
  registerUser,
  loginUser,
  refreshToken,
  changePassword,
  forgotPassword,
  resetPassword,
  getMe,
};
