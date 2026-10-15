import express from "express";
import cors from "cors";
import { errorHandler } from "./middleware/error-handler.js";
import { notFoundHandler } from "./middleware/not-found.js";
import { createApiRouter } from "./routes/index.js";

export function createApp({ apiRouter = createApiRouter() } = {}) {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(apiRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
