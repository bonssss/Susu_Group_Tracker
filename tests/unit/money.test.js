import assert from "node:assert/strict";
import test from "node:test";
import { formatMoney, parseMoney } from "../../src/domain/money.js";

test("parses whole and fractional amounts into pesewas", () => {
  assert.equal(parseMoney("50"), 5000);
  assert.equal(parseMoney("0.5"), 50);
  assert.equal(parseMoney("12.34"), 1234);
});

test("rejects non-string, negative, malformed, and over-precision amounts", () => {
  for (const amount of [50, "-1.00", "1.234", "1.2.3", " 1.00"]) {
    assert.throws(() => parseMoney(amount));
  }
});

test("rejects values that cannot be represented safely in pesewas", () => {
  assert.throws(() => parseMoney("90071992547410.00"), /too large/);
});

test("formats pesewas without floating-point rounding", () => {
  assert.equal(formatMoney(0), "0.00");
  assert.equal(formatMoney(7), "0.07");
  assert.equal(formatMoney(12345), "123.45");
});
