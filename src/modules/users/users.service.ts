import bcrypt from "bcryptjs";
import { UserRole, UserStatus } from "@prisma/client";
import env from "../../config/env.js";
import prisma from "../../config/prisma.js";
import ApiError from "../../utils/ApiError.js";
import { StatusCodes } from "http-status-codes";
import { CreateUserPayload, UpdateUserPayload } from "./users.interface.js";

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

const createUser = async (payload: CreateUserPayload) => {
  const existingUser = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (existingUser) {
    throw new ApiError(StatusCodes.CONFLICT, "User with this email already exists");
  }

  const hashedPassword = await bcrypt.hash(
    payload.password,
    env.bcrypt_salt_round || 10,
  );

  const result = await prisma.user.create({
    data: {
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      passwordHash: hashedPassword,
      phone: payload.phone,
      profileImage: payload.profileImage,
      role: payload.role || UserRole.STUDENT,
      status: UserStatus.ACTIVE,
    },
    select: userSelectedFields,
  });
  return result;
};

const getAllUsers = async () => {
  const result = await prisma.user.findMany({
    where: { isDeleted: false },
    select: userSelectedFields,
  });
  return result;
};

const getUserById = async (id: string) => {
  const result = await prisma.user.findUnique({
    where: { id, isDeleted: false },
    select: userSelectedFields,
  });
  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }
  return result;
};

const updateUser = async (id: string, payload: UpdateUserPayload) => {
  const user = await prisma.user.findUnique({
    where: { id, isDeleted: false },
  });
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }

  const result = await prisma.user.update({
    where: { id },
    data: payload,
    select: userSelectedFields,
  });
  return result;
};

const deleteUser = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id, isDeleted: false },
  });
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }

  const result = await prisma.user.update({
    where: { id },
    data: { isDeleted: true },
    select: userSelectedFields,
  });
  return result;
};

export const UserServices = {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
};

export default UserServices;
