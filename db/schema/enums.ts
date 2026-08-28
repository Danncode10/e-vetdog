import { pgEnum } from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", ["admin", "veterinarian", "owner"]);

export const appointmentStatus = pgEnum("appointment_status", [
  "requested",
  "scheduled",
  "completed",
  "cancelled",
  "no_show",
]);

export const checkInStatus = pgEnum("check_in_status", [
  "checked_in",
  "in_progress",
  "completed",
]);

export const encounterStatus = pgEnum("encounter_status", ["draft", "signed"]);

export const prescriptionStatus = pgEnum("prescription_status", [
  "active",
  "cancelled",
  "completed",
]);

