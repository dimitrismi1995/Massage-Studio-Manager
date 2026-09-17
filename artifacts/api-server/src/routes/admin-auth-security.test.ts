import { createHash } from "node:crypto";
import { createServer, type Server } from "node:http";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

type UserRow = {
  id: number;
  email: string;
  role: "viewer" | "editor";
  active: boolean;
  createdAt: Date;
  lastLoginAt: Date | null;
};

type InviteRow = {
  id: number;
  email: string;
  role: "viewer" | "editor";
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
};

const state = vi.hoisted(() => {
  const table = (name: string, columns: string[]) =>
    Object.fromEntries([
      ["$inferSelect", null],
      ...columns.map((column) => [column, `${name}.${column}`]),
    ]);

  return {
    tables: {
      adminUsersTable: table("adminUsers", [
        "id",
        "email",
        "role",
        "active",
        "createdAt",
        "lastLoginAt",
      ]),
      adminInvitesTable: table("adminInvites", [
        "id",
        "email",
        "role",
        "tokenHash",
        "expiresAt",
        "usedAt",
        "createdAt",
      ]),
      clientsTable: table("clients", [
        "id",
        "firstName",
        "lastName",
        "email",
        "phone",
        "createdAt",
      ]),
      medicalHistoryTable: table("medicalHistory", ["clientId", "createdAt"]),
      appointmentsTable: table("appointments", ["id", "clientId", "date"]),
      expensesTable: table("expenses", ["id", "date"]),
      reviewsTable: table("reviews", ["id", "clientId"]),
      emailJobsTable: table("emailJobs", ["id"]),
    },
    users: new Map<number, UserRow>(),
    invites: new Map<number, InviteRow>(),
    clients: [] as Array<Record<string, unknown>>,
    nextClientId: 1,
    clientInsertCalls: 0,
  };
});

type TableName = "adminUsers" | "adminInvites" | "clients" | "medicalHistory";
type Clause =
  | { kind: "eq"; column: string; value: unknown }
  | { kind: "isNull"; column: string }
  | { kind: "and"; clauses: Clause[] };

function tableName(table: Record<string, unknown>): TableName {
  const firstColumn = Object.values(table).find(
    (value): value is string => typeof value === "string",
  );
  return (firstColumn?.split(".")[0] ?? "") as TableName;
}

function rowValue(row: Record<string, unknown>, column: string): unknown {
  return row[column.split(".")[1] ?? column];
}

function matches(row: Record<string, unknown>, clause: Clause | null): boolean {
  if (!clause) return true;
  if (clause.kind === "and") return clause.clauses.every((item) => matches(row, item));
  if (clause.kind === "eq") return rowValue(row, clause.column) === clause.value;
  return rowValue(row, clause.column) == null;
}

function rowsFor(table: Record<string, unknown>): Array<Record<string, unknown>> {
  switch (tableName(table)) {
    case "adminUsers":
      return [...state.users.values()] as Array<Record<string, unknown>>;
    case "adminInvites":
      return [...state.invites.values()] as Array<Record<string, unknown>>;
    case "clients":
      return state.clients;
    case "medicalHistory":
      return [];
    default:
      return [];
  }
}

function project(
  row: Record<string, unknown>,
  selection?: Record<string, string>,
): Record<string, unknown> {
  if (!selection) return { ...row };
  return Object.fromEntries(
    Object.entries(selection).map(([key, column]) => [key, rowValue(row, column)]),
  );
}

function queryBuilder(
  table: Record<string, unknown>,
  selection?: Record<string, string>,
) {
  let clause: Clause | null = null;
  const builder = {
    where(nextClause: Clause) {
      clause = nextClause;
      return builder;
    },
    limit(_count: number) {
      return builder;
    },
    orderBy(..._columns: unknown[]) {
      return builder;
    },
    leftJoin(..._args: unknown[]) {
      return builder;
    },
    then(
      resolve: (value: Array<Record<string, unknown>>) => unknown,
      reject?: (reason: unknown) => unknown,
    ) {
      try {
        const result = rowsFor(table)
          .filter((row) => matches(row, clause))
          .map((row) => project(row, selection));
        return Promise.resolve(resolve(result));
      } catch (error) {
        return reject ? Promise.resolve(reject(error)) : Promise.reject(error);
      }
    },
  };
  return builder;
}

function updateBuilder(table: Record<string, unknown>) {
  return {
    set(values: Record<string, unknown>) {
      let clause: Clause | null = null;
      let executed = false;
      let result: Array<Record<string, unknown>> = [];

      const execute = () => {
        if (executed) return result;
        executed = true;
        const rows = rowsFor(table);
        const changed = rows.filter((row) => matches(row, clause));
        changed.forEach((row) => Object.assign(row, values));
        result = changed.map((row) => ({ ...row }));
        return result;
      };

      const whereBuilder = {
        where(nextClause: Clause) {
          clause = nextClause;
          return whereBuilder;
        },
        returning(selection?: Record<string, string>) {
          return Promise.resolve(execute().map((row) => project(row, selection)));
        },
        then(
          resolve: (value: undefined) => unknown,
          reject?: (reason: unknown) => unknown,
        ) {
          try {
            execute();
            return Promise.resolve(resolve(undefined));
          } catch (error) {
            return reject ? Promise.resolve(reject(error)) : Promise.reject(error);
          }
        },
      };

      return {
        where(nextClause: Clause) {
          clause = nextClause;
          return whereBuilder;
        },
      };
    },
  };
}

function insertBuilder(table: Record<string, unknown>) {
  return {
    values(values: Record<string, unknown>) {
      return {
        returning() {
          if (tableName(table) === "clients") {
            state.clientInsertCalls += 1;
            const client = {
              ...values,
              id: state.nextClientId++,
              createdAt: new Date(),
            };
            state.clients.push(client);
            return Promise.resolve([client]);
          }
          return Promise.resolve([]);
        },
      };
    },
  };
}

vi.mock("@workspace/db", () => ({
  db: {
    select: (selection?: Record<string, string>) => ({
      from: (table: Record<string, unknown>) => queryBuilder(table, selection),
    }),
    update: (table: Record<string, unknown>) => updateBuilder(table),
    insert: (table: Record<string, unknown>) => insertBuilder(table),
  },
  ...state.tables,
}));

vi.mock("drizzle-orm", () => ({
  and: (...clauses: Clause[]) => ({ kind: "and", clauses }),
  eq: (column: string, value: unknown) => ({ kind: "eq", column, value }),
  isNull: (column: string) => ({ kind: "isNull", column }),
  asc: () => null,
  gte: () => null,
  ilike: () => null,
  lte: () => null,
  or: () => null,
  sql: () => null,
}));

vi.mock("../lib/email", () => ({
  sendAdminInviteEmail: vi.fn().mockResolvedValue(true),
}));

let server: Server;
let baseUrl: string;
let app: typeof import("../app").default;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function seedUser(overrides: Partial<UserRow> = {}): UserRow {
  const user: UserRow = {
    id: 1,
    email: "invited@example.com",
    role: "viewer",
    active: false,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    lastLoginAt: null,
    ...overrides,
  };
  state.users.set(user.id, user);
  return user;
}

function seedInvite(
  token: string,
  overrides: Partial<InviteRow> = {},
): InviteRow {
  const invite: InviteRow = {
    id: state.invites.size + 1,
    email: "invited@example.com",
    role: "viewer",
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    usedAt: null,
    createdAt: new Date("2026-09-17T00:00:00.000Z"),
    ...overrides,
  };
  state.invites.set(invite.id, invite);
  return invite;
}

function resetState(): void {
  state.users.clear();
  state.invites.clear();
  state.clients.length = 0;
  state.nextClientId = 1;
  state.clientInsertCalls = 0;
}

function extractCookie(response: Response): string | undefined {
  const headers = response.headers as Headers & {
    getSetCookie?: () => string[];
  };
  const raw = headers.getSetCookie?.()[0] ?? headers.get("set-cookie");
  return raw?.split(";")[0];
}

async function request(
  path: string,
  options: { method?: string; body?: unknown; cookie?: string } = {},
): Promise<{ response: Response; body: unknown; cookie?: string }> {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers["content-type"] = "application/json";
  if (options.cookie) headers.cookie = options.cookie;

  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const text = await response.text();
  let body: unknown = text;
  try {
    body = text ? JSON.parse(text) : undefined;
  } catch {
    // Keep non-JSON responses as text.
  }
  return { response, body, cookie: extractCookie(response) };
}

async function acceptInvite(token: string): Promise<string> {
  const result = await request("/api/auth/accept", {
    method: "POST",
    body: { token },
  });
  expect(result.response.status).toBe(200);
  expect(result.cookie).toBeDefined();
  return result.cookie!;
}

async function ownerCookie(): Promise<string> {
  const result = await request("/api/auth/login", {
    method: "POST",
    body: { password: "owner-password" },
  });
  expect(result.response.status).toBe(200);
  expect(result.cookie).toBeDefined();
  return result.cookie!;
}

beforeAll(async () => {
  process.env.ADMIN_PASSWORD = "owner-password";
  process.env.SESSION_SECRET = "test-session-secret";
  process.env.NODE_ENV = "test";
  ({ default: app } = await import("../app"));
  server = createServer(app);
  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Test server did not start");
  baseUrl = `http://127.0.0.1:${address.port}`;
});

afterAll(async () => {
  if (!server) return;
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

beforeEach(() => {
  resetState();
});

describe("admin invitation and access security", () => {
  it("signs in an invited email with the invitation role and consumes the link", async () => {
    seedUser({ role: "viewer" });
    const token = "valid-viewer-token";
    const invite = seedInvite(token, { role: "editor" });

    const cookie = await acceptInvite(token);
    const me = await request("/api/auth/me", { cookie });

    expect(me.response.status).toBe(200);
    expect(me.body).toEqual({
      authenticated: true,
      role: "editor",
      email: "invited@example.com",
    });
    expect(state.users.get(1)?.active).toBe(true);
    expect(state.users.get(1)?.role).toBe("editor");
    expect(state.invites.get(invite.id)?.usedAt).toBeInstanceOf(Date);
  });

  it.each([
    ["expired", new Date(Date.now() - 1), null],
    ["already-used", new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), new Date()],
  ])("rejects an %s invitation link", async (_label, expiresAt, usedAt) => {
    seedUser();
    const token = `invalid-${String(_label)}`;
    seedInvite(token, { expiresAt, usedAt });

    const result = await request("/api/auth/accept", {
      method: "POST",
      body: { token },
    });

    expect(result.response.status).toBe(401);
    expect(result.body).toEqual({
      error: "This invitation is invalid or has expired",
    });
    expect(state.users.get(1)?.active).toBe(false);
  });

  it("keeps viewers read-only and lets editors write practice data", async () => {
    seedUser({ role: "viewer" });
    const viewerToken = "viewer-token";
    seedInvite(viewerToken, { role: "viewer" });
    const viewerCookie = await acceptInvite(viewerToken);

    const viewerWrite = await request("/api/clients", {
      method: "POST",
      cookie: viewerCookie,
      body: {
        firstName: "Viewer",
        lastName: "Blocked",
        email: "blocked@example.com",
        phone: "+41 78 000 00 00",
      },
    });

    expect(viewerWrite.response.status).toBe(403);
    expect(viewerWrite.body).toEqual({ error: "Read-only access" });
    expect(state.clientInsertCalls).toBe(0);

    resetState();
    seedUser({ role: "editor" });
    const editorToken = "editor-token";
    seedInvite(editorToken, { role: "editor" });
    const editorCookie = await acceptInvite(editorToken);

    const editorWrite = await request("/api/clients", {
      method: "POST",
      cookie: editorCookie,
      body: {
        firstName: "Editor",
        lastName: "Allowed",
        email: "editor@example.com",
        phone: "+41 78 000 00 01",
      },
    });
    const adminRead = await request("/api/admin/users", { cookie: editorCookie });

    expect(editorWrite.response.status).toBe(201);
    expect(state.clientInsertCalls).toBe(1);
    expect(adminRead.response.status).toBe(403);
    expect(adminRead.body).toEqual({ error: "Owner access required" });
  });

  it("revoking a user invalidates active sessions and unused invitations", async () => {
    seedUser({ role: "editor", active: false });
    const loginToken = "login-token";
    seedInvite(loginToken, { role: "editor" });
    const invitedCookie = await acceptInvite(loginToken);

    const unusedToken = "unused-token";
    const unusedInvite = seedInvite(unusedToken, {
      role: "editor",
      email: "invited@example.com",
    });
    const owner = await ownerCookie();
    const revoke = await request("/api/admin/users/1", {
      method: "DELETE",
      cookie: owner,
    });

    expect(revoke.response.status).toBe(204);
    expect(state.users.get(1)?.active).toBe(false);
    expect(state.invites.get(unusedInvite.id)?.usedAt).toBeInstanceOf(Date);

    const activeSession = await request("/api/auth/me", { cookie: invitedCookie });
    expect(activeSession.body).toEqual({ authenticated: false });

    const revokedInvite = await request("/api/auth/accept", {
      method: "POST",
      body: { token: unusedToken },
    });
    expect(revokedInvite.response.status).toBe(401);
    expect(revokedInvite.body).toEqual({
      error: "This invitation is invalid or has expired",
    });
  });
});