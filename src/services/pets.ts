"use server";

import { createClient } from "@/utils/supabase/server";
import { Tables, TablesInsert, TablesUpdate } from "@/types/supabase";
import { requireAuth } from "@/services/authorization";
import { revalidatePath } from "next/cache";

export type Pet = Tables<"pets">;
export type PetInsert = TablesInsert<"pets">;
export type PetUpdate = TablesUpdate<"pets">;

export type PetOwner = Tables<"pet_owners">;
export type PetOwnerInsert = TablesInsert<"pet_owners">;
export type PetOwnerUpdate = TablesUpdate<"pet_owners">;

export type PetFormInput = {
  name: string;
  species: Pet["species"];
  breed: string;
  sex: Pet["sex"];
  dateOfBirth: string;
  age: string;
  microchipId: string;
  color: string;
  notes: string;
};

function nullableValue(value: string): string | null {
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function parseAge(value: string): number | null {
  const normalized = value.trim();
  if (!normalized) return null;
  const age = Number(normalized);
  if (!Number.isInteger(age) || age < 0) throw new Error("Age must be a whole number that is zero or greater.");
  return age;
}

function toPetPayload(input: PetFormInput): Omit<PetInsert, "id" | "created_at" | "updated_at"> {
  const name = input.name.trim();
  if (!name) throw new Error("Pet name is required.");
  return {
    name,
    species: input.species,
    breed: nullableValue(input.breed),
    sex: input.sex,
    date_of_birth: nullableValue(input.dateOfBirth),
    age: parseAge(input.age),
    microchip_id: nullableValue(input.microchipId),
    color: nullableValue(input.color),
    notes: nullableValue(input.notes),
  };
}

export async function listPetsForCurrentUser() {
  await requireAuth();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pets")
    .select("*, pet_owners(id, relationship, is_primary_contact, can_view_medical_records, can_receive_notifications, owner_profile_id, profiles!pet_owners_owner_profile_id_fkey(full_name, email, phone))")
    .order("name")
    .limit(100);
  if (error) throw error;
  return data;
}

export async function listOwnerRegistry() {
  const { profile } = await requireAuth();
  if (profile.role !== "admin" && profile.role !== "veterinarian") throw new Error("Only clinic staff can view the owner registry.");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, pet_owners(pet_id, relationship, is_primary_contact, can_view_medical_records, pets(id, name, species, breed))")
    .eq("role", "owner")
    .order("full_name")
    .limit(100);
  if (error) throw error;
  return data;
}

export async function createOwnedPet(input: PetFormInput) {
  const { profile } = await requireAuth();
  if (profile.role !== "owner") throw new Error("Only pet owners can add pets from this workspace.");
  const payload = toPetPayload(input);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_owned_pet", {
    p_name: payload.name,
    p_species: payload.species,
    p_breed: payload.breed,
    p_sex: payload.sex,
    p_date_of_birth: payload.date_of_birth,
    p_age: payload.age,
    p_microchip_id: payload.microchip_id,
    p_color: payload.color,
    p_notes: payload.notes,
  });
  if (error) throw error;
  revalidatePath("/dashboard");
  return data;
}

export async function updateOwnedPet(id: string, input: PetFormInput) {
  const { profile } = await requireAuth();
  if (profile.role !== "owner" && profile.role !== "admin") throw new Error("You do not have permission to update pet details.");
  const payload = toPetPayload(input);
  const supabase = await createClient();
  const { data, error } = await supabase.from("pets").update(payload).eq("id", id).select().single();
  if (error) throw error;
  revalidatePath("/dashboard");
  return data;
}

export async function createPet(input: PetInsert) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("pets").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function getPetById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("pets").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
}

export async function listPetsByOwner(ownerProfileId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pets")
    .select("*, pet_owners!inner(*)")
    .eq("pet_owners.owner_profile_id", ownerProfileId);
  if (error) throw error;
  return data;
}

export async function listAllPets() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("pets").select("*").order("name");
  if (error) throw error;
  return data;
}

export async function updatePet(id: string, updates: PetUpdate) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("pets").update(updates).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deletePet(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("pets").delete().eq("id", id);
  if (error) throw error;
}

export async function createPetOwner(input: PetOwnerInsert) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("pet_owners").insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function getPetOwnersByPet(petId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pet_owners")
    .select("*, profiles!pet_owners_owner_profile_id_fkey(*)")
    .eq("pet_id", petId);
  if (error) throw error;
  return data;
}

export async function getPetOwnersByOwner(ownerProfileId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pet_owners")
    .select("*, pets(*)")
    .eq("owner_profile_id", ownerProfileId);
  if (error) throw error;
  return data;
}

export async function updatePetOwner(id: string, updates: PetOwnerUpdate) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("pet_owners").update(updates).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deletePetOwner(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("pet_owners").delete().eq("id", id);
  if (error) throw error;
}

export async function searchPets(query: string, limit = 20) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pets")
    .select("*")
    .ilike("name", `%${query}%`)
    .limit(limit);
  if (error) throw error;
  return data;
}
