import { Prisma } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { ZodError } from "zod";
import env from "../config/env.js";
import ApiError from "../utils/ApiError.js";

type IErrorMessage = {
  path: string | number;
  message: string;
};

export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    statusCode: StatusCodes.NOT_FOUND,
    errorCode: "ROUTE_NOT_FOUND",
    message: "Route Not Found",
    errorMessages: [
      {
        path: req.originalUrl,
        message: `Cannot ${req.method} ${req.originalUrl}`,
      },
    ],
  });
};

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let statusCode: number = StatusCodes.INTERNAL_SERVER_ERROR;
  let errorCode: string | undefined = undefined;
  let message: string = "Something went wrong!";
  let errorMessages: IErrorMessage[] = [];

  // Zod Validation Errors
  if (err instanceof ZodError) {
    statusCode = StatusCodes.BAD_REQUEST;
    errorCode = "VALIDATION_ERROR";
    message = "Validation Error";
    errorMessages = err.issues.map((issue) => ({
      path: String(issue.path[issue.path.length - 1] ?? "field"),
      message: issue.message,
    }));
  }

  // Prisma Known Request Errors
  else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      statusCode = StatusCodes.CONFLICT;
      const target = err.meta?.target;
      const field = Array.isArray(target)
        ? target.join(", ")
        : typeof target === "string"
        ? target.replace(/_\d+$/, "")
        : "field";

      if (field.includes("email")) {
        errorCode = "EMAIL_ALREADY_IN_USE";
        message = "Email address is already in use";
      } else {
        errorCode = "DUPLICATE_ENTRY";
        message = `Duplicate value for unique field: ${field}`;
      }
      errorMessages = [{ path: field, message }];
    } else if (err.code === "P2025") {
      statusCode = StatusCodes.NOT_FOUND;
      errorCode = "RECORD_NOT_FOUND";
      message = "Record not found";
      errorMessages = [{ path: "id", message: "Record not found" }];
    } else {
      statusCode = StatusCodes.BAD_REQUEST;
      errorCode = "DATABASE_ERROR";
      message = err.message || "Database query error";
      errorMessages = [{ path: "database", message }];
    }
  }

  // Prisma Validation Error
  else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = StatusCodes.BAD_REQUEST;
    errorCode = "DATABASE_VALIDATION_ERROR";
    message = "Invalid data provided to database query.";
    errorMessages = [{ path: "input", message }];
  }

  // Prisma Connection Error
  else if (err instanceof Prisma.PrismaClientInitializationError) {
    statusCode = StatusCodes.SERVICE_UNAVAILABLE;
    errorCode = "DATABASE_CONNECTION_ERROR";
    message = "Database connection failed.";
    errorMessages = [{ path: "database", message }];
  }

  // JWT Errors
  else if (
    err.name === "TokenExpiredError" ||
    err.name === "JsonWebTokenError" ||
    err.name === "NotBeforeError"
  ) {
    statusCode = StatusCodes.UNAUTHORIZED;
    errorCode = "INVALID_OR_EXPIRED_TOKEN";
    message = err.message || "Authentication token error";
    errorMessages = [{ path: "token", message }];
  }

  // Custom ApiError
  else if (err instanceof ApiError) {
    statusCode = err.statusCode;
    errorCode = err.errorCode;
    message = err.message;
    errorMessages = [{ path: "error", message: err.message }];
  }

  // Generic / Standard Error
  else if (err instanceof Error) {
    statusCode = (err as any).statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
    message = err.message || "An unexpected error occurred.";
    errorMessages = [{ path: "error", message }];
  }

  res.status(statusCode).json({
    success: false,
    statusCode,
    ...(errorCode && { errorCode }),
    message,
    errorMessages,
    ...(env.node_env === "development" && { stack: err?.stack }),
  });
};

export default {
  errorHandler,
  notFoundHandler,
};
