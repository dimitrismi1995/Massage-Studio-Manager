import { Router } from "express";
import { db } from "@workspace/db";
import { medicalHistoryTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  CreateMedicalHistoryBody,
  UpdateMedicalHistoryBody,
} from "@workspace/api-zod";

// mergeParams: true merges parent route params at runtime, but TS types on
// sub-routers don't reflect that automatically — access via record cast.
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

  // Server-side GDPR enforcement: reject if consent not given
  if (!body.data.gdprAccepted) {
    res.status(400).json({ error: "GDPR consent is required" });
    return;
  }

  const gdprAcceptedAt = new Date();
  const [record] = await db
    .insert(medicalHistoryTable)
    .values({ ...body.data, clientId, gdprAcceptedAt })
    .returning();
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
