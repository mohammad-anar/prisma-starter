import { UserRole } from "@prisma/client";

export type CreateUserPayload = {
  firstName?: string;
  lastName?: string;
  email: string;
  password: string;
  phone?: string;
  profileImage?: string;
  role?: UserRole;
};
