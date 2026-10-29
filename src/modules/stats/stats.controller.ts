import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import { StatsService } from "./stats.service.js";

const getStats = catchAsync(async (req: Request, res: Response) => {
  const result = await StatsService.getPlatformStats();

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Platform statistics retrieved successfully",
    data: result,
  });
});

export const StatsController = {
  getStats,
};

export default StatsController;
