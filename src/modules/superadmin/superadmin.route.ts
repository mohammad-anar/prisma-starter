import express from "express";
import { UserRole } from "@prisma/client";
import auth from "../../middleware/auth.middleware.js";
import { SuperAdminController } from "./superadmin.controller.js";

const router = express.Router();

// Strictly SUPERADMIN role only
router.use(auth(UserRole.SUPERADMIN));

router.get("/admins", SuperAdminController.getAllAdmins);
router.patch("/admins/:id/block", SuperAdminController.blockAdmin);
router.patch("/admins/:id/unblock", SuperAdminController.unblockAdmin);
router.patch("/admins/:id/remove-role", SuperAdminController.removeAdminRole);
router.delete("/admins/:id", SuperAdminController.deleteAdmin);

export const SuperAdminRoutes = router;
export default router;
