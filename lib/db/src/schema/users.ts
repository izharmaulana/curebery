import { pgTable, text, serial, boolean, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: text("role", { enum: ["patient", "nurse"] }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const nursesTable = pgTable("nurses", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").references(() => usersTable.id).notNull(),
  strNumber: text("str_number").notNull().unique(),
  specialization: text("specialization").notNull(),
  isOnline: boolean("is_online").default(false).notNull(),
  rating: real("rating").default(4.5).notNull(),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  avatarUrl: text("avatar_url"),
  totalPatients: serial("total_patients"),
  yearsExperience: serial("years_experience"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true });
export const insertNurseSchema = createInsertSchema(nursesTable).omit({ id: true, updatedAt: true });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
export type InsertNurse = z.infer<typeof insertNurseSchema>;
export type Nurse = typeof nursesTable.$inferSelect;
