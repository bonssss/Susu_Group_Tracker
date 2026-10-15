import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createApp } from "./app.js";
import { config } from "./config/index.js";

export function startServer(port = config.port) {
  const numericPort = Number(port);
  if (!Number.isInteger(numericPort) || numericPort < 1 || numericPort > 65535) {
    throw new RangeError("PORT must be an integer between 1 and 65535.");
  }

  const app = createApp();
  const server = app.listen(numericPort, () => {
    console.log(`Susu Group Tracker API listening on port ${numericPort} [${config.nodeEnv}]`);
  });

  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const server = startServer();

  const shutdown = (signal) => {
    console.log(`\nReceived ${signal}, shutting down gracefully...`);
    server.close(() => {
      console.log("Server closed.");
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}
