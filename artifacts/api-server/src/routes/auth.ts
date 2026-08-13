import { Router } from "express";
import { logger } from "../lib/logger.js";

const router = Router();
const COOKIE = "mmm_auth";
const MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days

router.get("/me", (req, res) => {
  res.json({ authenticated: req.signedCookies?.[COOKIE] === "1" });
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
    res.cookie(COOKIE, "1", {
      signed: true,
      httpOnly: true,
      sameSite: "lax",
      maxAge: MAX_AGE,
      secure: process.env.NODE_ENV === "production",
    });
    res.json({ ok: true });
  } else {
    res.status(401).json({ error: "Wrong password" });
  }
});

router.post("/logout", (_req, res) => {
  res.clearCookie(COOKIE);
  res.json({ ok: true });
});

export default router;
