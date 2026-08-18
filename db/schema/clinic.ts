import {
  boolean,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { profiles } from "./core";

const createdAt = timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();

export const petSpecies = pgEnum("pet_species", ["dog", "cat", "bird", "rabbit", "reptile", "other"]);
export const petSex = pgEnum("pet_sex", ["male", "female", "unknown"]);
export const ownerRelationship = pgEnum("owner_relationship", ["owner", "co_owner", "family", "caretaker"]);

export const pets = pgTable(
  "pets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    species: petSpecies("species").notNull(),
    breed: text("breed"),
    sex: petSex("sex").notNull().default("unknown"),
    dateOfBirth: date("date_of_birth"),
    age: integer("age"),
    microchipId: text("microchip_id"),
    color: text("color"),
    notes: text("notes"),
    createdAt,
    updatedAt,
  },
  (t) => ({
    nameIdx: index("idx_pets_name").on(t.name),
    speciesIdx: index("idx_pets_species").on(t.species),
  })
);

export const petOwners = pgTable(
  "pet_owners",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    petId: uuid("pet_id")
      .notNull()
      .references(() => pets.id, { onDelete: "cascade" }),
    ownerProfileId: uuid("owner_profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    relationship: ownerRelationship("relationship").notNull().default("owner"),
    isPrimaryContact: boolean("is_primary_contact").notNull().default(false),
    canViewMedicalRecords: boolean("can_view_medical_records").notNull().default(true),
    canReceiveNotifications: boolean("can_receive_notifications").notNull().default(true),
    createdAt,
    updatedAt,
  },
  (t) => ({
    petIdx: index("idx_pet_owners_pet_id").on(t.petId),
    ownerIdx: index("idx_pet_owners_owner_profile_id").on(t.ownerProfileId),
    uniquePetOwner: uniqueIndex("unique_pet_owner").on(t.petId, t.ownerProfileId),
  })
);
