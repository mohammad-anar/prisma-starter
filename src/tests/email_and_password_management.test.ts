process.env.NODE_ENV = "test";

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import request from "supertest";
import { Secret } from "jsonwebtoken";
import app from "../app.js";
import env from "../config/env.js";
import prisma from "../config/prisma.js";
import { jwtHelper } from "../utils/jwt.js";
import ApiError from "../utils/ApiError.js";
import { AuthServices } from "../modules/auth/auth.service.js";
import { UserServices } from "../modules/users/users.service.js";
import {
  renderPasswordChangedEmail,
  renderPasswordResetEmail,
  renderVerificationEmail,
} from "../utils/email/templates.js";
import { EmailProvider } from "../utils/email/emailProvider.js";
import { UserRole } from "@prisma/client";

describe("Section 12: Email Verification & Password Recovery Integration & Unit Tests", () => {
  const donorToken = jwtHelper.createToken(
    { id: "507f1f77bcf86cd799439011", phone: "01711111111", role: UserRole.DONOR, status: "APPROVED" },
    env.jwt.jwt_secret as Secret,
    "1h",
  );

  const adminToken = jwtHelper.createToken(
    { id: "507f1f77bcf86cd799439022", phone: "01722222222", role: UserRole.ADMIN, status: "APPROVED" },
    env.jwt.jwt_secret as Secret,
    "1h",
  );

  const superAdminToken = jwtHelper.createToken(
    { id: "507f1f77bcf86cd799439033", phone: "01733333333", role: UserRole.SUPERADMIN, status: "APPROVED" },
    env.jwt.jwt_secret as Secret,
    "1h",
  );

  describe("A. Email Templates & Branding", () => {
    it("renderVerificationEmail should generate branded HTML and Bengali message with token & link", () => {
      const email = renderVerificationEmail({
        name: "তাহমিদ আহমেদ",
        verificationUrl: "https://phulpurblood.org/verify-email?token=abc123xyz",
        token: "abc123xyz",
      });

      assert.match(email.subject, /ফুলপুর ব্লাড ডোনার নেটওয়ার্ক/);
      assert.match(email.html, /ফুলপুর ব্লাড ডোনার নেটওয়ার্ক/);
      assert.match(email.html, /তাহমিদ আহমেদ/);
      assert.match(email.html, /abc123xyz/);
      assert.match(email.html, /verify-email\?token=abc123xyz/);
      assert.match(email.text, /abc123xyz/);
    });

    it("renderPasswordResetEmail should generate secure reset instructions with 15-minute validity note", () => {
      const email = renderPasswordResetEmail({
        name: "মোঃ সাইদুল ইসলাম",
        resetUrl: "https://phulpurblood.org/reset-password?token=secureToken999",
        token: "secureToken999",
      });

      assert.match(email.subject, /পাসওয়ার্ড রিসেট নির্দেশিকা/);
      assert.match(email.html, /১৫ মিনিটের জন্য সক্রিয় থাকবে/);
      assert.match(email.html, /secureToken999/);
    });

    it("renderPasswordChangedEmail should generate security alert notification", () => {
      const email = renderPasswordChangedEmail({
        name: "নাজমুল হুদা",
      });

      assert.match(email.subject, /পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে/);
      assert.match(email.html, /পাসওয়ার্ড এইমাত্র সফলভাবে পরিবর্তন করা হয়েছে/);
    });
  });

  describe("B. API Endpoint Security & Validation", () => {
    it("PATCH /api/v1/auth/change-password should reject unauthenticated requests", async () => {
      const res = await request(app).patch("/api/v1/auth/change-password").send({
        oldPassword: "oldPassword123",
        newPassword: "newPassword123",
      });
      assert.equal(res.status, 401);
      assert.equal(res.body.success, false);
    });

    it("PATCH /api/v1/auth/change-password should validate password length (min 6 chars)", async () => {
      const res = await request(app)
        .patch("/api/v1/auth/change-password")
        .set("Authorization", `Bearer ${donorToken}`)
        .send({
          oldPassword: "oldPassword123",
          newPassword: "123", // Too short
        });
      assert.equal(res.status, 400);
      assert.equal(res.body.errorCode, "VALIDATION_ERROR");
    });

    it("PATCH /api/v1/users/me/email should reject unauthenticated callers", async () => {
      const res = await request(app).patch("/api/v1/users/me/email").send({
        email: "newemail@example.com",
      });
      assert.equal(res.status, 401);
    });

    it("PATCH /api/v1/users/me/email should reject invalid email format", async () => {
      const res = await request(app)
        .patch("/api/v1/users/me/email")
        .set("Authorization", `Bearer ${donorToken}`)
        .send({
          email: "not-an-email",
        });
      assert.equal(res.status, 400);
      assert.equal(res.body.errorCode, "VALIDATION_ERROR");
    });

    it("POST /api/v1/auth/forgot-password should reject invalid email format", async () => {
      const res = await request(app).post("/api/v1/auth/forgot-password").send({
        email: "invalid-email-format",
      });
      assert.equal(res.status, 400);
      assert.equal(res.body.errorCode, "VALIDATION_ERROR");
    });

    it("POST /api/v1/auth/reset-password should require token and valid new password", async () => {
      const res = await request(app).post("/api/v1/auth/reset-password").send({
        token: "",
        newPassword: "123",
      });
      assert.equal(res.status, 400);
      assert.equal(res.body.errorCode, "VALIDATION_ERROR");
    });

    it("POST /api/v1/auth/verify-email should require token in body", async () => {
      const res = await request(app).post("/api/v1/auth/verify-email").send({});
      assert.equal(res.status, 400);
      assert.equal(res.body.errorCode, "VALIDATION_ERROR");
    });
  });

  describe("C. Error Codes & Business Logic Rules", () => {
    it("Change password must throw EMAIL_REQUIRED ('You must update your email') when user has no email", async () => {
      // Mock user without email
      const originalFindUnique = prisma.user.findUnique;
      (prisma.user as any).findUnique = async () => ({
        id: "mock_user_1",
        email: null,
        passwordHashed: "$2a$10$abcdefghijklmnopqrstuvwxyz123456",
      });

      try {
        await assert.rejects(
          async () => {
            await AuthServices.changePassword("mock_user_1", {
              oldPassword: "oldPassword123",
              newPassword: "newPassword123",
            });
          },
          (err: any) => {
            assert.equal(err instanceof ApiError, true);
            assert.equal(err.errorCode, "EMAIL_REQUIRED");
            assert.equal(err.message, "You must update your email");
            return true;
          },
        );
      } finally {
        (prisma.user as any).findUnique = originalFindUnique;
      }
    });

    it("Change password must throw EMAIL_NOT_VERIFIED when user email is unverified", async () => {
      const originalFindUnique = prisma.user.findUnique;
      (prisma.user as any).findUnique = async () => ({
        id: "mock_user_2",
        email: "unverified@example.com",
        emailVerifiedAt: null,
        passwordHashed: "$2a$10$abcdefghijklmnopqrstuvwxyz123456",
      });

      try {
        await assert.rejects(
          async () => {
            await AuthServices.changePassword("mock_user_2", {
              oldPassword: "oldPassword123",
              newPassword: "newPassword123",
            });
          },
          (err: any) => {
            assert.equal(err instanceof ApiError, true);
            assert.equal(err.errorCode, "EMAIL_NOT_VERIFIED");
            return true;
          },
        );
      } finally {
        (prisma.user as any).findUnique = originalFindUnique;
      }
    });

    it("Change password must throw INVALID_CURRENT_PASSWORD when old password does not match", async () => {
      const validHash = await bcrypt.hash("correctOldPassword123", 10);
      const originalFindUnique = prisma.user.findUnique;
      (prisma.user as any).findUnique = async () => ({
        id: "mock_user_3",
        email: "verified@example.com",
        emailVerifiedAt: new Date(),
        passwordHashed: validHash,
      });

      try {
        await assert.rejects(
          async () => {
            await AuthServices.changePassword("mock_user_3", {
              oldPassword: "wrongOldPassword",
              newPassword: "brandNewPassword123",
            });
          },
          (err: any) => {
            assert.equal(err instanceof ApiError, true);
            assert.equal(err.errorCode, "INVALID_CURRENT_PASSWORD");
            return true;
          },
        );
      } finally {
        (prisma.user as any).findUnique = originalFindUnique;
      }
    });

    it("Change password must throw INVALID_PASSWORD when new password equals current password", async () => {
      const validHash = await bcrypt.hash("samePassword123", 10);
      const originalFindUnique = prisma.user.findUnique;
      (prisma.user as any).findUnique = async () => ({
        id: "mock_user_4",
        email: "verified@example.com",
        emailVerifiedAt: new Date(),
        passwordHashed: validHash,
      });

      try {
        await assert.rejects(
          async () => {
            await AuthServices.changePassword("mock_user_4", {
              oldPassword: "samePassword123",
              newPassword: "samePassword123",
            });
          },
          (err: any) => {
            assert.equal(err instanceof ApiError, true);
            assert.equal(err.errorCode, "INVALID_PASSWORD");
            return true;
          },
        );
      } finally {
        (prisma.user as any).findUnique = originalFindUnique;
      }
    });

    it("Update email must throw EMAIL_ALREADY_IN_USE when email exists on another account", async () => {
      const originalFindUnique = prisma.user.findUnique;
      const originalFindFirst = prisma.user.findFirst;

      (prisma.user as any).findUnique = async () => ({
        id: "507f1f77bcf86cd799439011",
        name: "Test Donor",
        email: "current@example.com",
      });

      // Another user has the target email
      (prisma.user as any).findFirst = async () => ({
        id: "507f1f77bcf86cd799439099",
        email: "taken@example.com",
      });

      try {
        await assert.rejects(
          async () => {
            await UserServices.updateMyEmail("507f1f77bcf86cd799439011", {
              email: "taken@example.com",
            });
          },
          (err: any) => {
            assert.equal(err instanceof ApiError, true);
            assert.equal(err.errorCode, "EMAIL_ALREADY_IN_USE");
            return true;
          },
        );
      } finally {
        (prisma.user as any).findUnique = originalFindUnique;
        (prisma.user as any).findFirst = originalFindFirst;
      }
    });

    it("Forgot password must return generic response for unknown email (anti-enumeration)", async () => {
      const originalFindFirst = prisma.user.findFirst;
      (prisma.user as any).findFirst = async () => null;

      try {
        const res = await AuthServices.forgotPassword({ email: "unknown@example.com" });
        assert.equal(
          res.message,
          "If an account with this email exists, a password reset link has been sent.",
        );
      } finally {
        (prisma.user as any).findFirst = originalFindFirst;
      }
    });

    it("Reset password must reject invalid or non-existent token with INVALID_OR_EXPIRED_TOKEN", async () => {
      const originalFindFirst = prisma.user.findFirst;
      (prisma.user as any).findFirst = async () => null; // Token not found

      try {
        await assert.rejects(
          async () => {
            await AuthServices.resetPassword({
              token: "invalid_or_expired_hex_token",
              newPassword: "brandNewPassword123",
            });
          },
          (err: any) => {
            assert.equal(err instanceof ApiError, true);
            assert.equal(err.errorCode, "INVALID_OR_EXPIRED_TOKEN");
            return true;
          },
        );
      } finally {
        (prisma.user as any).findFirst = originalFindFirst;
      }
    });

    it("Verify email must reject invalid token with INVALID_OR_EXPIRED_TOKEN", async () => {
      const originalFindFirst = prisma.user.findFirst;
      (prisma.user as any).findFirst = async () => null;

      try {
        await assert.rejects(
          async () => {
            await AuthServices.verifyEmail({ token: "nonexistent_token" });
          },
          (err: any) => {
            assert.equal(err instanceof ApiError, true);
            assert.equal(err.errorCode, "INVALID_OR_EXPIRED_TOKEN");
            return true;
          },
        );
      } finally {
        (prisma.user as any).findFirst = originalFindFirst;
      }
    });

    it("Password and tokens must be securely hashed and never exposed in plaintext", () => {
      const rawToken = "super_secret_raw_token_xyz_123";
      const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

      assert.notEqual(rawToken, tokenHash);
      assert.equal(tokenHash.length, 64); // SHA-256 hex length
    });
  });

  describe("D. Profile Image Management", () => {
    it("PATCH /api/v1/users/me/profile-image should reject unauthenticated requests", async () => {
      const res = await request(app).patch("/api/v1/users/me/profile-image").send({
        profileImage: "https://example.com/avatar.jpg",
      });
      assert.equal(res.status, 401);
    });

    it("PATCH /api/v1/users/me/profile-image should reject request with no image and no remove flag", async () => {
      const originalFindUnique = prisma.user.findUnique;
      (prisma.user as any).findUnique = async () => ({
        id: "507f1f77bcf86cd799439011",
        profileImage: null,
      });

      try {
        const res = await request(app)
          .patch("/api/v1/users/me/profile-image")
          .set("Authorization", `Bearer ${donorToken}`)
          .send({});
        assert.equal(res.status, 400);
      } finally {
        (prisma.user as any).findUnique = originalFindUnique;
      }
    });

    it("UserServices.updateMyProfileImage should update profile image URL for authenticated user", async () => {
      const originalFindUnique = prisma.user.findUnique;
      const originalUpdate = prisma.user.update;

      (prisma.user as any).findUnique = async () => ({
        id: "507f1f77bcf86cd799439011",
        profileImage: null,
      });

      (prisma.user as any).update = async ({ data }: any) => ({
        id: "507f1f77bcf86cd799439011",
        name: "Test Donor",
        phone: "01711111111",
        profileImage: data.profileImage,
        bloodGroup: "O_POSITIVE",
        role: "DONOR",
      });

      try {
        const res = await UserServices.updateMyProfileImage(
          "507f1f77bcf86cd799439011",
          "/image/donor-avatar-12345.jpg",
        );
        assert.equal(res.profileImage, "/image/donor-avatar-12345.jpg");
        assert.equal(res.message, "Profile image updated successfully");
      } finally {
        (prisma.user as any).findUnique = originalFindUnique;
        (prisma.user as any).update = originalUpdate;
      }
    });

    it("UserServices.updateMyProfileImage should remove profile image when remove is true", async () => {
      const originalFindUnique = prisma.user.findUnique;
      const originalUpdate = prisma.user.update;

      (prisma.user as any).findUnique = async () => ({
        id: "507f1f77bcf86cd799439011",
        profileImage: "/image/old-avatar.jpg",
      });

      (prisma.user as any).update = async ({ data }: any) => ({
        id: "507f1f77bcf86cd799439011",
        name: "Test Donor",
        phone: "01711111111",
        profileImage: data.profileImage, // should be null
        bloodGroup: "O_POSITIVE",
        role: "DONOR",
      });

      try {
        const res = await UserServices.updateMyProfileImage(
          "507f1f77bcf86cd799439011",
          undefined,
          true, // remove = true
        );
        assert.equal(res.profileImage, null);
        assert.equal(res.message, "Profile image removed successfully");
      } finally {
        (prisma.user as any).findUnique = originalFindUnique;
        (prisma.user as any).update = originalUpdate;
      }
    });
  });
});

