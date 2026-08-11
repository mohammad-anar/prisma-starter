import { prisma } from "../../../helpers/prisma.js";
import config from "../../../config/index.js";
import { createPatientPayload } from "./user.interface.js";
import bcrypt from "bcryptjs";

const createPatient = async (payload: createPatientPayload) => {
  const hashedPassword = await bcrypt.hash(
    payload.password,
    config.bcrypt_salt_round,
  );

  const result = await prisma.user.create({
    data: {
      email: payload.email,
      password: hashedPassword,
    },
  });
  return result;
};

export const UserSerivces = {
  createPatient,
};
