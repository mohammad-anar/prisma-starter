import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { Secret } from "jsonwebtoken";
import env from "../config/env.js";
import ApiError from "../utils/ApiError.js";
import { jwtHelper } from "../utils/jwt.js";

export const auth =
  (...roles: string[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tokenWithBearer = req.headers.authorization;
      if (!tokenWithBearer) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, "You are not authorized");
      }

      if (!tokenWithBearer.startsWith("Bearer ")) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          "Invalid token format! Token must start with Bearer",
        );
      }

      const token = tokenWithBearer.split(" ")[1];

      // verify token
      const verifyUser = jwtHelper.verifyToken(
        token,
        env.jwt.jwt_secret as Secret,
      );

      // set user to req
      req.user = verifyUser;

      // role guard
      if (roles.length && !roles.includes(verifyUser.role)) {
        throw new ApiError(
          StatusCodes.FORBIDDEN,
          "You don't have permission to access this resource",
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };

export default auth;
