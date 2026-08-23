"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/services/authorization";
import type {
  TablesInsert,
  TablesUpdate,
  Tables,
} from "@/types/supabase";
import { listPetsForCurrentUser } from "@/services/pets";

export type Appointment = Tables<"appointments">;
export type AppointmentInsert = TablesInsert<"appointments">;
export type AppointmentUpdate = TablesUpdate<"appointments">;
export type CheckIn = Tables<"check_ins">;
export type CheckInInsert = TablesInsert<"check_ins">;
export type CheckInUpdate = TablesUpdate<"check_ins">;
export type AppointmentStatusHistory = Tables<"appointment_status_history">;

export async function listAppointments(filters?: {
  status?: Appointment["status"];
  petId?: string;
  ownerId?: string;
  veterinarianId?: string;
  fromDate?: string;
  toDate?: string;
  limit?: number;
  offset?: number;
}) {
  const supabase = await createClient();
  let query = supabase
    .from("appointments")
    .select(`
      *,
      pets (id, name, species, breed, sex),
      owner:profiles!appointments_owner_id_fkey (id, full_name, email, phone),
      veterinarian:profiles!appointments_assigned_veterinarian_id_fkey (id, full_name),
      services (id, name, duration_minutes, price_from, price_to)
    `)
    .order("scheduled_start", { ascending: true, nullsFirst: false });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.petId) {
    query = query.eq("pet_id", filters.petId);
  }
  if (filters?.ownerId) {
    query = query.eq("owner_id", filters.ownerId);
  }
  if (filters?.veterinarianId) {
    query = query.eq("assigned_veterinarian_id", filters.veterinarianId);
  }
  if (filters?.fromDate) {
    query = query.gte("scheduled_start", filters.fromDate);
  }
  if (filters?.toDate) {
    query = query.lte("scheduled_start", filters.toDate);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  if (filters?.offset !== undefined && filters?.offset !== null) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getAppointmentById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointments")
    .select(
      `
      *,
      pets (id, name, species, breed, sex, date_of_birth, age, color, notes),
      owner:profiles!appointments_owner_id_fkey (id, full_name, email, phone, address, emergency_contact_name, emergency_contact_phone),
      veterinarian:profiles!appointments_assigned_veterinarian_id_fkey (id, full_name),
      services (id, name, duration_minutes, price_from, price_to, category)
    `
    )
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function createAppointment(input: AppointmentInsert) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointments")
    .insert({
      ...input,
      status: 'requested',
      requested_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw error;
  revalidatePath("/dashboard/appointments");
  return data;
}

export async function updateAppointment(id: string, updates: AppointmentUpdate) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointments")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  revalidatePath("/dashboard/appointments");
  return data;
}

export async function cancelAppointment(id: string, reason?: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointments")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      cancellation_reason: (reason as any) || "owner_request",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  revalidatePath("/dashboard/appointments");
  return data;
}

export async function scheduleAppointment(
  id: string,
  input: {
    scheduledStart: string;
    scheduledEnd: string;
    assignedVeterinarianId: string;
    notes?: string;
  }
) {
  const supabase = await createClient();

  // Check for double-booking
  const { data: doubleBooked } = await supabase.rpc("check_double_booking", {
    p_veterinarian_id: input.assignedVeterinarianId,
    p_start: input.scheduledStart,
    p_end: input.scheduledEnd,
    p_exclude_appointment_id: id,
  });

  if (doubleBooked) {
    throw new Error("This veterinarian has a conflicting appointment at that time");
  }

  const { data, error } = await supabase
    .from("appointments")
    .update({
      status: "scheduled",
      scheduled_start: input.scheduledStart,
      scheduled_end: input.scheduledEnd,
      assigned_veterinarian_id: input.assignedVeterinarianId,
      confirmed_at: new Date().toISOString(),
      notes: input.notes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  revalidatePath("/dashboard/appointments");
  return data;
}

export async function completeAppointment(id: string, notes?: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointments")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      notes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  revalidatePath("/dashboard/appointments");
  return data;
}

export async function markNoShow(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointments")
    .update({
      status: "no_show",
      no_show_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  revalidatePath("/dashboard/appointments");
  return data;
}

export async function rescheduleAppointment(
  id: string,
  input: {
    newScheduledStart: string;
    newScheduledEnd: string;
    reason?: string;
    notes?: string;
  }
) {
  const supabase = await createClient();

  // Get current appointment
  const { data: current } = await supabase
    .from("appointments")
    .select("assigned_veterinarian_id")
    .eq("id", id)
    .single();

  if (current?.assigned_veterinarian_id) {
    const { data: doubleBooked } = await supabase.rpc("check_double_booking", {
      p_veterinarian_id: current.assigned_veterinarian_id,
      p_start: input.newScheduledStart,
      p_end: input.newScheduledEnd,
      p_exclude_appointment_id: id,
    });

    if (doubleBooked) {
      throw new Error("This veterinarian has a conflicting appointment at that time");
    }
  }

  const { data, error } = await supabase
    .from("appointments")
    .update({
      scheduled_start: input.newScheduledStart,
      scheduled_end: input.newScheduledEnd,
      notes: input.notes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  revalidatePath("/dashboard/appointments");
  return data;
}

export async function createCheckIn(input: CheckInInsert) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("check_ins")
    .insert({
      ...input,
      arrival_time: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw error;
  revalidatePath("/dashboard/appointments");
  return data;
}

export async function updateCheckIn(id: string, updates: CheckInUpdate) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("check_ins")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  revalidatePath("/dashboard/appointments");
  return data;
}

export async function getCheckInByAppointmentId(appointmentId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("check_ins")
    .select("*")
    .eq("appointment_id", appointmentId)
    .single();
  if (error && error.code !== "PGRST116") throw error;
  return data;
}

export async function listCheckIns(filters?: {
  status?: CheckIn["status"];
  petId?: string;
  ownerId?: string;
  fromDate?: string;
  toDate?: string;
  walkIn?: boolean;
}) {
  const supabase = await createClient();
  let query = supabase
    .from("check_ins")
    .select(
      `
      *,
      appointments (id, status, scheduled_start, pets (id, name)),
      pets (id, name, species, breed),
      profiles!check_ins_owner_id_fkey (id, full_name, email, phone)
    `
    )
    .order("arrival_time", { ascending: false });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.petId) {
    query = query.eq("pet_id", filters.petId);
  }
  if (filters?.ownerId) {
    query = query.eq("owner_id", filters.ownerId);
  }
  if (filters?.walkIn !== undefined) {
    query = query.eq("walk_in", filters.walkIn);
  }
  if (filters?.fromDate) {
    query = query.gte("arrival_time", filters.fromDate);
  }
  if (filters?.toDate) {
    query = query.lte("arrival_time", filters.toDate);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getAppointmentStatusHistory(appointmentId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointment_status_history")
    .select(
      `
      *,
      profiles!appointment_status_history_changed_by_id_fkey (id, full_name, role)
    `
    )
    .eq("appointment_id", appointmentId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

export async function listOwnerAppointments(ownerId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointments")
    .select(
      `
      *,
      pets (id, name, species, breed, sex),
      services (id, name, duration_minutes, price_from, price_to)
    `
    )
    .eq("owner_id", ownerId)
    .order("scheduled_start", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return data;
}

export async function listPetAppointments(petId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointments")
    .select(
      `
      *,
      profiles!appointments_owner_id_fkey (id, full_name, email),
      profiles!appointments_assigned_veterinarian_id_fkey (id, full_name),
      services (id, name, duration_minutes, price_from, price_to)
    `
    )
    .eq("pet_id", petId)
    .order("scheduled_start", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return data;
}

export async function requestAppointment(input: Omit<AppointmentInsert, 'owner_id' | 'id'>) {
  const { profile } = await requireAuth();
  // Validate that the pet_id in input is linked to the owner's profile
  const pets = await listPetsForCurrentUser();
  const petIds = pets.map(pet => pet.id);
  if (!petIds.includes(input.pet_id)) {
    throw new Error("You can only request appointments for your own pets.");
  }
  // Now create the appointment with the owner_id set to the authenticated user's id
  const appointmentInput: AppointmentInsert = {
    ...input,
    owner_id: profile.id,
  };
  return createAppointment(appointmentInput);
}

export async function getVeterinarianSchedule(veterinarianId: string, date: string) {
  const supabase = await createClient();
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const { data, error } = await supabase
    .from("appointments")
    .select(
      `
      *,
      pets (id, name, species, breed),
      profiles!appointments_owner_id_fkey (id, full_name, phone),
      services (id, name, duration_minutes)
    `
    )
    .eq("assigned_veterinarian_id", veterinarianId)
    .gte("scheduled_start", startOfDay.toISOString())
    .lte("scheduled_start", endOfDay.toISOString())
    .in("status", ["requested", "scheduled"])
    .order("scheduled_start", { ascending: true });
  if (error) throw error;
  return data;
}