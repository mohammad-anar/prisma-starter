import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { BloodGroup } from "@prisma/client";
import {
  normalizeBloodGroup,
  parseBloodGroupFilter,
  formatBloodGroupDetails,
  BLOOD_GROUP_SYMBOL_MAP,
} from "../utils/bloodGroup.js";

describe("Blood Group Normalization & Formatting", () => {
  it("should normalize symbol inputs into Prisma BloodGroup enums", () => {
    assert.equal(normalizeBloodGroup("O+"), BloodGroup.O_POSITIVE);
    assert.equal(normalizeBloodGroup("o-"), BloodGroup.O_NEGATIVE);
    assert.equal(normalizeBloodGroup("A+"), BloodGroup.A_POSITIVE);
    assert.equal(normalizeBloodGroup("a-"), BloodGroup.A_NEGATIVE);
    assert.equal(normalizeBloodGroup("B+"), BloodGroup.B_POSITIVE);
    assert.equal(normalizeBloodGroup("b-"), BloodGroup.B_NEGATIVE);
    assert.equal(normalizeBloodGroup("AB+"), BloodGroup.AB_POSITIVE);
    assert.equal(normalizeBloodGroup("ab-"), BloodGroup.AB_NEGATIVE);
  });

  it("should normalize enum strings and Bengali inputs", () => {
    assert.equal(normalizeBloodGroup("A_POSITIVE"), BloodGroup.A_POSITIVE);
    assert.equal(normalizeBloodGroup("o_positive"), BloodGroup.O_POSITIVE);
    assert.equal(normalizeBloodGroup("ও পজিটিভ"), BloodGroup.O_POSITIVE);
    assert.equal(normalizeBloodGroup("এ নেগেটিভ"), BloodGroup.A_NEGATIVE);
  });

  it("should throw a Bad Request ApiError for invalid blood groups", () => {
    assert.throws(() => normalizeBloodGroup("C+"), {
      message: /Invalid blood group/,
    });
    assert.throws(() => normalizeBloodGroup("XYZ"), {
      message: /Invalid blood group/,
    });
  });

  it("should parse query filters and ignore 'all' or empty strings", () => {
    assert.equal(parseBloodGroupFilter("all"), undefined);
    assert.equal(parseBloodGroupFilter("সব গ্রুপ"), undefined);
    assert.equal(parseBloodGroupFilter(""), undefined);
    assert.equal(parseBloodGroupFilter("  "), undefined);
    assert.equal(parseBloodGroupFilter("O+"), BloodGroup.O_POSITIVE);
    assert.equal(parseBloodGroupFilter("B-"), BloodGroup.B_NEGATIVE);
  });

  it("should format all 8 blood groups with symbols and Bengali labels", () => {
    const allGroups = Object.values(BloodGroup);
    assert.equal(allGroups.length, 8);

    for (const bg of allGroups) {
      const formatted = formatBloodGroupDetails(bg);
      assert.equal(formatted.code, bg);
      assert.ok(formatted.symbol.length >= 2);
      assert.ok(formatted.bengaliLabel.length > 2);
      assert.equal(formatted.symbol, BLOOD_GROUP_SYMBOL_MAP[bg]);
    }
  });
});
