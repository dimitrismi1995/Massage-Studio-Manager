import { Router } from "express";
import { db } from "@workspace/db";
import { appointmentsTable, clientsTable, expensesTable, reviewsTable } from "@workspace/db";
import { eq, and, gte, lte } from "drizzle-orm";

const router = Router();

router.get("/stats", async (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const monthEnd = `${year}-${String(month).padStart(2, "0")}-${lastDay}`;

  const [todayAppts, monthCompletedAppts, monthExpenses, allClients, allReviews, pendingAppts] = await Promise.all([
    db.select().from(appointmentsTable).where(eq(appointmentsTable.date, today)),
    db.select({ price: appointmentsTable.price }).from(appointmentsTable).where(
      and(
        eq(appointmentsTable.status, "completed"),
        gte(appointmentsTable.date, monthStart),
        lte(appointmentsTable.date, monthEnd),
      ),
    ),
    db.select({ amount: expensesTable.amount }).from(expensesTable).where(
      and(
        gte(expensesTable.date, monthStart),
        lte(expensesTable.date, monthEnd),
      ),
    ),
    db.select({ id: clientsTable.id }).from(clientsTable),
    db.select({ rating: reviewsTable.rating }).from(reviewsTable).where(
      // only rated reviews
      gte(reviewsTable.rating, 1),
    ),
    db.select({ id: appointmentsTable.id }).from(appointmentsTable).where(
      and(
        eq(appointmentsTable.status, "scheduled"),
        gte(appointmentsTable.date, today),
      ),
    ),
  ]);

  const todayCompleted = todayAppts.filter((a) => a.status === "completed");
  const todayIncome = todayCompleted.reduce((s, a) => s + (a.price ?? 0), 0);
  const monthIncome = monthCompletedAppts.reduce((s, a) => s + (a.price ?? 0), 0);
  const monthExp = monthExpenses.reduce((s, e) => s + (e.amount ?? 0), 0);

  const ratings = allReviews.map((r) => r.rating ?? 0).filter((r) => r > 0);
  const avgRating = ratings.length > 0 ? ratings.reduce((s, r) => s + r, 0) / ratings.length : 0;

  res.json({
    todayIncome: Math.round(todayIncome * 100) / 100,
    todayAppointments: todayAppts.length,
    monthIncome: Math.round(monthIncome * 100) / 100,
    monthExpenses: Math.round(monthExp * 100) / 100,
    monthProfit: Math.round((monthIncome - monthExp) * 100) / 100,
    totalClients: allClients.length,
    avgRating: Math.round(avgRating * 10) / 10,
    pendingAppointments: pendingAppts.length,
  });
});

export default router;
