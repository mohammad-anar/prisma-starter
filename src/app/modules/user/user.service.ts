import { prisma } from "../../../helpers/prisma";
import config from "../../../config";
import { createPatientPayload } from "./user.interface";
import bcrypt from "bcryptjs";

const createPatient = async (payload: createPatientPayload) => {
  const hashedPassword = await bcrypt.hash(
    payload.password,
    config.bcrypt_solt_round,
  );

  const result = await prisma.$transaction(async (tnx) => {
    await tnx.user.create({
      data: {
        email: payload.email,
        password: hashedPassword,
      },
    });
    // create patient
    await tnx.patient;
  });
};

export const UserSerivces = {
  createPatient,
};
