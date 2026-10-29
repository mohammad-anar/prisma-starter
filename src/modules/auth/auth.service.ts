import crypto from "crypto";
import bcrypt from "bcryptjs";
import { BloodGroup, UserRole, UserStatus } from "@prisma/client";
import { Secret } from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import env from "../../config/env.js";
import prisma from "../../config/prisma.js";
import ApiError from "../../utils/ApiError.js";
import { jwtHelper } from "../../utils/jwt.js";
import { normalizeBloodGroup, formatBloodGroupDetails } from "../../utils/bloodGroup.js";
import { calculateCountdown } from "../../utils/countdown.js";
import { EmailProvider } from "../../utils/email/emailProvider.js";
import {
  IChangePassword,
  IForgotPassword,
  ILoginUser,
  IRefreshToken,
  IRegisterUser,
  IResetPassword,
  IVerifyEmail,
} from "./auth.interface.js";

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

const registerUser = async (payload: IRegisterUser) => {
  const cleanPhone = payload.phone.trim();
  const normalizedBloodGroup = normalizeBloodGroup(payload.bloodGroup);

  // Check unique phone
  const existingPhone = await prisma.user.findUnique({
    where: { phone: cleanPhone },
  });
  if (existingPhone) {
    throw new ApiError(StatusCodes.CONFLICT, "Phone number is already registered");
  }

  // Check unique email if supplied
  if (payload.email && payload.email.trim() !== "") {
    const existingEmail = await prisma.user.findFirst({
      where: { email: payload.email.trim().toLowerCase() },
    });
    if (existingEmail) {
      throw new ApiError(StatusCodes.CONFLICT, "Email is already registered");
    }
  }

  const saltRound = env.bcrypt_salt_round || 10;
  const passwordHashed = await bcrypt.hash(payload.password, saltRound);

  // Security: Public registration always forces role=DONOR and status=PENDING
  const created = await prisma.user.create({
    data: {
      name: payload.name.trim(),
      phone: cleanPhone,
      email: payload.email?.trim().toLowerCase() || null,
      bloodGroup: normalizedBloodGroup,
      status: UserStatus.PENDING,
      currentAddress: payload.currentAddress.trim(),
      permanentAddress: payload.permanentAddress.trim(),
      passwordHashed,
      role: UserRole.DONOR,
      isBlocked: false,
      profileImage: payload.profileImage || null,
      gender: payload.gender || "male",
    },
    select: userSafeSelect,
  });

  return {
    ...created,
    bloodGroupDetails: formatBloodGroupDetails(created.bloodGroup),
    message: "Registration submitted successfully. Your account is pending administrator verification.",
  };
};

const normalizeLoginPhone = (input: string): string => {
  const bengaliDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  let converted = input;
  bengaliDigits.forEach((digit, idx) => {
    converted = converted.split(digit).join(idx.toString());
  });
  const digitsOnly = converted.replace(/[^0-9]/g, "");
  if (digitsOnly.startsWith("880") && digitsOnly.length === 13) {
    return "0" + digitsOnly.slice(3);
  }
  return digitsOnly;
};

const loginUser = async (payload: ILoginUser) => {
  const identifier = (payload.phone || payload.email || payload.identifier || "").trim();

  if (!identifier) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Phone number or email is required");
  }

  const normalizedPhone = normalizeLoginPhone(identifier);
  const digitsOnly = identifier.replace(/[^0-9]/g, "");

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { phone: identifier },
        { phone: normalizedPhone },
        { phone: digitsOnly },
        { email: identifier.toLowerCase() },
      ],
    },
  });

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found with provided credentials");
  }

  if (user.isBlocked) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      "Your account has been blocked. Please contact an administrator.",
    );
  }

  const isPasswordMatched = await bcrypt.compare(
    payload.password,
    user.passwordHashed,
  );

  if (!isPasswordMatched) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid password");
  }

  const tokenPayload = {
    id: user.id,
    phone: user.phone,
    role: user.role,
    status: user.status,
  };

  const accessToken = jwtHelper.createToken(
    tokenPayload,
    env.jwt.jwt_secret as Secret,
    env.jwt.jwt_expire_in as any,
  );

  const refreshToken = jwtHelper.createToken(
    tokenPayload,
    env.jwt.jwt_secret as Secret,
    env.jwt.jwt_refresh_expire_in as any,
  );

  // Exclude passwordHashed and token hashes from user object
  const {
    passwordHashed: _,
    passwordResetTokenHash: _resetHash,
    emailVerificationTokenHash: _verifyHash,
    ...sanitizedUser
  } = user;

  return {
    accessToken,
    refreshToken,
    user: {
      ...sanitizedUser,
      bloodGroupDetails: formatBloodGroupDetails(user.bloodGroup),
      isEmailVerified: Boolean(user.emailVerifiedAt),
    },
  };
};

const refreshToken = async (payload: IRefreshToken) => {
  const { refreshToken: token } = payload;
  if (!token) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Refresh token is required");
  }

  let verified: any;
  try {
    verified = jwtHelper.verifyToken(token, env.jwt.jwt_secret as Secret);
  } catch {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid or expired refresh token");
  }

  const user = await prisma.user.findUnique({
    where: { id: verified.id },
  });

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User account no longer exists");
  }

  if (user.isBlocked) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      "Your account has been blocked. Please contact an administrator.",
    );
  }

  const tokenPayload = {
    id: user.id,
    phone: user.phone,
    role: user.role,
    status: user.status,
  };

  const newAccessToken = jwtHelper.createToken(
    tokenPayload,
    env.jwt.jwt_secret as Secret,
    env.jwt.jwt_expire_in as any,
  );

  return {
    accessToken: newAccessToken,
  };
};

const getMe = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: userSafeSelect,
  });

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User account not found");
  }

  if (user.isBlocked) {
    throw new ApiError(StatusCodes.FORBIDDEN, "Account is blocked");
  }

  // Fetch latest approved donation to compute countdown
  const latestApprovedDonation = await prisma.bloodDonateRecord.findFirst({
    where: {
      donorId: userId,
      status: "APPROVED",
    },
    orderBy: {
      donationDate: "desc",
    },
  });

  const countdown = calculateCountdown(latestApprovedDonation?.donationDate);

  return {
    ...user,
    bloodGroupDetails: formatBloodGroupDetails(user.bloodGroup),
    countdown,
    isEmailVerified: Boolean(user.emailVerifiedAt),
  };
};

const changePassword = async (userId: string, payload: IChangePassword) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }

  // Requirement 12.C: Check whether the user has an email address
  if (!user.email || user.email.trim() === "") {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "You must update your email",
      "EMAIL_REQUIRED",
    );
  }

  // Requirement 12.C: If an email exists but is not verified, require verification
  if (!user.emailVerifiedAt) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      "Please verify your email address before changing password",
      "EMAIL_NOT_VERIFIED",
    );
  }

  // Requirement 12.C: Verify user's current password
  const currentPassword = (payload.currentPassword || payload.oldPassword || "").trim();
  if (!currentPassword) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Current password is required",
      "INVALID_CURRENT_PASSWORD",
    );
  }

  const isMatched = await bcrypt.compare(currentPassword, user.passwordHashed);
  if (!isMatched) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Current password does not match",
      "INVALID_CURRENT_PASSWORD",
    );
  }

  // Requirement 12.C: Validate new password according to password policy
  if (!payload.newPassword || payload.newPassword.length < 6) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "New password must be at least 6 characters",
      "INVALID_PASSWORD",
    );
  }

  if (currentPassword === payload.newPassword) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "New password cannot be the same as your current password",
      "INVALID_PASSWORD",
    );
  }

  const saltRound = env.bcrypt_salt_round || 10;
  const newHashed = await bcrypt.hash(payload.newPassword, saltRound);

  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHashed: newHashed,
      passwordChangedAt: new Date(),
    },
  });

  // Security alert email to user's verified address
  await EmailProvider.sendPasswordChangedEmail(user.email, user.name);

  return { message: "Password updated successfully" };
};

const forgotPassword = async (payload: IForgotPassword) => {
  const email = (payload.email || "").trim().toLowerCase();
  if (!email) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Email address is required", "INVALID_EMAIL");
  }

  // Generic response to prevent account enumeration
  const genericResponse = {
    message: "If an account with this email exists, a password reset link has been sent.",
  };

  const user = await prisma.user.findFirst({
    where: { email },
  });

  // If no user exists with this email or user has no email, return generic response
  if (!user || !user.email) {
    return genericResponse;
  }

  // Require verified email before email-based password recovery
  if (!user.emailVerifiedAt) {
    return genericResponse;
  }

  // Rate limiting: 2-minute cooldown between reset requests
  if (
    user.passwordResetExpiresAt &&
    user.passwordResetExpiresAt.getTime() - Date.now() > 13 * 60 * 1000
  ) {
    throw new ApiError(
      StatusCodes.TOO_MANY_REQUESTS,
      "Please wait a moment before requesting another reset link",
      "RATE_LIMIT_EXCEEDED",
    );
  }

  // Cryptographically secure, single-use, time-limited token
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: expiresAt,
    },
  });

  // Send password reset email
  await EmailProvider.sendPasswordResetEmail(user.email, user.name, rawToken);

  return genericResponse;
};

const resetPassword = async (payload: IResetPassword) => {
  const token = (payload.token || "").trim();
  if (!token) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Reset token is required",
      "INVALID_OR_EXPIRED_TOKEN",
    );
  }

  if (!payload.newPassword || payload.newPassword.length < 6) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "New password must be at least 6 characters",
      "INVALID_PASSWORD",
    );
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const user = await prisma.user.findFirst({
    where: {
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: { gt: new Date() },
    },
  });

  if (!user) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Invalid or expired reset token",
      "INVALID_OR_EXPIRED_TOKEN",
    );
  }

  const saltRound = env.bcrypt_salt_round || 10;
  const passwordHashed = await bcrypt.hash(payload.newPassword, saltRound);

  // Invalidate reset token and update password hash
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHashed,
      passwordResetTokenHash: null,
      passwordResetExpiresAt: null,
      passwordChangedAt: new Date(),
    },
  });

  if (user.email) {
    await EmailProvider.sendPasswordChangedEmail(user.email, user.name);
  }

  return { message: "Password reset completed successfully. You can now log in with your new password." };
};

const sendEmailVerification = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }

  // Missing email check
  if (!user.email || user.email.trim() === "") {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "You must update your email",
      "EMAIL_REQUIRED",
    );
  }

  const verifiedEmail = user.email;

  if (user.emailVerifiedAt) {
    return {
      message: "Your email address is already verified",
      verified: true,
    };
  }

  // Rate limit: 60 seconds cooldown
  if (
    user.emailVerificationExpiresAt &&
    user.emailVerificationExpiresAt.getTime() - Date.now() > 23.9 * 60 * 60 * 1000
  ) {
    throw new ApiError(
      StatusCodes.TOO_MANY_REQUESTS,
      "Please wait a moment before requesting another verification email",
      "RATE_LIMIT_EXCEEDED",
    );
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await prisma.user.update({
    where: { id: userId },
    data: {
      emailVerificationTokenHash: tokenHash,
      emailVerificationExpiresAt: expiresAt,
    },
  });

  await EmailProvider.sendVerificationEmail(verifiedEmail, user.name, rawToken);

  return {
    message: "Verification email sent successfully. Please check your inbox.",
    sentTo: verifiedEmail,
  };
};

const verifyEmail = async (payload: IVerifyEmail) => {
  const token = (payload.token || "").trim();
  if (!token) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Verification token is required",
      "INVALID_OR_EXPIRED_TOKEN",
    );
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const user = await prisma.user.findFirst({
    where: {
      emailVerificationTokenHash: tokenHash,
      emailVerificationExpiresAt: { gt: new Date() },
    },
  });

  if (!user) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Invalid or expired verification token",
      "INVALID_OR_EXPIRED_TOKEN",
    );
  }

  // Invalidate token and set emailVerifiedAt
  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerifiedAt: new Date(),
      emailVerificationTokenHash: null,
      emailVerificationExpiresAt: null,
    },
  });

  return {
    message: "Email address verified successfully",
    verified: true,
  };
};

export const AuthServices = {
  registerUser,
  loginUser,
  refreshToken,
  getMe,
  changePassword,
  forgotPassword,
  resetPassword,
  sendEmailVerification,
  verifyEmail,
};

export default AuthServices;
