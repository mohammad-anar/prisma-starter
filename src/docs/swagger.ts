export const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "ফুলপুর ব্লাড ডোনার নেটওয়ার্ক API (Phulpur Blood Donor Network)",
    version: "1.0.0",
    description:
      "RESTful API documentation for Phulpur Blood Donor Network — a MongoDB & Prisma based blood donor community platform with RBAC, 120-day donation countdown tracking, emergency requests, and administrator verification.",
    contact: {
      name: "Phulpur Blood Donor Network Support",
      email: "contact@phulpurblood.org",
    },
  },
  servers: [
    {
      url: "http://localhost:5001",
      description: "Local Development Server",
    },
    {
      url: "/api/v1",
      description: "Base API Path",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      User: {
        type: "object",
        properties: {
          id: { type: "string", example: "660c1abf8d74567890abcdef" },
          name: { type: "string", example: "মোঃ রফিকুল ইসলাম" },
          phone: { type: "string", example: "01712345678" },
          email: { type: "string", nullable: true, example: "rafiqul@example.com" },
          emailVerifiedAt: { type: "string", format: "date-time", nullable: true },
          isEmailVerified: { type: "boolean", example: true },
          bloodGroup: {
            type: "string",
            enum: [
              "A_POSITIVE",
              "A_NEGATIVE",
              "B_POSITIVE",
              "B_NEGATIVE",
              "AB_POSITIVE",
              "AB_NEGATIVE",
              "O_POSITIVE",
              "O_NEGATIVE",
            ],
            example: "O_POSITIVE",
          },
          status: { type: "string", enum: ["PENDING", "APPROVED"], example: "APPROVED" },
          currentAddress: { type: "string", example: "ফুলপুর পৌরসভা, ময়মনসিংহ" },
          permanentAddress: { type: "string", example: "ফুলপুর, ময়মনসিংহ" },
          role: { type: "string", enum: ["DONOR", "ADMIN", "SUPERADMIN"], example: "DONOR" },
          isBlocked: { type: "boolean", example: false },
          profileImage: { type: "string", nullable: true },
          gender: { type: "string", example: "male" },
        },
      },
      BloodDonateRecord: {
        type: "object",
        properties: {
          id: { type: "string", example: "660c2bc08d74567890abcdef" },
          donorId: { type: "string", example: "660c1abf8d74567890abcdef" },
          donationDate: { type: "string", format: "date-time" },
          donationAddress: { type: "string", example: "ফুলপুর উপজেলা স্বাস্থ্য কমপ্লেক্স" },
          rugirDhoron: { type: "string", nullable: true, example: "থ্যালাসেমিয়া রোগী" },
          donationSlipNumber: { type: "string", nullable: true, example: "SLIP-2026-001" },
          slipUrl: { type: "string", nullable: true, example: "/slips/slip-123456789.jpg" },
          status: { type: "string", enum: ["PENDING", "APPROVED", "REJECTED"], example: "APPROVED" },
          verifiedById: { type: "string", nullable: true },
          verifiedAt: { type: "string", format: "date-time", nullable: true },
        },
      },
      EmergencyBloodRequest: {
        type: "object",
        properties: {
          id: { type: "string", example: "660c3cd18d74567890abcdef" },
          title: { type: "string", example: "জরুরি ১ ব্যাগ ও পজিটিভ রক্ত প্রয়োজন" },
          rugirNam: { type: "string", example: "সালমা বেগম" },
          thikana: { type: "string", example: "ফুলপুর সদর হাসপাতাল, ফুলপুর" },
          phone: { type: "string", example: "01812345678" },
          bloodGroup: { type: "string", example: "O_POSITIVE" },
          kotoBag: { type: "integer", example: 1 },
          status: { type: "string", enum: ["ACTIVE", "FULFILLED", "CLOSED"], example: "ACTIVE" },
          createdById: { type: "string", nullable: true },
        },
      },
      PlatformContact: {
        type: "object",
        properties: {
          id: { type: "string" },
          phone: { type: "string", example: "০১৭১২-৩৪৫৬৭৮" },
          email: { type: "string", example: "contact@phulpurblood.org" },
          whatsapp: { type: "string", example: "+8801712345678" },
        },
      },
    },
  },
  paths: {
    "/api/v1/auth/register": {
      post: {
        tags: ["Authentication"],
        summary: "Public donor registration (defaults to DONOR & PENDING)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "phone", "bloodGroup", "currentAddress", "permanentAddress", "password"],
                properties: {
                  name: { type: "string", example: "মোঃ রফিকুল ইসলাম" },
                  phone: { type: "string", example: "01712345678" },
                  bloodGroup: { type: "string", example: "O+" },
                  currentAddress: { type: "string", example: "ফুলপুর পৌরসভা, ময়মনসিংহ" },
                  permanentAddress: { type: "string", example: "ফুলপুর, ময়মনসিংহ" },
                  password: { type: "string", example: "Secret123!" },
                  email: { type: "string", example: "donor@example.com" },
                  gender: { type: "string", enum: ["male", "female", "other"], example: "male" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "User registered successfully; awaiting approval" },
          409: { description: "Phone number already registered" },
        },
      },
    },
    "/api/v1/auth/login": {
      post: {
        tags: ["Authentication"],
        summary: "Login with phone or email and password",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["password"],
                properties: {
                  phone: { type: "string", example: "01712345678" },
                  email: { type: "string", example: "donor@example.com" },
                  password: { type: "string", example: "Secret123!" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "User logged in successfully with JWT tokens" },
          401: { description: "Invalid password" },
          403: { description: "User account is blocked" },
          404: { description: "User not found" },
        },
      },
    },
    "/api/v1/auth/logout": {
      post: {
        tags: ["Authentication"],
        summary: "Logout user",
        responses: { 200: { description: "Logged out successfully" } },
      },
    },
    "/api/v1/auth/me": {
      get: {
        tags: ["Authentication"],
        summary: "Get current authenticated profile with countdown tracker",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Current user profile" } },
      },
    },
    "/api/v1/users/me/email": {
      patch: {
        tags: ["Users"],
        summary: "Update own email address and send verification token",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email"],
                properties: {
                  email: { type: "string", format: "email", example: "newemail@example.com" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Email updated, verification email dispatched" },
          400: { description: "Invalid email format" },
          409: { description: "EMAIL_ALREADY_IN_USE" },
        },
      },
    },
    "/api/v1/users/me/profile-image": {
      patch: {
        tags: ["Users"],
        summary: "Upload, update, or remove own profile image",
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  profileImage: { type: "string", format: "binary", description: "Image file (JPEG, PNG, WEBP)" },
                  remove: { type: "boolean", description: "Set true to remove profile image" },
                },
              },
            },
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  profileImage: { type: "string", nullable: true, example: "https://example.com/avatar.jpg" },
                  remove: { type: "boolean", example: false },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Profile image updated or removed successfully" },
          400: { description: "Invalid image format or file size exceeded" },
          401: { description: "Unauthorized" },
        },
      },
    },
    "/api/v1/auth/change-password": {
      patch: {
        tags: ["Authentication"],
        summary: "Change password (requires verified email)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["currentPassword", "newPassword"],
                properties: {
                  currentPassword: { type: "string", example: "OldSecret123!" },
                  newPassword: { type: "string", example: "NewSecret456!" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Password updated successfully" },
          400: { description: "EMAIL_REQUIRED ('You must update your email') or INVALID_CURRENT_PASSWORD" },
          403: { description: "EMAIL_NOT_VERIFIED" },
        },
      },
    },
    "/api/v1/auth/send-email-verification": {
      post: {
        tags: ["Authentication"],
        summary: "Request a new email verification message",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Verification email sent successfully" },
          400: { description: "EMAIL_REQUIRED" },
          429: { description: "RATE_LIMIT_EXCEEDED" },
        },
      },
    },
    "/api/v1/auth/verify-email": {
      post: {
        tags: ["Authentication"],
        summary: "Verify email address using token",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["token"],
                properties: {
                  token: { type: "string", example: "32_byte_hex_token" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Email verified successfully" },
          400: { description: "INVALID_OR_EXPIRED_TOKEN" },
        },
      },
    },
    "/api/v1/auth/forgot-password": {
      post: {
        tags: ["Authentication"],
        summary: "Request password reset email (generic response to prevent enumeration)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email"],
                properties: {
                  email: { type: "string", format: "email", example: "donor@example.com" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Generic acceptance message" },
          429: { description: "RATE_LIMIT_EXCEEDED" },
        },
      },
    },
    "/api/v1/auth/reset-password": {
      post: {
        tags: ["Authentication"],
        summary: "Reset password with single-use secure token",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["token", "newPassword"],
                properties: {
                  token: { type: "string", example: "32_byte_hex_token" },
                  newPassword: { type: "string", example: "NewSecret456!" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Password reset completed successfully" },
          400: { description: "INVALID_OR_EXPIRED_TOKEN or INVALID_PASSWORD" },
        },
      },
    },
    "/api/v1/donors": {
      get: {
        tags: ["Donors"],
        summary: "Public approved donor directory with filters and countdown eligibility",
        parameters: [
          { name: "bloodGroup", in: "query", schema: { type: "string" }, description: "e.g. O+, A-, O_POSITIVE" },
          { name: "location", in: "query", schema: { type: "string" }, description: "Location search" },
          { name: "searchQuery", in: "query", schema: { type: "string" }, description: "Name/phone/location search" },
          { name: "onlyAvailable", in: "query", schema: { type: "boolean" }, description: "Only return donors who can donate today" },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 10 } },
        ],
        responses: { 200: { description: "List of approved donors" } },
      },
    },
    "/api/v1/donors/{id}": {
      get: {
        tags: ["Donors"],
        summary: "Get single approved donor public profile",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Donor profile" }, 404: { description: "Donor not found" } },
      },
    },
    "/api/v1/donors/me": {
      patch: {
        tags: ["Donors"],
        summary: "Update current authenticated donor's profile",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Profile updated" } },
      },
    },
    "/api/v1/donors/me/donations": {
      get: {
        tags: ["Donors"],
        summary: "Get current donor's donation records and 120-day countdown",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Donation history and countdown" } },
      },
    },
    "/api/v1/donations": {
      post: {
        tags: ["Donations"],
        summary: "Submit a new blood donation record with optional slip upload",
        security: [{ bearerAuth: [] }],
        responses: { 201: { description: "Donation record submitted for review" } },
      },
    },
    "/api/v1/donations/me": {
      get: {
        tags: ["Donations"],
        summary: "View my donation records and 120-day countdown tracker",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Donation records and countdown" } },
      },
    },
    "/api/v1/admin/donors": {
      get: {
        tags: ["Admin Donor Management"],
        summary: "List all donors for administrator review",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "status", in: "query", schema: { type: "string", enum: ["PENDING", "APPROVED"] } },
          { name: "isBlocked", in: "query", schema: { type: "boolean" } },
        ],
        responses: { 200: { description: "Donors list" } },
      },
    },
    "/api/v1/admin/donors/{id}/approve": {
      patch: {
        tags: ["Admin Donor Management"],
        summary: "Approve a pending donor registration",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Donor approved" } },
      },
    },
    "/api/v1/admin/donors/{id}/reject": {
      patch: {
        tags: ["Admin Donor Management"],
        summary: "Reject a pending donor registration",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Donor rejected" } },
      },
    },
    "/api/v1/admin/donors/{id}/block": {
      patch: {
        tags: ["Admin Donor Management"],
        summary: "Block a donor account",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Donor blocked" } },
      },
    },
    "/api/v1/admin/donors/{id}/unblock": {
      patch: {
        tags: ["Admin Donor Management"],
        summary: "Unblock a donor account",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Donor unblocked" } },
      },
    },
    "/api/v1/admin/donations": {
      get: {
        tags: ["Admin Donation Verification"],
        summary: "View all donation records",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Donation records list" } },
      },
    },
    "/api/v1/admin/donations/{id}/approve": {
      patch: {
        tags: ["Admin Donation Verification"],
        summary: "Approve a donation record and reset countdown to 120 days",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Donation record approved" } },
      },
    },
    "/api/v1/admin/donations/{id}/reject": {
      patch: {
        tags: ["Admin Donation Verification"],
        summary: "Reject a donation record",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Donation record rejected" } },
      },
    },
    "/api/v1/superadmin/admins": {
      get: {
        tags: ["Super Admin Management"],
        summary: "List all administrator accounts (Super Admin only)",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Administrators list" } },
      },
    },
    "/api/v1/superadmin/admins/{id}/block": {
      patch: {
        tags: ["Super Admin Management"],
        summary: "Block an administrator account",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Admin blocked" } },
      },
    },
    "/api/v1/superadmin/admins/{id}/unblock": {
      patch: {
        tags: ["Super Admin Management"],
        summary: "Unblock an administrator account",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Admin unblocked" } },
      },
    },
    "/api/v1/superadmin/admins/{id}/remove-role": {
      patch: {
        tags: ["Super Admin Management"],
        summary: "Remove admin privileges and demote account to DONOR",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Admin privileges removed" } },
      },
    },
    "/api/v1/superadmin/admins/{id}": {
      delete: {
        tags: ["Super Admin Management"],
        summary: "Permanently delete an admin account (only if safe without audit conflicts)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Admin deleted" }, 409: { description: "Audit conflict: associated records exist" } },
      },
    },
    "/api/v1/emergency-requests": {
      post: {
        tags: ["Emergency Blood Requests"],
        summary: "Post an emergency blood request",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["title", "rugirNam", "thikana", "phone", "bloodGroup", "kotoBag"],
                properties: {
                  title: { type: "string", example: "জরুরি ১ ব্যাগ ও পজিটিভ রক্ত প্রয়োজন" },
                  rugirNam: { type: "string", example: "সালমা বেগম" },
                  thikana: { type: "string", example: "ফুলপুর সদর হাসপাতাল" },
                  phone: { type: "string", example: "01712345678" },
                  bloodGroup: { type: "string", example: "O+" },
                  kotoBag: { type: "integer", example: 1 },
                },
              },
            },
          },
        },
        responses: { 201: { description: "Emergency request created" } },
      },
      get: {
        tags: ["Emergency Blood Requests"],
        summary: "View active emergency blood requests",
        responses: { 200: { description: "Emergency requests list" } },
      },
    },
    "/api/v1/emergency-requests/{id}": {
      get: {
        tags: ["Emergency Blood Requests"],
        summary: "Get single emergency blood request",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Emergency request details" } },
      },
      patch: {
        tags: ["Emergency Blood Requests"],
        summary: "Update emergency blood request (owner or admin)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Emergency request updated" } },
      },
    },
    "/api/v1/admin/emergency-requests/{id}/status": {
      patch: {
        tags: ["Emergency Blood Requests"],
        summary: "Update emergency blood request status (ACTIVE, FULFILLED, CLOSED)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Status updated" } },
      },
    },
    "/api/v1/admin/emergency-requests/{id}": {
      delete: {
        tags: ["Emergency Blood Requests"],
        summary: "Delete emergency blood request (admin only)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Request deleted" } },
      },
    },
    "/api/v1/platform-contact": {
      get: {
        tags: ["Platform Contact"],
        summary: "Public read platform contact information",
        responses: { 200: { description: "Platform contact info" } },
      },
    },
    "/api/v1/admin/platform-contact": {
      patch: {
        tags: ["Platform Contact"],
        summary: "Update platform contact information (admin only)",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Platform contact updated" } },
      },
    },
    "/api/v1/stats": {
      get: {
        tags: ["Platform Stats"],
        summary: "Public platform statistics (total donors, donations, last donation days ago)",
        responses: { 200: { description: "Platform statistics" } },
      },
    },
  },
};

export default swaggerDocument;
