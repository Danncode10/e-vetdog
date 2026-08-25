"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Calendar } from "lucide-react";

import { listAppointmentSchedules, createAppointmentSchedule, updateAppointmentSchedule, deleteAppointmentSchedule } from "@/services/appointments";
import { Button } from "@/components/ui/button";

export function SchedulesTab({ role }: { role: string }) {
  // Render the SchedulesPage content
  return <SchedulesPage />;
}

function SchedulesPage() {
  const router = useRouter();

  const [schedules, setSchedules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newSchedule, setNewSchedule] = useState({
    dayOfWeek: 0,
    startTime: "09:00" as string,
    endTime: "17:00" as string,
    maxCapacity: 3 as number,
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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormErrors({});

    const { dayOfWeek, startTime, endTime, maxCapacity } = newSchedule;

    if (dayOfWeek === undefined || dayOfWeek === null || !startTime || !endTime) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (maxCapacity <= 0) {
      toast.error("Max capacity must be greater than 0");
      return;
    }

    if (editingSchedule) {
      try {
        await updateAppointmentSchedule(editingSchedule.id, {
          day_of_week: dayOfWeek,
          start_time: startTime,
          end_time: endTime,
          max_capacity: maxCapacity,
        });
        setFormErrors({});
        setNewSchedule({
          dayOfWeek: 0,
          startTime: "09:00",
          endTime: "17:00",
          maxCapacity: 3,
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
          day_of_week: dayOfWeek,
          start_time: startTime,
          end_time: endTime,
          max_capacity: maxCapacity,
        });
        setFormErrors({});
        setNewSchedule({
          dayOfWeek: 0,
          startTime: "09:00",
          endTime: "17:00",
          maxCapacity: 3,
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

  const dayOptions = [
    { value: 0, label: "Sunday" },
    { value: 1, label: "Monday" },
    { value: 2, label: "Tuesday" },
    { value: 3, label: "Wednesday" },
    { value: 4, label: "Thursday" },
    { value: 5, label: "Friday" },
    { value: 6, label: "Saturday" },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl py-8">
      <div className="bg-card border border-border rounded-2xl p-6 sm:p-8">
        <h2 className="text-2xl font-semibold text-foreground tracking-tight mb-6">
          Manage Appointment Schedules
        </h2>

        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-3 mb-8">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Day of Week
            </label>
            <select
              onChange={(e) =>
                setNewSchedule((prev) => ({ ...prev, dayOfWeek: Number(e.target.value as string) }))
              }
              className="block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="0" disabled>
                {isLoading ? "Loading..." : "Select a day"}
              </option>
              {dayOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
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

          <Button type="submit">
            {editingSchedule ? "Update Schedule" : "Add Schedule"}
          </Button>
        </form>

        {editingSchedule && (
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Editing: {editingSchedule.day_of_week_label || editingSchedule.day_of_week}
            </h3>
            <p className="text-sm text-muted-foreground">
              Start: {editingSchedule.start_time} &nbsp;|&nbsp; End: {editingSchedule.end_time}
            </p>
            <p className="text-sm text-muted-foreground">
              Max Capacity: {editingSchedule.max_capacity}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditingSchedule(null)}
            >
              Cancel
            </Button>
          </div>
        )}

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
                Admins can create weekly schedules with day, time range, and max capacity per slot
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {schedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="rounded-lg border border-border bg-card p-4 sm:p-6 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-foreground">
                      {schedule.day_of_week_label || schedule.day_of_week}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">
                    <span className="font-medium">Time:</span> {schedule.start_time} - {schedule.end_time}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">Max Capacity:</span> {schedule.max_capacity}
                    <span className="ml-2 text-primary cursor-pointer" onClick={() => setEditingSchedule(schedule)}>
                      Edit
                    </span>
                    <span className="ml-2 text-destructive cursor-pointer" onClick={() => handleDelete(schedule.id)}>
                      Delete
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}