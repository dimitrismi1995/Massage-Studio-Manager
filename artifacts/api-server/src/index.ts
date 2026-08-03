import app from "./app";
import { logger } from "./lib/logger";
import { startJobPoller } from "./lib/email-job-processor";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  // Start the persistent polling loop — sweeps immediately on boot for overdue
  // jobs, then every minute so future-scheduled jobs fire on time after a restart.
  startJobPoller();
});
