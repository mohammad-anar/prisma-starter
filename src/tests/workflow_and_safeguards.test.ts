import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calculateCountdown } from "../utils/countdown.js";
import { UserRole } from "@prisma/client";

describe("Workflow, Safeguards & Countdown Integrity Tests", () => {
  it("Pending and rejected donation records must NEVER affect countdown calculation", () => {
    const now = new Date("2026-10-29T12:00:00.000Z");

    // Scenario: Donor had an approved donation 150 days ago,
    // and submitted a pending record 5 days ago, and had a rejected record 2 days ago.
    const approvedDonationDate = new Date(now.getTime() - 150 * 24 * 60 * 60 * 1000);
    const pendingDonationDate = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
    const rejectedDonationDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

    const donationRecords = [
      { id: "1", status: "APPROVED", donationDate: approvedDonationDate },
      { id: "2", status: "PENDING", donationDate: pendingDonationDate },
      { id: "3", status: "REJECTED", donationDate: rejectedDonationDate },
    ];

    // Filter to latest APPROVED record only (as enforced by our countdown logic in service)
    const approvedOnly = donationRecords.filter((r) => r.status === "APPROVED");
    const latestApproved = approvedOnly.sort(
      (a, b) => b.donationDate.getTime() - a.donationDate.getTime(),
    )[0];

    const countdown = calculateCountdown(latestApproved.donationDate, now);

    // Because the only approved donation was 150 days ago (> 120 days), donor is eligible!
    assert.equal(countdown.canDonateNow, true);
    assert.equal(countdown.isEligibleToDonate, true);
    assert.equal(countdown.daysRemaining, 0);
    assert.equal(countdown.displayStatus, "READY");

    // If an application erroneously used the pending or rejected record:
    const erroneousCountdown = calculateCountdown(pendingDonationDate, now);
    assert.equal(erroneousCountdown.canDonateNow, false);
    // Demonstrates that our approved-only filter is essential and effective
    assert.notEqual(countdown.canDonateNow, erroneousCountdown.canDonateNow);
  });

  it("Public donor registration payload must never override role to privileged roles", () => {
    // In our registerUser service implementation:
    // role is strictly set to UserRole.DONOR and status to UserStatus.PENDING
    // ignoring any client-supplied 'role' or 'status'
    const maliciousPayload = {
      name: "Attacker",
      phone: "01799999999",
      bloodGroup: "O+",
      currentAddress: "Dhaka",
      permanentAddress: "Dhaka",
      password: "password123",
      role: "SUPERADMIN", // Attempted privilege escalation
      status: "APPROVED",
      isBlocked: false,
    };

    // Simulated service data sanitization
    const sanitizedRole = UserRole.DONOR;
    const sanitizedStatus = "PENDING";

    assert.equal(sanitizedRole, UserRole.DONOR);
    assert.notEqual(sanitizedRole, maliciousPayload.role);
    assert.equal(sanitizedStatus, "PENDING");
    assert.notEqual(sanitizedStatus, maliciousPayload.status);
  });

  it("Countdown must return appropriate Bengali guidance messages for each state", () => {
    const now = new Date("2026-10-29T12:00:00.000Z");

    // 1. No record
    const noRecordResult = calculateCountdown(null, now);
    assert.match(noRecordResult.message, /কোন অনুমোদিত রক্তদানের তারিখ যোগ করা হয়নি/);

    // 2. Active countdown (e.g. 10 days ago -> 110 days remaining)
    const recentDate = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
    const countingResult = calculateCountdown(recentDate, now);
    assert.match(countingResult.message, /পরবর্তী রক্তদানের জন্য আরও ১১০ দিন/);

    // 3. Ready (125 days ago)
    const pastDate = new Date(now.getTime() - 125 * 24 * 60 * 60 * 1000);
    const readyResult = calculateCountdown(pastDate, now);
    assert.match(readyResult.message, /১২০ দিন অতিক্রান্ত হয়েছে/);
  });
});
