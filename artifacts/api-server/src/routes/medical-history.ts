import { Router } from "express";
import { db } from "@workspace/db";
import { medicalHistoryTable, clientsTable, appointmentsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import {
  CreateMedicalHistoryBody,
  UpdateMedicalHistoryBody,
} from "@workspace/api-zod";
import { sendNewClientThankYouEmail, sendReturningClientThankYouEmail } from "../lib/email";
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

  // Check if client has any prior medical history (determines new vs returning)
  const priorHistory = await db
    .select({ id: medicalHistoryTable.id })
    .from(medicalHistoryTable)
    .where(eq(medicalHistoryTable.clientId, clientId));
  const isNewClient = priorHistory.length === 0;

  const gdprAcceptedAt = new Date();
  const [record] = await db
    .insert(medicalHistoryTable)
    .values({ ...body.data, clientId, gdprAcceptedAt })
    .returning();

  // Schedule email 2 hours after form save — fire and forget
  const TWO_HOURS = 2 * 60 * 60 * 1000;
  const baseUrl = `${req.protocol}://${req.get("host")}`;

  setTimeout(async () => {
    try {
      const [client] = await db.select().from(clientsTable).where(eq(clientsTable.id, clientId));
      if (!client?.email) return;

      const firstName = client.firstName;
      const toEmail = client.email;

      if (isNewClient) {
        // Try to find a review link from their most recent appointment
        const appts = await db
          .select({ id: appointmentsTable.id })
          .from(appointmentsTable)
          .where(eq(appointmentsTable.clientId, clientId))
          .orderBy(desc(appointmentsTable.date))
          .limit(1);

        const reviewUrl = appts.length > 0
          ? `${baseUrl}/review?appointmentId=${appts[0]!.id}`
          : undefined;

        await sendNewClientThankYouEmail({ toEmail, toName: firstName, reviewUrl });
      } else {
        await sendReturningClientThankYouEmail({ toEmail, toName: firstName });
      }
    } catch (err) {
      logger.error({ err, clientId }, "Error sending scheduled form thank-you email");
    }
  }, TWO_HOURS);

  logger.info({ clientId, isNewClient, scheduledIn: "2h" }, "Thank-you email scheduled after form save");

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
