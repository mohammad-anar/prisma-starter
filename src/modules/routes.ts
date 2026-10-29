import express from "express";
import { AuthRoutes } from "./auth/auth.route.js";
import { DonorsRoutes } from "./donors/donors.route.js";
import { AdminRoutes } from "./admin/admin.route.js";
import { SuperAdminRoutes } from "./superadmin/superadmin.route.js";
import { DonationsRoutes } from "./donations/donations.route.js";
import { EmergencyRoutes } from "./emergencyRequests/emergency.route.js";
import { ContactRoutes } from "./platformContact/contact.route.js";
import { ContactMessageRoutes } from "./contact/contact.route.js";
import { StatsRoutes } from "./stats/stats.route.js";
import { UserRoutes } from "./users/users.route.js";

const router = express.Router();

const moduleRoutes = [
  { path: "/auth", route: AuthRoutes },
  { path: "/donors", route: DonorsRoutes },
  { path: "/admin", route: AdminRoutes },
  { path: "/superadmin", route: SuperAdminRoutes },
  { path: "/donations", route: DonationsRoutes },
  { path: "/emergency-requests", route: EmergencyRoutes },
  { path: "/platform-contact", route: ContactRoutes },
  { path: "/contact", route: ContactMessageRoutes },
  { path: "/stats", route: StatsRoutes },
  { path: "/users", route: UserRoutes },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
