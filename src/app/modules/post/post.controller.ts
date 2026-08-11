import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync.js";
import { PostServices } from "./post.service.js";
import sendResponse from "../../shared/sendResponse.js";
import httpStatus from "http-status";

const createPost = catchAsync(async (req: Request, res: Response) => {
  const result = await PostServices.createPost(req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Post created successfully",
    data: result,
  });
});

const getAllPosts = catchAsync(async (req: Request, res: Response) => {
  const result = await PostServices.getAllPosts();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Posts fetched successfully",
    data: result,
  });
});

export const PostController = {
  createPost,
  getAllPosts,
};
