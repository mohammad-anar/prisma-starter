import { UserRole } from "@prisma/client";

export type IRegisterUser = {
  firstName?: string;
  lastName?: string;
  email: string;
  password: string;
  phone?: string;
  profileImage?: string;
  role?: UserRole;
};

export type ILoginUser = {
  email: string;
  password: string;
};

export type IChangePassword = {
  oldPassword: string;
  newPassword: string;
};

export type IForgotPassword = {
  email: string;
};

export type IResetPassword = {
  token: string;
  newPassword: string;
};

export type IRefreshToken = {
  refreshToken: string;
};
