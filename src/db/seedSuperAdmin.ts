import bcrypt from "bcryptjs";
import config from "../config/index.js";
import { prisma } from "./prisma.js";
import { UserRole, UserStatus } from "@prisma/client";

export const seedSuperAdmin = async () => {
  if (!config.admin.email || !config.admin.password) {
    return;
  }

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
      config.bcrypt_salt_round || 10,
    );

    await prisma.user.create({
      data: {
        firstName: config.admin.name || "Super",
        lastName: "Admin",
        email: config.admin.email as string,
        phone: config.admin.phone as string,
        passwordHash: hashedPassword,
        profileImage: config.admin.avatar as string,
        role: UserRole.ADMIN,
        isVerified: true,
        needPasswordChange: false,
        status: UserStatus.ACTIVE,
      },
    });
    console.log("Super admin created successfully.");
  } else {
    console.log("Super admin already exists.");
  }
};
