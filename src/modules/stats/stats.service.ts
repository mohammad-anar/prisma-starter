import prisma from "../../config/prisma.js";

const getPlatformStats = async () => {
  const [
    totalDonors,
    totalDonations,
    lastApprovedDonation,
    pendingDonors,
    activeEmergencyRequests,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "DONOR", status: "APPROVED", isBlocked: false } }),
    prisma.bloodDonateRecord.count({ where: { status: "APPROVED" } }),
    prisma.bloodDonateRecord.findFirst({
      where: { status: "APPROVED" },
      orderBy: { donationDate: "desc" },
      select: { donationDate: true },
    }),
    prisma.user.count({ where: { role: "DONOR", status: "PENDING" } }),
    prisma.emergencyBloodRequest.count({ where: { status: "ACTIVE" } }),
  ]);

  let lastDonationDaysAgo = 0;
  if (lastApprovedDonation?.donationDate) {
    const diffMs = Date.now() - new Date(lastApprovedDonation.donationDate).getTime();
    lastDonationDaysAgo = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  }

  return {
    totalDonors,
    totalDonations,
    lastDonationDaysAgo,
    pendingDonors,
    activeEmergencyRequests,
  };
};

export const StatsService = {
  getPlatformStats,
};

export default StatsService;
