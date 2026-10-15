import { createSusuService } from "../services/susu-service.js";

export function createSusuController(service = createSusuService()) {
  return {
    createGroup(req, res) {
      const result = service.createGroup(req.body?.weeklyContribution);
      res.status(201).json(result);
    },

    addMember(req, res) {
      const result = service.addMember(req.body?.name);
      res.status(201).json(result);
    },

    recordContribution(req, res) {
      const result = service.recordContribution(
        req.body?.member,
        req.body?.amount,
      );
      res.json(result);
    },

    closeWeek(req, res) {
      const result = service.closeWeek();
      res.json(result);
    },

    getReport(req, res) {
      const result = service.getReport();
      res.json(result);
    },
  };
}
