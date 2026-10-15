import assert from "node:assert/strict";
import { once } from "node:events";
import test from "node:test";
import { createApp } from "../server.js";

async function withApi(run) {
  const server = createApp().listen(0);
  await once(server, "listening");
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  try {
    await run((path, body, method = "POST") =>
      fetch(`${baseUrl}${path}`, {
        method,
        headers: { "content-type": "application/json" },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      }),
    );
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function setupGroup(request) {
  const response = await request("/group", { weeklyContribution: "50.00" });
  assert.equal(response.status, 201);
  for (const name of ["Ama", "Kofi", "Esi"]) {
    assert.equal((await request("/members", { name })).status, 201);
  }
}

test("creates one group and rejects malformed or duplicate group creation", async () => {
  await withApi(async (request) => {
    const invalid = await request("/group", { weeklyContribution: "50.001" });
    assert.equal(invalid.status, 400);

    const created = await request("/group", { weeklyContribution: "50.00" });
    assert.equal(created.status, 201);
    assert.deepEqual(await created.json(), { weeklyContribution: "50.00" });

    const duplicate = await request("/group", { weeklyContribution: "20.00" });
    assert.equal(duplicate.status, 409);
  });
});

test("reports incomplete payments without advancing, then pays out and advances", async () => {
  await withApi(async (request) => {
    await setupGroup(request);
    for (const [member, amount] of [
      ["Ama", "50.00"],
      ["Kofi", "50.00"],
      ["Esi", "30.00"],
    ]) {
      assert.equal((await request("/contributions", { member, amount })).status, 200);
    }

    const incomplete = await request("/weeks/close", {});
    assert.deepEqual(await incomplete.json(), {
      closed: false,
      week: 1,
      owes: [{ member: "Esi", amount: "20.00" }],
    });

    assert.equal(
      (await request("/contributions", { member: "Esi", amount: "20.00" })).status,
      200,
    );
    const closed = await request("/weeks/close", {});
    assert.deepEqual(await closed.json(), {
      closed: true,
      week: 1,
      payout: { recipient: "Ama", amount: "150.00" },
      currentWeek: 2,
    });

    const report = await request("/report", undefined, "GET");
    assert.deepEqual(await report.json(), {
      currentWeek: 2,
      weeklyContribution: "50.00",
      members: [
        { name: "Ama", paidInFull: false, paid: "0.00", owes: "50.00" },
        { name: "Kofi", paidInFull: false, paid: "0.00", owes: "50.00" },
        { name: "Esi", paidInFull: false, paid: "0.00", owes: "50.00" },
      ],
      payoutHistory: [{ week: 1, recipient: "Ama", amount: "150.00" }],
    });
  });
});

test("rejects unknown members, duplicate members, and invalid contributions", async () => {
  await withApi(async (request) => {
    await setupGroup(request);

    assert.equal((await request("/members", { name: " ama " })).status, 409);
    assert.equal(
      (await request("/contributions", { member: "Unknown", amount: "1.00" })).status,
      404,
    );
    assert.equal((await request("/contributions", { member: "Ama", amount: "0.00" })).status, 400);
    assert.equal((await request("/contributions", { member: "Ama", amount: "1.001" })).status, 400);

    await request("/contributions", { member: "Ama", amount: "49.00" });
    const excess = await request("/contributions", { member: "Ama", amount: "1.01" });
    assert.equal(excess.status, 400);
  });
});

test("does not allow adding members after contributions begin", async () => {
  await withApi(async (request) => {
    await setupGroup(request);
    await request("/contributions", { member: "Ama", amount: "0.01" });

    const response = await request("/members", { name: "Yaa" });
    assert.equal(response.status, 400);
  });
});

test("returns useful errors when a group has not been created", async () => {
  await withApi(async (request) => {
    const response = await request("/report", undefined, "GET");
    assert.equal(response.status, 404);
    assert.match((await response.json()).error, /Create a group/);
  });
});
