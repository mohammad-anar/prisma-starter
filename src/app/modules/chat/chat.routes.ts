import express from "express";
import { ChatController } from "./chat.controller.js";

const router = express.Router();

router.post("/create-room", ChatController.createRoom);

export const ChatRoutes = router;
