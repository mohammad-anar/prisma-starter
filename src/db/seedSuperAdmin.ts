import bcrypt from "bcryptjs";
import config from "../config/index.js";
import { prisma } from "./prisma.js";
import { UserRole } from "@prisma/client";

export const seedSuperAdmin = async () => {
  console.log("Checking for Admin with email:", config.admin.email);

  const isExist = await prisma.user.findFirst({
    where: {
      email: config.admin.email,
      role: UserRole.ADMIN,
    },
  });

  if (!isExist) {
    const hashedPassword = await bcrypt.hash(
      config.admin.password as string,
      config.bcrypt_salt_round,
    );

    await prisma.user.create({
      data: {
        name: config.admin.name as string,
        email: config.admin.email as string,
        phone: config.admin.phone as string,
        password: hashedPassword,
        avatar: config.admin.avatar as string,
        role: UserRole.ADMIN,
        isVerified: true,
      },
    });
    console.log("Super admin created successfully.");
  } else {
    console.log("Super admin already exists.");
  }
};
