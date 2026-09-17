import { Router } from "express";
import { and, eq, isNull } from "drizzle-orm";
import { createHash } from "node:crypto";
import { adminInvitesTable, adminUsersTable, db } from "@workspace/db";
import { logger } from "../lib/logger.js";
import {
  clearSessionCookie,
  getSession,
  setSessionCookie,
} from "../lib/auth-session.js";

const router = Router();

function hashInviteToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

router.get("/me", (req, res) => {
  getSession(req)
    .then((session) => {
      if (!session) {
        res.json({ authenticated: false });
        return;
      }
      res.json({
        authenticated: true,
        role: session.role,
        email: session.email,
      });
    })
    .catch(() => res.status(500).json({ error: "Unable to read session" }));
});

router.post("/login", (req, res) => {
  const { password } = req.body as { password?: string };
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    logger.error("ADMIN_PASSWORD secret is not set");
    res.status(500).json({ error: "Server misconfiguration" });
    return;
  }

  if (password === adminPassword) {
    setSessionCookie(res, "owner");
    res.json({ ok: true });
  } else {
    res.status(401).json({ error: "Wrong password" });
  }
});

router.post("/logout", (_req, res) => {
  clearSessionCookie(res);
  res.json({ ok: true });
});

router.post("/accept", async (req, res) => {
  const token = typeof req.body?.token === "string" ? req.body.token.trim() : "";
  if (!token) {
    res.status(400).json({ error: "Invitation token is required" });
    return;
  }

  const [invite] = await db
    .select()
    .from(adminInvitesTable)
    .where(
      and(
        eq(adminInvitesTable.tokenHash, hashInviteToken(token)),
        isNull(adminInvitesTable.usedAt),
      ),
    )
    .limit(1);

  if (!invite || invite.expiresAt <= new Date()) {
    res.status(401).json({ error: "This invitation is invalid or has expired" });
    return;
  }

  const [user] = await db
    .update(adminUsersTable)
    .set({ active: true, role: invite.role, lastLoginAt: new Date() })
    .where(eq(adminUsersTable.email, invite.email))
    .returning();

  if (!user || (user.role !== "viewer" && user.role !== "editor")) {
    res.status(401).json({ error: "This invitation is no longer active" });
    return;
  }

  await db
    .update(adminInvitesTable)
    .set({ usedAt: new Date() })
    .where(eq(adminInvitesTable.id, invite.id));

  setSessionCookie(res, `user:${user.id}`);
  res.json({ ok: true, role: user.role });
});

export default router;
