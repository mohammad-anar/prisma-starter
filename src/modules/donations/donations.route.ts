import express from "express";
import { UserRole } from "@prisma/client";
import auth from "../../middleware/auth.middleware.js";
import fileUploadHandler from "../../middleware/fileUpload.middleware.js";
import validateRequest from "../../middleware/validate.middleware.js";
import { DonationsController } from "./donations.controller.js";
import { DonationsValidation } from "./donations.validation.js";

const router = express.Router();

// Donor endpoints
router.post(
  "/",
  auth(),
  fileUploadHandler(),
  validateRequest(DonationsValidation.createDonationZodSchema),
  DonationsController.createDonation,
);

router.get("/me", auth(), DonationsController.getMyDonations);

// Admin endpoints (also reachable via /api/v1/admin/donations in routes.ts)
router.get(
  "/admin/all",
  auth(UserRole.ADMIN, UserRole.SUPERADMIN),
  DonationsController.getAllDonationsForAdmin,
);

router.patch(
  "/admin/:id/approve",
  auth(UserRole.ADMIN, UserRole.SUPERADMIN),
  DonationsController.approveDonation,
);

router.patch(
  "/admin/:id/reject",
  auth(UserRole.ADMIN, UserRole.SUPERADMIN),
  DonationsController.rejectDonation,
);

export const DonationsRoutes = router;
export default router;
