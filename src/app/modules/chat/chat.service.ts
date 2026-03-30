import { prisma } from "../../../helpers/prisma.js";

const createRoom = async (data: {
  workshopId: string;
  userId: string;
  bookingId?: string;
  name?: string;
}) => {
  const room = await prisma.room.create({
    data,
  });

  return room;
};

export const ChatService = {
  createRoom,
};
