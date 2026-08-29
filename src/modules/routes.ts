import express from "express";
import { AuthRoutes } from "./auth/auth.route.js";
import { UserRoutes } from "./users/users.route.js";
import { CoursesRoutes } from "./courses/courses.route.js";
import { MilestonesRoutes } from "./milestones/milestones.route.js";
import { ModuleRoutes } from "./modules/modules.route.js";
import { LessonsRoutes } from "./lessons/lessons.route.js";
import { VideosRoutes } from "./videos/videos.route.js";
import { EnrollmentsRoutes } from "./enrollments/enrollments.route.js";
import { PaymentsRoutes } from "./payments/payments.route.js";
import { ProgressRoutes } from "./progress/progress.route.js";
import { NotificationsRoutes } from "./notifications/notifications.route.js";

const router = express.Router();

const moduleRoutes = [
  { path: "/auth", route: AuthRoutes },
  { path: "/users", route: UserRoutes },
  { path: "/courses", route: CoursesRoutes },
  { path: "/milestones", route: MilestonesRoutes },
  { path: "/modules", route: ModuleRoutes },
  { path: "/lessons", route: LessonsRoutes },
  { path: "/videos", route: VideosRoutes },
  { path: "/enrollments", route: EnrollmentsRoutes },
  { path: "/payments", route: PaymentsRoutes },
  { path: "/progress", route: ProgressRoutes },
  { path: "/notifications", route: NotificationsRoutes },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
