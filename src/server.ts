import app from "./app.js";
import env from "./config/env.js";
import { initSocket } from "./config/socket.js";
import { connectRedis } from "./config/redis.js";
import { seedSuperAdmin } from "./utils/seedSuperAdmin.js";

let server: any;

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception detected. Shutting down...");
  console.error(error);
  process.exit(1);
});

async function bootstrap() {
  try {
    // Seed default super admin
    await seedSuperAdmin();

    // Connect to Redis
    await connectRedis();

    // Start HTTP server
    server = app.listen(env.port, () => {
      console.log(`🚀 Server running on http://localhost:${env.port}`);
    });

    // Initialize Socket.io
    initSocket(server);
  } catch (error) {
    console.error("Error during server startup:", error);
    process.exit(1);
  }
}

process.on("unhandledRejection", (error) => {
  console.error("Unhandled Rejection detected. Shutting down...");
  console.error(error);

  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

process.on("SIGTERM", () => {
  console.log("SIGTERM received.");
  if (server) {
    server.close(() => {
      process.exit(0);
    });
  }
});

process.on("SIGINT", () => {
  console.log("SIGINT received.");
  if (server) {
    server.close(() => {
      process.exit(0);
    });
  }
});

bootstrap();
