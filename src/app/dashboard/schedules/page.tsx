"use client";

export default function SchedulesPageDefault() {
  return <SchedulesCalendarPage />;
}

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus, CalendarDays, Clock, Users, X, Pencil, Trash2 } from "lucide-react";
import { listAppointmentSchedules, deleteAppointmentSchedule } from "@/services/appointments";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function SchedulesTab({ role }: { role?: string | null }) {
  return <SchedulesCalendarPage />;
}

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatTime12(time: string): string {
  // time is "HH:MM:SS" or "HH:MM"
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const displayH = h % 12 || 12;
  return `${displayH}:${String(m).padStart(2, "0")} ${period}`;
}

// ──────────────────────────────────────────────────────────────
// Popover component
// ──────────────────────────────────────────────────────────────

interface SchedulePopoverProps {
  schedule: any;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  onClose: () => void;
  onEdit: (schedule: any) => void;
  onDelete: (id: string) => void;
}

function SchedulePopover({ schedule, anchorRef, onClose, onEdit, onDelete }: SchedulePopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose, anchorRef]);

  const dateObj = new Date(schedule.specific_date + "T00:00:00");
  const dateLabel = dateObj.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div
      ref={popoverRef}
      className="absolute z-50 w-72 bg-card border border-border rounded-xl shadow-xl p-4 top-full mt-1 left-1/2 -translate-x-1/2"
      style={{ minWidth: 260 }}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">
        Schedule Details
      </p>

      <p className="text-sm font-semibold text-foreground mb-3 leading-tight">{dateLabel}</p>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4 text-primary shrink-0" />
          <span>
            {formatTime12(schedule.start_time)} – {formatTime12(schedule.end_time)}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="w-4 h-4 text-primary shrink-0" />
          <span>Max {schedule.max_capacity} slot{schedule.max_capacity !== 1 ? "s" : ""}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
              schedule.is_closed
                ? "bg-destructive/10 text-destructive"
                : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
            }`}
          >
            {schedule.is_closed ? "Closed" : "Open"}
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onEdit(schedule)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-primary hover:bg-primary/10 border border-primary/20 transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" />
          Edit
        </button>
        <button
          onClick={() => onDelete(schedule.id)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-destructive hover:bg-destructive/10 border border-destructive/20 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete
        </button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Day cell
// ──────────────────────────────────────────────────────────────

interface DayCellProps {
  day: number | null;
  dateStr: string | null;
  schedule: any | null;
  isToday: boolean;
  onEdit: (schedule: any) => void;
  onDelete: (id: string) => void;
}

function DayCell({ day, dateStr, schedule, isToday, onEdit, onDelete }: DayCellProps) {
  const [showPopover, setShowPopover] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);

  if (day === null || dateStr === null) {
    return <div className="min-h-[72px] rounded-xl" />;
  }

  const hasSchedule = !!schedule;
  const isClosed = schedule?.is_closed;

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={() => hasSchedule && setShowPopover((v) => !v)}
        className={`
          w-full min-h-[72px] rounded-xl border text-left p-2 transition-all duration-150 group
          ${hasSchedule && !isClosed
            ? "bg-green-50 border-green-300 hover:bg-green-100 hover:border-green-400 dark:bg-green-900/20 dark:border-green-700 dark:hover:bg-green-900/40 cursor-pointer"
            : isClosed
            ? "bg-orange-50 border-orange-200 hover:bg-orange-100 dark:bg-orange-900/20 dark:border-orange-800 cursor-pointer"
            : "bg-muted/40 border-border hover:bg-muted/70 cursor-default"
          }
          ${isToday ? "ring-2 ring-primary ring-offset-1" : ""}
        `}
      >
        {/* Day number */}
        <span
          className={`
            text-sm font-bold leading-none block mb-1.5
            ${isToday
              ? "w-6 h-6 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold"
              : hasSchedule
              ? "text-emerald-950 dark:text-emerald-200"
              : "text-foreground/80 font-semibold"
            }
          `}
        >
          {day}
        </span>

        {/* Schedule indicator */}
        {hasSchedule && (
          <div className="space-y-0.5">
            <div
              className={`text-xs font-bold truncate leading-tight ${
                isClosed
                  ? "text-orange-700 dark:text-orange-300"
                  : "text-emerald-800 dark:text-emerald-300"
              }`}
            >
              {isClosed ? "Closed" : formatTime12(schedule.start_time)}
            </div>
            {!isClosed && (
              <div className="text-[11px] font-medium text-emerald-700/90 dark:text-emerald-400 leading-tight">
                – {formatTime12(schedule.end_time)}
              </div>
            )}
          </div>
        )}
      </button>

      {/* Popover */}
      {showPopover && schedule && (
        <SchedulePopover
          schedule={schedule}
          anchorRef={btnRef}
          onClose={() => setShowPopover(false)}
          onEdit={(s) => {
            setShowPopover(false);
            onEdit(s);
          }}
          onDelete={(id) => {
            setShowPopover(false);
            onDelete(id);
          }}
        />
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Main calendar page
// ──────────────────────────────────────────────────────────────

function SchedulesCalendarPage() {
  const router = useRouter();

  const today = new Date();
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [schedules, setSchedules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this schedule?")) return;
    try {
      await deleteAppointmentSchedule(id);
      await fetchSchedules();
      toast.success("Schedule deleted successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete schedule");
    }
  };

  const handleEdit = (schedule: any) => {
    router.push(`/dashboard/schedules/new?edit=${schedule.id}`);
  };

  // Build schedule lookup map: "YYYY-MM-DD" → schedule
  const scheduleMap = new Map<string, any>();
  for (const s of schedules) {
    if (s.specific_date) {
      // Normalize to YYYY-MM-DD (strip time zone offset if any)
      const key = String(s.specific_date).slice(0, 10);
      scheduleMap.set(key, s);
    }
  }

  // Calendar grid
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = toLocalDateString(today);

  const prevMonth = () => {
    setViewDate((d) => {
      const n = new Date(d);
      n.setMonth(n.getMonth() - 1);
      n.setDate(1);
      return n;
    });
  };

  const nextMonth = () => {
    setViewDate((d) => {
      const n = new Date(d);
      n.setMonth(n.getMonth() + 1);
      n.setDate(1);
      return n;
    });
  };

  const goToday = () => {
    const n = new Date();
    n.setDate(1);
    setViewDate(n);
  };

  // Build grid rows
  type GridCell = { day: number | null; dateStr: string | null };
  const cells: GridCell[] = [];
  for (let i = 0; i < firstDay; i++) cells.push({ day: null, dateStr: null });
  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month, d);
    cells.push({ day: d, dateStr: toLocalDateString(dateObj) });
  }
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push({ day: null, dateStr: null });

  const totalWithSchedule = schedules.length;

  return (
    <div className="mx-auto w-full max-w-7xl py-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-foreground tracking-tight">
            Appointment Schedule
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isLoading
              ? "Loading schedules…"
              : `${totalWithSchedule} date${totalWithSchedule !== 1 ? "s" : ""} configured this year`}
          </p>
        </div>

        <Button
          onClick={() => router.push("/dashboard/schedules/new")}
          className="flex items-center gap-2 shrink-0"
          id="add-schedule-btn"
        >
          <Plus className="w-4 h-4" />
          Add Schedule
        </Button>
      </div>

      {/* ── Calendar Card ── */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">

        {/* Month nav */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <button
              onClick={prevMonth}
              id="prev-month-btn"
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className="text-base font-semibold text-foreground min-w-[160px] text-center">
              {MONTH_NAMES[month]} {year}
            </h3>
            <button
              onClick={nextMonth}
              id="next-month-btn"
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={goToday}
            id="today-btn"
            className="text-xs font-medium text-primary hover:bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-lg transition-colors"
          >
            Today
          </button>
        </div>

        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 border-b border-border">
          {DAYS_OF_WEEK.map((d) => (
            <div
              key={d}
              className="py-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        {isLoading ? (
          <div className="grid grid-cols-7 gap-1.5 p-3">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="h-[72px] rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1.5 p-3">
            {cells.map(({ day, dateStr }, idx) => {
              const schedule = dateStr ? (scheduleMap.get(dateStr) ?? null) : null;
              const isToday = dateStr === todayStr;
              return (
                <DayCell
                  key={idx}
                  day={day}
                  dateStr={dateStr}
                  schedule={schedule}
                  isToday={isToday}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              );
            })}
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center gap-6 px-5 py-3 border-t border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-green-300 border border-green-400" />
            <span className="text-xs text-muted-foreground">Open schedule</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-orange-200 border border-orange-300" />
            <span className="text-xs text-muted-foreground">Closed day</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-muted border border-border" />
            <span className="text-xs text-muted-foreground">No schedule</span>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <div className="w-3 h-3 rounded-sm ring-2 ring-primary" />
            <span className="text-xs text-muted-foreground">Today</span>
          </div>
        </div>
      </div>

      {/* Empty state hint */}
      {!isLoading && schedules.length === 0 && (
        <div className="mt-6 flex flex-col items-center justify-center py-12 text-center">
          <CalendarDays className="w-12 h-12 text-muted-foreground/50 mb-3" strokeWidth={1.5} />
          <p className="text-sm font-medium text-muted-foreground">No schedules configured yet</p>
          <p className="text-xs text-muted-foreground/70 mt-1 mb-4">
            Click &ldquo;Add Schedule&rdquo; to set available days for appointments.
          </p>
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/schedules/new")}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add your first schedule
          </Button>
        </div>
      )}
    </div>
  );
}