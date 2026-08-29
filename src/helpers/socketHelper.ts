import colors from "colors";
import { Server, Socket } from "socket.io";

let io: Server | null = null;

// Store multiple sockets per user/workshop
const socketMap: Map<string, Set<string>> = new Map();

export const initSocket = (server: any) => {
  io = new Server(server, {
    pingTimeout: 60000,
    cors: { origin: "*" },
  });

  io.on("connection", (socket: Socket) => {
    console.log(colors.green("A user connected"));

    // ================= REGISTER =================
    socket.on("register", (id: string) => {
      if (!id) return;

      if (!socketMap.has(id)) socketMap.set(id, new Set());
      socketMap.get(id)!.add(socket.id);

      console.log(colors.blue(`Registered socket ${socket.id} for ID ${id}`));
    });

    // ================= DISCONNECT =================
    socket.on("disconnect", () => {
      console.log(colors.red(`Socket disconnected: ${socket.id}`));

      for (const [id, sockets] of socketMap.entries()) {
        if (sockets.has(socket.id)) {
          sockets.delete(socket.id);
          if (sockets.size === 0) socketMap.delete(id);
        }
      }
    });

    // ================= JOIN ROOM =================
    socket.on("join_room", (roomId: string) => {
      if (!roomId) return;
      socket.join(roomId);
      console.log(colors.blue(`Socket ${socket.id} joined room ${roomId}`));
    });

    // ================= LEAVE ROOM =================
    socket.on("leave_room", (roomId: string) => {
      if (!roomId) return;
      socket.leave(roomId);
      console.log(colors.gray(`Socket ${socket.id} left room ${roomId}`));
    });

    // ================= SEND MESSAGE =================
    socket.on("send_message", async (payload: any, callback?: (value: any) => void) => {
      try {
        let data = payload;
        if (typeof payload === "string") {
          data = JSON.parse(payload);
        }

        const { roomId, senderId, content, type } = data;

        if (!roomId || !senderId) {
          return socket.emit("error", {
            message: "roomId and senderId are required",
          });
        }

        const message = {
          id: `msg-${Date.now()}`,
          roomId,
          senderId,
          content,
          type: type || "TEXT",
          createdAt: new Date(),
        };

        if (callback && typeof callback === "function") {
          callback({
            success: true,
            message: "Message sent successfully",
            data: message,
          });
        }

        io!.to(roomId).emit("receive_message", message);
      } catch (error) {
        console.error("❌ Error saving message:", error);

        socket.emit("error", {
          message: "Failed to send message",
        });
      }
    });

    // ================= CREATE ROOM =================
    socket.on(
      "create_room",
      async (data: {
        workshopId: string;
        userId: string;
        bookingId?: string;
        name?: string;
      }) => {
        try {
          if (!data.workshopId || !data.userId) {
            return socket.emit("error", {
              message: "workshopId and userId required",
            });
          }

          const room = {
            id: `room-${Date.now()}`,
            ...data,
            createdAt: new Date(),
          };

          socket.join(room.id);
          socket.emit("room_created", room);

          console.log(
            colors.blue(
              `Room created: ${room.id} (user: ${data.userId}, workshop: ${data.workshopId})`
            )
          );
        } catch (error) {
          console.error("Error creating room", error);

          socket.emit("error", {
            message: "Failed to create room",
          });
        }
      }
    );

    // ================= TYPING =================
    socket.on(
      "typing",
      (data: { roomId: string; senderId: string; isTyping: boolean }) => {
        socket.to(data.roomId).emit("user_typing", data);
      }
    );
  });

  return io;
};

// ================= HELPERS =================

export const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized!");
  return io;
};

export const getSocketIds = (id: string) => {
  return Array.from(socketMap.get(id) || []);
};

// ================= CHAT NOTIFICATION =================

export const createAndEmitNotification = async (data: any) => {
  return data;
};

export const createAndEmitChatNotification = async (data: any) => {
  return data;
};