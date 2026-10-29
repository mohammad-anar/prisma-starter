import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import { ContactMessageService } from "./contact.service.js";

const createContactMessage = catchAsync(async (req: Request, res: Response) => {
  const result = await ContactMessageService.createContactMessage(req.body);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "আপনার বার্তাটি সফলভাবে পাঠানো হয়েছে। যোগাযোগ করার জন্য ধন্যবাদ।",
    data: result,
  });
});

const getContactMessages = catchAsync(async (req: Request, res: Response) => {
  const result = await ContactMessageService.getContactMessages(req.query);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "যোগাযোগ বার্তাসমূহ সফলভাবে লোড হয়েছে।",
    pagination: result.meta,
    data: result.data,
  });
});

const updateContactMessageStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const result = await ContactMessageService.updateContactMessageStatus(id, status);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "বার্তার স্থিতি সফলভাবে আপডেট করা হয়েছে।",
    data: result,
  });
});

const deleteContactMessage = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ContactMessageService.deleteContactMessage(id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.message,
    data: result,
  });
});

export const ContactMessageController = {
  createContactMessage,
  getContactMessages,
  updateContactMessageStatus,
  deleteContactMessage,
};

export default ContactMessageController;
