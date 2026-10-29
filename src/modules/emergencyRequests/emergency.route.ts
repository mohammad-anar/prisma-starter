import express from "express";
import { UserRole } from "@prisma/client";
import auth, { optionalAuth } from "../../middleware/auth.middleware.js";
import validateRequest from "../../middleware/validate.middleware.js";
import { EmergencyController } from "./emergency.controller.js";
import { EmergencyValidation } from "./emergency.validation.js";

const router = express.Router();

router.post(
  "/",
  optionalAuth,
  validateRequest(EmergencyValidation.createEmergencyRequestZodSchema),
  EmergencyController.createEmergencyRequest,
);

router.get("/", optionalAuth, EmergencyController.getAllEmergencyRequests);
router.get("/:id", EmergencyController.getEmergencyRequestById);

router.patch(
  "/:id",
  auth(),
  validateRequest(EmergencyValidation.updateEmergencyRequestZodSchema),
  EmergencyController.updateEmergencyRequest,
);

// Admin status & deletion endpoints
router.patch(
  "/admin/:id/status",
  auth(UserRole.ADMIN, UserRole.SUPERADMIN),
  validateRequest(EmergencyValidation.updateStatusZodSchema),
  EmergencyController.updateStatus,
);

router.delete(
  "/admin/:id",
  auth(UserRole.ADMIN, UserRole.SUPERADMIN),
  EmergencyController.deleteEmergencyRequest,
);

export const EmergencyRoutes = router;
export default router;
