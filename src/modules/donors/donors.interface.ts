import { BloodGroup } from "@prisma/client";

export type IDonorFilters = {
  bloodGroup?: string;
  location?: string;
  searchQuery?: string;
  onlyAvailable?: boolean | string;
};

export type IUpdateDonorProfile = {
  name?: string;
  currentAddress?: string;
  permanentAddress?: string;
  bloodGroup?: BloodGroup | string;
  profileImage?: string;
  gender?: string;
  email?: string;
};
