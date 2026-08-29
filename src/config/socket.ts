import colors from "colors";
import { Server, Socket } from "socket.io";

let io: Server | null = null;
const socketMap: Map<string, Set<string>> = new Map();

export const initSocket = (server: any) => {
  io = new Server(server, {
    pingTimeout: 60000,
    cors: { origin: "*" },
  });

  io.on("connection", (socket: Socket) => {
    console.log(colors.green("A user connected via socket: " + socket.id));

    socket.on("register", (id: string) => {
      if (!id) return;
      if (!socketMap.has(id)) socketMap.set(id, new Set());
      socketMap.get(id)!.add(socket.id);
      console.log(colors.blue(`Registered socket ${socket.id} for ID ${id}`));
    });

    socket.on("disconnect", () => {
      console.log(colors.red(`Socket disconnected: ${socket.id}`));
      for (const [id, sockets] of socketMap.entries()) {
        if (sockets.has(socket.id)) {
          sockets.delete(socket.id);
          if (sockets.size === 0) socketMap.delete(id);
        }
      }
    });

    socket.on("join_room", (roomId: string) => {
      if (!roomId) return;
      socket.join(roomId);
      console.log(colors.blue(`Socket ${socket.id} joined room ${roomId}`));
    });

    socket.on("leave_room", (roomId: string) => {
      if (!roomId) return;
      socket.leave(roomId);
      console.log(colors.gray(`Socket ${socket.id} left room ${roomId}`));
    });
  });

  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error("Socket.io is not initialized!");
  }
  return io;
};

export const getSocketIds = (id: string): string[] => {
  return Array.from(socketMap.get(id) || []);
};

export default {
  initSocket,
  getIO,
  getSocketIds,
};
