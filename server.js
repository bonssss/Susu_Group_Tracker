import express from "express";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { formatMoney, parseMoney } from "./src/money.js";
import { SusuError, SusuGroup } from "./src/susu-group.js";

export function createApp() {
  const app = express();
  let group;

  app.use(express.json());

  app.post("/group", (req, res, next) => {
    try {
      if (group) {
        throw new SusuError("A group already exists in this process.", 409);
      }

      group = new SusuGroup(parseMoney(req.body?.weeklyContribution));
      res.status(201).json({
        weeklyContribution: formatMoney(group.weeklyContributionPesewas),
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/members", (req, res, next) => {
    try {
      const currentGroup = requireGroup(group);
      const member = currentGroup.addMember(req.body?.name);
      res.status(201).json({ member });
    } catch (error) {
      next(error);
    }
  });

  app.post("/contributions", (req, res, next) => {
    try {
      const currentGroup = requireGroup(group);
      const result = currentGroup.recordContribution(
        req.body?.member,
        parseMoney(req.body?.amount),
      );
      res.json({
        week: currentGroup.getReport().currentWeek,
        member: result.member,
        paid: formatMoney(result.paidPesewas),
        owes: formatMoney(currentGroup.weeklyContributionPesewas - result.paidPesewas),
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/weeks/close", (req, res, next) => {
    try {
      const currentGroup = requireGroup(group);
      const result = currentGroup.closeWeek();

      if (!result.closed) {
        res.json({
          closed: false,
          week: result.week,
          owes: result.owes.map(({ member, amountPesewas }) => ({
            member,
            amount: formatMoney(amountPesewas),
          })),
        });
        return;
      }

      res.json({
        closed: true,
        week: result.week,
        payout: {
          recipient: result.recipient,
          amount: formatMoney(result.amountPesewas),
        },
        currentWeek: currentGroup.getReport().currentWeek,
      });
    } catch (error) {
      next(error);
    }
  });

  app.get("/report", (req, res, next) => {
    try {
      const report = requireGroup(group).getReport();
      res.json({
        currentWeek: report.currentWeek,
        weeklyContribution: formatMoney(report.weeklyContributionPesewas),
        members: report.members.map((member) => ({
          name: member.name,
          paidInFull: member.paidInFull,
          paid: formatMoney(member.paidPesewas),
          owes: formatMoney(member.owesPesewas),
        })),
        payoutHistory: report.payoutHistory.map((payout) => ({
          week: payout.week,
          recipient: payout.recipient,
          amount: formatMoney(payout.amountPesewas),
        })),
      });
    } catch (error) {
      next(error);
    }
  });

  app.use((req, res) => {
    res.status(404).json({ error: "Route not found." });
  });

  app.use((error, req, res, next) => {
    if (error instanceof SusuError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    if (error instanceof TypeError || error instanceof RangeError) {
      res.status(400).json({ error: error.message });
      return;
    }
    if (error instanceof SyntaxError && "body" in error) {
      res.status(400).json({ error: "Request body must contain valid JSON." });
      return;
    }

    console.error(error);
    res.status(500).json({ error: "An unexpected server error occurred." });
  });

  return app;
}

function requireGroup(group) {
  if (!group) {
    throw new SusuError("Create a group before using this endpoint.", 404);
  }
  return group;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const port = Number(process.env.PORT ?? 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new RangeError("PORT must be an integer between 1 and 65535.");
  }

  createApp().listen(port, () => {
    console.log(`Susu Group Tracker API listening on port ${port}`);
  });
}
