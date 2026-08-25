"use client";

import * as React from "react";
import { CalendarDays, Plus, Clock, Check, X, RefreshCw } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  listAppointments,
  createCheckIn,
  updateCheckIn,
  getCheckInByAppointmentId,
  completeAppointment,
  markNoShow,
} from "@/services/appointments";
import type { UserRole } from "@/lib/dashboard-features";

type AppointmentRow = Awaited<ReturnType<typeof listAppointments>>[number];
type CheckInRow = NonNullable<Awaited<ReturnType<typeof getCheckInByAppointmentId>>>;
type AppointmentFilters = Parameters<typeof listAppointments>[0];

function fmtDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(iso));
}
function fmtTime(iso: string) {
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(new Date(iso));
}
function fmtDateTime(iso: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(iso));
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

export function ClinicTab({ role, userId }: { role: UserRole; userId: string }) {
  const [selectedDate, setSelectedDate] = React.useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0]; // YYYY-MM-DD
  });
  const [appointments, setAppointments] = React.useState<AppointmentRow[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [checkInMap, setCheckInMap] = React.useState<Record<string, CheckInRow | null>>({});
  const [dateError, setDateError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function load() {
      try {
        setIsLoading(true);
        setDateError(null);
        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(selectedDate);
        endOfDay.setHours(23, 59, 59, 999);

        const filters: AppointmentFilters = {
          fromDate: startOfDay.toISOString(),
          toDate: endOfDay.toISOString(),
        };

        // If veterinarian, filter by their ID; if admin, show all
        if (role === "veterinarian") {
          filters.veterinarianId = userId;
        }

        const data = await listAppointments(filters);
        setAppointments(data);

        // Fetch check-ins for these appointments to show check-in status
        const checkInPromises = data.map(async (appointment) => {
          try {
            const checkIn = await getCheckInByAppointmentId(appointment.id);
            return { appointmentId: appointment.id, checkIn };
          } catch {
            // If no check-in found, return null
            return { appointmentId: appointment.id, checkIn: null };
          }
        });

        const checkInResults = await Promise.all(checkInPromises);
        const newCheckInMap: Record<string, CheckInRow | null> = {};
        checkInResults.forEach(({ appointmentId, checkIn }) => {
          newCheckInMap[appointmentId] = checkIn;
        });
        setCheckInMap(newCheckInMap);
      } catch (error) {
        console.error("Failed to load clinic schedule:", error);
        setDateError("Failed to load schedule. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }

    if (selectedDate) {
      load();
    }
  }, [selectedDate, role, userId]);

  const handleCheckIn = async (appointmentId: string) => {
    try {
      const appointment = appointments.find((a) => a.id === appointmentId);
      if (!appointment) throw new Error("Appointment not found");

      const checkInInput = {
        appointment_id: appointmentId,
        pet_id: appointment.pet_id,
        owner_id: appointment.owner_id,
        walk_in: false,
      };

      await createCheckIn(checkInInput);
      // Refetch check-in map for this appointment
      const checkIn = await getCheckInByAppointmentId(appointmentId);
      setCheckInMap((prev) => ({
        ...prev,
        [appointmentId]: checkIn,
      }));
    } catch {
      console.error("Failed to check-in:", error);
      alert("Failed to check-in. Please try again.");
    }
  };

  const handleStartService = async (appointmentId: string) => {
    try {
      const checkIn = checkInMap[appointmentId];
      if (!checkIn) throw new Error("Check-in not found");

      await updateCheckIn(checkIn.id, {
        service_start: new Date().toISOString(),
      });
      setCheckInMap((prev) => ({
        ...prev,
        [appointmentId]: {
          ...checkIn,
          service_start: new Date().toISOString(),
        },
      }));
    } catch {
      console.error("Failed to start service:", error);
      alert("Failed to start service. Please try again.");
    }
  };

  const handleEndService = async (appointmentId: string) => {
    try {
      const checkIn = checkInMap[appointmentId];
      if (!checkIn) throw new Error("Check-in not found");

      await updateCheckIn(checkIn.id, {
        service_end: new Date().toISOString(),
      });
      setCheckInMap((prev) => ({
        ...prev,
        [appointmentId]: {
          ...checkIn,
          service_end: new Date().toISOString(),
        },
      }));
    } catch (error) {
      console.error("Failed to end service:", error);
      alert("Failed to end service. Please try again.");
    }
  };

  const handleCompleteAppointment = async (appointmentId: string) => {
    try {
      await completeAppointment(appointmentId);
      // Refetch appointments to update status
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);
      const filters: AppointmentFilters = {
        fromDate: startOfDay.toISOString(),
        toDate: endOfDay.toISOString(),
      };
      if (role === "veterinarian") {
        filters.veterinarianId = userId;
      }
      const data = await listAppointments(filters);
      setAppointments(data);
      // Also refetch check-ins for the new data
      const checkInPromises = data.map(async (appointment) => {
        try {
          const checkIn = await getCheckInByAppointmentId(appointment.id);
          return { appointmentId: appointment.id, checkIn };
        } catch {
          return { appointmentId: appointment.id, checkIn: null };
        }
      });
      const checkInResults = await Promise.all(checkInPromises);
      const newCheckInMap: Record<string, CheckInRow | null> = {};
      checkInResults.forEach(({ appointmentId, checkIn }) => {
        newCheckInMap[appointmentId] = checkIn;
      });
      setCheckInMap(newCheckInMap);
    } catch (error) {
      console.error("Failed to complete appointment:", error);
      alert("Failed to complete appointment. Please try again.");
    }
  };

  const handleMarkNoShow = async (appointmentId: string) => {
    try {
      await markNoShow(appointmentId);
      // Refetch appointments to update status
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);
      const filters: AppointmentFilters = {
        fromDate: startOfDay.toISOString(),
        toDate: endOfDay.toISOString(),
      };
      if (role === "veterinarian") {
        filters.veterinarianId = userId;
      }
      const data = await listAppointments(filters);
      setAppointments(data);
      // Also refetch check-ins for the new data
      const checkInPromises = data.map(async (appointment) => {
        try {
          const checkIn = await getCheckInByAppointmentId(appointment.id);
          return { appointmentId: appointment.id, checkIn };
        } catch {
          return { appointmentId: appointment.id, checkIn: null };
        }
      });
      const checkInResults = await Promise.all(checkInPromises);
      const newCheckInMap: Record<string, CheckInRow | null> = {};
      checkInResults.forEach(({ appointmentId, checkIn }) => {
        newCheckInMap[appointmentId] = checkIn;
      });
      setCheckInMap(newCheckInMap);
    } catch (error) {
      console.error("Failed to mark no-show:", error);
      alert("Failed to mark no-show. Please try again.");
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value;
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleToday = () => {
    const today = new Date();
    setSelectedDate(today.toISOString().split("T")[0]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
          <h2 className="text-2xl font-semibold text-foreground tracking-tight">
            Clinic Schedule
          </h2>
          <p className="mt-1 text-[14px] text-muted-foreground">
            Manage today&apos;s appointments, check-ins, and clinic flow.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
          <div className="flex items-center gap-2">
            <label htmlFor="clinic-date" className="text-sm font-medium text-foreground">Date</label>
            <input
              id="clinic-date"
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              className="min-h-12 w-32 rounded-md border border-input bg-background px-3 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-40"
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleToday}
              className="ml-2"
            >
              Today
            </Button>
          </div>
          {dateError && (
            <p className="mt-2 text-destructive text-sm">
              {dateError}
            </p>
          )}
        </div>
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
            No appointments scheduled for {new Date(selectedDate).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}.
          </p>
          <div className="mt-4">
            <Button variant="outline" onClick={handleToday}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Show today
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {appointments.map((app) => (
            <Card key={app.id} className="flex flex-col h-full">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg">{app.pets?.name || "Unknown Pet"}</CardTitle>
                    <CardDescription className="mt-1 text-sm">
                      {app.owner?.full_name || "Unknown Owner"}
                    </CardDescription>
                  </div>
                  <StatusBadge status={app.status} />
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
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
                  {app.notes && (
                    <div className="pt-1">
                      <span className="text-muted-foreground block mb-1">Notes</span>
                      <p className="text-foreground line-clamp-2">{app.notes}</p>
                    </div>
                  )}
                  {/* Check-in status */}
                  <div className="pt-2 border-t border-border">
                    <span className="text-muted-foreground font-medium">Check-in Status</span>
                    {checkInMap[app.id] ? (
                      <div className="mt-2 space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Arrived:</span>
                          <span className="font-medium">
                            {checkInMap[app.id]?.arrival_time
                              ? fmtDateTime(checkInMap[app.id].arrival_time)
                              : "Not checked in"}
                          </span>
                        </div>
                        {checkInMap[app.id]?.service_start && (
                          <div className="flex justify-between">
                            <span>Service Started:</span>
                            <span className="font-medium">
                              {fmtDateTime(checkInMap[app.id].service_start)}
                            </span>
                          </div>
                        )}
                        {checkInMap[app.id]?.service_end && (
                          <div className="flex justify-between">
                            <span>Service Ended:</span>
                            <span className="font-medium">
                              {fmtDateTime(checkInMap[app.id].service_end)}
                            </span>
                          </div>
                        )}
                        {checkInMap[app.id]?.notes && (
                          <div className="pt-1">
                            <span className="text-muted-foreground block mb-1">Check-in Notes</span>
                            <p className="text-foreground text-xs line-clamp-2">{checkInMap[app.id].notes}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="mt-2 text-muted-foreground">Not checked in</p>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-0 space-y-2">
                {/* Action buttons based on appointment status and check-in status */}
                {app.status === "requested" || app.status === "scheduled" ? (
                  <>
                    {(!checkInMap[app.id] || !checkInMap[app.id].id) && (
                      <Button
                        variant="default"
                        onClick={() => handleCheckIn(app.id)}
                        className="w-full justify-start"
                      >
                        <Plus className="mr-2 h-3 w-3" />
                        Check-in
                      </Button>
                    )}
                    {checkInMap[app.id] && checkInMap[app.id].id && !checkInMap[app.id].service_start && (
                      <Button
                        variant="default"
                        onClick={() => handleStartService(app.id)}
                        className="w-full justify-start"
                      >
                        <Clock className="mr-2 h-3 w-3" />
                        Start Service
                      </Button>
                    )}
                    {checkInMap[app.id] && checkInMap[app.id].service_start && !checkInMap[app.id].service_end && (
                      <Button
                        variant="default"
                        onClick={() => handleEndService(app.id)}
                        className="w-full justify-start"
                      >
                        <X className="mr-2 h-3 w-3" />
                        End Service
                      </Button>
                    )}
                    {checkInMap[app.id] && checkInMap[app.id].service_end && (
                      <>
                        <Button
                          variant="default"
                          onClick={() => handleCompleteAppointment(app.id)}
                          className="w-full justify-start"
                        >
                          <Check className="mr-2 h-3 w-3" />
                          Complete
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleMarkNoShow(app.id)}
                          className="mt-1 w-full justify-start border-destructive bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          <X className="mr-2 h-3 w-3" />
                          No-show
                        </Button>
                      </>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground text-center">
                    No actions available for {app.status.replace("_", " ")} appointments.
                  </p>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}