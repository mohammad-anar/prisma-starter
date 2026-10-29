import compression from "compression";
import cors from "cors";
import express, { Application, Request, Response } from "express";
import swaggerUi from "swagger-ui-express";
import env from "./config/env.js";
import routes from "./modules/routes.js";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware.js";
import { swaggerDocument } from "./docs/swagger.js";

const app: Application = express();
const corsOrigins = env.cors_origin || "*";

// Middleware
app.use(compression());
app.use(
  cors({
    origin: corsOrigins.includes(",")
      ? corsOrigins.split(",").map((origin) => origin.trim())
      : corsOrigins === "*"
      ? "*"
      : [corsOrigins],
    credentials: true,
  }),
);

// Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static uploads directory
app.use(express.static("uploads"));
app.use("/uploads", express.static("uploads"));

// Swagger raw JSON endpoint (MUST be registered before swaggerUi route handler)
app.get("/api-docs/swagger.json", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/json");
  res.status(200).json(swaggerDocument);
});
app.get("/swagger.json", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/json");
  res.status(200).json(swaggerDocument);
});

// Swagger UI Explorer
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// API v1 Router
app.use("/api/v1", routes);

// Health check route
app.get("/", (req: Request, res: Response) => {
  res.send({
    message: "ফুলপুর ব্লাড ডোনার নেটওয়ার্ক API Server is running...",
    project: "Phulpur Blood Donor Network",
    database: "MongoDB with Prisma ORM",
    environment: env.node_env,
    uptime: `${process.uptime().toFixed(2)} sec`,
    docs: "/api-docs",
    timeStamp: new Date().toISOString(),
  });
});

// Error handling middlewares
app.use(errorHandler);
app.use(notFoundHandler);

export default app;
