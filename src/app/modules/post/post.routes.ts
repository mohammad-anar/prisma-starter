import express from "express";
import { PostController } from "./post.controller.js";

const router = express.Router();

router.post("/create-post", PostController.createPost);
router.get("/", PostController.getAllPosts);

export const PostRoutes = router;
