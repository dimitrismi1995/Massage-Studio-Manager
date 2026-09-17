import { Request, Response, NextFunction } from "express";
import { getSession, type AuthSession } from "../lib/auth-session";

// Only these are allowed without a valid session cookie
const PUBLIC: Array<{ method: string; re: RegExp }> = [
  { method: "GET",  re: /^\/health/ },
  { method: "GET",  re: /^\/auth\// },
  { method: "POST", re: /^\/auth\// },
];

declare global {
  namespace Express {
    interface Request {
      adminSession?: AuthSession;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const isPublic = PUBLIC.some(
    (r) => r.method === req.method && r.re.test(req.path),
  );
  if (isPublic) { next(); return; }

  const session = await getSession(req);
  if (!session) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  req.adminSession = session;
  if (!["GET", "HEAD", "OPTIONS"].includes(req.method) && session.role === "viewer") {
    res.status(403).json({ error: "Read-only access" });
    return;
  }
  next();
}

export function requireOwner(req: Request, res: Response, next: NextFunction): void {
  if (req.adminSession?.role === "owner") {
    next();
    return;
  }
  res.status(403).json({ error: "Owner access required" });
}
