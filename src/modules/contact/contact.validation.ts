import { z } from "zod";

const createContactMessageZodSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "নাম কমপক্ষে ২ অক্ষরের হতে হবে")
    .max(100, "নাম সর্বোচ্চ ১০০ অক্ষরের হতে পারবে"),
  email: z
    .string()
    .trim()
    .email("সঠিক ইমেইল ঠিকানা প্রদান করুন"),
  phone: z
    .string()
    .trim()
    .optional()
    .refine(
      (val) => !val || /^(\+?880|0)1[3-9]\d{8}$/.test(val.replace(/[-\s]/g, "")),
      { message: "সঠিক বাংলাদেশি মোবাইল নম্বর প্রদান করুন" },
    ),
  subject: z
    .string()
    .trim()
    .min(2, "বিষয় কমপক্ষে ২ অক্ষরের হতে হবে")
    .max(150, "বিষয় সর্বোচ্চ ১৫০ অক্ষরের হতে পারবে"),
  message: z
    .string()
    .trim()
    .min(5, "বার্তা কমপক্ষে ৫ অক্ষরের হতে হবে")
    .max(3000, "বার্তা সর্বোচ্চ ৩০০০ অক্ষরের হতে পারবে"),
});

export const ContactMessageValidation = {
  createContactMessageZodSchema,
};

export default ContactMessageValidation;
