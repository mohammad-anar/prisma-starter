import { prisma } from "../../../helpers/prisma.js";

const createRoom = async (data: {
  workshopId: string;
  userId: string;
  bookingId?: string;
  name?: string;
}) => {
  return { id: "mock-room-id", ...data };
};

export const ChatService = {
  createRoom,
};
