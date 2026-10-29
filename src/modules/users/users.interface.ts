import { BloodGroup, UserRole, UserStatus } from "@prisma/client";

export type CreateUserPayload = {
  name: string;
  phone: string;
  email?: string;
  password: string;
  bloodGroup: BloodGroup | string;
  currentAddress: string;
  permanentAddress: string;
  profileImage?: string;
  role?: UserRole;
  status?: UserStatus;
  gender?: string;
};

export type UpdateUserPayload = {
  name?: string;
  phone?: string;
  email?: string;
  bloodGroup?: BloodGroup | string;
  currentAddress?: string;
  permanentAddress?: string;
  profileImage?: string;
  role?: UserRole;
  status?: UserStatus;
  isBlocked?: boolean;
  gender?: string;
};

export type UpdateEmailPayload = {
  email: string;
};
