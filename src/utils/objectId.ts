import { StatusCodes } from "http-status-codes";
import ApiError from "./ApiError.js";

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

export const isValidObjectId = (id: string | null | undefined): boolean => {
  if (!id || typeof id !== "string") return false;
  return OBJECT_ID_REGEX.test(id);
};

export const validateObjectId = (
  id: string | null | undefined,
  fieldName = "id",
): string => {
  if (!id || !isValidObjectId(id)) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      `Invalid MongoDB ObjectId provided for '${fieldName}'`,
    );
  }
  return id;
};

export default {
  isValidObjectId,
  validateObjectId,
};
