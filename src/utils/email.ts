import nodemailer from "nodemailer";
import env from "../config/env.js";

type ISendEmail = {
  to: string;
  subject: string;
  html: string;
};

const transporter = nodemailer.createTransport({
  host: env.email.host,
  port: Number(env.email.port),
  secure: false,
  auth: {
    user: env.email.user,
    pass: env.email.pass,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

export const sendEmail = async (values: ISendEmail) => {
  try {
    if (!env.email.user || !env.email.pass) {
      console.warn("⚠️ Email credentials not provided, skipping sendEmail");
      return;
    }

    await transporter.sendMail({
      from: `"LMS Platform" <${env.email.from || env.email.user}>`,
      to: values.to,
      subject: values.subject,
      html: values.html,
    });
  } catch (error) {
    console.error("Email send failed:", error);
  }
};

export const emailHelper = {
  sendEmail,
};

export default emailHelper;
