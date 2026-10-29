import { BloodGroup } from "@prisma/client";
import { StatusCodes } from "http-status-codes";
import ApiError from "./ApiError.js";

export const BLOOD_GROUP_SYMBOL_MAP: Record<BloodGroup, string> = {
  [BloodGroup.A_POSITIVE]: "A+",
  [BloodGroup.A_NEGATIVE]: "A-",
  [BloodGroup.B_POSITIVE]: "B+",
  [BloodGroup.B_NEGATIVE]: "B-",
  [BloodGroup.AB_POSITIVE]: "AB+",
  [BloodGroup.AB_NEGATIVE]: "AB-",
  [BloodGroup.O_POSITIVE]: "O+",
  [BloodGroup.O_NEGATIVE]: "O-",
};

export const BLOOD_GROUP_BENGALI_MAP: Record<BloodGroup, string> = {
  [BloodGroup.A_POSITIVE]: "এ পজিটিভ (A+)",
  [BloodGroup.A_NEGATIVE]: "এ নেগেটিভ (A-)",
  [BloodGroup.B_POSITIVE]: "বি পজিটিভ (B+)",
  [BloodGroup.B_NEGATIVE]: "বি নেগেটিভ (B-)",
  [BloodGroup.AB_POSITIVE]: "এবি পজিটিভ (AB+)",
  [BloodGroup.AB_NEGATIVE]: "এবি নেগেটিভ (AB-)",
  [BloodGroup.O_POSITIVE]: "ও পজিটিভ (O+)",
  [BloodGroup.O_NEGATIVE]: "ও নেগেটিভ (O-)",
};

const INPUT_NORMALIZATION_MAP: Record<string, BloodGroup> = {
  "A+": BloodGroup.A_POSITIVE,
  "A-": BloodGroup.A_NEGATIVE,
  "B+": BloodGroup.B_POSITIVE,
  "B-": BloodGroup.B_NEGATIVE,
  "AB+": BloodGroup.AB_POSITIVE,
  "AB-": BloodGroup.AB_NEGATIVE,
  "O+": BloodGroup.O_POSITIVE,
  "O-": BloodGroup.O_NEGATIVE,

  A_POSITIVE: BloodGroup.A_POSITIVE,
  A_NEGATIVE: BloodGroup.A_NEGATIVE,
  B_POSITIVE: BloodGroup.B_POSITIVE,
  B_NEGATIVE: BloodGroup.B_NEGATIVE,
  AB_POSITIVE: BloodGroup.AB_POSITIVE,
  AB_NEGATIVE: BloodGroup.AB_NEGATIVE,
  O_POSITIVE: BloodGroup.O_POSITIVE,
  O_NEGATIVE: BloodGroup.O_NEGATIVE,

  "A POSITIVE": BloodGroup.A_POSITIVE,
  "A NEGATIVE": BloodGroup.A_NEGATIVE,
  "B POSITIVE": BloodGroup.B_POSITIVE,
  "B NEGATIVE": BloodGroup.B_NEGATIVE,
  "AB POSITIVE": BloodGroup.AB_POSITIVE,
  "AB NEGATIVE": BloodGroup.AB_NEGATIVE,
  "O POSITIVE": BloodGroup.O_POSITIVE,
  "O NEGATIVE": BloodGroup.O_NEGATIVE,

  "এ পজিটিভ": BloodGroup.A_POSITIVE,
  "এ নেগেটিভ": BloodGroup.A_NEGATIVE,
  "বি পজিটিভ": BloodGroup.B_POSITIVE,
  "বি নেগেটিভ": BloodGroup.B_NEGATIVE,
  "এবি পজিটিভ": BloodGroup.AB_POSITIVE,
  "এবি নেগেটিভ": BloodGroup.AB_NEGATIVE,
  "ও পজিটিভ": BloodGroup.O_POSITIVE,
  "ও নেগেটিভ": BloodGroup.O_NEGATIVE,
};

export const normalizeBloodGroup = (input: unknown): BloodGroup => {
  if (typeof input !== "string") {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Blood group must be a string");
  }

  const clean = input.trim().toUpperCase().replace(/\s+/g, " ");
  const mapped = INPUT_NORMALIZATION_MAP[clean] || INPUT_NORMALIZATION_MAP[input.trim()];

  if (!mapped) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      `Invalid blood group '${input}'. Valid values are: A+, A-, B+, B-, AB+, AB-, O+, O- or canonical enum equivalents.`,
    );
  }

  return mapped;
};

export const parseBloodGroupFilter = (input: unknown): BloodGroup | undefined => {
  if (!input || typeof input !== "string") return undefined;
  const trimmed = input.trim();
  if (
    trimmed === "" ||
    trimmed === "all" ||
    trimmed === "ALL" ||
    trimmed === "সব গ্রুপ" ||
    trimmed === "সব"
  ) {
    return undefined;
  }
  try {
    return normalizeBloodGroup(trimmed);
  } catch {
    return undefined;
  }
};

export const formatBloodGroupDetails = (bg: BloodGroup) => {
  return {
    code: bg,
    symbol: BLOOD_GROUP_SYMBOL_MAP[bg] || bg,
    bengaliLabel: BLOOD_GROUP_BENGALI_MAP[bg] || bg,
  };
};

export default {
  BLOOD_GROUP_SYMBOL_MAP,
  BLOOD_GROUP_BENGALI_MAP,
  normalizeBloodGroup,
  parseBloodGroupFilter,
  formatBloodGroupDetails,
};
