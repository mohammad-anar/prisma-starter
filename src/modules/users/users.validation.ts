import { z } from "zod";
import { UserRole, UserStatus } from "@prisma/client";

const createUserZodSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 characters")
    .regex(/^[0-9+০-৯\s-]+$/, "Invalid phone number format"),
  email: z.string().email("Valid email is required").optional().or(z.literal("")),
  password: z.string().min(6, "Password must be at least 6 characters"),
  bloodGroup: z.string().min(1, "Blood group is required"),
  currentAddress: z.string().min(2, "Current address is required"),
  permanentAddress: z.string().min(2, "Permanent address is required"),
  role: z.nativeEnum(UserRole).optional(),
  status: z.nativeEnum(UserStatus).optional(),
});

const updateUserZodSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().min(10).optional(),
  email: z.string().email().optional().or(z.literal("")),
  currentAddress: z.string().min(2).optional(),
  permanentAddress: z.string().min(2).optional(),
  bloodGroup: z.string().optional(),
  role: z.nativeEnum(UserRole).optional(),
  status: z.nativeEnum(UserStatus).optional(),
  isBlocked: z.boolean().optional(),
});

const updateEmailZodSchema = z.object({
  email: z.string({ error: "Email is required" }).trim().email("Invalid email format"),
});

export const UserValidation = {
  createUserZodSchema,
  updateUserZodSchema,
  updateEmailZodSchema,
};

export default UserValidation;
