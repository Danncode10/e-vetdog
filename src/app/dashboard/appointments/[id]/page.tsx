import { getAppointmentById, listOwnerAppointments } from "@/services/appointments";
import { getOwnerRegistryDetail } from "@/services/pets";
import { requireAuth } from "@/services/authorization";
import { notFound } from "next/navigation";
import { AppointmentDetailView } from "@/components/dashboard/appointments/appointment-detail-view";

export default async function AppointmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { profile } = await requireAuth();
  const { id } = await params;

  let appt: Awaited<ReturnType<typeof getAppointmentById>>;
  try {
    appt = await getAppointmentById(id);
  } catch {
    notFound();
  }

  // Owners may only view their own appointments
  if (profile.role === "owner" && appt.owner_id !== profile.id) {
    notFound();
  }

  const ownerId = appt.owner_id;

  // Fetch owner appointments & owner pets in parallel
  const [ownerAppointments, ownerRegistry] = await Promise.all([
    listOwnerAppointments(ownerId).catch(() => []),
    getOwnerRegistryDetail(ownerId).catch(() => null),
  ]);

  const ownerPets = ownerRegistry?.linkedPets || [];

  return (
    <AppointmentDetailView
      appointment={appt}
      ownerAppointments={ownerAppointments}
      ownerPets={ownerPets}
    />
  );
}
