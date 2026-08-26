import { getAppointmentById } from "@/services/appointments";
import { requireAuth } from "@/services/authorization";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function fmtDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}
function fmtTime(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}
function fmtDateTime(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    requested: "bg-amber-100 text-amber-800 border-amber-200",
    scheduled: "bg-blue-100 text-blue-800 border-blue-200",
    completed: "bg-green-100 text-green-800 border-green-200",
    cancelled: "bg-red-100 text-red-800 border-red-200",
    no_show: "bg-gray-100 text-gray-800 border-gray-200",
  };
  const cls = map[status] ?? "bg-muted text-muted-foreground border-border";
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold capitalize ${cls}`}>
      {status.replace("_", " ")}
    </span>
  );
}

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

  const owner = appt.profiles as any;
  const vet = (appt as any).profiles as any; // second joined profile
  const petProfile = appt.pets as any;
  const service = appt.services as any;

  const scheduledStart = appt.scheduled_start;
  const scheduledEnd = appt.scheduled_end;

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 print:py-4 print:px-0">

      {/* ── Back + actions ─────────────────────────────── */}
      <div className="flex items-center">
        <Link
          href="/dashboard?tab=appointments"
          className="inline-flex min-h-12 items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to appointments
        </Link>
      </div>

      {/* ── Status + title row ──────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Appointment details
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Reference ID: <span className="font-mono text-xs">{appt.id}</span>
          </p>
        </div>
        <StatusBadge status={appt.status} />
      </div>

      {/* ── Patient ──────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Patient
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm sm:grid-cols-3">
          <div>
            <p className="text-muted-foreground">Name</p>
            <p className="font-medium text-foreground">{petProfile?.name ?? "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Species</p>
            <p className="font-medium text-foreground capitalize">{petProfile?.species ?? "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Breed</p>
            <p className="font-medium text-foreground">{petProfile?.breed ?? "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Sex</p>
            <p className="font-medium text-foreground capitalize">{petProfile?.sex ?? "—"}</p>
          </div>
          {petProfile?.date_of_birth && (
            <div>
              <p className="text-muted-foreground">Date of birth</p>
              <p className="font-medium text-foreground">{petProfile.date_of_birth}</p>
            </div>
          )}
          {petProfile?.color && (
            <div>
              <p className="text-muted-foreground">Color / markings</p>
              <p className="font-medium text-foreground">{petProfile.color}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Schedule ─────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm sm:grid-cols-3">
          {scheduledStart ? (
            <>
              <div>
                <p className="text-muted-foreground">Date</p>
                <p className="font-medium text-foreground">{fmtDate(scheduledStart)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Start time</p>
                <p className="font-medium text-foreground">{fmtTime(scheduledStart)}</p>
              </div>
              {scheduledEnd && (
                <div>
                  <p className="text-muted-foreground">End time</p>
                  <p className="font-medium text-foreground">{fmtTime(scheduledEnd)}</p>
                </div>
              )}
            </>
          ) : (
            <>
              {appt.preferred_date && (
                <div>
                  <p className="text-muted-foreground">Preferred date</p>
                  <p className="font-medium text-foreground">{appt.preferred_date}</p>
                </div>
              )}
              {appt.preferred_time && (
                <div>
                  <p className="text-muted-foreground">Preferred time</p>
                  <p className="font-medium text-foreground">{appt.preferred_time}</p>
                </div>
              )}
              <div className="col-span-full">
                <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                  This appointment is pending confirmation. Final schedule will be set by staff.
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Service ──────────────────────────────────────── */}
      {service && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Service
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm sm:grid-cols-3">
            <div>
              <p className="text-muted-foreground">Service name</p>
              <p className="font-medium text-foreground">{service.name}</p>
            </div>
            {service.duration_minutes && (
              <div>
                <p className="text-muted-foreground">Est. duration</p>
                <p className="font-medium text-foreground">{service.duration_minutes} mins</p>
              </div>
            )}
            {(service.price_from || service.price_to) && (
              <div>
                <p className="text-muted-foreground">Price range</p>
                <p className="font-medium text-foreground">
                  {service.price_from && `₱${service.price_from}`}
                  {service.price_from && service.price_to && " – "}
                  {service.price_to && `₱${service.price_to}`}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Reason / Notes ───────────────────────────────── */}
      {(appt.reason || appt.notes) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {appt.reason && (
              <div>
                <p className="text-muted-foreground mb-1">Reason for visit</p>
                <p className="text-foreground whitespace-pre-wrap">{appt.reason}</p>
              </div>
            )}
            {appt.notes && (
              <div>
                <p className="text-muted-foreground mb-1">Additional notes</p>
                <p className="text-foreground whitespace-pre-wrap">{appt.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Timeline ─────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Timeline
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {appt.requested_at && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Requested</span>
              <span className="text-foreground">{fmtDateTime(appt.requested_at)}</span>
            </div>
          )}
          {appt.confirmed_at && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Confirmed</span>
              <span className="text-foreground">{fmtDateTime(appt.confirmed_at)}</span>
            </div>
          )}
          {appt.completed_at && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Completed</span>
              <span className="text-foreground">{fmtDateTime(appt.completed_at)}</span>
            </div>
          )}
          {appt.cancelled_at && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cancelled</span>
              <span className="text-foreground">{fmtDateTime(appt.cancelled_at)}</span>
            </div>
          )}
          {appt.cancellation_reason && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cancellation reason</span>
              <span className="text-foreground capitalize">{String(appt.cancellation_reason).replace("_", " ")}</span>
            </div>
          )}
        </CardContent>
      </Card>


    </div>
  );
}
