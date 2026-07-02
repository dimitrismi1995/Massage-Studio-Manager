import { Router } from "express";
import { db } from "@workspace/db";
import { appointmentsTable, clientsTable, reviewsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  ListAppointmentsQueryParams,
  CreateAppointmentBody,
  GetAppointmentParams,
  UpdateAppointmentParams,
  UpdateAppointmentBody,
  DeleteAppointmentParams,
  CompleteAppointmentParams,
  CancelAppointmentParams,
} from "@workspace/api-zod";
import { sendThankYouEmail } from "../lib/email";
import { logger } from "../lib/logger";

const router = Router();

async function enrichAppointment(appt: typeof appointmentsTable.$inferSelect) {
  const [client] = await db.select().from(clientsTable).where(eq(clientsTable.id, appt.clientId));
  return {
    ...appt,
    clientName: client ? `${client.firstName} ${client.lastName}` : null,
    clientEmail: client?.email ?? null,
  };
}

// GET /appointments
router.get("/", async (req, res) => {
  const parsed = ListAppointmentsQueryParams.safeParse(req.query);
  const params = parsed.success ? parsed.data : {};

  const all = await db
    .select({
      id: appointmentsTable.id,
      clientId: appointmentsTable.clientId,
      date: appointmentsTable.date,
      startTime: appointmentsTable.startTime,
      endTime: appointmentsTable.endTime,
      durationMinutes: appointmentsTable.durationMinutes,
      serviceType: appointmentsTable.serviceType,
      status: appointmentsTable.status,
      price: appointmentsTable.price,
      notes: appointmentsTable.notes,
      completedAt: appointmentsTable.completedAt,
      emailScheduledFor: appointmentsTable.emailScheduledFor,
      emailSentAt: appointmentsTable.emailSentAt,
      createdAt: appointmentsTable.createdAt,
      firstName: clientsTable.firstName,
      lastName: clientsTable.lastName,
      email: clientsTable.email,
    })
    .from(appointmentsTable)
    .leftJoin(clientsTable, eq(appointmentsTable.clientId, clientsTable.id))
    .orderBy(appointmentsTable.date, appointmentsTable.startTime);

  let filtered = all.map((a) => ({
    id: a.id,
    clientId: a.clientId,
    clientName: a.firstName && a.lastName ? `${a.firstName} ${a.lastName}` : null,
    clientEmail: a.email ?? null,
    date: a.date,
    startTime: a.startTime,
    endTime: a.endTime,
    durationMinutes: a.durationMinutes,
    serviceType: a.serviceType,
    status: a.status,
    price: a.price,
    notes: a.notes,
    completedAt: a.completedAt ? a.completedAt.toISOString() : null,
    emailScheduledFor: a.emailScheduledFor ? a.emailScheduledFor.toISOString() : null,
    emailSentAt: a.emailSentAt ? a.emailSentAt.toISOString() : null,
    createdAt: a.createdAt.toISOString(),
  }));

  if (params.date) {
    filtered = filtered.filter((a) => a.date === params.date);
  }
  if (params.status) {
    filtered = filtered.filter((a) => a.status === params.status);
  }
  if (params.clientId) {
    filtered = filtered.filter((a) => a.clientId === params.clientId);
  }

  res.json(filtered);
});

// POST /appointments
router.post("/", async (req, res) => {
  const parsed = CreateAppointmentBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [appt] = await db.insert(appointmentsTable).values(parsed.data).returning();
  const enriched = await enrichAppointment(appt);
  res.status(201).json({
    ...enriched,
    completedAt: enriched.completedAt ? enriched.completedAt.toISOString() : null,
    emailScheduledFor: enriched.emailScheduledFor ? enriched.emailScheduledFor.toISOString() : null,
    emailSentAt: enriched.emailSentAt ? enriched.emailSentAt.toISOString() : null,
    createdAt: enriched.createdAt.toISOString(),
  });
});

// GET /appointments/:appointmentId
router.get("/:appointmentId", async (req, res) => {
  const parsed = GetAppointmentParams.safeParse({ appointmentId: Number(req.params.appointmentId) });
  if (!parsed.success) { res.status(400).json({ error: "Invalid id" }); return; }

  const [appt] = await db.select().from(appointmentsTable).where(eq(appointmentsTable.id, parsed.data.appointmentId));
  if (!appt) { res.status(404).json({ error: "Not found" }); return; }

  const enriched = await enrichAppointment(appt);
  res.json({
    ...enriched,
    completedAt: enriched.completedAt ? enriched.completedAt.toISOString() : null,
    emailScheduledFor: enriched.emailScheduledFor ? enriched.emailScheduledFor.toISOString() : null,
    emailSentAt: enriched.emailSentAt ? enriched.emailSentAt.toISOString() : null,
    createdAt: enriched.createdAt.toISOString(),
  });
});

// PATCH /appointments/:appointmentId
router.patch("/:appointmentId", async (req, res) => {
  const params = UpdateAppointmentParams.safeParse({ appointmentId: Number(req.params.appointmentId) });
  const body = UpdateAppointmentBody.safeParse(req.body);
  if (!params.success || !body.success) { res.status(400).json({ error: "Invalid input" }); return; }

  const [appt] = await db
    .update(appointmentsTable)
    .set(body.data)
    .where(eq(appointmentsTable.id, params.data.appointmentId))
    .returning();
  if (!appt) { res.status(404).json({ error: "Not found" }); return; }

  const enriched = await enrichAppointment(appt);
  res.json({
    ...enriched,
    completedAt: enriched.completedAt ? enriched.completedAt.toISOString() : null,
    emailScheduledFor: enriched.emailScheduledFor ? enriched.emailScheduledFor.toISOString() : null,
    emailSentAt: enriched.emailSentAt ? enriched.emailSentAt.toISOString() : null,
    createdAt: enriched.createdAt.toISOString(),
  });
});

// DELETE /appointments/:appointmentId
router.delete("/:appointmentId", async (req, res) => {
  const parsed = DeleteAppointmentParams.safeParse({ appointmentId: Number(req.params.appointmentId) });
  if (!parsed.success) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(appointmentsTable).where(eq(appointmentsTable.id, parsed.data.appointmentId));
  res.status(204).send();
});

// POST /appointments/:appointmentId/complete
router.post("/:appointmentId/complete", async (req, res) => {
  const parsed = CompleteAppointmentParams.safeParse({ appointmentId: Number(req.params.appointmentId) });
  if (!parsed.success) { res.status(400).json({ error: "Invalid id" }); return; }

  const now = new Date();
  // Schedule email 20 minutes after completion
  const emailScheduledFor = new Date(now.getTime() + 20 * 60 * 1000);

  const [appt] = await db
    .update(appointmentsTable)
    .set({ status: "completed", completedAt: now, emailScheduledFor })
    .where(eq(appointmentsTable.id, parsed.data.appointmentId))
    .returning();
  if (!appt) { res.status(404).json({ error: "Not found" }); return; }

  // Create a review record for this appointment
  const existingReview = await db.select().from(reviewsTable).where(eq(reviewsTable.appointmentId, appt.id));
  if (existingReview.length === 0) {
    await db.insert(reviewsTable).values({ appointmentId: appt.id, clientId: appt.clientId });
  }

  // Get client info and attempt to send email asynchronously
  const [client] = await db.select().from(clientsTable).where(eq(clientsTable.id, appt.clientId));
  if (client?.email) {
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    // Fire and forget — email is scheduled
    setTimeout(async () => {
      try {
        const sent = await sendThankYouEmail({
          toEmail: client.email,
          toName: `${client.firstName}`,
          appointmentId: appt.id,
          serviceType: appt.serviceType,
          reviewBaseUrl: `${baseUrl}/reviews`,
          language: "en",
        });
        if (sent) {
          await db
            .update(appointmentsTable)
            .set({ emailSentAt: new Date() })
            .where(eq(appointmentsTable.id, appt.id));
        }
      } catch (err) {
        logger.error({ err }, "Error in scheduled email send");
      }
    }, 20 * 60 * 1000);
  }

  const enriched = await enrichAppointment(appt);
  res.json({
    ...enriched,
    completedAt: enriched.completedAt ? enriched.completedAt.toISOString() : null,
    emailScheduledFor: enriched.emailScheduledFor ? enriched.emailScheduledFor.toISOString() : null,
    emailSentAt: enriched.emailSentAt ? enriched.emailSentAt.toISOString() : null,
    createdAt: enriched.createdAt.toISOString(),
  });
});

// POST /appointments/:appointmentId/cancel
router.post("/:appointmentId/cancel", async (req, res) => {
  const parsed = CancelAppointmentParams.safeParse({ appointmentId: Number(req.params.appointmentId) });
  if (!parsed.success) { res.status(400).json({ error: "Invalid id" }); return; }

  const [appt] = await db
    .update(appointmentsTable)
    .set({ status: "cancelled" })
    .where(eq(appointmentsTable.id, parsed.data.appointmentId))
    .returning();
  if (!appt) { res.status(404).json({ error: "Not found" }); return; }

  const enriched = await enrichAppointment(appt);
  res.json({
    ...enriched,
    completedAt: enriched.completedAt ? enriched.completedAt.toISOString() : null,
    emailScheduledFor: enriched.emailScheduledFor ? enriched.emailScheduledFor.toISOString() : null,
    emailSentAt: enriched.emailSentAt ? enriched.emailSentAt.toISOString() : null,
    createdAt: enriched.createdAt.toISOString(),
  });
});

export default router;
