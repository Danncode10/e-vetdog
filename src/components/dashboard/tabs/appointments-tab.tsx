"use client";

import { CalendarDays, Loader2, Plus } from "lucide-react";

export function AppointmentsTab() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground tracking-tight">Appointments</h2>
          <p className="mt-1 text-[14px] text-muted-foreground">
            Manage appointment requests, scheduling, and check-ins.
          </p>
        </div>
        <button className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-[13px] font-medium hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" />
          New Appointment
        </button>
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