import { createClient } from "@/utils/supabase/server";
import { Tables, TablesInsert, TablesUpdate } from "@/types/supabase";

export type Pet = Tables<"pets">;
export type PetInsert = TablesInsert<"pets">;
export type PetUpdate = TablesUpdate<"pets">;

export type PetOwner = Tables<"pet_owners">;
export type PetOwnerInsert = TablesInsert<"pet_owners">;
export type PetOwnerUpdate = TablesUpdate<"pet_owners">;

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
