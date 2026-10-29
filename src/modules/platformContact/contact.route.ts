import express from "express";
import { UserRole } from "@prisma/client";
import auth from "../../middleware/auth.middleware.js";
import validateRequest from "../../middleware/validate.middleware.js";
import { ContactController } from "./contact.controller.js";
import { ContactValidation } from "./contact.validation.js";

const router = express.Router();

// Public: view contact
router.get("/", ContactController.getPlatformContact);

// Admin / SuperAdmin: update contact
router.patch(
  "/",
  auth(UserRole.ADMIN, UserRole.SUPERADMIN),
  validateRequest(ContactValidation.updateContactZodSchema),
  ContactController.updatePlatformContact,
);

export const ContactRoutes = router;
export default router;
