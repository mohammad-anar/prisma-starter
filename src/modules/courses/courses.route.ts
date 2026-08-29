import express from "express";
import { CoursesController } from "./courses.controller.js";

const router = express.Router();

router.get("/", CoursesController.getAllCourses);

export const CoursesRoutes = router;
export default router;
