import express from "express";
import { UserRouter } from "../modules/user/user.routes.js";
import { PostRoutes } from "../modules/post/post.routes.js";

const router = express.Router();

const moduleRoutes = [
  {
    path: "/users",
    route: UserRouter,
  },
  {
    path: "/posts",
    route: PostRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
