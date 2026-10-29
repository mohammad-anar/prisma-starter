import bcrypt from "bcryptjs";
import env from "../config/env.js";
import prisma from "../config/prisma.js";
import { BloodGroup, UserRole, UserStatus } from "@prisma/client";

export const seedSuperAdmin = async () => {
  const superAdminPhone = env.admin.phone || "01972606255";
  const superAdminEmail = env.admin.email || "bonnochobi@gmail.com";
  const superAdminPassword = env.admin.password || "@Hridoy7060@";
  const superAdminName = env.admin.name || "Hridoy Hassan";

  try {
    const existingSuperAdmin = await prisma.user.findFirst({
      where: {
        OR: [
          { role: UserRole.SUPERADMIN },
          { phone: superAdminPhone },
          { email: superAdminEmail.toLowerCase() },
        ],
      },
    });

    const hashedPassword = await bcrypt.hash(
      superAdminPassword,
      env.bcrypt_salt_round || 10,
    );

    if (!existingSuperAdmin) {
      await prisma.user.create({
        data: {
          name: superAdminName,
          phone: superAdminPhone,
          email: superAdminEmail,
          bloodGroup: BloodGroup.O_POSITIVE,
          status: UserStatus.APPROVED,
          currentAddress: "ফুলপুর পৌরসভা, ফুলপুর, ময়মনসিংহ",
          permanentAddress: "ফুলপুর পৌরসভা, ফুলপুর, ময়মনসিংহ",
          passwordHashed: hashedPassword,
          role: UserRole.SUPERADMIN,
          isBlocked: false,
          profileImage: env.admin.avatar || null,
        },
      });
      console.log("🛡️ Super Admin initialized successfully:", superAdminPhone);
    } else {
      await prisma.user.update({
        where: { id: existingSuperAdmin.id },
        data: {
          name: superAdminName,
          phone: superAdminPhone,
          email: superAdminEmail,
          passwordHashed: hashedPassword,
          role: UserRole.SUPERADMIN,
          status: UserStatus.APPROVED,
          isBlocked: false,
        },
      });
      console.log("🛡️ Super Admin account updated and verified:", superAdminPhone);
    }
  } catch (error: any) {
    console.error("⚠️ Error while checking/seeding Super Admin:", error.message);
  }
};

export default seedSuperAdmin;
