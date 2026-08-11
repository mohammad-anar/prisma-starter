import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync.js";
import { UserSerivces } from "./user.service.js";

const createPatient = catchAsync(async (req: Request, res: Response) => {
  const result = await UserSerivces.createPatient(req.body);
  console.log({ result });
});

export const UserController = {
  createPatient,
};
