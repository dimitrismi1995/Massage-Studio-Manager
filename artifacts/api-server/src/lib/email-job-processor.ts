import { db } from "@workspace/db";
import { emailJobsTable, clientsTable } from "@workspace/db";
import { eq, and, isNull, lte, or, lt } from "drizzle-orm";
import { sendThankYouEmail } from "./email";
import { logger } from "./logger";

const DELAY_MS = process.env.NODE_ENV === "development"
  ? 5 * 1000              // 5 s in dev (for testing)
  : 2 * 60 * 60 * 1000;  // 2 h in production
const POLL_INTERVAL_MS = process.env.NODE_ENV === "development"
  ? 5 * 1000   // poll every 5 s in dev
  : 60 * 1000; // poll every 60 s in production
// If processing_started_at is older than this, the job is considered stale
// (crashed mid-send) and can be reclaimed.
const LEASE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

/** Maximum number of send attempts before a job is permanently failed. */
const MAX_RETRIES = 5;

/**
 * Compute exponential backoff delay for a given retry attempt (0-indexed).
 * Delays: 1 min, 2 min, 4 min, 8 min, 16 min (capped at 30 min).
 */
function backoffDelayMs(retryCount: number): number {
  const base = 60 * 1000; // 1 minute
  const cap = 30 * 60 * 1000; // 30 minutes
  return Math.min(base * Math.pow(2, retryCount), cap);
}

/**
 * Schedule a thank-you email by persisting a job to the database.
 * Crash/restart-safe: the polling loop will fire the job at its due time.
 */
export async function scheduleThankYouEmail(opts: {
  clientId: number;
  baseUrl: string;
}): Promise<void> {
  const scheduledFor = new Date(Date.now() + DELAY_MS);
  await db.insert(emailJobsTable).values({
    clientId: opts.clientId,
    baseUrl: opts.baseUrl,
    scheduledFor,
  });
  logger.info(
    { clientId: opts.clientId, scheduledFor },
    "Thank-you email job persisted to database",
  );
}

/**
 * Attempt to claim a single job using an atomic conditional update.
 * A job is claimable when:
 *   - sentAt IS NULL (not yet successfully sent)
 *   - failed = false
 *   - scheduledFor <= now (due)
 *   - nextRetryAt IS NULL  OR  nextRetryAt <= now (retry window has elapsed)
 *   - processingStartedAt IS NULL  OR  processingStartedAt < (now - LEASE_TIMEOUT)
 *
 * Returns true if this process claimed the job, false if another process got it first.
 */
async function claimJob(jobId: number, now: Date): Promise<boolean> {
  const leaseExpiry = new Date(now.getTime() - LEASE_TIMEOUT_MS);

  const [claimed] = await db
    .update(emailJobsTable)
    .set({ processingStartedAt: now })
    .where(
      and(
        eq(emailJobsTable.id, jobId),
        isNull(emailJobsTable.sentAt),
        eq(emailJobsTable.failed, false),
        or(
          isNull(emailJobsTable.nextRetryAt),
          lte(emailJobsTable.nextRetryAt, now),
        ),
        or(
          isNull(emailJobsTable.processingStartedAt),
          lt(emailJobsTable.processingStartedAt, leaseExpiry),
        ),
      ),
    )
    .returning({ id: emailJobsTable.id });

  return claimed !== undefined;
}

/**
 * Process all unsent jobs whose scheduledFor is in the past and whose
 * nextRetryAt (if set) is also in the past.
 * Uses a lease (processingStartedAt) so concurrent calls or restarts mid-send
 * cannot permanently lose a job.
 */
export async function processDueJobs(): Promise<void> {
  const now = new Date();
  const leaseExpiry = new Date(now.getTime() - LEASE_TIMEOUT_MS);

  // Find jobs that are due and not yet claimed (or whose lease has expired).
  // A job is eligible when:
  //   - not yet sent, not permanently failed
  //   - scheduledFor has passed
  //   - nextRetryAt is null (first attempt) or has passed (retry window elapsed)
  //   - no active lease (or lease has expired)
  const pendingJobs = await db
    .select()
    .from(emailJobsTable)
    .where(
      and(
        isNull(emailJobsTable.sentAt),
        eq(emailJobsTable.failed, false),
        lte(emailJobsTable.scheduledFor, now),
        or(
          isNull(emailJobsTable.nextRetryAt),
          lte(emailJobsTable.nextRetryAt, now),
        ),
        or(
          isNull(emailJobsTable.processingStartedAt),
          lt(emailJobsTable.processingStartedAt, leaseExpiry),
        ),
      ),
    );

  if (pendingJobs.length === 0) return;

  logger.info({ count: pendingJobs.length }, "Processing due email jobs");

  for (const job of pendingJobs) {
    const claimed = await claimJob(job.id, now);
    if (!claimed) {
      // Another process claimed this job between our SELECT and UPDATE — skip.
      continue;
    }

    try {
      const [client] = await db
        .select()
        .from(clientsTable)
        .where(eq(clientsTable.id, job.clientId));

      if (!client?.email) {
        // No client or no email — mark permanently failed (retrying won't help).
        await db
          .update(emailJobsTable)
          .set({ processingStartedAt: null, failed: true })
          .where(eq(emailJobsTable.id, job.id));
        logger.warn(
          { jobId: job.id, clientId: job.clientId },
          "Client not found or has no email — job marked permanently failed",
        );
        continue;
      }

      const sent = await sendThankYouEmail({
        toEmail: client.email,
        toName: client.firstName,
        clientId: job.clientId,
        baseUrl: job.baseUrl,
      });

      if (sent) {
        // Only mark sentAt after a confirmed successful send.
        await db
          .update(emailJobsTable)
          .set({ sentAt: new Date(), processingStartedAt: null })
          .where(eq(emailJobsTable.id, job.id));
        logger.info(
          { jobId: job.id, clientId: job.clientId },
          "Thank-you email sent — job marked complete",
        );
      } else {
        await handleFailure(job.id, job.retryCount, "Email send returned false");
      }
    } catch (err) {
      await handleFailure(job.id, job.retryCount, "Unexpected error", err);
    }
  }
}

/**
 * Handle a failed send attempt.
 * If retries remain, schedule the next attempt with exponential backoff and
 * clear the failed flag so the poller picks it up again.
 * Once MAX_RETRIES is exhausted, mark the job permanently failed.
 *
 * Retry count semantics: retryCount tracks completed retries (0 = no retries yet).
 * MAX_RETRIES = 5 means up to 5 retry attempts after the initial failure.
 * Backoff is indexed by the number of retries already attempted so the first
 * retry always waits the base delay (1 minute).
 */
async function handleFailure(
  jobId: number,
  currentRetryCount: number,
  reason: string,
  err?: unknown,
): Promise<void> {
  const newRetryCount = currentRetryCount + 1;

  if (newRetryCount > MAX_RETRIES) {
    await db
      .update(emailJobsTable)
      .set({ processingStartedAt: null, failed: true, retryCount: newRetryCount })
      .where(eq(emailJobsTable.id, jobId));
    logger.error(
      { jobId, retryCount: newRetryCount, maxRetries: MAX_RETRIES, reason, err },
      "Email job permanently failed after max retries",
    );
  } else {
    // Use currentRetryCount (prior value) so first retry delay is backoffDelayMs(0) = 1 min.
    const delay = backoffDelayMs(currentRetryCount);
    const nextRetryAt = new Date(Date.now() + delay);
    await db
      .update(emailJobsTable)
      .set({
        processingStartedAt: null,
        failed: false,
        retryCount: newRetryCount,
        nextRetryAt,
      })
      .where(eq(emailJobsTable.id, jobId));
    logger.warn(
      { jobId, retryCount: newRetryCount, nextRetryAt, delayMs: delay, reason, err },
      "Email job failed — scheduled for retry",
    );
  }
}

/**
 * Start a persistent polling loop that sweeps for due jobs every minute.
 * Call once at server startup. The first sweep runs immediately so jobs that
 * were pending when the server last stopped are processed without delay.
 */
export function startJobPoller(): void {
  const sweep = () => {
    processDueJobs().catch((err) =>
      logger.error({ err }, "Error during email job poll sweep"),
    );
  };

  // Immediate sweep on startup for jobs already overdue.
  sweep();

  // Periodic sweep catches future-scheduled jobs as they become due.
  setInterval(sweep, POLL_INTERVAL_MS);

  logger.info(
    { pollIntervalMs: POLL_INTERVAL_MS },
    "Email job poller started",
  );
}
