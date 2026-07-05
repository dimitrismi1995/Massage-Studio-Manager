import { Router } from "express";
import { db } from "@workspace/db";
import { reviewsTable, clientsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { UpdateReviewParams, UpdateReviewBody, CreateReviewBody } from "@workspace/api-zod";

const router = Router();

// POST /reviews
router.post("/", async (req, res) => {
  const body = CreateReviewBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: "Invalid input" }); return; }

  const [review] = await db
    .insert(reviewsTable)
    .values({
      clientId: body.data.clientId,
      rating: body.data.rating ?? null,
      comment: body.data.comment ?? null,
    })
    .returning();
  res.status(201).json(review);
});

// GET /reviews
router.get("/", async (req, res) => {
  const rows = await db
    .select({
      id: reviewsTable.id,
      appointmentId: reviewsTable.appointmentId,
      clientId: reviewsTable.clientId,
      rating: reviewsTable.rating,
      comment: reviewsTable.comment,
      emailSentAt: reviewsTable.emailSentAt,
      createdAt: reviewsTable.createdAt,
      firstName: clientsTable.firstName,
      lastName: clientsTable.lastName,
    })
    .from(reviewsTable)
    .leftJoin(clientsTable, eq(reviewsTable.clientId, clientsTable.id))
    .orderBy(reviewsTable.createdAt);

  const result = rows.map((r) => ({
    ...r,
    clientName: r.firstName && r.lastName ? `${r.firstName} ${r.lastName}` : null,
    firstName: undefined,
    lastName: undefined,
  }));

  res.json(result);
});

// PATCH /reviews/:reviewId
router.patch("/:reviewId", async (req, res) => {
  const params = UpdateReviewParams.safeParse({ reviewId: Number(req.params.reviewId) });
  const body = UpdateReviewBody.safeParse(req.body);
  if (!params.success || !body.success) { res.status(400).json({ error: "Invalid input" }); return; }

  const [review] = await db
    .update(reviewsTable)
    .set(body.data)
    .where(eq(reviewsTable.id, params.data.reviewId))
    .returning();
  if (!review) { res.status(404).json({ error: "Not found" }); return; }
  res.json(review);
});

export default router;
