import { BloodGroup } from "@prisma/client";

export type IRegisterUser = {
  name: string;
  phone: string;
  bloodGroup: BloodGroup | string;
  currentAddress: string;
  permanentAddress: string;
  password: string;
  email?: string;
  profileImage?: string;
  gender?: string;
};

export type ILoginUser = {
  phone?: string;
  email?: string;
  identifier?: string;
  password: string;
};

export type IChangePassword = {
  oldPassword?: string;
  currentPassword?: string;
  newPassword: string;
};

export type IForgotPassword = {
  phone?: string;
  email?: string;
};

export type IResetPassword = {
  token: string;
  newPassword: string;
};

export type IVerifyEmail = {
  token: string;
};

export type IRefreshToken = {
  refreshToken: string;
};
