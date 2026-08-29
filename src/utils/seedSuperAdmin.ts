import bcrypt from "bcryptjs";
import env from "../config/env.js";
import prisma from "../config/prisma.js";
import { UserRole, UserStatus } from "@prisma/client";

export const seedSuperAdmin = async () => {
  if (!env.admin.email || !env.admin.password) {
    return;
  }

  console.log("Checking for Admin with email:", env.admin.email);

  const isExist = await prisma.user.findFirst({
    where: {
      email: env.admin.email,
      role: UserRole.ADMIN,
    },
  });

  if (!isExist) {
    const hashedPassword = await bcrypt.hash(
      env.admin.password,
      env.bcrypt_salt_round || 10,
    );

    await prisma.user.create({
      data: {
        firstName: env.admin.name || "Super",
        lastName: "Admin",
        email: env.admin.email,
        phone: env.admin.phone,
        passwordHash: hashedPassword,
        profileImage: env.admin.avatar,
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

export default seedSuperAdmin;
