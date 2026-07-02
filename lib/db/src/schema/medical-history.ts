import { pgTable, serial, integer, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { clientsTable } from "./clients";

export const medicalHistoryTable = pgTable("medical_history", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clientsTable.id, { onDelete: "cascade" }),
  conditions: text("conditions"),
  allergies: text("allergies"),
  immuneIssues: text("immune_issues"),
  otherHealthIssues: text("other_health_issues"),
  medications: text("medications"),
  painAreas: text("pain_areas"),
  previousMassageExperience: boolean("previous_massage_experience").default(false),
  preferredPressure: text("preferred_pressure"),
  massageGoals: text("massage_goals"),
  gdprAccepted: boolean("gdpr_accepted").notNull().default(false),
  gdprAcceptedAt: timestamp("gdpr_accepted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMedicalHistorySchema = createInsertSchema(medicalHistoryTable).omit({ id: true, createdAt: true });
export type InsertMedicalHistory = z.infer<typeof insertMedicalHistorySchema>;
export type MedicalHistory = typeof medicalHistoryTable.$inferSelect;
