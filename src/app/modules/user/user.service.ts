import { prisma } from "../../../db/prisma.js";
import config from "../../../config/index.js";
import { CreateUserPayload } from "./user.interface.js";
import { UserRole, UserStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

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
  const hashedPassword = await bcrypt.hash(
    payload.password,
    config.bcrypt_salt_round || 10,
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

export const UserServices = {
  createUser,
  getAllUsers,
};
