import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Shared state the mock factories close over ────────────────────────────────
// vi.hoisted ensures these are available before the hoisted vi.mock() calls run.
const state = vi.hoisted(() => ({
  /** Return values for successive db.select().from().where() calls. */
  selectResults: [] as unknown[][],
  selectCallIdx: 0,

  /** Return value for the claimJob update's .returning() call. */
  updateClaimResult: [] as Array<{ id: number }>,

  /** Captures every db.update().set(values) call for assertion. */
  updates: [] as Array<{ values: Record<string, unknown> }>,

  /** Spy for sendThankYouEmail so we can assert call count and arguments. */
  sendThankYouEmail: vi.fn<
    (opts: {
      toEmail: string;
      toName: string;
      clientId: number;
      baseUrl: string;
    }) => Promise<boolean>
  >(),
}));

// ── Mock @workspace/db ────────────────────────────────────────────────────────
vi.mock("@workspace/db", () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () =>
          Promise.resolve(state.selectResults[state.selectCallIdx++] ?? []),
      }),
    }),
    update: () => ({
      set: (values: Record<string, unknown>) => {
        state.updates.push({ values });
        return {
          where: () => ({
            // Awaitable directly (mark-sent / mark-failed path, no .returning())
            then(
              resolve: (v: undefined) => void,
              reject: (e: unknown) => void,
            ) {
              return Promise.resolve(undefined).then(resolve, reject);
            },
            // .returning() path used by claimJob
            returning: () => Promise.resolve(state.updateClaimResult),
          }),
        };
      },
    }),
  },
  emailJobsTable: {},
  clientsTable: {},
}));

// ── Mock drizzle-orm operators (passed to .where() but ignored by our mock) ──
vi.mock("drizzle-orm", () => ({
  eq: () => null,
  and: () => null,
  isNull: () => null,
  lte: () => null,
  or: () => null,
  lt: () => null,
}));

// ── Mock ./email ──────────────────────────────────────────────────────────────
vi.mock("./email", () => ({
  sendThankYouEmail: state.sendThankYouEmail,
}));

// ── Mock ./logger (suppress noise in test output) ────────────────────────────
vi.mock("./logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// ── Import the module under test (after all mocks are registered) ─────────────
import { processDueJobs } from "./email-job-processor";

// ── Test data helpers ─────────────────────────────────────────────────────────
function makeJob(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    clientId: 42,
    baseUrl: "https://example.com",
    scheduledFor: new Date(Date.now() - 60_000), // 1 minute ago → due
    processingStartedAt: null,
    sentAt: null,
    failed: false,
    retryCount: 0,
    nextRetryAt: null,
    createdAt: new Date(),
    ...overrides,
  };
}

function makeClient(overrides: Record<string, unknown> = {}) {
  return {
    id: 42,
    firstName: "Anna",
    lastName: "Test",
    email: "anna@example.com",
    phone: "+41 78 000 00 00",
    age: null,
    dateOfBirth: null,
    address: null,
    floor: null,
    plz: null,
    notes: null,
    createdAt: new Date(),
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────
describe("processDueJobs", () => {
  beforeEach(() => {
    // Reset all shared state before each test
    state.selectResults = [];
    state.selectCallIdx = 0;
    state.updateClaimResult = [];
    state.updates = [];
    state.sendThankYouEmail.mockReset();
  });

  it("sends a thank-you email and marks the job sent when an overdue job is present", async () => {
    const job = makeJob();
    const client = makeClient();

    // DB returns the pending job on the first select; the client on the second.
    state.selectResults = [[job], [client]];
    // Simulate a successful claim (processingStartedAt set, row locked).
    state.updateClaimResult = [{ id: job.id }];
    // Email send succeeds.
    state.sendThankYouEmail.mockResolvedValue(true);

    await processDueJobs();

    // Email was sent exactly once with the correct arguments.
    expect(state.sendThankYouEmail).toHaveBeenCalledOnce();
    expect(state.sendThankYouEmail).toHaveBeenCalledWith({
      toEmail: client.email,
      toName: client.firstName,
      clientId: job.clientId,
      baseUrl: job.baseUrl,
    });

    // After a successful send the job must be marked sentAt (not null) and
    // processingStartedAt must be cleared.
    const markSent = state.updates.find(
      (u) => u.values.sentAt != null,
    );
    expect(markSent).toBeDefined();
    expect(markSent!.values.processingStartedAt).toBeNull();
  });

  it("leaves a not-yet-due job untouched (no email, no DB writes)", async () => {
    // A job whose scheduledFor is in the future is excluded by the DB query.
    // The query therefore returns an empty result set.
    state.selectResults = [[]];

    await processDueJobs();

    expect(state.sendThankYouEmail).not.toHaveBeenCalled();
    // processDueJobs returns early — no update calls at all.
    expect(state.updates).toHaveLength(0);
  });

  it("skips a job already marked sentAt — no double-send", async () => {
    // An already-sent job is excluded by the DB query (sentAt IS NOT NULL
    // fails the isNull(sentAt) filter). Simulate this by returning no jobs.
    state.selectResults = [[]];

    await processDueJobs();

    expect(state.sendThankYouEmail).not.toHaveBeenCalled();
    expect(state.updates).toHaveLength(0);
  });

  it("does not send an email when the lease claim fails (another process won the race)", async () => {
    // The job appears in the pending query but the atomic UPDATE claim returns
    // nothing — another process (or a concurrent restart) already claimed it.
    const job = makeJob();
    const client = makeClient();

    state.selectResults = [[job], [client]];
    state.updateClaimResult = []; // claim returns empty → not claimed

    await processDueJobs();

    expect(state.sendThankYouEmail).not.toHaveBeenCalled();
    // The only update should be the claim attempt itself; no sentAt write.
    const markSent = state.updates.find((u) => u.values.sentAt != null);
    expect(markSent).toBeUndefined();
  });
});
