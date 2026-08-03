import { db } from "@workspace/db";
import { emailJobsTable, clientsTable } from "@workspace/db";
import { eq, and, isNull, lte, or, lt } from "drizzle-orm";
import { sendThankYouEmail } from "./email";
import { logger } from "./logger";

const DELAY_MS = 2 * 60 * 60 * 1000; // 2 hours
const POLL_INTERVAL_MS = 60 * 1000;   // sweep every 60 s
// If processing_started_at is older than this, the job is considered stale
// (crashed mid-send) and can be reclaimed.
const LEASE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

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
          isNull(emailJobsTable.processingStartedAt),
          lt(emailJobsTable.processingStartedAt, leaseExpiry),
        ),
      ),
    )
    .returning({ id: emailJobsTable.id });

  return claimed !== undefined;
}

/**
 * Process all unsent jobs whose scheduledFor is in the past.
 * Uses a lease (processingStartedAt) so concurrent calls or restarts mid-send
 * cannot permanently lose a job.
 */
export async function processDueJobs(): Promise<void> {
  const now = new Date();
  const leaseExpiry = new Date(now.getTime() - LEASE_TIMEOUT_MS);

  // Find jobs that are due and not yet claimed (or whose lease has expired).
  const pendingJobs = await db
    .select()
    .from(emailJobsTable)
    .where(
      and(
        isNull(emailJobsTable.sentAt),
        eq(emailJobsTable.failed, false),
        lte(emailJobsTable.scheduledFor, now),
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
        // No client or no email — mark failed so we don't keep retrying.
        await db
          .update(emailJobsTable)
          .set({ processingStartedAt: null, failed: true })
          .where(eq(emailJobsTable.id, job.id));
        logger.warn(
          { jobId: job.id, clientId: job.clientId },
          "Client not found or has no email — job marked failed",
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
        // Clear the lease so the next poll can retry; mark failed to avoid loops.
        await db
          .update(emailJobsTable)
          .set({ processingStartedAt: null, failed: true })
          .where(eq(emailJobsTable.id, job.id));
        logger.error(
          { jobId: job.id, clientId: job.clientId },
          "Email send failed — job marked failed",
        );
      }
    } catch (err) {
      // Clear lease — expired lease means the next poll will retry.
      await db
        .update(emailJobsTable)
        .set({ processingStartedAt: null, failed: true })
        .where(eq(emailJobsTable.id, job.id));
      logger.error(
        { err, jobId: job.id, clientId: job.clientId },
        "Unexpected error processing email job — job marked failed",
      );
    }
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
