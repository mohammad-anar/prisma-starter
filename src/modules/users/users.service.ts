import fs from "fs";
import path from "path";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { UserRole, UserStatus } from "@prisma/client";
import env from "../../config/env.js";
import prisma from "../../config/prisma.js";
import ApiError from "../../utils/ApiError.js";
import { StatusCodes } from "http-status-codes";
import { formatBloodGroupDetails, normalizeBloodGroup } from "../../utils/bloodGroup.js";
import { validateObjectId } from "../../utils/objectId.js";
import { EmailProvider } from "../../utils/email/emailProvider.js";
import { CreateUserPayload, UpdateEmailPayload, UpdateUserPayload } from "./users.interface.js";

const userSafeSelect = {
  id: true,
  name: true,
  phone: true,
  email: true,
  emailVerifiedAt: true,
  bloodGroup: true,
  status: true,
  currentAddress: true,
  permanentAddress: true,
  role: true,
  isBlocked: true,
  profileImage: true,
  gender: true,
  createdAt: true,
  updatedAt: true,
};

const createUser = async (payload: CreateUserPayload) => {
  const cleanPhone = payload.phone.trim();
  const existingPhone = await prisma.user.findUnique({
    where: { phone: cleanPhone },
  });

  if (existingPhone) {
    throw new ApiError(StatusCodes.CONFLICT, "User with this phone number already exists");
  }

  if (payload.email && payload.email.trim() !== "") {
    const existingEmail = await prisma.user.findFirst({
      where: { email: payload.email.trim().toLowerCase() },
    });
    if (existingEmail) {
      throw new ApiError(StatusCodes.CONFLICT, "User with this email already exists");
    }
  }

  const hashedPassword = await bcrypt.hash(
    payload.password,
    env.bcrypt_salt_round || 10,
  );

  const normalizedBg = normalizeBloodGroup(payload.bloodGroup);

  const result = await prisma.user.create({
    data: {
      name: payload.name.trim(),
      phone: cleanPhone,
      email: payload.email?.trim().toLowerCase() || null,
      bloodGroup: normalizedBg,
      currentAddress: payload.currentAddress.trim(),
      permanentAddress: payload.permanentAddress.trim(),
      passwordHashed: hashedPassword,
      role: payload.role || UserRole.DONOR,
      status: payload.status || UserStatus.APPROVED,
      profileImage: payload.profileImage || null,
      gender: payload.gender || "male",
      isBlocked: false,
    },
    select: userSafeSelect,
  });

  return {
    ...result,
    bloodGroupDetails: formatBloodGroupDetails(result.bloodGroup),
  };
};

const getAllUsers = async () => {
  const users = await prisma.user.findMany({
    select: userSafeSelect,
    orderBy: { createdAt: "desc" },
  });

  return users.map((u) => ({
    ...u,
    bloodGroupDetails: formatBloodGroupDetails(u.bloodGroup),
  }));
};

const getUserById = async (id: string) => {
  validateObjectId(id, "userId");

  const result = await prisma.user.findUnique({
    where: { id },
    select: userSafeSelect,
  });

  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }

  return {
    ...result,
    bloodGroupDetails: formatBloodGroupDetails(result.bloodGroup),
  };
};

const updateUser = async (id: string, payload: UpdateUserPayload) => {
  validateObjectId(id, "userId");

  const user = await prisma.user.findUnique({
    where: { id },
  });
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }

  const updateData: any = {};
  if (payload.name) updateData.name = payload.name.trim();
  if (payload.phone) {
    const cleanPhone = payload.phone.trim();
    const phoneExists = await prisma.user.findFirst({
      where: { phone: cleanPhone, id: { not: id } },
    });
    if (phoneExists) {
      throw new ApiError(StatusCodes.CONFLICT, "Phone number is already taken");
    }
    updateData.phone = cleanPhone;
  }
  if (payload.email) {
    const cleanEmail = payload.email.trim().toLowerCase();
    const emailExists = await prisma.user.findFirst({
      where: { email: cleanEmail, id: { not: id } },
    });
    if (emailExists) {
      throw new ApiError(StatusCodes.CONFLICT, "Email is already taken");
    }
    updateData.email = cleanEmail;
  }
  if (payload.currentAddress) updateData.currentAddress = payload.currentAddress.trim();
  if (payload.permanentAddress) updateData.permanentAddress = payload.permanentAddress.trim();
  if (payload.bloodGroup) {
    updateData.bloodGroup = normalizeBloodGroup(payload.bloodGroup);
  }
  if (payload.profileImage) updateData.profileImage = payload.profileImage;
  if (payload.gender) updateData.gender = payload.gender;
  if (payload.role) updateData.role = payload.role;
  if (payload.status) updateData.status = payload.status;
  if (payload.isBlocked !== undefined) updateData.isBlocked = payload.isBlocked;

  const result = await prisma.user.update({
    where: { id },
    data: updateData,
    select: userSafeSelect,
  });

  return {
    ...result,
    bloodGroupDetails: formatBloodGroupDetails(result.bloodGroup),
  };
};

const deleteUser = async (id: string) => {
  validateObjectId(id, "userId");

  const user = await prisma.user.findUnique({
    where: { id },
  });
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }

  if (user.role === UserRole.SUPERADMIN) {
    const superCount = await prisma.user.count({ where: { role: UserRole.SUPERADMIN } });
    if (superCount <= 1) {
      throw new ApiError(StatusCodes.FORBIDDEN, "Cannot delete the only Super Admin");
    }
  }

  // Check donation history
  const donationCount = await prisma.bloodDonateRecord.count({ where: { donorId: id } });
  if (donationCount > 0) {
    // Preserve donation history by soft-blocking instead of corrupting historical records
    await prisma.user.update({
      where: { id },
      data: { isBlocked: true },
    });
    return {
      id,
      message: "User account has been deactivated and blocked to preserve existing donation records.",
    };
  }

  await prisma.user.delete({ where: { id } });

  return {
    id,
    message: "User deleted successfully",
  };
};

const updateMyEmail = async (userId: string, payload: UpdateEmailPayload) => {
  validateObjectId(userId, "userId");

  const normalizedEmail = payload.email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }

  // Prevent duplicate email across other users
  const emailInUse = await prisma.user.findFirst({
    where: {
      email: normalizedEmail,
      id: { not: userId },
    },
  });

  if (emailInUse) {
    throw new ApiError(
      StatusCodes.CONFLICT,
      "Email address is already in use by another account",
      "EMAIL_ALREADY_IN_USE",
    );
  }

  // Generate cryptographically secure single-use token and SHA-256 hash
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours expiry

  // Invalidate previous verification status and record token hash
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      email: normalizedEmail,
      emailVerifiedAt: null,
      emailVerificationTokenHash: tokenHash,
      emailVerificationExpiresAt: expiresAt,
    },
    select: userSafeSelect,
  });

  // Dispatch verification email
  await EmailProvider.sendVerificationEmail(normalizedEmail, user.name, rawToken);

  return {
    ...updatedUser,
    bloodGroupDetails: formatBloodGroupDetails(updatedUser.bloodGroup),
    isEmailVerified: false,
    message: "Verification email sent to your new email address. Please verify to complete email update.",
  };
};

const updateMyProfileImage = async (
  userId: string,
  newProfileImage?: string | null,
  remove = false,
) => {
  validateObjectId(userId, "userId");

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }

  // Remove existing profile image
  if (remove || newProfileImage === null) {
    if (user.profileImage && user.profileImage.startsWith("/image/")) {
      const oldFilePath = path.join(process.cwd(), "uploads", user.profileImage);
      if (fs.existsSync(oldFilePath)) {
        try {
          fs.unlinkSync(oldFilePath);
        } catch {
          // Ignore cleanup error
        }
      }
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { profileImage: null },
      select: userSafeSelect,
    });

    return {
      ...updated,
      bloodGroupDetails: formatBloodGroupDetails(updated.bloodGroup),
      message: "Profile image removed successfully",
    };
  }

  if (!newProfileImage || typeof newProfileImage !== "string" || newProfileImage.trim() === "") {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Please provide a valid image file or URL");
  }

  const cleanImage = newProfileImage.trim();

  // If replacing an existing local file, clean up old file
  if (user.profileImage && user.profileImage.startsWith("/image/") && user.profileImage !== cleanImage) {
    const oldFilePath = path.join(process.cwd(), "uploads", user.profileImage);
    if (fs.existsSync(oldFilePath)) {
      try {
        fs.unlinkSync(oldFilePath);
      } catch {
        // Ignore cleanup error
      }
    }
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { profileImage: cleanImage },
    select: userSafeSelect,
  });

  return {
    ...updated,
    bloodGroupDetails: formatBloodGroupDetails(updated.bloodGroup),
    message: "Profile image updated successfully",
  };
};

export const UserServices = {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateMyEmail,
  updateMyProfileImage,
};

export default UserServices;
