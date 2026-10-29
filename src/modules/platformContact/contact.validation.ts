import { z } from "zod";

const updateContactZodSchema = z.object({
  phone: z.string().min(6, "Valid phone number is required"),
  email: z.string().email("Valid email address is required"),
  whatsapp: z.string().min(6, "Valid WhatsApp number is required"),
});

export const ContactValidation = {
  updateContactZodSchema,
};

export default ContactValidation;
