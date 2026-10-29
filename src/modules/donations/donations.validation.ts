import { z } from "zod";

const createDonationZodSchema = z.object({
  donationDate: z.string().min(1, "Donation date is required"),
  donationAddress: z.string().min(2, "Donation address is required"),
  rugirDhoron: z.string().optional(),
  donationSlipNumber: z.string().optional(),
  slipUrl: z.string().optional(),
});

export const DonationsValidation = {
  createDonationZodSchema,
};

export default DonationsValidation;
