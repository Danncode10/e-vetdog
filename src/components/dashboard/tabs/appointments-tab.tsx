"use client";

import Link from "next/link";
import { CalendarDays, Plus } from "lucide-react";

export function AppointmentsTab() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-foreground tracking-tight">Appointments</h2>
          <p className="mt-1 text-[14px] text-muted-foreground">
            Manage appointment requests, scheduling, and check-ins.
          </p>
        </div>
        <Link href="/dashboard/appointments/new" className="inline-flex min-h-12 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          <Plus className="mr-2 h-4 w-4" strokeWidth={1.5} />
          Request appointment
        </Link>
      </div>

      <div className="rounded-2xl border border-border bg-card p-12 text-center">
        <CalendarDays className="w-10 h-10 text-muted-foreground mx-auto mb-3" strokeWidth={1.5} />
        <p className="text-[14px] text-muted-foreground">
          No appointments yet. Schedule a visit to get started.
        </p>
      </div>
    </div>
  );
}