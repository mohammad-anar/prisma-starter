import express from "express";
import { UserRole } from "@prisma/client";
import auth from "../../middleware/auth.middleware.js";
import validateRequest from "../../middleware/validate.middleware.js";
import { UserController } from "./users.controller.js";
import { UserValidation } from "./users.validation.js";

const router = express.Router();

router.post(
  "/",
  auth(UserRole.ADMIN),
  validateRequest(UserValidation.createUserZodSchema),
  UserController.createUser,
);

router.get(
  "/",
  auth(UserRole.ADMIN),
  UserController.getAllUsers,
);

router.get(
  "/:id",
  auth(),
  UserController.getUserById,
);

router.patch(
  "/:id",
  auth(UserRole.ADMIN),
  validateRequest(UserValidation.updateUserZodSchema),
  UserController.updateUser,
);

router.delete(
  "/:id",
  auth(UserRole.ADMIN),
  UserController.deleteUser,
);

export const UserRoutes = router;
export default router;
