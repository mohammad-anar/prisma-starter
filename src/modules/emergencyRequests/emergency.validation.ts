import { z } from "zod";

const createEmergencyRequestZodSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  rugirNam: z.string().min(2, "Patient name (রোগীর নাম) is required"),
  thikana: z.string().min(2, "Address (ঠিকানা) is required"),
  phone: z
    .string()
    .min(10, "Valid phone number is required")
    .regex(/^[0-9+০-৯\s-]+$/, "Invalid phone number format"),
  bloodGroup: z.string().min(1, "Blood group is required"),
  kotoBag: z.coerce.number().int().positive("Number of bags must be a positive integer"),
});

const updateEmergencyRequestZodSchema = z.object({
  title: z.string().min(3).optional(),
  rugirNam: z.string().min(2).optional(),
  thikana: z.string().min(2).optional(),
  phone: z.string().min(10).optional(),
  bloodGroup: z.string().min(1).optional(),
  kotoBag: z.coerce.number().int().positive().optional(),
  status: z.enum(["ACTIVE", "FULFILLED", "CLOSED"]).optional(),
});

const updateStatusZodSchema = z.object({
  status: z.enum(["ACTIVE", "FULFILLED", "CLOSED"], {
    message: "Status must be ACTIVE, FULFILLED, or CLOSED",
  }),
});

export const EmergencyValidation = {
  createEmergencyRequestZodSchema,
  updateEmergencyRequestZodSchema,
  updateStatusZodSchema,
};

export default EmergencyValidation;
