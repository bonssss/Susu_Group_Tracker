export function parseMoney(amount) {
  if (typeof amount !== "string") {
    throw new TypeError("Money amounts must be decimal strings, such as \"50.00\".");
  }

  const match = /^(0|[1-9]\d*)(?:\.(\d{1,2}))?$/.exec(amount);
  if (!match) {
    throw new RangeError("Money amounts must have at most two decimal places.");
  }

  const wholePesos = Number(match[1]);
  const fractionalPesewas = Number((match[2] ?? "").padEnd(2, "0"));
  const pesewas = wholePesos * 100 + fractionalPesewas;
  if (!Number.isSafeInteger(pesewas)) {
    throw new RangeError("Money amount is too large.");
  }

  return pesewas;
}

export function formatMoney(pesewas) {
  if (!Number.isSafeInteger(pesewas) || pesewas < 0) {
    throw new RangeError("Money must be a non-negative whole number of pesewas.");
  }

  const wholePesos = Math.floor(pesewas / 100);
  const fractionalPesewas = String(pesewas % 100).padStart(2, "0");
  return `${wholePesos}.${fractionalPesewas}`;
}
