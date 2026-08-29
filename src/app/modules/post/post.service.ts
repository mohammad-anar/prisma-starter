import { prisma } from "../../../db/prisma.js";

const createPost = async (payload: { title: string; content?: string; authorId: string }) => {
  const result = await prisma.post.create({
    data: payload,
  });
  return result;
};

const getAllPosts = async () => {
  const result = await prisma.post.findMany({
    include: { author: true },
  });
  return result;
};

export const PostServices = {
  createPost,
  getAllPosts,
};
