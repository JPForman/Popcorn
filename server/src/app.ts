import "express-async-errors";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { authRouter } from "./routes/auth.routes.js";
import { healthRouter } from "./routes/health.routes.js";
import { usersRouter } from "./routes/users.routes.js";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.CLIENT_ORIGIN }));
  app.use(express.json());

  app.use("/api/health", healthRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/users", usersRouter);

  app.use(errorHandler);

  return app;
}
