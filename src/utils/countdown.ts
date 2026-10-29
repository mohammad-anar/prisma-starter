export interface ICountdownResult {
  hasApprovedDonation: boolean;
  isEligibleToDonate: boolean;
  canDonateNow: boolean;
  targetDate: string | null;
  lastDonationDate: string | null;
  daysRemaining: number;
  hoursRemaining: number;
  minutesRemaining: number;
  secondsRemaining: number;
  totalSecondsRemaining: number;
  displayStatus: "READY" | "COUNTING" | "NO_RECORD" | "INVALID_FUTURE_DATE";
  title: string;
  subtitle: string;
  message: string;
  disclaimer: string;
}

const INTERVAL_DAYS = 120;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MS_PER_HOUR = 60 * 60 * 1000;
const MS_PER_MINUTE = 60 * 1000;
const MS_PER_SECOND = 1000;

export const toBengaliDigits = (num: number | string): string => {
  const bn = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return String(num).replace(/[0-9]/g, (d) => bn[Number(d)]);
};

export const calculateCountdown = (
  lastApprovedDonationDate: Date | string | null | undefined,
  now: Date = new Date(),
): ICountdownResult => {
  const title = "পরবর্তী সম্ভাব্য রক্তদানের সময়";
  const subtitle = "নিয়মিত ১২০ দিনের বিরতির সাধারণ ট্র্যাকার";
  const disclaimer =
    "এটি সাধারণ সময়-ভিত্তিক ট্র্যাকার, কোনো চিকিৎসাগত নিশ্চয়তা বা স্বাস্থ্যগত ছাড়পত্র নয়। রক্তদানের পূর্বে শারীরিক সুস্থতা নিশ্চিত করুন।";

  if (!lastApprovedDonationDate) {
    return {
      hasApprovedDonation: false,
      isEligibleToDonate: true,
      canDonateNow: true,
      targetDate: null,
      lastDonationDate: null,
      daysRemaining: 0,
      hoursRemaining: 0,
      minutesRemaining: 0,
      secondsRemaining: 0,
      totalSecondsRemaining: 0,
      displayStatus: "NO_RECORD",
      title,
      subtitle,
      message: "কোন অনুমোদিত রক্তদানের তারিখ যোগ করা হয়নি। আপনি বর্তমানে রক্তদান করতে প্রস্তুত।",
      disclaimer,
    };
  }

  const donationDate = new Date(lastApprovedDonationDate);
  if (isNaN(donationDate.getTime())) {
    return {
      hasApprovedDonation: false,
      isEligibleToDonate: true,
      canDonateNow: true,
      targetDate: null,
      lastDonationDate: null,
      daysRemaining: 0,
      hoursRemaining: 0,
      minutesRemaining: 0,
      secondsRemaining: 0,
      totalSecondsRemaining: 0,
      displayStatus: "NO_RECORD",
      title,
      subtitle,
      message: "অবৈধ রক্তদানের তারিখ পাওয়া গেছে।",
      disclaimer,
    };
  }

  // Guard against future donation dates
  if (donationDate.getTime() > now.getTime()) {
    return {
      hasApprovedDonation: true,
      isEligibleToDonate: false,
      canDonateNow: false,
      targetDate: null,
      lastDonationDate: donationDate.toISOString(),
      daysRemaining: 0,
      hoursRemaining: 0,
      minutesRemaining: 0,
      secondsRemaining: 0,
      totalSecondsRemaining: 0,
      displayStatus: "INVALID_FUTURE_DATE",
      title,
      subtitle,
      message: "রক্তদানের তারিখ ভবিষ্যতের তারিখ হতে পারে না।",
      disclaimer,
    };
  }

  const targetDate = new Date(donationDate.getTime() + INTERVAL_DAYS * MS_PER_DAY);
  const diffMs = targetDate.getTime() - now.getTime();

  if (diffMs <= 0) {
    return {
      hasApprovedDonation: true,
      isEligibleToDonate: true,
      canDonateNow: true,
      targetDate: targetDate.toISOString(),
      lastDonationDate: donationDate.toISOString(),
      daysRemaining: 0,
      hoursRemaining: 0,
      minutesRemaining: 0,
      secondsRemaining: 0,
      totalSecondsRemaining: 0,
      displayStatus: "READY",
      title,
      subtitle,
      message: "রক্তদানের নির্ধারিত ১২০ দিন অতিক্রান্ত হয়েছে। আপনি এখন রক্তদানে প্রস্তুত!",
      disclaimer,
    };
  }

  const totalSecondsRemaining = Math.floor(diffMs / MS_PER_SECOND);
  const daysRemaining = Math.floor(diffMs / MS_PER_DAY);
  const hoursRemaining = Math.floor((diffMs % MS_PER_DAY) / MS_PER_HOUR);
  const minutesRemaining = Math.floor((diffMs % MS_PER_HOUR) / MS_PER_MINUTE);
  const secondsRemaining = Math.floor((diffMs % MS_PER_MINUTE) / MS_PER_SECOND);

  return {
    hasApprovedDonation: true,
    isEligibleToDonate: false,
    canDonateNow: false,
    targetDate: targetDate.toISOString(),
    lastDonationDate: donationDate.toISOString(),
    daysRemaining,
    hoursRemaining,
    minutesRemaining,
    secondsRemaining,
    totalSecondsRemaining,
    displayStatus: "COUNTING",
    title,
    subtitle,
    message: `পরবর্তী রক্তদানের জন্য আরও ${toBengaliDigits(daysRemaining)} দিন ${toBengaliDigits(hoursRemaining)} ঘণ্টা অপেক্ষা করুন।`,
    disclaimer,
  };
};

export default calculateCountdown;
