import { setServers } from "node:dns/promises";
import mongoose from "mongoose";
import cron from "node-cron";
import { readConfig } from "./config.js";
import { createApp } from "./app.js";
import { User } from "./models/User.js";
import { Problem } from "./models/Problem.js";
import { runReminders } from "./lib/reminders.js";

try {
  const config = readConfig();

  // Optional DNS override for your local network.
  if (process.env.DNS_SERVERS) {
    setServers(
      process.env.DNS_SERVERS.split(",")
        .map((server) => server.trim())
        .filter(Boolean),
    );
  }

  await mongoose.connect(config.mongoUri, {
    serverSelectionTimeoutMS: 10000,
  });

  await Promise.all([User.init(), Problem.init()]);

  const server = createApp(config).listen(config.port, "0.0.0.0", () => {
    console.log(`CodeTrack API running on port ${config.port}`);
  });

  let task;

  if (process.env.ENABLE_CRON === "true") {
    task = cron.schedule(
      "0 9 * * *",
      () =>
        runReminders(config.origin)
          .then((result) => console.log("Reminders:", result))
          .catch(() => console.error("Reminder job failed")),
      {
        timezone: "Asia/Kolkata",
        noOverlap: true,
      },
    );
  }

  for (const signal of ["SIGINT", "SIGTERM"]) {
    process.on(signal, () => {
      task?.stop();

      server.close(async () => {
        await mongoose.disconnect();
        process.exit(0);
      });
    });
  }
} catch (error) {
  const message = String(error.message).replace(
    /mongodb(?:\+srv)?:\/\/[^\s]+/gi,
    "[MongoDB URI hidden]",
  );

  console.error("Startup failed:", error.name);
  console.error("Details:", message);

  process.exit(1);
}