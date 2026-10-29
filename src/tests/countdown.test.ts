import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calculateCountdown } from "../utils/countdown.js";

describe("120-Day Blood Donation Countdown Calculator", () => {
  it("should return ready state when no approved donation date exists", () => {
    const result = calculateCountdown(null);

    assert.equal(result.hasApprovedDonation, false);
    assert.equal(result.canDonateNow, true);
    assert.equal(result.isEligibleToDonate, true);
    assert.equal(result.daysRemaining, 0);
    assert.equal(result.hoursRemaining, 0);
    assert.equal(result.minutesRemaining, 0);
    assert.equal(result.secondsRemaining, 0);
    assert.equal(result.displayStatus, "NO_RECORD");
    assert.match(result.title, /পরবর্তী সম্ভাব্য রক্তদানের সময়/);
    assert.match(result.subtitle, /নিয়মিত ১২০ দিনের বিরতির সাধারণ ট্র্যাকার/);
  });

  it("should return ready state when 120 days or more have elapsed since last approved donation", () => {
    const now = new Date("2026-10-29T12:00:00.000Z");
    // Donation 121 days ago
    const donationDate = new Date(now.getTime() - 121 * 24 * 60 * 60 * 1000);

    const result = calculateCountdown(donationDate, now);

    assert.equal(result.hasApprovedDonation, true);
    assert.equal(result.canDonateNow, true);
    assert.equal(result.isEligibleToDonate, true);
    assert.equal(result.daysRemaining, 0);
    assert.equal(result.displayStatus, "READY");
    assert.match(result.message, /১২০ দিন অতিক্রান্ত হয়েছে/);
  });

  it("should return counting state when less than 120 days have elapsed", () => {
    const now = new Date("2026-10-29T12:00:00.000Z");
    // Donation 20 days ago -> 100 days remaining
    const donationDate = new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000);

    const result = calculateCountdown(donationDate, now);

    assert.equal(result.hasApprovedDonation, true);
    assert.equal(result.canDonateNow, false);
    assert.equal(result.isEligibleToDonate, false);
    assert.equal(result.daysRemaining, 100);
    assert.equal(result.displayStatus, "COUNTING");
    assert.ok(result.totalSecondsRemaining > 0);
    assert.match(result.message, /১০০ দিন/);
  });

  it("should calculate exact remaining days, hours, minutes, and seconds", () => {
    const now = new Date("2026-10-29T12:00:00.000Z");
    // Target is exactly 10 days, 5 hours, 30 minutes, 15 seconds from now
    // donationDate = now + (10d 5h 30m 15s) - 120d = now - (109d 18h 29m 45s)
    const msRemaining =
      10 * 24 * 60 * 60 * 1000 +
      5 * 60 * 60 * 1000 +
      30 * 60 * 1000 +
      15 * 1000;
    const targetDate = new Date(now.getTime() + msRemaining);
    const donationDate = new Date(targetDate.getTime() - 120 * 24 * 60 * 60 * 1000);

    const result = calculateCountdown(donationDate, now);

    assert.equal(result.daysRemaining, 10);
    assert.equal(result.hoursRemaining, 5);
    assert.equal(result.minutesRemaining, 30);
    assert.equal(result.secondsRemaining, 15);
  });

  it("should safely handle future donation dates", () => {
    const now = new Date("2026-10-29T12:00:00.000Z");
    const futureDate = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);

    const result = calculateCountdown(futureDate, now);

    assert.equal(result.displayStatus, "INVALID_FUTURE_DATE");
    assert.equal(result.canDonateNow, false);
    assert.match(result.message, /ভবিষ্যতের তারিখ হতে পারে না/);
  });

  it("should safely handle invalid date values without crashing", () => {
    const result = calculateCountdown("not-a-valid-date");

    assert.equal(result.hasApprovedDonation, false);
    assert.equal(result.canDonateNow, true);
    assert.equal(result.displayStatus, "NO_RECORD");
  });
});
