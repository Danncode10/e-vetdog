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
    // Filter by preferred_date when scheduled_start may be null or different
    query = query.gte("preferred_date", filters.fromDate);
  }
  if (filters?.toDate) {
    // Filter by preferred_date when scheduled_start may be null or different
    query = query.lte("preferred_date", filters.toDate);
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

  // Preserve preferred_date and preferred_time from existing appointment
  const { data: existing } = await supabase
    .from("appointments")
    .select("preferred_date, preferred_time")
    .eq("id", id)
    .single();

  const { data, error } = await supabase
    .from("appointments")
    .update({
      status: "scheduled",
      scheduled_start: input.scheduledStart,
      scheduled_end: input.scheduledEnd,
      assigned_veterinarian_id: input.assignedVeterinarianId,
      confirmed_at: new Date().toISOString(),
      // Preserve preferred_date and preferred_time from the original appointment request
      ...(existing?.preferred_date !== undefined && { preferred_date: existing.preferred_date }),
      ...(existing?.preferred_time !== undefined && { preferred_time: existing.preferred_time }),
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

  // Get current appointment including preferred_date and preferred_time
  const { data: current } = await supabase
    .from("appointments")
    .select("assigned_veterinarian_id, preferred_date, preferred_time")
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
      // Preserve preferred_date and preferred_time from the original appointment
      ...(current?.preferred_date !== undefined && { preferred_date: current.preferred_date }),
      ...(current?.preferred_time !== undefined && { preferred_time: current.preferred_time }),
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
    // Filter by scheduled_start, but also include appointments with preferred_date in range
    .gte("scheduled_start", startOfDay.toISOString())
    .lte("scheduled_start", endOfDay.toISOString())
    .in("status", ["requested", "scheduled"])
    .order("scheduled_start", { ascending: true });
  if (error) throw error;
  return data;
}

/**
 * Get available appointment slots based on admin-configured schedules.
 * Checks schedules and subtracts already-booked appointments.
 * If veterinarianId is provided, only checks appointments for that vet.
 * If not provided, checks all appointments (global capacity).
 */
export async function listAppointmentSchedules() {
  const supabase = await createClient();
  try {
    const { data, error } = await supabase
      .from("appointment_schedules")
      .select("*")
      .eq("status", "active")
      .order("is_recurring", { ascending: false })
      .order("day_of_week", { ascending: true })
      .order("specific_date", { ascending: true });
    if (error) {
      console.error("EXACT_PG_ERROR_listAppointmentSchedules:", JSON.stringify({
        message: error.message,
        hint: error.hint,
        code: error.code
      }, null, 2));
      throw error;
    }
    return data;
  } catch (err) {
    console.error("EXACT_PG_ERROR_CATCH_listAppointmentSchedules:", JSON.stringify(err, null, 2));
    throw err;
  }
}

export async function createAppointmentSchedule(input: {
  day_of_week: number;
  start_time: string;
  end_time: string;
  max_capacity: number;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointment_schedules")
    .insert({
      ...input,
      status: "active",
    })
    .select()
    .single();
  if (error) throw error;
  revalidatePath("/dashboard/schedules");
  return data;
}

export async function updateAppointmentSchedule(
  id: string,
  input: {
    day_of_week?: number;
    start_time?: string;
    end_time?: string;
    max_capacity?: number;
  }
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointment_schedules")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  revalidatePath("/dashboard/schedules");
  return data;
}

export async function deleteAppointmentSchedule(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("appointment_schedules")
    .delete()
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/dashboard/schedules");
}

export async function getAvailableSlots(
  veterinarianId?: string,
  date?: string
) {
  const supabase = await createClient();
  if (!date) return { slots: [], scheduled: [] };

  try {
    // 1. First, check for specific date schedules (is_recurring=false or specific_date set)
    const specificDate = new Date(date).toISOString().split("T")[0];
    const { data: specificSchedules, error: specificError } = await supabase
      .from("appointment_schedules")
      .select("*")
      .or(`is_closed.eq.false,specific_date.eq.${specificDate}`)
      .eq("status", 'active');

    if (specificError) {
      console.error("EXACT_PG_ERROR_getAvailableSlots_specific:", JSON.stringify({
        message: specificError.message,
        hint: specificError.hint,
        code: specificError.code
      }, null, 2));
      throw specificError;
    }
  } catch (err) {
    console.error("EXACT_PG_ERROR_CATCH_getAvailableSlots_specific:", JSON.stringify(err, null, 2));
    throw err;
  }

  // 2. If no specific date schedule found, fall back to recurring day-of-week schedules
  let schedules: any[] = [];
  if (!specificSchedules || specificSchedules.length === 0) {
    // Fall back to recurring schedules for this day of week
    const dayOfWeek = new Date(`${date}T00:00:00`).getDay();
    const { data: fallbackSchedules, error: fallbackError } = await supabase
      .from("appointment_schedules")
      .select("*")
      .eq("day_of_week", dayOfWeek)
      .eq("is_recurring", true)
      .eq("status", 'active');

    if (fallbackError) throw fallbackError;
    schedules = fallbackSchedules || [];
  } else {
    schedules = specificSchedules;
  }

  if (!schedules || schedules.length === 0) {
    // No schedules configured; return no available slots
    return { slots: [], scheduled: [] };
  }

  // 3. Determine the query builder based on whether a vet ID is provided
  let queryBuilder = supabase.from("appointments").select("scheduled_start, scheduled_end");

  if (veterinarianId) {
    queryBuilder = queryBuilder.eq("assigned_veterinarian_id", veterinarianId);
  }

  // 3. Get already-booked appointments for this date
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const { data: bookedAppts, error: bookError } = await queryBuilder
    .gte("scheduled_start", startOfDay.toISOString())
    .lte("scheduled_start", endOfDay.toISOString())
    .in("status", ["requested", "scheduled"]);

  if (bookError) throw bookError;

  // 4. Build slots from schedules, marking capacity
  const slots = schedules.map((schedule) => {
    // Parse time strings from Supabase (format: "HH:MM:SS")
    const [startH, startM] = schedule.start_time.split(":").map(Number);
    const [endH, endM] = schedule.end_time.split(":").map(Number);

    const slotStart = new Date(date);
    slotStart.setHours(startH, startM, 0, 0);

    const slotEnd = new Date(date);
    slotEnd.setHours(endH, endM, 0, 0);

    // Count how many appointments overlap this slot
    const booked = (bookedAppts || []).filter((appt) => {
      const apptStart = new Date(appt.scheduled_start);
      const apptEnd = new Date(appt.scheduled_end);
      return apptStart < slotEnd && apptEnd > slotStart;
    });

    const currentBookings = booked.length;
    const available = schedule.max_capacity - currentBookings;
    const isAvailable = available > 0;

    // Format time for display (HH:MM AM/PM)
    const formatTime = (h: number, m: number) => {
      const period = h >= 12 ? "PM" : "AM";
      const displayH = h % 12 || 12;
      return `${displayH}:${m.toString().padStart(2, "0")} ${period}`;
    };

    return {
      id: schedule.id,
      start: schedule.start_time,
      end: schedule.end_time,
      maxCapacity: schedule.max_capacity,
      currentBookings,
      available,
      isAvailable,
      label: `${formatTime(startH, startM)} - ${formatTime(endH, endM)}`,
    };
  });

  return { slots, scheduled: bookedAppts || [] };
}