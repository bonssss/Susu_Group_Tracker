import assert from "node:assert/strict";
import test from "node:test";
import { SusuService } from "../../src/services/susu-service.js";

test("susu service requires group creation before other actions", () => {
  const service = new SusuService();

  assert.throws(() => service.addMember("Ama"), /Create a group before using this endpoint/);
  assert.throws(() => service.recordContribution("Ama", "50.00"), /Create a group before using this endpoint/);
  assert.throws(() => service.closeWeek(), /Create a group before using this endpoint/);
  assert.throws(() => service.getReport(), /Create a group before using this endpoint/);
});

test("susu service creates group and rejects duplicate creation", () => {
  const service = new SusuService();
  const result = service.createGroup("100.00");

  assert.deepEqual(result, { weeklyContribution: "100.00" });
  assert.throws(() => service.createGroup("50.00"), /A group already exists/);
});

test("susu service handles member addition, contributions, and weekly cycle", () => {
  const service = new SusuService();
  service.createGroup("50.00");

  const memberResult = service.addMember("Kwame");
  assert.deepEqual(memberResult, { member: "Kwame" });

  const contribResult = service.recordContribution("Kwame", "30.00");
  assert.deepEqual(contribResult, {
    week: 1,
    member: "Kwame",
    paid: "30.00",
    owes: "20.00",
  });

  const incompleteClose = service.closeWeek();
  assert.deepEqual(incompleteClose, {
    closed: false,
    week: 1,
    owes: [{ member: "Kwame", amount: "20.00" }],
  });

  service.recordContribution("Kwame", "20.00");
  const completeClose = service.closeWeek();
  assert.deepEqual(completeClose, {
    closed: true,
    week: 1,
    payout: { recipient: "Kwame", amount: "50.00" },
    currentWeek: 2,
  });

  const report = service.getReport();
  assert.equal(report.currentWeek, 2);
  assert.equal(report.weeklyContribution, "50.00");
  assert.equal(report.payoutHistory.length, 1);
});
