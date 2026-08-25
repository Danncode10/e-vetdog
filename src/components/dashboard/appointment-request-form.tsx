"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Clock3, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
// Replaced third-party time picker with native input
import { Button } from "@/components/ui/button";
import { requestAppointment } from "@/services/appointments";
import { listPetsForCurrentUser } from "@/services/pets";
import { listServices } from "@/services/services";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

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
  const [availableSlots, setAvailableSlots] = React.useState<SlotOption[]>([]);
  const [slotsLoading, setSlotsLoading] = React.useState(false);
  const [selectedServiceId, setSelectedServiceId] = React.useState<string | null>(null);

  React.useEffect(() => {
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

  // Load available slots when preferred date changes
  const slotsQuery = useQuery({
    queryKey: ["available-slots", formData.preferredDate, selectedServiceId],
    queryFn: async () => {
      if (!formData.preferredDate || !selectedServiceId) return [];
      setSlotsLoading(true);
      try {
        // Get available slots - without specifying vet ID to check global capacity
        const { data, error } = await import("@/services/appointments").then((m) => m.getAvailableSlots(undefined, formData.preferredDate));
        if (error) throw error;
        setSlotsLoading(false);
        return data?.slots || [];
      } catch (err) {
        setSlotsLoading(false);
        console.error("Failed to load available slots:", err);
        return [];
      }
    },
    enabled: !!formData.preferredDate && !!selectedServiceId,
    refetchOnWindowFocus: false,
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formData.petId || !formData.serviceId || !formData.preferredDate || !formData.preferredTime) {
      setError("Select a pet, service, date, and time to continue.");
      return;
    }

    // Check if the selected time slot has available capacity
    const selectedSlot = availableSlots.find((slot) => slot.label === formData.preferredTime);
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
            <input id="appointment-date" type="date" value={formData.preferredDate} onChange={(event) => setFormData((previous) => ({ ...previous, preferredDate: event.target.value }))} min={new Date().toISOString().split("T")[0]} disabled={isPending} className={inputClassName} />
          </label>
          <label className="text-sm font-medium text-foreground">
            Preferred time
            <div className="relative mt-2">
              <Clock3 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.5} />
              <input
                id="appointment-time"
                type="time"
                aria-label="Preferred time"
                value={formData.preferredTime}
                onChange={(event) => setFormData((previous) => ({ ...previous, preferredTime: event.target.value }))}
                disabled={isPending}
                className="block min-h-12 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </label>
          {selectedServiceId && formData.preferredDate && !slotsLoading && availableSlots.length > 0 && (
            <div className="mt-4 space-y-3">
              <p className="text-sm font-medium text-foreground">Available time slots</p>
              <div className="grid grid-cols-2 gap-2">
                {availableSlots.map((slot) => (
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
          <Link href="/dashboard?tab=appointments" className="inline-flex min-h-12 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">Cancel</Link>
          <Button type="submit" disabled={isPending || isLoadingPets || isLoadingServices || services.length === 0}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isPending ? "Submitting..." : "Submit request"}
          </Button>
        </div>
      </form>
    </div>
  );
}