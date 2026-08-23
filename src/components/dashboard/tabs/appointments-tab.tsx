"use client";

import * as React from "react";
import { CalendarDays, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { requestAppointment } from "@/services/appointments";
import { listPetsForCurrentUser } from "@/services/pets";
import { listServices } from "@/services/services";
import { toast } from "sonner";

type PetOption = Pick<Awaited<ReturnType<typeof listPetsForCurrentUser>>[number], "id" | "name">;
type ServiceOption = Pick<Awaited<ReturnType<typeof listServices>>[number], "id" | "name">;

export function AppointmentsTab() {
  const [pets, setPets] = React.useState<PetOption[]>([]);
  const [services, setServices] = React.useState<ServiceOption[]>([]);
  const [isLoadingPets, setIsLoadingPets] = React.useState(true);
  const [isLoadingServices, setIsLoadingServices] = React.useState(true);
  const [open, setOpen] = React.useState(false);
  const [isPending, setIsPending] = React.useState(false);
  const [formData, setFormData] = React.useState({
    petId: "",
    serviceId: "",
    preferredDate: "",
    preferredTime: "",
    reason: "",
    notes: ""
  });
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoadingPets(true);
        setIsLoadingServices(true);

        const [petData, serviceData] = await Promise.all([
          listPetsForCurrentUser(),
          listServices()
        ]);

        setPets(petData);
        setServices(serviceData);
      } catch (err) {
        console.error("Failed to load initial data:", err);
        toast.error("Failed to load pets or services");
      } finally {
        setIsLoadingPets(false);
        setIsLoadingServices(false);
      }
    };

    loadInitialData();
  }, []);

  const handleSubmit = async () => {
    if (!formData.petId || !formData.serviceId || !formData.preferredDate || !formData.preferredTime) {
      setError("Please fill in all required fields");
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
        notes: formData.notes
      });

      toast.success("Appointment request submitted successfully!");
      setOpen(false);
      setFormData({
        petId: "",
        serviceId: "",
        preferredDate: "",
        preferredTime: "",
        reason: "",
        notes: ""
      });
    } catch (err: unknown) {
      console.error("Failed to request appointment:", err);
      const message = err instanceof Error ? err.message : "Failed to submit appointment request";
      setError(message);
      toast.error(message);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-foreground tracking-tight">Appointments</h2>
          <p className="mt-1 text-[14px] text-muted-foreground">
            Manage appointment requests, scheduling, and check-ins.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" strokeWidth={1.5} />
          Request appointment
        </Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-foreground tracking-tight">Request New Appointment</h2>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close appointment request dialog"
              className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </div>

          <form onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Pet</label>
              <select
                value={formData.petId}
                onChange={(e) => setFormData(prev => ({ ...prev, petId: e.target.value }))}
                disabled={isPending || isLoadingPets}
                className="block w-full px-3 py-2 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="">Select a pet</option>
                {pets.map(pet => (
                  <option key={pet.id} value={pet.id}>
                    {pet.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Service</label>
              <select
                value={formData.serviceId}
                onChange={(e) => setFormData(prev => ({ ...prev, serviceId: e.target.value }))}
                disabled={isPending || isLoadingServices}
                className="block w-full px-3 py-2 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="">Select a service</option>
                {services.map(service => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-3 grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Date</label>
                <input
                  type="date"
                  value={formData.preferredDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, preferredDate: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                  disabled={isPending}
                  className="block w-full px-3 py-2 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Time</label>
                <input
                  type="time"
                  value={formData.preferredTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, preferredTime: e.target.value }))}
                  disabled={isPending}
                  className="block w-full px-3 py-2 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Reason for Visit</label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                rows={3}
                disabled={isPending}
                className="block w-full px-3 py-2 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Additional Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                disabled={isPending}
                className="block w-full px-3 py-2 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive text-destructive rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="flex items-center justify-end pt-4 space-x-3">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                type="submit"
                disabled={isPending || !(formData.petId && formData.serviceId && formData.preferredDate && formData.preferredTime)}
              >
                {isPending ? "Submitting..." : "Request Appointment"}
              </Button>
            </div>
          </form>
        </Dialog>
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