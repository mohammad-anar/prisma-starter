import bcrypt from "bcryptjs";
import { BloodGroup, UserRole, UserStatus } from "@prisma/client";
import prisma from "../config/prisma.js";

async function main() {
  console.log("🧹 Starting database dummy data reset...");

  // 1. Delete all donation records
  const deletedDonations = await prisma.bloodDonateRecord.deleteMany({});
  console.log(`🗑️ Deleted ${deletedDonations.count} donation records.`);

  // 2. Delete all contact messages
  const deletedMessages = await prisma.contactMessage.deleteMany({});
  console.log(`🗑️ Deleted ${deletedMessages.count} contact messages.`);

  // 3. Delete all emergency requests
  const deletedEmergencies = await prisma.emergencyBloodRequest.deleteMany({});
  console.log(`🗑️ Deleted ${deletedEmergencies.count} emergency requests.`);

  // 4. Delete all non-superadmin users
  const deletedUsers = await prisma.user.deleteMany({
    where: {
      role: {
        not: UserRole.SUPERADMIN,
      },
    },
  });
  console.log(`🗑️ Deleted ${deletedUsers.count} dummy users / donors.`);

  // 5. Setup Super Admin
  const superAdminPhone = "01972606255";
  const superAdminEmail = "bonnochobi@gmail.com";
  const superAdminName = "Hridoy Hassan";
  const superAdminRawPassword = "@Hridoy7060@";
  const hashedPassword = await bcrypt.hash(superAdminRawPassword, 10);

  // Check if any SUPERADMIN user exists
  const existingSuperAdmin = await prisma.user.findFirst({
    where: {
      OR: [
        { role: UserRole.SUPERADMIN },
        { phone: superAdminPhone },
        { email: superAdminEmail },
      ],
    },
  });

  if (existingSuperAdmin) {
    const updated = await prisma.user.update({
      where: { id: existingSuperAdmin.id },
      data: {
        name: superAdminName,
        phone: superAdminPhone,
        email: superAdminEmail,
        passwordHashed: hashedPassword,
        role: UserRole.SUPERADMIN,
        status: UserStatus.APPROVED,
        isBlocked: false,
        bloodGroup: BloodGroup.O_POSITIVE,
        currentAddress: "ফুলপুর পৌরসভা, ফুলপুর, ময়মনসিংহ",
        permanentAddress: "ফুলপুর পৌরসভা, ফুলপুর, ময়মনসিংহ",
        profileImage: "/images/team-profile.jpg",
      },
    });
    console.log("👑 Super Admin successfully updated:", {
      id: updated.id,
      name: updated.name,
      phone: updated.phone,
      email: updated.email,
      role: updated.role,
    });
  } else {
    const created = await prisma.user.create({
      data: {
        name: superAdminName,
        phone: superAdminPhone,
        email: superAdminEmail,
        passwordHashed: hashedPassword,
        role: UserRole.SUPERADMIN,
        status: UserStatus.APPROVED,
        isBlocked: false,
        bloodGroup: BloodGroup.O_POSITIVE,
        currentAddress: "ফুলপুর পৌরসভা, ফুলপুর, ময়মনসিংহ",
        permanentAddress: "ফুলপুর পৌরসভা, ফুলপুর, ময়মনসিংহ",
        profileImage: "/images/team-profile.jpg",
      },
    });
    console.log("👑 Super Admin successfully created:", {
      id: created.id,
      name: created.name,
      phone: created.phone,
      email: created.email,
      role: created.role,
    });
  }

  // 6. Double check remaining counts
  const totalUsers = await prisma.user.count();
  const totalDonations = await prisma.bloodDonateRecord.count();
  const totalMessages = await prisma.contactMessage.count();
  const totalEmergencies = await prisma.emergencyBloodRequest.count();

  console.log("\n📊 Database Status After Reset:");
  console.log(`- Total Users: ${totalUsers} (Super Admin only)`);
  console.log(`- Total Donations: ${totalDonations}`);
  console.log(`- Total Contact Messages: ${totalMessages}`);
  console.log(`- Total Emergency Requests: ${totalEmergencies}`);
  console.log("\n✅ Reset completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Reset error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
