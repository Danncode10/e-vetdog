"use client";

import * as React from "react";
import Link from "next/link";
import { CalendarDays, Plus } from "lucide-react";
import { listOwnerAppointments, listAppointments } from "@/services/appointments";
import type { UserRole } from "@/lib/dashboard-features";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

function fmtDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(iso));
}
function fmtTime(iso: string) {
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(new Date(iso));
}

export function AppointmentsTab({ role, userId }: { role: UserRole, userId: string }) {
  const [appointments, setAppointments] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    async function load() {
      try {
        const data = role === "owner" 
          ? await listOwnerAppointments(userId)
          : await listAppointments();
        setAppointments(data);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [role, userId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-foreground tracking-tight">Appointments</h2>
          <p className="mt-1 text-[14px] text-muted-foreground">
            Manage appointment requests, scheduling, and check-ins.
          </p>
        </div>
        {role === "owner" && (
          <Link href="/dashboard/appointments/new" className="inline-flex min-h-12 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            <Plus className="mr-2 h-4 w-4" strokeWidth={1.5} />
            Request appointment
          </Link>
        )}
      </div>

      {isLoading ? (
        <div className="h-32 animate-pulse rounded-2xl bg-muted" />
      ) : appointments.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <CalendarDays className="w-10 h-10 text-muted-foreground mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-[14px] text-muted-foreground">
            No appointments yet. Schedule a visit to get started.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {appointments.map((app) => (
            <Card key={app.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{app.pets?.name || "Unknown Pet"}</CardTitle>
                <CardDescription className="mt-1">
                  {app.services?.name || "General Visit"} · Status: <span className="capitalize font-medium text-primary">{app.status.replace('_', ' ')}</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-2">
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">Date</span>
                    <span className="font-medium">{app.scheduled_start ? fmtDate(app.scheduled_start) : (app.preferred_date || "TBD")}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">Time</span>
                    <span className="font-medium">{app.scheduled_start ? fmtTime(app.scheduled_start) : (app.preferred_time || "TBD")}</span>
                  </div>
                  {app.reason && (
                    <div className="pt-1">
                      <span className="text-muted-foreground block mb-1">Reason for visit</span>
                      <p className="text-foreground">{app.reason}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}