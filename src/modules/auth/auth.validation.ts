import { z } from "zod";

const registerZodSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 characters")
    .regex(/^[0-9+০-৯\s-]+$/, "Invalid phone number format"),
  bloodGroup: z.string().min(1, "Blood group is required"),
  currentAddress: z.string().min(2, "Current address is required"),
  permanentAddress: z.string().min(2, "Permanent address is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  email: z.string().email("Invalid email format").optional().or(z.literal("")),
  profileImage: z.string().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
});

const loginZodSchema = z
  .object({
    phone: z.string().optional(),
    email: z.string().optional(),
    identifier: z.string().optional(),
    password: z.string().min(1, "Password is required"),
  })
  .refine(
    (data) => Boolean(data.phone || data.email || data.identifier),
    {
      message: "Please provide a phone number or email to log in",
      path: ["phone"],
    },
  );

const changePasswordZodSchema = z
  .object({
    oldPassword: z.string().optional(),
    currentPassword: z.string().optional(),
    newPassword: z.string().min(6, "New password must be at least 6 characters"),
  })
  .refine(
    (data) => Boolean(data.oldPassword || data.currentPassword),
    {
      message: "Current password is required",
      path: ["oldPassword"],
    },
  );

const forgotPasswordZodSchema = z.object({
  email: z.string().trim().email("Valid email format is required"),
});

const resetPasswordZodSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

const verifyEmailZodSchema = z.object({
  token: z.string().min(1, "Verification token is required"),
});

const refreshTokenZodSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export const AuthValidation = {
  registerZodSchema,
  loginZodSchema,
  changePasswordZodSchema,
  forgotPasswordZodSchema,
  resetPasswordZodSchema,
  verifyEmailZodSchema,
  refreshTokenZodSchema,
};

export default AuthValidation;
