import { Router } from "express";
import { db } from "@workspace/db";
import { appointmentsTable, expensesTable } from "@workspace/db";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import {
  GetFinanceSummaryQueryParams,
  GetMonthlyBreakdownQueryParams,
  GetTopServicesQueryParams,
} from "@workspace/api-zod";

const router = Router();

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function monthStr(date: Date) {
  return date.toISOString().slice(0, 7); // YYYY-MM
}

// GET /finance/summary
router.get("/summary", async (req, res) => {
  const parsed = GetFinanceSummaryQueryParams.safeParse(req.query);
  const period = parsed.success ? parsed.data.period ?? "month" : "month";
  const dateParam = parsed.success ? parsed.data.date ?? todayStr() : todayStr();

  let startDate: string;
  let endDate: string;
  let label: string;

  const d = new Date(dateParam);

  if (period === "day") {
    startDate = dateParam;
    endDate = dateParam;
    label = dateParam;
  } else if (period === "month") {
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    endDate = `${year}-${String(month).padStart(2, "0")}-${lastDay}`;
    label = `${year}-${String(month).padStart(2, "0")}`;
  } else {
    // year
    const year = d.getFullYear();
    startDate = `${year}-01-01`;
    endDate = `${year}-12-31`;
    label = String(year);
  }

  const appts = await db
    .select({ price: appointmentsTable.price })
    .from(appointmentsTable)
    .where(
      and(
        eq(appointmentsTable.status, "completed"),
        gte(appointmentsTable.date, startDate),
        lte(appointmentsTable.date, endDate),
      ),
    );

  const allAppts = await db
    .select({ id: appointmentsTable.id })
    .from(appointmentsTable)
    .where(
      and(
        gte(appointmentsTable.date, startDate),
        lte(appointmentsTable.date, endDate),
      ),
    );

  const expenses = await db
    .select({ amount: expensesTable.amount })
    .from(expensesTable)
    .where(
      and(
        gte(expensesTable.date, startDate),
        lte(expensesTable.date, endDate),
      ),
    );

  const totalIncome = appts.reduce((s, a) => s + (a.price ?? 0), 0);
  const totalExpenses = expenses.reduce((s, e) => s + (e.amount ?? 0), 0);

  res.json({
    period: label,
    totalIncome: Math.round(totalIncome * 100) / 100,
    totalExpenses: Math.round(totalExpenses * 100) / 100,
    profit: Math.round((totalIncome - totalExpenses) * 100) / 100,
    appointmentCount: allAppts.length,
  });
});

// GET /finance/monthly-breakdown
router.get("/monthly-breakdown", async (req, res) => {
  const parsed = GetMonthlyBreakdownQueryParams.safeParse(req.query);
  const year = parsed.success && parsed.data.year ? parsed.data.year : new Date().getFullYear();

  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;

  const appts = await db
    .select({ date: appointmentsTable.date, price: appointmentsTable.price })
    .from(appointmentsTable)
    .where(
      and(
        eq(appointmentsTable.status, "completed"),
        gte(appointmentsTable.date, startDate),
        lte(appointmentsTable.date, endDate),
      ),
    );

  const expenses = await db
    .select({ date: expensesTable.date, amount: expensesTable.amount })
    .from(expensesTable)
    .where(
      and(
        gte(expensesTable.date, startDate),
        lte(expensesTable.date, endDate),
      ),
    );

  const byMonth: Record<number, { income: number; expenses: number }> = {};
  for (let m = 1; m <= 12; m++) {
    byMonth[m] = { income: 0, expenses: 0 };
  }

  for (const a of appts) {
    const m = Number(a.date.split("-")[1]);
    byMonth[m].income += a.price ?? 0;
  }
  for (const e of expenses) {
    const m = Number(e.date.split("-")[1]);
    byMonth[m].expenses += e.amount ?? 0;
  }

  const result = Object.entries(byMonth).map(([m, v]) => ({
    month: Number(m),
    year,
    income: Math.round(v.income * 100) / 100,
    expenses: Math.round(v.expenses * 100) / 100,
    profit: Math.round((v.income - v.expenses) * 100) / 100,
  }));

  res.json(result);
});

// GET /finance/top-services
router.get("/top-services", async (req, res) => {
  const parsed = GetTopServicesQueryParams.safeParse(req.query);
  const year = parsed.success && parsed.data.year ? parsed.data.year : new Date().getFullYear();
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;

  const appts = await db
    .select({ serviceType: appointmentsTable.serviceType, price: appointmentsTable.price })
    .from(appointmentsTable)
    .where(
      and(
        eq(appointmentsTable.status, "completed"),
        gte(appointmentsTable.date, startDate),
        lte(appointmentsTable.date, endDate),
      ),
    );

  const byService: Record<string, { revenue: number; count: number }> = {};
  for (const a of appts) {
    if (!byService[a.serviceType]) byService[a.serviceType] = { revenue: 0, count: 0 };
    byService[a.serviceType].revenue += a.price ?? 0;
    byService[a.serviceType].count += 1;
  }

  const result = Object.entries(byService)
    .map(([serviceType, v]) => ({
      serviceType,
      revenue: Math.round(v.revenue * 100) / 100,
      count: v.count,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  res.json(result);
});

export default router;
