import { Request, Response, NextFunction } from "express";

const COOKIE = "mmm_auth";

// Only these are allowed without a valid session cookie
const PUBLIC: Array<{ method: string; re: RegExp }> = [
  { method: "GET",  re: /^\/health/ },
  { method: "GET",  re: /^\/auth\// },
  { method: "POST", re: /^\/auth\// },
];

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const isPublic = PUBLIC.some(
    (r) => r.method === req.method && r.re.test(req.path),
  );
  if (isPublic) { next(); return; }

  if (req.signedCookies?.[COOKIE] === "1") { next(); return; }

  res.status(401).json({ error: "Unauthorized" });
}
