import { ContactMessageStatus } from "@prisma/client";
import prisma from "../../config/prisma.js";
import env from "../../config/env.js";
import { sendEmail } from "../../utils/email.js";

export interface IContactMessagePayload {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

const createContactMessage = async (payload: IContactMessagePayload) => {
  // 1. Save contact message in MongoDB database
  const created = await prisma.contactMessage.create({
    data: {
      name: payload.name.trim(),
      email: payload.email.trim().toLowerCase(),
      phone: payload.phone ? payload.phone.trim() : null,
      subject: payload.subject.trim(),
      message: payload.message.trim(),
      status: ContactMessageStatus.NEW,
    },
  });

  // 2. Dispatch email notification to official contact / admin email
  try {
    const adminEmail = env.email.user || "bdc.anrul@gmail.com";
    const formattedDate = new Date().toLocaleString("bn-BD", {
      timeZone: "Asia/Dhaka",
      dateStyle: "medium",
      timeStyle: "short",
    });

    await sendEmail({
      to: adminEmail,
      subject: `[ফুলপুর ব্লাড ডোনার নেটওয়ার্ক] নতুন যোগাযোগ বার্তা: ${payload.subject}`,
      html: `
        <div style="font-family: Arial, 'Hind Siliguri', sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #fee2e2; border-radius: 12px; overflow: hidden;">
          <div style="background: #b91c1c; padding: 20px; text-align: center; color: #ffffff;">
            <h2 style="margin: 0; font-size: 20px;">নতুন বার্তা প্রাপ্তি — ফুলপুর ব্লাড ডোনার নেটওয়ার্ক</h2>
          </div>
          <div style="padding: 24px; color: #374151;">
            <p style="font-size: 15px; margin-top: 0;">ওয়েবসাইট থেকে একজন ব্যবহারকারী নতুন বার্তা পাঠিয়েছেন:</p>
            <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; width: 120px; color: #6b7280;">প্রেরকের নাম:</td>
                <td style="padding: 8px 0; font-weight: bold; color: #111827;">${payload.name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">ইমেইল:</td>
                <td style="padding: 8px 0;"><a href="mailto:${payload.email}" style="color: #b91c1c; text-decoration: none;">${payload.email}</a></td>
              </tr>
              ${
                payload.phone
                  ? `<tr>
                      <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">ফোন নম্বর:</td>
                      <td style="padding: 8px 0;"><a href="tel:${payload.phone}" style="color: #b91c1c; text-decoration: none;">${payload.phone}</a></td>
                    </tr>`
                  : ""
              }
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">বিষয়:</td>
                <td style="padding: 8px 0; font-weight: bold; color: #111827;">${payload.subject}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #6b7280;">প্রেরণের সময়:</td>
                <td style="padding: 8px 0; color: #4b5563;">${formattedDate}</td>
              </tr>
            </table>

            <div style="margin-top: 20px; padding: 16px; background: #fdf2f2; border-left: 4px solid #b91c1c; border-radius: 8px;">
              <h4 style="margin: 0 0 8px 0; font-size: 14px; color: #991b1b;">বার্তার বিষয়বস্তু:</h4>
              <p style="margin: 0; font-size: 14px; line-height: 1.6; white-space: pre-wrap; color: #1f2937;">${payload.message}</p>
            </div>
          </div>
          <div style="background: #f9fafb; padding: 16px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #f3f4f6;">
            © ২০২৬ ফুলপুর ব্লাড ডোনার নেটওয়ার্ক। সর্বস্বত্ব সংরক্ষিত।
          </div>
        </div>
      `,
    });
  } catch (error: any) {
    // Graceful error logging: message is successfully stored in database
    console.error("⚠️ Contact message email notification delivery failed:", error.message);
  }

  return created;
};

import { validateObjectId } from "../../utils/objectId.js";

const getContactMessages = async (options: { page?: number; limit?: number; status?: string }) => {
  const page = Number(options.page) || 1;
  const limit = Number(options.limit) || 10;
  const skip = (page - 1) * limit;

  const whereClause: any = {};
  if (options.status && options.status !== "all" && options.status !== "ALL") {
    whereClause.status = options.status;
  }

  const [data, total, newCount, readCount, resolvedCount] = await Promise.all([
    prisma.contactMessage.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.contactMessage.count({ where: whereClause }),
    prisma.contactMessage.count({ where: { status: "NEW" } }),
    prisma.contactMessage.count({ where: { status: "READ" } }),
    prisma.contactMessage.count({ where: { status: "RESOLVED" } }),
  ]);

  return {
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
      counts: {
        total: newCount + readCount + resolvedCount,
        new: newCount,
        read: readCount,
        resolved: resolvedCount,
      },
    },
    data,
  };
};

const updateContactMessageStatus = async (id: string, status: ContactMessageStatus) => {
  validateObjectId(id, "messageId");
  const updated = await prisma.contactMessage.update({
    where: { id },
    data: { status },
  });
  return updated;
};

const deleteContactMessage = async (id: string) => {
  validateObjectId(id, "messageId");
  await prisma.contactMessage.delete({ where: { id } });
  return { id, message: "যোগাযোগ বার্তাটি সফলভাবে মুছে ফেলা হয়েছে।" };
};

export const ContactMessageService = {
  createContactMessage,
  getContactMessages,
  updateContactMessageStatus,
  deleteContactMessage,
};

export default ContactMessageService;
