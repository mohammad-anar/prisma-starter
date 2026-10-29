import { z } from "zod";

const updateProfileZodSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  currentAddress: z.string().min(2, "Current address is required").optional(),
  permanentAddress: z.string().min(2, "Permanent address is required").optional(),
  bloodGroup: z.string().min(1).optional(),
  profileImage: z.string().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  email: z.string().email("Invalid email format").optional().or(z.literal("")),
});

export const DonorsValidation = {
  updateProfileZodSchema,
};

export default DonorsValidation;
