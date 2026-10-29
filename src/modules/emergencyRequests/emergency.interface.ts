import { BloodGroup, EmergencyRequestStatus } from "@prisma/client";

export type ICreateEmergencyRequest = {
  title: string;
  rugirNam: string;
  thikana: string;
  phone: string;
  bloodGroup: BloodGroup | string;
  kotoBag: number;
};

export type IUpdateEmergencyRequest = {
  title?: string;
  rugirNam?: string;
  thikana?: string;
  phone?: string;
  bloodGroup?: BloodGroup | string;
  kotoBag?: number;
  status?: EmergencyRequestStatus;
};

export type IEmergencyRequestFilters = {
  status?: string;
  bloodGroup?: string;
  searchQuery?: string;
  thikana?: string;
};
