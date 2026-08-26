"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Calendar, ArrowLeft, ArrowRight } from "lucide-react";

import { listAppointmentSchedules, createAppointmentSchedule, updateAppointmentSchedule, deleteAppointmentSchedule } from "@/services/appointments";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function SchedulesTab({ role }: { role: string }) {
  return <SchedulesPage />;
}

function SchedulesPage() {
  const router = useRouter();

  const [schedules, setSchedules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newSchedule, setNewSchedule] = useState({
    specificDate: "" as string,
    startTime: "09:00" as string,
    endTime: "17:00" as string,
    maxCapacity: 3 as number,
    isClosed: false as boolean,
  });
  const [editingSchedule, setEditingSchedule] = useState<any | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    setIsLoading(true);
    try {
      const data = await listAppointmentSchedules();
      setSchedules(data);
    } catch (error) {
      console.error("Failed to load schedules:", error);
      toast.error("Failed to load appointment schedules");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormErrors({});

    const { specificDate, startTime, endTime, maxCapacity, isClosed } = newSchedule;

    if (!specificDate || !startTime || !endTime) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (maxCapacity <= 0) {
      toast.error("Max capacity must be greater than 0");
      return;
    }

    // Validate date format YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(specificDate)) {
      toast.error("Please enter a valid date in YYYY-MM-DD format");
      return;
    }

    // Parse date to get day of week (0=Sunday, 6=Saturday)
    const dateObj = new Date(`${specificDate}T00:00:00`);
    const dayOfWeek = isNaN(dateObj.getDay()) ? 0 : dateObj.getDay();

    // Ensure TIME format is HH:MM:SS for PostgreSQL
    const formatTime = (time: string) => {
      // If time is already in HH:MM:SS format, return as-is
      if (/^\d{2}:\d{2}:\d{2}$/.test(time)) {
        return time;
      }
      // If time is in HH:MM format, append :00 for seconds
      if (/^\d{2}:\d{2}$/.test(time)) {
        return `${time}:00`;
      }
      // Fallback - should not happen with proper form validation
      return time;
    };

    if (editingSchedule) {
      try {
        await updateAppointmentSchedule(editingSchedule.id, {
          specific_date: specificDate,
          start_time: formatTime(startTime),
          end_time: formatTime(endTime),
          max_capacity: maxCapacity,
          day_of_week: dayOfWeek,
          is_closed: isClosed,
        });
        setFormErrors({});
        setNewSchedule({
          specificDate: "",
          startTime: "09:00",
          endTime: "17:00",
          maxCapacity: 3,
          isClosed: false,
        });
        setEditingSchedule(null);
        fetchSchedules();
        toast.success("Schedule updated successfully");
      } catch (error: any) {
        toast.error(error.message || "Failed to update schedule");
      }
    } else {
      try {
        await createAppointmentSchedule({
          specific_date: specificDate,
          start_time: formatTime(startTime),
          end_time: formatTime(endTime),
          max_capacity: maxCapacity,
          day_of_week: dayOfWeek,
          is_closed: isClosed,
        });
        setFormErrors({});
        setNewSchedule({
          specificDate: "",
          startTime: "09:00",
          endTime: "17:00",
          maxCapacity: 3,
          isClosed: false,
        });
        fetchSchedules();
        toast.success("Schedule created successfully");
      } catch (error: any) {
        toast.error(error.message || "Failed to create schedule");
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this schedule?")) {
      try {
        await deleteAppointmentSchedule(id);
        fetchSchedules();
        toast.success("Schedule deleted successfully");
      } catch (error: any) {
        toast.error(error.message || "Failed to delete schedule");
      }
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl py-8">
      <div className="bg-card border border-border rounded-2xl p-6 sm:p-8">
        <h2 className="text-2xl font-semibold text-foreground tracking-tight mb-6">
          Manage Appointment Schedules
        </h2>

        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-3 mb-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Date
            </label>
            <input
              type="date"
              value={newSchedule.specificDate}
              onChange={(e) =>
                setNewSchedule((prev) => ({ ...prev, specificDate: e.target.value as string }))
              }
              className="block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              min={new Date().toISOString().split("T")[0]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Start Time (HH:MM)
            </label>
            <input
              type="time"
              value={newSchedule.startTime}
              onChange={(e) =>
                setNewSchedule((prev) => ({ ...prev, startTime: e.target.value as string }))
              }
              className="block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              End Time (HH:MM)
            </label>
            <input
              type="time"
              value={newSchedule.endTime}
              onChange={(e) =>
                setNewSchedule((prev) => ({ ...prev, endTime: e.target.value as string }))
              }
              className="block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Max Capacity per Slot
            </label>
            <input
              type="number"
              value={newSchedule.maxCapacity}
              onChange={(e) =>
                setNewSchedule((prev) => ({ ...prev, maxCapacity: Number(e.target.value as string) }))
              }
              className="block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              min="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Is Closed
            </label>
            <select
              value={newSchedule.isClosed ? "true" : "false"}
              onChange={(e) =>
                setNewSchedule((prev) => ({ ...prev, isClosed: e.target.value === "true" }))
              }
              className="block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="false">Open</option>
              <option value="true">Closed</option>
            </select>
          </div>

          <Button type="submit">
            {editingSchedule ? "Update Schedule" : "Add Schedule"}
          </Button>
        </form>

        <div className="mt-8">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Existing Schedules
          </h3>

          {isLoading ? (
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="h-40 animate-pulse rounded-2xl bg-muted" />
              <div className="h-40 animate-pulse rounded-2xl bg-muted" />
              <div className="h-40 animate-pulse rounded-2xl bg-muted" />
            </div>
          ) : schedules.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-3" strokeWidth={1.5} />
              <p>No appointment schedules configured yet</p>
              <p className="mt-2 text-sm">
                Admins can create specific-date schedules with date, time range, and max capacity per slot
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {schedules.map((schedule) => {
                const isSpecificDate = !!schedule.specific_date;
                const dateDisplay = isSpecificDate
                  ? new Date(schedule.specific_date).toLocaleDateString(undefined, {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })
                  : `${schedule.start_time} - ${schedule.end_time}`;

                return (
                  <div
                    key={schedule.id}
                    className="rounded-lg border border-border bg-card p-4 sm:p-6 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-foreground">{dateDisplay}</span>
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">
                      <span className="font-medium">Time:</span> {schedule.start_time} - {schedule.end_time}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">Max Capacity:</span> {schedule.max_capacity}
                      {schedule.is_closed && <span className="text-destructive ml-2 font-medium">Closed</span>}
                    </div>
                    <div className="mt-2">
                      <span className="text-xs text-primary cursor-pointer" onClick={() => setEditingSchedule(schedule)}>
                        Edit
                      </span>
                      <span className="ml-2 text-destructive cursor-pointer" onClick={() => handleDelete(schedule.id)}>
                        Delete
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}