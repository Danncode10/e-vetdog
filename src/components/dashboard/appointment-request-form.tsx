"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Calendar, Clock3, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { CalendarRange } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { requestAppointment } from "@/services/appointments";
import { listPetsForCurrentUser } from "@/services/pets";
import { listServices } from "@/services/services";
import { getAvailableSlots, listAppointmentSchedules } from "@/services/appointments";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

// Day of week labels (0=Sunday, 6=Saturday)
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Pure date/calendar helpers — placed at module scope so they can be used
// in useState initializers without "used before declaration" errors.
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
};

const formatDateMonthYear = (yyyyMM: string) => {
  const [year, month] = yyyyMM.split("-");
  const d = new Date(`${year}-${month}-01`);
  return `${d.toLocaleString("default", { month: "long" })} ${year}`;
};

const formatDateYYYYMM = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const getDaysInMonth = (yyyyMM: string) => {
  const [year, month] = yyyyMM.split("-");
  const date = new Date(Number(year), Number(month), 0);
  return date.getDate();
};

const getFirstDayOfMonth = (yyyyMM: string) => {
  const [year, month] = yyyyMM.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.getDay(); // 0 = Sunday, 6 = Saturday
};

type PetOption = Pick<Awaited<ReturnType<typeof listPetsForCurrentUser>>[number], "id" | "name">;
type ServiceOption = Pick<Awaited<ReturnType<typeof listServices>>[number], "id" | "name">;

const inputClassName = "mt-2 block min-h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

type SlotOption = {
  id: string;
  start: string;
  end: string;
  maxCapacity: number;
  currentBookings: number;
  available: number;
  isAvailable: boolean;
  label: string;
};

export function AppointmentRequestForm() {
  const router = useRouter();
  const [pets, setPets] = React.useState<PetOption[]>([]);
  const [services, setServices] = React.useState<ServiceOption[]>([]);
  const [isLoadingPets, setIsLoadingPets] = React.useState(true);
  const [isLoadingServices, setIsLoadingServices] = React.useState(true);
  const [isPending, setIsPending] = React.useState(false);
  const [formData, setFormData] = React.useState({ petId: "", serviceId: "", preferredDate: "", preferredTime: "", reason: "", notes: "" });
  const [error, setError] = React.useState<string | null>(null);
  const [selectedServiceId, setSelectedServiceId] = React.useState<string | null>(null);
  const [showCalendar, setShowCalendar] = React.useState(false);
  const [currentMonth, setCurrentMonth] = React.useState(formatDateYYYYMM(new Date()));

  const generateCalendarDays = (yyyyMM: string) => {
    const daysInMonth = getDaysInMonth(yyyyMM);
    const firstDay = getFirstDayOfMonth(yyyyMM);
    const today = new Date();
    const todayYYYYMM = formatDateYYYYMM(today);
    const isToday = yyyyMM === todayYYYYMM;

    const days: any[] = [];

    // Empty days before the first day of the month (offset from previous month)
    for (let i = 0; i < firstDay; i++) {
      days.push({
        day: "", // Use empty string to avoid rendering negative numbers/zero
        isPast: true,
        isCurrentMonth: false,
        disabled: true,
        isEmpty: true,
      });
    }

    // Actual days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayYYYYMM = formatDateYYYYMM(new Date(`${yyyyMM}-${day}`));
      const isCurrentMonth = dayYYYYMM === yyyyMM;
      const isPastDay = dayYYYYMM < todayYYYYMM || (yyyyMM === todayYYYYMM && day < today.getDate());
      const isOpenDay = isCurrentMonth && !isPastDay && isDayOpen(dayYYYYMM);
      const isSelected = formData.preferredDate === dayYYYYMM;

      // Determine badge color: green if available, red if fully booked/closed
      let badgeClass = "bg-green-100 text-green-800";
      let badgeText = "🟢 Available";
      const schedules = schedulesQuery.data || [];
      const hasSpecificDateSchedule = schedules.some((s: any) =>
        s.specific_date === dayYYYYMM && s.is_recurring === false && s.is_closed === false
      );
      const hasRecurringSchedule = schedules.some((s: any) =>
        s.day_of_week === new Date(dayYYYYMM).getDay() && s.is_recurring === true && s.is_closed === false
      );
      const hasActiveSchedule = hasSpecificDateSchedule || hasRecurringSchedule;
      if (!hasActiveSchedule) {
        badgeClass = "bg-red-100 text-red-800";
        badgeText = "🔴 Closed/Full";
      } else if (formData.preferredDate === dayYYYYMM) {
        badgeClass = "bg-yellow-100 text-yellow-800";
        badgeText = "🟡 Select time";
      }

      days.push({
        day,
        dateString: dayYYYYMM,
        isPast: isPastDay,
        isCurrentMonth,
        isOpenDay,
        isSelected,
        disabled: isPastDay || !isCurrentMonth,
        // Badge indicators
        badgeClass,
        badgeText,
        // Grey out days without clinic schedule
        grayOut: isCurrentMonth && !isPastDay && !hasActiveSchedule,
      });
    }

    // Empty days after the last day of the month to fill the grid
    const totalCells = 42; // 6 weeks * 7 days
    const remainingCells = totalCells - days.length;
    for (let i = 0; i < remainingCells; i++) {
      days.push({
        isEmpty: true,
      });
    }

    return days;
  };

  const isDayOpen = (dayYYYYMM: string) => {
    // Check if there's an active schedule for this specific date or day of week
    const schedules = schedulesQuery.data || [];

    // First, check for specific date schedules
    if (formData.preferredDate === dayYYYYMM) {
      // User is viewing the exact preferred date - check if there's a specific_date schedule
      return schedules.some((s: any) =>
        s.specific_date === dayYYYYMM && s.is_recurring === false && s.is_closed === false
      );
    }

    // Fall back to day-of-week check for recurring schedules
    const dayOfWeek = new Date(dayYYYYMM).getDay();
    return schedules.some((s: any) =>
      s.day_of_week === dayOfWeek && s.is_recurring === true && s.is_closed === false
    );
  };

  const handleDateSelect = (dayYYYYMM: string) => {
    setShowCalendar(false);
    setFormData((prev) => ({ ...prev, preferredDate: dayYYYYMM }));
    // Fetch slots for the selected date
    if (dayYYYYMM) {
      slotsQuery.refetch();
    }
  };

  useEffect(() => {
    listPetsForCurrentUser()
      .then(setPets)
      .catch((loadError: unknown) => {
        console.error("Failed to load pets:", loadError);
        setError("We could not load your pets. Please try again.");
      })
      .finally(() => setIsLoadingPets(false));

    listServices()
      .then(setServices)
      .catch((loadError: unknown) => {
        console.error("Failed to load services:", loadError);
        setError("We could not load clinic services. Please try again.");
      })
      .finally(() => setIsLoadingServices(false));
  }, []);

  // Fetch active clinic schedules to know which days the clinic operates
  const schedulesQuery = useQuery({
    queryKey: ["appointment-schedules"],
    queryFn: async () => {
      const result = await listAppointmentSchedules();
      return result || [];
    },
    refetchOnWindowFocus: false,
  });

  // Load available slots when preferred date changes
  const slotsQuery = useQuery({
    queryKey: ["available-slots", formData.preferredDate],
    queryFn: async () => {
      if (!formData.preferredDate) return [];
      const result = await getAvailableSlots(undefined, formData.preferredDate);
      return result.slots || [];
    },
    enabled: !!formData.preferredDate,
    refetchOnWindowFocus: false,
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formData.petId || !formData.serviceId || !formData.preferredDate || !formData.preferredTime) {
      setError("Select a pet, service, date, and time to continue.");
      return;
    }

    // Check if the selected time slot has available capacity
    const selectedSlot = slotsQuery.data?.find((slot) => slot.start === formData.preferredTime);
    if (selectedSlot && !selectedSlot.isAvailable) {
      setError(`This time slot is fully booked. Maximum ${selectedSlot.maxCapacity} appointments allowed per slot.`);
      return;
    }

    setIsPending(true);
    setError(null);
    try {
      await requestAppointment({
        pet_id: formData.petId,
        service_id: formData.serviceId,
        preferred_date: formData.preferredDate,
        preferred_time: formData.preferredTime,
        reason: formData.reason,
        notes: formData.notes,
      });
      toast.success("Appointment request submitted successfully.");
      router.push("/dashboard?tab=appointments");
      router.refresh();
    } catch (submitError: unknown) {
      const message = submitError instanceof Error ? submitError.message : "Failed to submit appointment request.";
      setError(message);
      toast.error(message);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8">
      <div className="space-y-4">
        <Link href="/dashboard?tab=appointments" className="inline-flex min-h-12 items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
          Back to appointments
        </Link>
        <div>
          <p className="text-sm font-medium text-primary">Appointment request</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">Request a new appointment</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Tell us which pet needs care and when you would prefer to visit. The clinic will confirm the final schedule.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-8">
        <div className="grid gap-6 sm:grid-cols-2">
          <label className="text-sm font-medium text-foreground">
            Pet
            <select id="appointment-pet" value={formData.petId} onChange={(event) => setFormData((previous) => ({ ...previous, petId: event.target.value }))} disabled={isPending || isLoadingPets} className={inputClassName}>
              <option value="">{isLoadingPets ? "Loading pets..." : "Select a pet"}</option>
              {pets.map((pet) => <option key={pet.id} value={pet.id}>{pet.name}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium text-foreground">
            Service
            <select id="appointment-service" value={formData.serviceId} onChange={(event) => {
              const newServiceId = event.target.value;
              setFormData((previous) => ({ ...previous, serviceId: newServiceId }));
              setSelectedServiceId(newServiceId);
            }} disabled={isPending || isLoadingServices || services.length === 0} className={inputClassName}>
              <option value="">{isLoadingServices ? "Loading services..." : services.length === 0 ? "No services available" : "Select a service"}</option>
              {services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium text-foreground">
            Preferred date
          </label>
          <div className="relative">
            <button
              onClick={() => setShowCalendar(!showCalendar)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors hover:bg-muted focus-visible:data-[state=open]:bg-primary/10"
              aria-label="Select date"
            >
              <Calendar className="mr-2 h-4 w-4" strokeWidth={1.5} />
              {showCalendar ? "×" : formData.preferredDate ? formatDate(formData.preferredDate) : "Select a date"}
              {showCalendar && <ArrowRight className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={1.5} />}
            </button>

            {showCalendar && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="relative z-50 bg-white/95 backdrop-blur-sm shadow-lg rounded-lg p-4 max-w-full w-full max-h-[calc(100vh-8rem)] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => setCurrentMonth(prev => {
                      const date = new Date(prev);
                      date.setMonth(date.getMonth() - 1);
                      return formatDateYYYYMM(date);
                    })}
                    className="prev-month inline-flex items-center gap-2 px-3 py-1 rounded-md hover:bg-muted transition-colors"
                    aria-label="Previous month"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M12.707 5.971a.75.75 0 011.06 1.06l-7.146 7.147 7.147 7.146a.75.75 0 01-1.06 1.06L11.95 7.03a.75.75 0 01-1.06 1.06l-7.147-7.146-7.146 7.147a.75.75 0 010-1.06l7.146-7.147a.75.75 0 011.06 1.06z" />
                    </svg>
                    <span className="sr-only">Previous month</span>
                  </button>
                  <span className="font-medium text-lg">{formatDateMonthYear(currentMonth)}</span>
                  <button
                    onClick={() => setCurrentMonth(prev => {
                      const date = new Date(prev);
                      date.setMonth(date.getMonth() + 1);
                      return formatDateYYYYMM(date);
                    })}
                    className="next-month inline-flex items-center gap-2 px-3 py-1 rounded-md hover:bg-muted transition-colors"
                    aria-label="Next month"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M7.293 5.971a.75.75 0 011.06 1.06l7.147 7.146a.75.75 0 011.06 1.06L12.95 12.95a.75.75 0 01-1.06 1.06l-7.146 7.147-7.147-7.146a.75.75 0 01-1.06-1.06L11.95 12.97a.75.75 0 011.06-1.06l7.146-7.147a.75.75 0 011.06 1.06z" />
                    </svg>
                    <span className="sr-only">Next month</span>
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1 border-b pb-3">
                  {DAY_LABELS.map((day) => (
                    <div key={day} className="text-xs font-medium text-muted-foreground">{day}</div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {generateCalendarDays(currentMonth).map((dayObj, index) => (
                    <button
                      key={index}
                      className={`rounded-md border ${dayObj.disabled ? 'border-border' : 'border-none'} px-2 py-1 text-sm ${
                        dayObj.disabled
                          ? 'bg-muted/50 opacity-50 cursor-not-allowed'
                          : 'bg-background text-foreground hover:bg-muted transition-colors'}
                      `}
                      disabled={dayObj.disabled}
                      onClick={() => handleDateSelect(dayObj.dateString)}
                    >
                      {dayObj.day}
                      {dayObj.badgeText && !dayObj.isPast && !dayObj.isEmpty ? (
                        <span className={`absolute -right-1 -top-1 rounded-full px-2 py-0.5 text-xs ${
                          dayObj.badgeClass
                        }`}
                          title={dayObj.badgeText}
                        >
                          {dayObj.badgeText}
                        </span>
                      ) : null}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          {selectedServiceId && formData.preferredDate && (
            <div className="mt-4 space-y-3">
              <p className="text-sm font-medium text-foreground">Available time slots</p>
              {slotsQuery.isLoading && (
                <p className="text-sm text-muted-foreground">Loading slots...</p>
              )}
              {formData.preferredDate && !slotsQuery.data?.length && (
                <p className="text-sm text-muted-foreground">No available clinic slots for this day.</p>
              )}
              <div className="grid grid-cols-2 gap-2">
                {slotsQuery.data?.map((slot) => (
                  <div
                    key={slot.id}
                    className={`rounded-md border ${slot.isAvailable ? 'border-primary' : 'border-border'} px-3 py-2 text-sm ${slot.isAvailable ? 'bg-background' : 'bg-muted/50'} ${!slot.isAvailable ? 'opacity-50 cursor-not-allowed' : ''} transition-colors cursor-pointer`}
                    onClick={() => setFormData((previous) => ({ ...previous, preferredTime: slot.start }))}
                  >
                    <div className="font-medium text-foreground">{slot.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {slot.currentBookings}/{slot.maxCapacity} {'appointments'.replace('appointments', slot.currentBookings === 1 ? 'appointment' : 'appointments')}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs">
                <span className="flex items-center">
                  <span className="w-2 h-2 rounded-full bg-green-500 mr-1"></span>
                  🟢 Available
                </span>
                <span className="flex items-center ml-4">
                  <span className="w-2 h-2 rounded-full bg-red-500 mr-1"></span>
                  🔴 Fully Booked/Closed
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <label className="text-sm font-medium text-foreground">
            Reason for visit
            <textarea id="appointment-reason" value={formData.reason} onChange={(event) => setFormData((previous) => ({ ...previous, reason: event.target.value }))} rows={4} disabled={isPending} className={inputClassName} />
          </label>
          <label className="text-sm font-medium text-foreground">
            Additional notes
            <textarea id="appointment-notes" value={formData.notes} onChange={(event) => setFormData((previous) => ({ ...previous, notes: event.target.value }))} rows={4} disabled={isPending} className={inputClassName} />
          </label>
        </div>

        {error && <p role="alert" className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

        <div className="flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:justify-end">
          <Link href="/dashboard?tab=appointments" className="inline-flex min-h-12 items-center justify-center rounded-md border border-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">Cancel</Link>
          <Button type="submit" disabled={isPending || isLoadingPets || isLoadingServices || services.length === 0}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isPending ? "Submitting..." : "Submit request"}
          </Button>
        </div>
      </form>
    </div>
  );
}