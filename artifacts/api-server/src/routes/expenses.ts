import { Router } from "express";
import { db } from "@workspace/db";
import { expensesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  ListExpensesQueryParams,
  CreateExpenseBody,
  UpdateExpenseParams,
  UpdateExpenseBody,
  DeleteExpenseParams,
} from "@workspace/api-zod";

const router = Router();

// GET /expenses
router.get("/", async (req, res) => {
  const parsed = ListExpensesQueryParams.safeParse(req.query);
  const { month, year } = parsed.success ? parsed.data : {};

  const all = await db.select().from(expensesTable).orderBy(expensesTable.date);

  let filtered = all;
  if (year) {
    filtered = filtered.filter((e) => e.date.startsWith(String(year)));
  }
  if (month) {
    // month is like "01", "12" etc
    filtered = filtered.filter((e) => {
      const parts = e.date.split("-");
      return parts[1] === String(month).padStart(2, "0");
    });
  }

  res.json(filtered);
});

// POST /expenses
router.post("/", async (req, res) => {
  const parsed = CreateExpenseBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [expense] = await db.insert(expensesTable).values(parsed.data).returning();
  res.status(201).json(expense);
});

// PATCH /expenses/:expenseId
router.patch("/:expenseId", async (req, res) => {
  const params = UpdateExpenseParams.safeParse({ expenseId: Number(req.params.expenseId) });
  const body = UpdateExpenseBody.safeParse(req.body);
  if (!params.success || !body.success) { res.status(400).json({ error: "Invalid input" }); return; }

  const [expense] = await db
    .update(expensesTable)
    .set(body.data)
    .where(eq(expensesTable.id, params.data.expenseId))
    .returning();
  if (!expense) { res.status(404).json({ error: "Not found" }); return; }
  res.json(expense);
});

// DELETE /expenses/:expenseId
router.delete("/:expenseId", async (req, res) => {
  const parsed = DeleteExpenseParams.safeParse({ expenseId: Number(req.params.expenseId) });
  if (!parsed.success) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(expensesTable).where(eq(expensesTable.id, parsed.data.expenseId));
  res.status(204).send();
});

export default router;
