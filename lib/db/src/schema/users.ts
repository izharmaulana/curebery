import { pgTable, text, serial, integer, boolean, real, timestamp } from "drizzle-orm/pg-core";
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
  userId: integer("user_id").references(() => usersTable.id).notNull(),
  strNumber: text("str_number").notNull().unique(),
  specialization: text("specialization").notNull(),
  isOnline: boolean("is_online").default(false).notNull(),
  rating: real("rating").default(4.5).notNull(),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  avatarUrl: text("avatar_url"),
  totalPatients: integer("total_patients"),
  yearsExperience: integer("years_experience"),
  phone: text("phone"),
  address: text("address"),
  bio: text("bio"),
  services: text("services"),
  rate: text("rate"),
  strExpiry: text("str_expiry"),
  radiusKm: integer("radius_km").default(5),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const connectionsTable = pgTable("connections", {
  id: serial("id").primaryKey(),
  patientUserId: integer("patient_user_id").references(() => usersTable.id).notNull(),
  nurseUserId: integer("nurse_user_id").references(() => usersTable.id).notNull(),
  nurseProfileId: integer("nurse_profile_id").references(() => nursesTable.id).notNull(),
  status: text("status").default("pending").notNull(),
  patientName: text("patient_name").notNull(),
  nurseName: text("nurse_name").notNull(),
  nurseSpec: text("nurse_spec").notNull(),
  orderStatus: text("order_status").default("none").notNull(),
  patientLat: real("patient_lat"),
  patientLng: real("patient_lng"),
  ratingGiven: real("rating_given"),
  reviewText: text("review_text"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const messagesTable = pgTable("messages", {
  id: serial("id").primaryKey(),
  connectionId: integer("connection_id").references(() => connectionsTable.id).notNull(),
  senderUserId: integer("sender_user_id").references(() => usersTable.id).notNull(),
  senderRole: text("sender_role", { enum: ["patient", "nurse"] }).notNull(),
  text: text("text").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Message = typeof messagesTable.$inferSelect;
export type Connection = typeof connectionsTable.$inferSelect;

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true });
export const insertNurseSchema = createInsertSchema(nursesTable).omit({ id: true, updatedAt: true });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
export type InsertNurse = z.infer<typeof insertNurseSchema>;
export type Nurse = typeof nursesTable.$inferSelect;
