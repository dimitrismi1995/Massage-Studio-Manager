import { pgTable, serial, integer, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { clientsTable } from "./clients";

export const emailJobsTable = pgTable("email_jobs", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clientsTable.id, { onDelete: "cascade" }),
  baseUrl: text("base_url").notNull(),
  scheduledFor: timestamp("scheduled_for").notNull(),
  /** Set just before sending; cleared on failure so the job can be retried. */
  processingStartedAt: timestamp("processing_started_at"),
  /** Set only after a confirmed successful send. */
  sentAt: timestamp("sent_at"),
  failed: boolean("failed").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type EmailJob = typeof emailJobsTable.$inferSelect;
