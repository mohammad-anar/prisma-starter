import bcrypt from "bcryptjs";
import env from "../config/env.js";
import prisma from "../config/prisma.js";
import { BloodGroup, ContactMessageStatus, DonationStatus, UserRole, UserStatus } from "@prisma/client";

export const seedInitialData = async () => {
  // Only seed dummy sample data if explicitly enabled via environment variable
  if (process.env.SEED_DUMMY_DATA !== "true") {
    return;
  }

  try {
    const existingDonorCount = await prisma.user.count({
      where: { role: UserRole.DONOR },
    });

    let donors: any[] = [];
    if (existingDonorCount === 0) {
      console.log("🌱 Database donor records empty. Seeding initial Fulpur donors...");
      const defaultPassword = await bcrypt.hash("Donor123456!", env.bcrypt_salt_round || 10);
      donors = await Promise.all([
        prisma.user.create({
          data: {
            name: "তানভীর আহমেদ",
            phone: "01711893425",
            email: "tanvir.ahmed@example.com",
            bloodGroup: BloodGroup.O_POSITIVE,
            status: UserStatus.APPROVED,
            currentAddress: "ফুলপুর পৌরসভা, ওয়ার্ড নং ৩, হাসপাতাল রোড",
            permanentAddress: "ফুলপুর পৌরসভা, ময়মনসিংহ",
            passwordHashed: defaultPassword,
            role: UserRole.DONOR,
            gender: "male",
            profileImage: "/images/donors/tanvir.jpg",
            isBlocked: false,
          },
        }),
        prisma.user.create({
          data: {
            name: "ফারহানা আক্তার রীমা",
            phone: "01822674369",
            email: "farhana.rima@example.com",
            bloodGroup: BloodGroup.B_POSITIVE,
            status: UserStatus.APPROVED,
            currentAddress: "পশ্চিম বালিয়া বাজার সংলগ্ন, বালিয়া ইউনিয়ন",
            permanentAddress: "বালিয়া, ফুলপুর, ময়মনসিংহ",
            passwordHashed: defaultPassword,
            role: UserRole.DONOR,
            gender: "female",
            profileImage: "/images/donors/nusrat.jpg",
            isBlocked: false,
          },
        }),
        prisma.user.create({
          data: {
            name: "মোস্তফা কামাল",
            phone: "01934512476",
            email: "mostafa.kamal@example.com",
            bloodGroup: BloodGroup.AB_POSITIVE,
            status: UserStatus.PENDING,
            currentAddress: "চর রামভদ্রপুর, ঘাট এলাকা, রামভদ্রপুর ইউনিয়ন",
            permanentAddress: "রামভদ্রপুর, ফুলপুর, ময়মনসিংহ",
            passwordHashed: defaultPassword,
            role: UserRole.DONOR,
            gender: "male",
            profileImage: "/images/donors/rafiqul.jpg",
            isBlocked: false,
          },
        }),
        prisma.user.create({
          data: {
            name: "সোহেল রানা",
            phone: "01778902211",
            email: "sohel.rana@example.com",
            bloodGroup: BloodGroup.O_NEGATIVE,
            status: UserStatus.APPROVED,
            currentAddress: "উচ্চ বিদ্যালয় মোড়, ভাইটকান্দি ইউনিয়ন",
            permanentAddress: "ভাইটকান্দি, ফুলপুর, ময়মনসিংহ",
            passwordHashed: defaultPassword,
            role: UserRole.DONOR,
            gender: "male",
            profileImage: "/images/donors/shakib.jpg",
            isBlocked: false,
          },
        }),
        prisma.user.create({
          data: {
            name: "রফিকুল ইসলাম",
            phone: "01677112233",
            email: "rafiqul.fulpur@example.com",
            bloodGroup: BloodGroup.A_POSITIVE,
            status: UserStatus.APPROVED,
            currentAddress: "পাকুড়িয়া বাজার, রূপসী ইউনিয়ন",
            permanentAddress: "রূপসী, ফুলপুর, ময়মনসিংহ",
            passwordHashed: defaultPassword,
            role: UserRole.DONOR,
            gender: "male",
            profileImage: "/images/donors/rafiqul.jpg",
            isBlocked: false,
          },
        }),
        prisma.user.create({
          data: {
            name: "মাহমুদা বেগম",
            phone: "01712889900",
            email: "mahmuda.begum@example.com",
            bloodGroup: BloodGroup.A_NEGATIVE,
            status: UserStatus.PENDING,
            currentAddress: "বওলা বাজার, বওলা ইউনিয়ন, ফুলপুর",
            permanentAddress: "বওলা, ফুলপুর, ময়মনসিংহ",
            passwordHashed: defaultPassword,
            role: UserRole.DONOR,
            gender: "female",
            profileImage: "/images/donors/nusrat.jpg",
            isBlocked: false,
          },
        }),
      ]);
    } else {
      donors = await prisma.user.findMany({
        where: { role: UserRole.DONOR },
        take: 6,
      });
    }

    const adminUser = await prisma.user.findFirst({
      where: { role: { in: [UserRole.SUPERADMIN, UserRole.ADMIN] } },
    });

    const existingDonationCount = await prisma.bloodDonateRecord.count();
    if (existingDonationCount === 0 && donors.length > 0) {
      console.log("🌱 Seeding initial donation records...");
      await Promise.all([
        // Pending record 1
        prisma.bloodDonateRecord.create({
          data: {
            donorId: donors[0].id,
            donationDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            donationAddress: "ফুলপুর উপজেলা স্বাস্থ্য কমপ্লেক্স",
            rugirDhoron: "জরুরি প্রসূতি ও গাইনি বিভাগ (সিজারিয়ান কেস)",
            donationSlipNumber: "FLP-HC-2026-084",
            slipUrl: "/images/donors/tanvir.jpg",
            status: DonationStatus.PENDING,
          },
        }),
        // Pending record 2
        prisma.bloodDonateRecord.create({
          data: {
            donorId: donors[1].id,
            donationDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
            donationAddress: "ময়মনসিংহ মেডিকেল কলেজ হাসপাতাল (MMCH)",
            rugirDhoron: "অর্থোপেডিক জরুরি ট্রমা সার্জারি",
            donationSlipNumber: "MMCH-TRM-8812",
            slipUrl: "/images/donors/nusrat.jpg",
            status: DonationStatus.PENDING,
          },
        }),
        // Pending record 3
        prisma.bloodDonateRecord.create({
          data: {
            donorId: donors[2].id,
            donationDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            donationAddress: "ফুলপুর সেন্ট্রাল ক্লিনিক",
            rugirDhoron: "থ্যালাসেমিয়া নিয়মিত রক্ত পরিসঞ্চালন",
            donationSlipNumber: "FCC-THAL-309",
            slipUrl: "/images/donors/rafiqul.jpg",
            status: DonationStatus.PENDING,
          },
        }),
        // Approved record 1
        prisma.bloodDonateRecord.create({
          data: {
            donorId: donors[0].id,
            donationDate: new Date(Date.now() - 125 * 24 * 60 * 60 * 1000),
            donationAddress: "ফুলপুর উপজেলা স্বাস্থ্য কমপ্লেক্স",
            rugirDhoron: "মেডিসিন ওয়ার্ড রোগী সহায়তা",
            donationSlipNumber: "FLP-HC-2025-442",
            status: DonationStatus.APPROVED,
            verifiedById: adminUser?.id,
            verifiedAt: new Date(Date.now() - 124 * 24 * 60 * 60 * 1000),
          },
        }),
        // Approved record 2
        prisma.bloodDonateRecord.create({
          data: {
            donorId: donors[3].id,
            donationDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
            donationAddress: "তারাকান্দা উপজেলা স্বাস্থ্য কমপ্লেক্স",
            rugirDhoron: "জরুরি প্রসূতি বিভাগ",
            donationSlipNumber: "TRK-HC-192",
            status: DonationStatus.APPROVED,
            verifiedById: adminUser?.id,
            verifiedAt: new Date(Date.now() - 59 * 24 * 60 * 60 * 1000),
          },
        }),
      ]);
    }

    // 3. Seed Contact Messages & Reports
    const existingContactCount = await prisma.contactMessage.count();
    if (existingContactCount === 0) {
      console.log("🌱 Seeding initial contact messages & reports...");
      await Promise.all([
        prisma.contactMessage.create({
          data: {
            name: "মোঃ আলমগীর কবির",
            email: "alamgir.kabir@example.com",
            phone: "01712349911",
            subject: "জরুরি রক্তদাতার মোবাইল নম্বরে সংযোগ পাওয়া যাচ্ছে না",
            message: "বালিয়া ইউনিয়নের একজন ডোনারের নম্বরে একাধিকবার কল করেও বন্ধ পাওয়া গেছে। জরুরি রোগীর জন্য রক্তের প্রয়োজন ছিল। তথ্য হালনাগাদ করার অনুরোধ জানাচ্ছি।",
            status: ContactMessageStatus.NEW,
          },
        }),
        prisma.contactMessage.create({
          data: {
            name: "সাবরিনা ইয়াসমিন",
            email: "sabrina.y@example.com",
            phone: "01855667788",
            subject: "ফুলপুর রক্তদান ক্যাম্পেইন আয়োজন বিষয়ে পরামর্শ",
            message: "ফুলপুর সরকারি ডিগ্রি কলেজ প্রাঙ্গণে একটি স্বেচ্ছাসেবী রক্তদান শিবিরের আয়োজনের জন্য আমরা ডোনার নেটওয়ার্কের সহযোগিতা ও সমন্বয় কামনা করছি।",
            status: ContactMessageStatus.NEW,
          },
        }),
        prisma.contactMessage.create({
          data: {
            name: "ডাঃ রফিকুল ইসলাম",
            email: "dr.rafiq@fulpurhealth.gov.bd",
            phone: "01711002233",
            subject: "হাসপাতাল ব্লাড ব্যাংকের সাথে নিয়মিত সমন্বয় সংক্রান্ত",
            message: "ফুলপুর স্বাস্থ্য কমপ্লেক্সে জরুরি রোগীদের রক্তের চাহিদা পূরণে আপনাদের নেটওয়ার্ক দারুণ ভূমিকা রাখছে। ধন্যবাদ ও শুভকামনা।",
            status: ContactMessageStatus.READ,
          },
        }),
      ]);
    }

    console.log("✅ Initial sample data for Fulpur blood network seeded successfully!");
  } catch (error: any) {
    console.error("⚠️ Error seeding initial sample data:", error.message);
  }
};

export default seedInitialData;
