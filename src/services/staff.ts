"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import { createAdminClient, createClient } from "@/utils/supabase/server";
import type { Database, Json, Tables } from "@/types/supabase";

type StaffRole = Extract<Database["public"]["Enums"]["user_role"], "admin" | "veterinarian">;
type Profile = Tables<"profiles">;

export type StaffMember = Pick<Profile, "id" | "email" | "full_name" | "role" | "created_at"> & {
  is_active: boolean;
};

export type StaffActionResult = {
  error?: string;
  success?: string;
};

type StaffAuditAction = "staff_invited" | "staff_updated" | "staff_deactivated" | "staff_reactivated";

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function parseStaffRole(value: string): StaffRole | null {
  return value === "admin" || value === "veterinarian" ? value : null;
}

function toJson(value: Record<string, string | boolean | null>): Json {
  return value;
}

async function getAdminActor() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("You must be signed in to manage staff.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role, is_active")
    .eq("id", user.id)
    .single();

  if (profileError || profile?.role !== "admin" || !profile.is_active) {
    throw new Error("Only active administrators can manage staff.");
  }

  return { id: profile.id, email: user.email ?? null };
}

async function writeAuditLog(
  actorId: string,
  targetProfileId: string,
  action: StaffAuditAction,
  previousValues: Record<string, string | boolean | null>,
  nextValues: Record<string, string | boolean | null>,
) {
  const adminClient = createAdminClient();
  const { error } = await adminClient.from("staff_audit_logs").insert({
    actor_id: actorId,
    target_profile_id: targetProfileId,
    action,
    previous_values: toJson(previousValues),
    next_values: toJson(nextValues),
  });

  if (error) {
    throw new Error("The staff change could not be recorded for audit.");
  }
}

async function assertNotFinalActiveAdmin(
  target: Pick<StaffMember, "id" | "role" | "is_active">,
  nextRole: StaffRole,
  nextIsActive: boolean,
) {
  if (target.role !== "admin" || !target.is_active || (nextRole === "admin" && nextIsActive)) {
    return;
  }

  const adminClient = createAdminClient();
  const { count, error } = await adminClient
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin")
    .eq("is_active", true);

  if (error) {
    throw new Error("Could not verify the active administrator count.");
  }

  if ((count ?? 0) <= 1) {
    throw new Error("The final active administrator cannot be deactivated or changed to veterinarian.");
  }
}

export async function listStaff(): Promise<StaffMember[]> {
  await getAdminActor();

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("profiles")
    .select("id, email, full_name, role, is_active, created_at")
    .in("role", ["admin", "veterinarian"])
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error("Could not load clinic staff.");
  }

  return data;
}

export async function inviteStaff(input: { email: string; fullName: string; role: string }): Promise<StaffActionResult> {
  try {
    const actor = await getAdminActor();
    const email = input.email.trim().toLowerCase();
    const fullName = normalizeText(input.fullName);
    const role = parseStaffRole(input.role);

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return { error: "Enter a valid staff email address." };
    }
    if (!fullName) {
      return { error: "Enter the staff member's full name." };
    }
    if (!role) {
      return { error: "Choose an administrator or veterinarian role." };
    }

    const adminClient = createAdminClient();
    const origin = process.env.NEXT_PUBLIC_SITE_URL;
    const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
      data: { full_name: fullName },
      redirectTo: origin ? `${origin}/auth/callback?next=/dashboard` : undefined,
    });

    if (error || !data.user) {
      return { error: error?.message ?? "Could not send the staff invitation." };
    }

    const { error: profileError } = await adminClient
      .from("profiles")
      .update({ full_name: fullName, role, is_active: true })
      .eq("id", data.user.id);

    if (profileError) {
      return { error: "The invitation was created, but the staff role could not be assigned." };
    }

    await writeAuditLog(actor.id, data.user.id, "staff_invited", {}, { email, full_name: fullName, role, is_active: true });
    revalidatePath("/dashboard/team");
    return { success: `Invitation sent to ${email}.` };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not invite staff." };
  }
}

export async function updateStaff(input: { id: string; fullName: string; role: string }): Promise<StaffActionResult> {
  try {
    const actor = await getAdminActor();
    const fullName = normalizeText(input.fullName);
    const role = parseStaffRole(input.role);
    if (!input.id || !fullName || !role) {
      return { error: "Provide a name and valid staff role." };
    }

    const adminClient = createAdminClient();
    const { data: target, error: targetError } = await adminClient
      .from("profiles")
      .select("id, email, full_name, role, is_active, created_at")
      .eq("id", input.id)
      .single();

    if (targetError || !target || (target.role !== "admin" && target.role !== "veterinarian")) {
      return { error: "That staff account is not available." };
    }

    await assertNotFinalActiveAdmin(target, role, target.is_active);
    const { error: updateError } = await adminClient
      .from("profiles")
      .update({ full_name: fullName, role })
      .eq("id", target.id);

    if (updateError) {
      return { error: "Could not update the staff account." };
    }

    await writeAuditLog(
      actor.id,
      target.id,
      "staff_updated",
      { full_name: target.full_name, role: target.role, is_active: target.is_active },
      { full_name: fullName, role, is_active: target.is_active },
    );
    revalidatePath("/dashboard/team");
    return { success: "Staff account updated." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not update the staff account." };
  }
}

export async function setStaffActive(input: { id: string; isActive: boolean }): Promise<StaffActionResult> {
  try {
    const actor = await getAdminActor();
    if (!input.id) {
      return { error: "Choose a staff account first." };
    }

    const adminClient = createAdminClient();
    const { data: target, error: targetError } = await adminClient
      .from("profiles")
      .select("id, email, full_name, role, is_active, created_at")
      .eq("id", input.id)
      .single();

    if (targetError || !target || (target.role !== "admin" && target.role !== "veterinarian")) {
      return { error: "That staff account is not available." };
    }

    await assertNotFinalActiveAdmin(target, target.role, input.isActive);
    const { error: updateError } = await adminClient
      .from("profiles")
      .update({ is_active: input.isActive })
      .eq("id", target.id);
    if (updateError) {
      return { error: "Could not update the staff account status." };
    }

    const { error: authError } = await adminClient.auth.admin.updateUserById(target.id, {
      ban_duration: input.isActive ? "none" : "876000h",
    });
    if (authError) {
      await adminClient.from("profiles").update({ is_active: target.is_active }).eq("id", target.id);
      return { error: "Could not update sign-in access for this staff account." };
    }

    await writeAuditLog(
      actor.id,
      target.id,
      input.isActive ? "staff_reactivated" : "staff_deactivated",
      { is_active: target.is_active },
      { is_active: input.isActive },
    );
    revalidatePath("/dashboard/team");
    return { success: input.isActive ? "Staff account reactivated." : "Staff account deactivated." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not update the staff account status." };
  }
}
