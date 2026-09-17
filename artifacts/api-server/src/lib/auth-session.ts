import type { Request, Response } from "express";
import { and, eq } from "drizzle-orm";
import { adminUsersTable, db } from "@workspace/db";

export const AUTH_COOKIE = "mmm_auth";
export const OWNER_SESSION = "owner";
export const MAX_AGE = 30 * 24 * 60 * 60 * 1000;

export type AuthSession =
  | { role: "owner"; email: string | null; userId: null }
  | { role: "editor" | "viewer"; email: string; userId: number };

export async function getSession(req: Request): Promise<AuthSession | null> {
  const value = req.signedCookies?.[AUTH_COOKIE];
  if (!value) return null;

  if (value === OWNER_SESSION) {
    return {
      role: "owner",
      email: process.env.ADMIN_EMAIL?.trim().toLowerCase() || null,
      userId: null,
    };
  }

  if (!value.startsWith("user:")) return null;
  const userId = Number(value.slice("user:".length));
  if (!Number.isInteger(userId) || userId < 1) return null;

  const [user] = await db
    .select({
      id: adminUsersTable.id,
      email: adminUsersTable.email,
      role: adminUsersTable.role,
    })
    .from(adminUsersTable)
    .where(and(eq(adminUsersTable.id, userId), eq(adminUsersTable.active, true)))
    .limit(1);

  if (!user || (user.role !== "viewer" && user.role !== "editor")) return null;
  return { role: user.role, email: user.email, userId: user.id };
}

export function setSessionCookie(res: Response, value: string): void {
  res.cookie(AUTH_COOKIE, value, {
    signed: true,
    httpOnly: true,
    sameSite: "lax",
    maxAge: MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(AUTH_COOKIE, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}
