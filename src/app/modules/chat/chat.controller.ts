import { Request, Response } from "express";
import { ChatService } from "./chat.service.js";
import sendResponse from "../../shared/sendResponse.js";
import catchAsync from "../../shared/catchAsync.js";

const createRoom = catchAsync(async (req: Request, res: Response) => {
  const result = await ChatService.createRoom(req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Room created successfully",
    data: result,
  });
});

export const ChatController = {
  createRoom,
};
