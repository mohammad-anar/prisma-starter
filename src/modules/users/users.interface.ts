import { UserRole, UserStatus } from "@prisma/client";

export type CreateUserPayload = {
  firstName?: string;
  lastName?: string;
  email: string;
  password: string;
  phone?: string;
  profileImage?: string;
  role?: UserRole;
};

export type UpdateUserPayload = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  profileImage?: string;
  role?: UserRole;
  status?: UserStatus;
};
