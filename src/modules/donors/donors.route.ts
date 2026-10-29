import express from "express";
import auth from "../../middleware/auth.middleware.js";
import fileUploadHandler from "../../middleware/fileUpload.middleware.js";
import validateRequest from "../../middleware/validate.middleware.js";
import { DonorsController } from "./donors.controller.js";
import { DonorsValidation } from "./donors.validation.js";

const router = express.Router();

// Public routes
router.get("/", DonorsController.getAllDonors);
router.get("/me/donations", auth(), DonorsController.getMyDonations);
router.patch(
  "/me",
  auth(),
  fileUploadHandler(),
  validateRequest(DonorsValidation.updateProfileZodSchema),
  DonorsController.updateMyProfile,
);
router.get("/:id", DonorsController.getDonorById);

export const DonorsRoutes = router;
export default router;
