"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, Loader2, ShieldCheck, Stethoscope, UserCog, UserPlus, UserRoundCheck, UserRoundX, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { addExistingStaff, setStaffActive, updateStaffRole, type StaffMember } from "@/services/staff";

type StaffRole = "admin" | "veterinarian";

const inputClass = "min-h-12 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none ring-ring focus:ring-2";

function RoleBadge({ role }: { role: StaffRole }) {
  const Icon = role === "admin" ? ShieldCheck : Stethoscope;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground">
      <Icon className="size-3.5" />
      {role === "admin" ? "Administrator" : "Veterinarian"}
    </span>
  );
}

function roleLabel(role: StaffRole) {
  return role === "admin" ? "Administrator" : "Veterinarian";
}

function staffName(member: StaffMember) {
  return member.full_name?.trim() || "Name not set";
}

export function StaffManagement({ staff }: { staff: StaffMember[] }) {
  const [isPending, startTransition] = useTransition();
  const [newStaff, setNewStaff] = useState({ email: "", role: "veterinarian" as StaffRole });
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [roleDrafts, setRoleDrafts] = useState<Record<string, StaffRole>>({});
  const [confirmation, setConfirmation] = useState<
    | { id: string; kind: "role"; nextRole: StaffRole }
    | { id: string; kind: "status"; nextIsActive: boolean }
    | null
  >(null);

  const activeAdminCount = staff.filter((member) => member.role === "admin" && member.is_active).length;

  function run(action: () => Promise<{ error?: string; success?: string }>) {
    startTransition(async () => {
      const result = await action();
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (result.success) toast.success(result.success);
      setConfirmation(null);
      setEditingRoleId(null);
    });
  }

  function isFinalActiveAdmin(member: StaffMember) {
    return member.role === "admin" && member.is_active && activeAdminCount <= 1;
  }

  const statusConfirmation = confirmation?.kind === "status" ? confirmation : null;
  const confirmedMember = statusConfirmation ? staff.find((member) => member.id === statusConfirmation.id) : null;

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-border bg-card p-4 sm:p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-foreground">Add a staff member</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            The person must create an E-VetDoc account first. Add the email they used, then choose their clinic role.
          </p>
        </div>
        <form
          className="grid gap-4 md:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            run(async () => {
              const result = await addExistingStaff(newStaff);
              if (result.success) setNewStaff({ email: "", role: "veterinarian" });
              return result;
            });
          }}
        >
          <label className="space-y-2 text-sm font-medium text-foreground">
            Email address
            <input className={inputClass} type="email" value={newStaff.email} onChange={(event) => setNewStaff({ ...newStaff, email: event.target.value })} required />
          </label>
          <label className="space-y-2 text-sm font-medium text-foreground">
            Staff role
            <select className={inputClass} value={newStaff.role} onChange={(event) => setNewStaff({ ...newStaff, role: event.target.value as StaffRole })}>
              <option value="veterinarian">Veterinarian</option>
              <option value="admin">Administrator</option>
            </select>
          </label>
          <div className="flex items-end md:col-span-2">
            <Button className="w-full" type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
              Add to team
            </Button>
          </div>
        </form>
      </section>

      <section className="rounded-lg border border-border bg-card">
        <div className="border-b border-border p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-foreground">Clinic staff</h3>
          <p className="mt-1 text-sm text-muted-foreground">Update roles or suspend a staff account. Every change is recorded.</p>
        </div>
        <div className="border-b border-border bg-muted px-4 py-3 text-sm text-muted-foreground sm:px-6">
          Keep at least one active administrator. Role and access changes are recorded for audit.
        </div>
        {staff.length === 0 ? (
          <div className="flex min-h-48 flex-col items-center justify-center gap-3 p-6 text-center">
            <UserRoundCheck className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No staff accounts have been added yet.</p>
          </div>
        ) : (
          <div className="grid gap-4 p-4 sm:p-6">
            {staff.map((member) => {
              const currentRole = member.role as StaffRole;
              const draftRole = roleDrafts[member.id] ?? currentRole;
              const editingRole = editingRoleId === member.id;
              const memberConfirmation = confirmation?.id === member.id ? confirmation : null;
              const finalAdmin = isFinalActiveAdmin(member);
              return (
                <article
                  key={member.id}
                  className="rounded-lg border border-border bg-background p-4"
                >
                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                    <div className="min-w-0 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-base font-semibold text-foreground">{staffName(member)}</p>
                        <RoleBadge role={currentRole} />
                        <span className={member.is_active ? "text-xs font-medium text-primary" : "text-xs font-medium text-destructive"}>
                          {member.is_active ? "Active" : "Deactivated"}
                        </span>
                      </div>
                      <p className="truncate text-sm text-muted-foreground">{member.email ?? "No email available"}</p>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2 lg:min-w-96">
                      <Button
                        type="button"
                        variant="outline"
                        disabled={isPending}
                        onClick={() => {
                          setConfirmation(null);
                          setRoleDrafts({ ...roleDrafts, [member.id]: currentRole });
                          setEditingRoleId(editingRole ? null : member.id);
                        }}
                      >
                        <UserCog className="size-4" />
                        Change role
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={isPending}
                        onClick={() => {
                          setEditingRoleId(null);
                          setConfirmation({ id: member.id, kind: "status", nextIsActive: !member.is_active });
                        }}
                      >
                        {member.is_active ? <UserRoundX className="size-4" /> : <UserRoundCheck className="size-4" />}
                        {member.is_active ? "Deactivate" : "Reactivate"}
                      </Button>
                    </div>
                  </div>

                  {editingRole ? (
                    <div className="mt-4 rounded-md border border-border bg-card p-4">
                      <label className="space-y-2 text-sm font-medium text-foreground">
                        New role
                        <select className={inputClass} value={draftRole} onChange={(event) => setRoleDrafts({ ...roleDrafts, [member.id]: event.target.value as StaffRole })}>
                          <option value="veterinarian">Veterinarian</option>
                          <option value="admin">Administrator</option>
                        </select>
                      </label>
                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        <Button
                          type="button"
                          disabled={isPending || draftRole === currentRole}
                          onClick={() => setConfirmation({ id: member.id, kind: "role", nextRole: draftRole })}
                        >
                          <ShieldCheck className="size-4" />
                          Review role change
                        </Button>
                        <Button type="button" variant="outline" disabled={isPending} onClick={() => setEditingRoleId(null)}>
                          <X className="size-4" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : null}

                  {memberConfirmation?.kind === "role" ? (
                    <div className="mt-4 rounded-md border border-border bg-muted p-4">
                      <div className="flex gap-3">
                        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" />
                        <div className="space-y-2">
                          <p className="font-medium text-foreground">
                            {memberConfirmation.kind === "role"
                              ? `Change ${staffName(member)} to ${roleLabel(memberConfirmation.nextRole)}?`
                              : `${memberConfirmation.nextIsActive ? "Reactivate" : "Deactivate"} ${staffName(member)}?`}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {memberConfirmation.kind === "role" && finalAdmin && memberConfirmation.nextRole !== "admin"
                              ? "This is the final active administrator. Add another active administrator before changing this role."
                              : memberConfirmation.kind === "status" && finalAdmin && !memberConfirmation.nextIsActive
                                ? "This is the final active administrator. Add another active administrator before deactivating this account."
                                : "This action changes staff access and will be recorded in the audit log."}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        <Button
                          type="button"
                          disabled={
                            isPending ||
                            (memberConfirmation.kind === "role" && finalAdmin && memberConfirmation.nextRole !== "admin") ||
                            (memberConfirmation.kind === "status" && finalAdmin && !memberConfirmation.nextIsActive)
                          }
                          onClick={() => {
                            if (memberConfirmation.kind === "role") {
                              run(() => updateStaffRole({ id: member.id, role: memberConfirmation.nextRole }));
                              return;
                            }
                            run(() => setStaffActive({ id: member.id, isActive: memberConfirmation.nextIsActive }));
                          }}
                        >
                          {isPending ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
                          Confirm
                        </Button>
                        <Button type="button" variant="outline" disabled={isPending} onClick={() => setConfirmation(null)}>
                          <X className="size-4" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </section>
      <ConfirmationDialog
        open={Boolean(statusConfirmation && confirmedMember)}
        title={`${statusConfirmation?.nextIsActive ? "Reactivate" : "Deactivate"} ${confirmedMember ? staffName(confirmedMember) : "staff member"}?`}
        description={
          statusConfirmation?.nextIsActive
            ? "This restores the staff member's dashboard access and will be recorded in the audit log."
            : "This removes the staff member's dashboard access and will be recorded in the audit log."
        }
        confirmLabel={statusConfirmation?.nextIsActive ? "Reactivate staff member" : "Deactivate staff member"}
        isPending={isPending}
        onOpenChange={(open) => {
          if (!open) setConfirmation(null);
        }}
        onConfirm={() => {
          if (!statusConfirmation) return;
          run(() => setStaffActive({ id: statusConfirmation.id, isActive: statusConfirmation.nextIsActive }));
        }}
      />
    </div>
  );
}
