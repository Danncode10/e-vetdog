"use client";

import { useState, useTransition } from "react";
import { Loader2, MailPlus, ShieldCheck, Stethoscope, UserRoundCheck, UserRoundX } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { inviteStaff, setStaffActive, updateStaff, type StaffMember } from "@/services/staff";

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

export function StaffManagement({ staff }: { staff: StaffMember[] }) {
  const [isPending, startTransition] = useTransition();
  const [invite, setInvite] = useState({ email: "", fullName: "", role: "veterinarian" as StaffRole });
  const [editing, setEditing] = useState<Record<string, { fullName: string; role: StaffRole }>>({});

  function run(action: () => Promise<{ error?: string; success?: string }>) {
    startTransition(async () => {
      const result = await action();
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (result.success) toast.success(result.success);
    });
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-border bg-card p-4 sm:p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-foreground">Invite a staff member</h3>
          <p className="mt-1 text-sm text-muted-foreground">They will receive a confirmation email before they can sign in.</p>
        </div>
        <form
          className="grid gap-4 md:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            run(async () => {
              const result = await inviteStaff(invite);
              if (result.success) setInvite({ email: "", fullName: "", role: "veterinarian" });
              return result;
            });
          }}
        >
          <label className="space-y-2 text-sm font-medium text-foreground">
            Full name
            <input className={inputClass} value={invite.fullName} onChange={(event) => setInvite({ ...invite, fullName: event.target.value })} required />
          </label>
          <label className="space-y-2 text-sm font-medium text-foreground">
            Email address
            <input className={inputClass} type="email" value={invite.email} onChange={(event) => setInvite({ ...invite, email: event.target.value })} required />
          </label>
          <label className="space-y-2 text-sm font-medium text-foreground">
            Staff role
            <select className={inputClass} value={invite.role} onChange={(event) => setInvite({ ...invite, role: event.target.value as StaffRole })}>
              <option value="veterinarian">Veterinarian</option>
              <option value="admin">Administrator</option>
            </select>
          </label>
          <div className="flex items-end">
            <Button className="w-full" type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <MailPlus className="size-4" />}
              Send invitation
            </Button>
          </div>
        </form>
      </section>

      <section className="rounded-lg border border-border bg-card">
        <div className="border-b border-border p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-foreground">Clinic staff</h3>
          <p className="mt-1 text-sm text-muted-foreground">Update roles or suspend a staff account. Every change is recorded.</p>
        </div>
        {staff.length === 0 ? (
          <div className="flex min-h-48 flex-col items-center justify-center gap-3 p-6 text-center">
            <UserRoundCheck className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No staff accounts have been invited yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {staff.map((member) => {
              const form = editing[member.id] ?? { fullName: member.full_name ?? "", role: member.role as StaffRole };
              return (
                <form
                  key={member.id}
                  className="grid gap-4 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_11rem_auto] lg:items-end"
                  onSubmit={(event) => {
                    event.preventDefault();
                    run(() => updateStaff({ id: member.id, ...form }));
                  }}
                >
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-foreground">{member.email ?? "No email available"}</p>
                      <RoleBadge role={member.role as StaffRole} />
                      <span className={member.is_active ? "text-xs text-primary" : "text-xs text-destructive"}>{member.is_active ? "Active" : "Deactivated"}</span>
                    </div>
                    <label className="space-y-2 text-sm font-medium text-foreground">
                      Full name
                      <input className={inputClass} value={form.fullName} onChange={(event) => setEditing({ ...editing, [member.id]: { ...form, fullName: event.target.value } })} required />
                    </label>
                  </div>
                  <label className="space-y-2 text-sm font-medium text-foreground">
                    Role
                    <select className={inputClass} value={form.role} onChange={(event) => setEditing({ ...editing, [member.id]: { ...form, role: event.target.value as StaffRole } })}>
                      <option value="veterinarian">Veterinarian</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </label>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                    <Button type="submit" variant="outline" disabled={isPending}>Save changes</Button>
                    <Button type="button" variant="outline" disabled={isPending} onClick={() => run(() => setStaffActive({ id: member.id, isActive: !member.is_active }))}>
                      {member.is_active ? <UserRoundX className="size-4" /> : <UserRoundCheck className="size-4" />}
                      {member.is_active ? "Deactivate" : "Reactivate"}
                    </Button>
                  </div>
                </form>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
