import express from "express";
import { UserRole } from "@prisma/client";
import auth from "../../middleware/auth.middleware.js";
import validateRequest from "../../middleware/validate.middleware.js";
import { ContactMessageController } from "./contact.controller.js";
import { ContactMessageValidation } from "./contact.validation.js";

const router = express.Router();

// Public: Submit a contact message
router.post(
  "/",
  validateRequest(ContactMessageValidation.createContactMessageZodSchema),
  ContactMessageController.createContactMessage,
);

// Admin / SuperAdmin: View submitted contact messages
router.get(
  "/",
  auth(UserRole.ADMIN, UserRole.SUPERADMIN),
  ContactMessageController.getContactMessages,
);

// Admin / SuperAdmin: Update message status
router.patch(
  "/:id/status",
  auth(UserRole.ADMIN, UserRole.SUPERADMIN),
  ContactMessageController.updateContactMessageStatus,
);

// Admin / SuperAdmin: Delete message
router.delete(
  "/:id",
  auth(UserRole.ADMIN, UserRole.SUPERADMIN),
  ContactMessageController.deleteContactMessage,
);

export const ContactMessageRoutes = router;
export default router;
