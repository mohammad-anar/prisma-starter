import express from "express";
import { UserRole } from "@prisma/client";
import auth from "../../middleware/auth.middleware.js";
import validateRequest from "../../middleware/validate.middleware.js";
import { AdminController } from "./admin.controller.js";
import { DonationsController } from "../donations/donations.controller.js";
import { EmergencyController } from "../emergencyRequests/emergency.controller.js";
import { EmergencyValidation } from "../emergencyRequests/emergency.validation.js";
import { ContactController } from "../platformContact/contact.controller.js";
import { ContactValidation } from "../platformContact/contact.validation.js";

const router = express.Router();

// All admin routes require ADMIN or SUPERADMIN role
router.use(auth(UserRole.ADMIN, UserRole.SUPERADMIN));

// Admin donor management
router.get("/overview", AdminController.getAdminOverview);
router.get("/donors", AdminController.getAllDonors);
router.patch("/donors/:id/approve", AdminController.approveDonor);
router.patch("/donors/:id/reject", AdminController.rejectDonor);
router.patch("/donors/:id/block", AdminController.blockDonor);
router.patch("/donors/:id/unblock", AdminController.unblockDonor);
router.get("/reports", AdminController.getOperationalReports);

// Admin donation verification
router.get("/donations", DonationsController.getAllDonationsForAdmin);
router.patch("/donations/:id/approve", DonationsController.approveDonation);
router.patch("/donations/:id/reject", DonationsController.rejectDonation);

// Admin emergency requests management
router.patch(
  "/emergency-requests/:id/status",
  validateRequest(EmergencyValidation.updateStatusZodSchema),
  EmergencyController.updateStatus,
);
router.delete("/emergency-requests/:id", EmergencyController.deleteEmergencyRequest);

// Admin platform contact update
router.patch(
  "/platform-contact",
  validateRequest(ContactValidation.updateContactZodSchema),
  ContactController.updatePlatformContact,
);

export const AdminRoutes = router;
export default router;
