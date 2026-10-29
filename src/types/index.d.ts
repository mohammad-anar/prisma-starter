import { UserRole, UserStatus } from "@prisma/client";

export interface IAuthUser {
  id: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  name?: string;
  email?: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user: IAuthUser;
    }
  }
}

export {};
