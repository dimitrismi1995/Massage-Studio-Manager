import { Router } from "express";
import { and, asc, eq, isNull } from "drizzle-orm";
import { randomBytes, createHash } from "node:crypto";
import { adminInvitesTable, adminUsersTable, db } from "@workspace/db";
import { requireOwner } from "../middleware/requireAuth.js";
import { sendAdminInviteEmail } from "../lib/email.js";

const router = Router();
const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function getBaseUrl(req: { protocol: string; get(name: string): string | undefined }): string {
  const configured = process.env.REPLIT_DOMAINS?.split(",")[0]?.trim();
  if (configured) return `https://${configured}`.replace(/\/$/, "");
  const forwardedProto = req.get("x-forwarded-proto")?.split(",")[0]?.trim() || req.protocol;
  return `${forwardedProto}://${req.get("host")}`.replace(/\/$/, "");
}

function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

router.use(requireOwner);

router.get("/users", async (_req, res) => {
  const users = await db
    .select({
      id: adminUsersTable.id,
      email: adminUsersTable.email,
      role: adminUsersTable.role,
      active: adminUsersTable.active,
      createdAt: adminUsersTable.createdAt,
      lastLoginAt: adminUsersTable.lastLoginAt,
    })
    .from(adminUsersTable)
    .orderBy(asc(adminUsersTable.createdAt));
  res.json(users);
});

router.post("/users", async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const role = req.body?.role;
  if (!email || (role !== "viewer" && role !== "editor")) {
    res.status(400).json({ error: "A valid email and access level are required" });
    return;
  }

  const [user] = await db
    .insert(adminUsersTable)
    .values({ email, role, active: true })
    .onConflictDoUpdate({
      target: adminUsersTable.email,
      set: { role, active: true },
    })
    .returning({
      id: adminUsersTable.id,
      email: adminUsersTable.email,
      role: adminUsersTable.role,
      active: adminUsersTable.active,
      createdAt: adminUsersTable.createdAt,
      lastLoginAt: adminUsersTable.lastLoginAt,
    });

  if (!user) {
    res.status(500).json({ error: "Unable to create user" });
    return;
  }

  // A new invitation invalidates any earlier unused link for this email.
  await db
    .update(adminInvitesTable)
    .set({ usedAt: new Date() })
    .where(and(eq(adminInvitesTable.email, email), isNull(adminInvitesTable.usedAt)));

  const token = randomBytes(32).toString("hex");
  await db.insert(adminInvitesTable).values({
    email,
    role,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + INVITE_TTL_MS),
  });

  const inviteUrl = `${getBaseUrl(req)}/?adminToken=${encodeURIComponent(token)}`;
  const sent = await sendAdminInviteEmail({ toEmail: email, role, inviteUrl });
  if (!sent) {
    res.status(502).json({
      error: "The user was saved, but the invitation email could not be sent",
      user,
    });
    return;
  }

  res.status(201).json({ user, invitationSent: true });
});

router.patch("/users/:id", async (req, res) => {
  const id = Number(req.params.id);
  const role = req.body?.role;
  if (!Number.isInteger(id) || id < 1 || (role !== "viewer" && role !== "editor")) {
    res.status(400).json({ error: "A valid user and access level are required" });
    return;
  }

  const [user] = await db
    .update(adminUsersTable)
    .set({ role })
    .where(eq(adminUsersTable.id, id))
    .returning({
      id: adminUsersTable.id,
      email: adminUsersTable.email,
      role: adminUsersTable.role,
      active: adminUsersTable.active,
      createdAt: adminUsersTable.createdAt,
      lastLoginAt: adminUsersTable.lastLoginAt,
    });

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  await db
    .update(adminInvitesTable)
    .set({ usedAt: new Date() })
    .where(
      and(
        eq(adminInvitesTable.email, user.email),
        isNull(adminInvitesTable.usedAt),
      ),
    );
  res.json(user);
});

router.delete("/users/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    res.status(400).json({ error: "Invalid user" });
    return;
  }

  const [user] = await db
    .update(adminUsersTable)
    .set({ active: false })
    .where(eq(adminUsersTable.id, id))
    .returning({ id: adminUsersTable.id });

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  const [revokedUser] = await db
    .select({ email: adminUsersTable.email })
    .from(adminUsersTable)
    .where(eq(adminUsersTable.id, id))
    .limit(1);
  if (revokedUser) {
    await db
      .update(adminInvitesTable)
      .set({ usedAt: new Date() })
      .where(
        and(
          eq(adminInvitesTable.email, revokedUser.email),
          isNull(adminInvitesTable.usedAt),
        ),
      );
  }
  res.status(204).send();
});

export default router;