"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, Plus, ExternalLink } from "lucide-react";
import { listOwnerAppointments, listAppointments } from "@/services/appointments";
import type { UserRole } from "@/lib/dashboard-features";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function fmtDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(iso));
}
function fmtTime(iso: string) {
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(new Date(iso));
}

const STATUS_STYLES: Record<string, string> = {
  requested: "bg-amber-100 text-amber-800 border-amber-200",
  scheduled: "bg-blue-100 text-blue-800 border-blue-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
  no_show: "bg-gray-100 text-gray-800 border-gray-200",
};

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_STYLES[status] ?? "bg-muted text-muted-foreground border-border";
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${cls}`}>
      {status.replace("_", " ")}
    </span>
  );
}

export function AppointmentsTab({ role, userId }: { role: UserRole; userId: string }) {
  const router = useRouter();
  const [appointments, setAppointments] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    async function load() {
      try {
        const data =
          role === "owner"
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
          <Link
            href="/dashboard/appointments/new"
            className="inline-flex min-h-12 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Plus className="mr-2 h-4 w-4" strokeWidth={1.5} />
            Request appointment
          </Link>
        )}
      </div>

      {isLoading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="h-40 animate-pulse rounded-2xl bg-muted" />
          <div className="h-40 animate-pulse rounded-2xl bg-muted" />
        </div>
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
            <Card key={app.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg">{app.pets?.name || "Unknown Pet"}</CardTitle>
                    <CardDescription className="mt-1">
                      {app.services?.name || "General Visit"}
                    </CardDescription>
                  </div>
                  <StatusBadge status={app.status} />
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="text-sm space-y-2">
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">Date</span>
                    <span className="font-medium">
                      {app.scheduled_start
                        ? fmtDate(app.scheduled_start)
                        : app.preferred_date || "TBD"}
                    </span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">Time</span>
                    <span className="font-medium">
                      {app.scheduled_start
                        ? fmtTime(app.scheduled_start)
                        : app.preferred_time || "TBD"}
                    </span>
                  </div>
                  {app.reason && (
                    <div className="pt-1">
                      <span className="text-muted-foreground block mb-1">Reason for visit</span>
                      <p className="text-foreground line-clamp-2">{app.reason}</p>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => router.push(`/dashboard/appointments/${app.id}`)}
                >
                  <ExternalLink className="h-4 w-4" />
                  View details
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}