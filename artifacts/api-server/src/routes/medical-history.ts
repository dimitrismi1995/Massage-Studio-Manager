import { Router } from "express";
import { db } from "@workspace/db";
import { medicalHistoryTable, clientsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  CreateMedicalHistoryBody,
  UpdateMedicalHistoryBody,
} from "@workspace/api-zod";
import { sendThankYouEmail } from "../lib/email";
import { logger } from "../lib/logger";

const router = Router({ mergeParams: true });

function getClientId(params: Record<string, string>): number {
  return Number(params["clientId"]);
}

// GET /clients/:clientId/medical-history
router.get("/", async (req, res) => {
  const clientId = getClientId(req.params as Record<string, string>);
  if (!clientId) { res.status(400).json({ error: "Invalid clientId" }); return; }

  const rows = await db
    .select()
    .from(medicalHistoryTable)
    .where(eq(medicalHistoryTable.clientId, clientId))
    .orderBy(medicalHistoryTable.createdAt);

  if (rows.length === 0) { res.status(404).json({ error: "No medical history found" }); return; }
  const record = rows[rows.length - 1]!;
  res.json({
    ...record,
    gdprAcceptedAt: record.gdprAcceptedAt ? record.gdprAcceptedAt.toISOString() : null,
    createdAt: record.createdAt.toISOString(),
  });
});

// POST /clients/:clientId/medical-history
router.post("/", async (req, res) => {
  const clientId = getClientId(req.params as Record<string, string>);
  if (!clientId) { res.status(400).json({ error: "Invalid clientId" }); return; }

  const body = CreateMedicalHistoryBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: "Invalid input" }); return; }

  if (!body.data.gdprAccepted) {
    res.status(400).json({ error: "GDPR consent is required" });
    return;
  }

  const gdprAcceptedAt = new Date();
  const [record] = await db
    .insert(medicalHistoryTable)
    .values({ ...body.data, clientId, gdprAcceptedAt })
    .returning();

  // Schedule email 2 hours after form save
  const DELAY = 2 * 60 * 60 * 1000;
  // Use the public-facing domain from env; fall back to request host as last resort
  const baseUrl = process.env.REPLIT_DOMAINS
    ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}`
    : `${req.protocol}://${req.get("host")}`;

  setTimeout(async () => {
    try {
      const [client] = await db.select().from(clientsTable).where(eq(clientsTable.id, clientId));
      if (!client?.email) return;

      const firstName = client.firstName;
      const toEmail = client.email;

      await sendThankYouEmail({ toEmail, toName: firstName, clientId, baseUrl });
    } catch (err) {
      logger.error({ err, clientId }, "Error sending scheduled form thank-you email");
    }
  }, DELAY);

  logger.info({ clientId, scheduledIn: "2h", baseUrl }, "Thank-you email scheduled after form save");

  res.status(201).json({
    ...record,
    gdprAcceptedAt: record!.gdprAcceptedAt ? record!.gdprAcceptedAt.toISOString() : null,
    createdAt: record!.createdAt.toISOString(),
  });
});

// PATCH /clients/:clientId/medical-history/:historyId
router.patch("/:historyId", async (req, res) => {
  const p = req.params as Record<string, string>;
  const clientId = getClientId(p);
  const historyId = Number(p["historyId"]);
  if (!clientId || !historyId) { res.status(400).json({ error: "Invalid params" }); return; }

  const body = UpdateMedicalHistoryBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: "Invalid input" }); return; }

  const [record] = await db
    .update(medicalHistoryTable)
    .set(body.data)
    .where(
      and(
        eq(medicalHistoryTable.id, historyId),
        eq(medicalHistoryTable.clientId, clientId),
      ),
    )
    .returning();
  if (!record) { res.status(404).json({ error: "Not found" }); return; }
  res.json({
    ...record,
    gdprAcceptedAt: record.gdprAcceptedAt ? record.gdprAcceptedAt.toISOString() : null,
    createdAt: record.createdAt.toISOString(),
  });
});

export default router;
