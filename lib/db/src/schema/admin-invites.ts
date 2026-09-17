import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const adminInvitesTable = pgTable("admin_invites", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  role: text("role").notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AdminInvite = typeof adminInvitesTable.$inferSelect;
