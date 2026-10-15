function parsePort(value, defaultPort = 3000) {
  if (value === undefined || value === null || value === "") {
    return defaultPort;
  }
  const numericPort = Number(value);
  if (!Number.isInteger(numericPort) || numericPort < 1 || numericPort > 65535) {
    throw new RangeError("PORT must be an integer between 1 and 65535.");
  }
  return numericPort;
}

export const config = {
  port: parsePort(process.env.PORT, 3000),
  nodeEnv: process.env.NODE_ENV || "development",
  isProduction: process.env.NODE_ENV === "production",
  isTest: process.env.NODE_ENV === "test",
};
