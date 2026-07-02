import { pgTable, serial, integer, text, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { clientsTable } from "./clients";

export const appointmentsTable = pgTable("appointments", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clientsTable.id, { onDelete: "cascade" }),
  date: text("date").notNull(), // YYYY-MM-DD
  startTime: text("start_time").notNull(), // HH:MM
  endTime: text("end_time"),
  durationMinutes: integer("duration_minutes").default(60),
  serviceType: text("service_type").notNull(),
  status: text("status").notNull().default("scheduled"), // scheduled | completed | cancelled | no_show
  price: real("price").notNull(),
  notes: text("notes"),
  completedAt: timestamp("completed_at"),
  emailScheduledFor: timestamp("email_scheduled_for"),
  emailSentAt: timestamp("email_sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAppointmentSchema = createInsertSchema(appointmentsTable).omit({ id: true, createdAt: true, completedAt: true, emailScheduledFor: true, emailSentAt: true });
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Appointment = typeof appointmentsTable.$inferSelect;
