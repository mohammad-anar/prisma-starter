import { z } from "zod";
import { UserRole, UserStatus } from "@prisma/client";

const createUserZodSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().optional(),
  role: z.nativeEnum(UserRole).optional(),
});

const updateUserZodSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  role: z.nativeEnum(UserRole).optional(),
  status: z.nativeEnum(UserStatus).optional(),
});

export const UserValidation = {
  createUserZodSchema,
  updateUserZodSchema,
};
