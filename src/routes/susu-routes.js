import { Router } from "express";
import { createSusuController } from "../controllers/susu-controller.js";

export function createSusuRouter(controller = createSusuController()) {
  const router = Router();

  router.post("/group", controller.createGroup);
  router.post("/members", controller.addMember);
  router.post("/contributions", controller.recordContribution);
  router.post("/weeks/close", controller.closeWeek);
  router.get("/report", controller.getReport);

  return router;
}
