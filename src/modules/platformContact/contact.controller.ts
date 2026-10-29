import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import { ContactService } from "./contact.service.js";

const getPlatformContact = catchAsync(async (req: Request, res: Response) => {
  const result = await ContactService.getPlatformContact();

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Platform contact retrieved successfully",
    data: result,
  });
});

const updatePlatformContact = catchAsync(async (req: Request, res: Response) => {
  const adminUserId = req.user.id;
  const result = await ContactService.updatePlatformContact(
    req.body,
    adminUserId,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.message,
    data: result,
  });
});

export const ContactController = {
  getPlatformContact,
  updatePlatformContact,
};

export default ContactController;
