import { Router } from "express";
import { db } from "@workspace/db";
import { clientsTable, medicalHistoryTable } from "@workspace/db";
import { eq, ilike, or } from "drizzle-orm";
import {
  ListClientsQueryParams,
  CreateClientBody,
  GetClientParams,
  UpdateClientParams,
  UpdateClientBody,
  DeleteClientParams,
} from "@workspace/api-zod";

const router = Router();

// GET /clients
router.get("/", async (req, res) => {
  const parsed = ListClientsQueryParams.safeParse(req.query);
  const search = parsed.success ? parsed.data.search : undefined;

  const clients = await db.select().from(clientsTable).orderBy(clientsTable.createdAt);

  let filtered = clients;
  if (search) {
    const s = search.toLowerCase();
    filtered = clients.filter(
      (c) =>
        c.firstName.toLowerCase().includes(s) ||
        c.lastName.toLowerCase().includes(s) ||
        c.email.toLowerCase().includes(s) ||
        c.phone.includes(s),
    );
  }

  // Check which clients have medical history
  const historyRows = await db.select({ clientId: medicalHistoryTable.clientId }).from(medicalHistoryTable);
  const historySet = new Set(historyRows.map((h) => h.clientId));

  const result = filtered.map((c) => ({ ...c, hasMedicalHistory: historySet.has(c.id) }));
  res.json(result);
});

// POST /clients
router.post("/", async (req, res) => {
  const parsed = CreateClientBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [client] = await db.insert(clientsTable).values(parsed.data).returning();
  const historyRows = await db.select({ clientId: medicalHistoryTable.clientId }).from(medicalHistoryTable).where(eq(medicalHistoryTable.clientId, client.id));
  res.status(201).json({ ...client, hasMedicalHistory: historyRows.length > 0 });
});

// GET /clients/:clientId
router.get("/:clientId", async (req, res) => {
  const parsed = GetClientParams.safeParse({ clientId: Number(req.params.clientId) });
  if (!parsed.success) { res.status(400).json({ error: "Invalid id" }); return; }

  const [client] = await db.select().from(clientsTable).where(eq(clientsTable.id, parsed.data.clientId));
  if (!client) { res.status(404).json({ error: "Not found" }); return; }

  const historyRows = await db.select({ clientId: medicalHistoryTable.clientId }).from(medicalHistoryTable).where(eq(medicalHistoryTable.clientId, client.id));
  res.json({ ...client, hasMedicalHistory: historyRows.length > 0 });
});

// PATCH /clients/:clientId
router.patch("/:clientId", async (req, res) => {
  const params = UpdateClientParams.safeParse({ clientId: Number(req.params.clientId) });
  const body = UpdateClientBody.safeParse(req.body);
  if (!params.success || !body.success) { res.status(400).json({ error: "Invalid input" }); return; }

  const [client] = await db
    .update(clientsTable)
    .set(body.data)
    .where(eq(clientsTable.id, params.data.clientId))
    .returning();
  if (!client) { res.status(404).json({ error: "Not found" }); return; }

  const historyRows = await db.select({ clientId: medicalHistoryTable.clientId }).from(medicalHistoryTable).where(eq(medicalHistoryTable.clientId, client.id));
  res.json({ ...client, hasMedicalHistory: historyRows.length > 0 });
});

// DELETE /clients/:clientId
router.delete("/:clientId", async (req, res) => {
  const parsed = DeleteClientParams.safeParse({ clientId: Number(req.params.clientId) });
  if (!parsed.success) { res.status(400).json({ error: "Invalid id" }); return; }

  await db.delete(clientsTable).where(eq(clientsTable.id, parsed.data.clientId));
  res.status(204).send();
});

export default router;
