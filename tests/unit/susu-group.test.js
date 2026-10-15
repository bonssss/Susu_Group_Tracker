import assert from "node:assert/strict";
import test from "node:test";
import { SusuError, SusuGroup } from "../../src/domain/susu-group.js";

function createGroup() {
  const group = new SusuGroup(5000);
  group.addMember("Ama");
  group.addMember("Kofi");
  group.addMember("Esi");
  return group;
}

test("an incomplete week does not close and reports each outstanding amount", () => {
  const group = createGroup();
  group.recordContribution("Ama", 5000);
  group.recordContribution("Kofi", 5000);
  group.recordContribution("Esi", 3000);

  assert.deepEqual(group.closeWeek(), {
    closed: false,
    week: 1,
    owes: [{ member: "Esi", amountPesewas: 2000 }],
  });
  assert.equal(group.getReport().currentWeek, 1);
});

test("a partial payment can be completed and the first member receives the full pot", () => {
  const group = createGroup();
  group.recordContribution("Ama", 5000);
  group.recordContribution("Kofi", 5000);
  group.recordContribution("Esi", 3000);
  group.closeWeek();
  group.recordContribution("Esi", 2000);

  assert.deepEqual(group.closeWeek(), {
    closed: true,
    week: 1,
    recipient: "Ama",
    amountPesewas: 15000,
  });
});

test("successful closes advance the week and pay members in join order", () => {
  const group = createGroup();

  for (const recipient of ["Ama", "Kofi"]) {
    for (const member of ["Ama", "Kofi", "Esi"]) {
      group.recordContribution(member, 5000);
    }
    assert.equal(group.closeWeek().recipient, recipient);
  }

  assert.equal(group.getReport().currentWeek, 3);
});

test("the report shows current payments, amounts owed, and payout history", () => {
  const group = createGroup();
  group.recordContribution("Ama", 5000);
  group.recordContribution("Kofi", 3000);

  assert.deepEqual(group.getReport().members, [
    { name: "Ama", paidPesewas: 5000, owesPesewas: 0, paidInFull: true },
    { name: "Kofi", paidPesewas: 3000, owesPesewas: 2000, paidInFull: false },
    { name: "Esi", paidPesewas: 0, owesPesewas: 5000, paidInFull: false },
  ]);
  assert.deepEqual(group.getReport().payoutHistory, []);
});

test("member names are unique regardless of case or surrounding whitespace", () => {
  const group = new SusuGroup(5000);
  group.addMember("Ama");
  assert.throws(() => group.addMember(" ama "), (error) => error.statusCode === 409);
});

test("unknown members and zero, negative, or excess payments are rejected", () => {
  const group = createGroup();

  assert.throws(() => group.recordContribution("Unknown", 100), (error) => error.statusCode === 404);
  assert.throws(() => group.recordContribution("Ama", 0), SusuError);
  assert.throws(() => group.recordContribution("Ama", -1), SusuError);
  group.recordContribution("Ama", 3000);
  assert.throws(() => group.recordContribution("Ama", 2001), /exceeds/);
});

test("members cannot be added after the first contribution", () => {
  const group = createGroup();
  group.recordContribution("Ama", 1);

  assert.throws(() => group.addMember("Yaa"), /after contributions have started/);
});

test("a week cannot close until the group has at least one member", () => {
  assert.throws(() => new SusuGroup(5000).closeWeek(), /at least one member/);
});
