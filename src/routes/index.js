import { Router } from "express";
import { createSusuRouter } from "./susu-routes.js";

export function createApiRouter(susuRouter = createSusuRouter()) {
  const router = Router();
  router.use(susuRouter);
  return router;
}
