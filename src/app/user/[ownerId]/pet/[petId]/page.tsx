import Link from "next/link";
import { ArrowLeft, ClipboardList } from "lucide-react";
import { getStaffPetRecord } from "@/services/pets";
import { requireRole } from "@/services/authorization";
import { notFound } from "next/navigation";

export default async function PetRecordPage({ 
  params,
  searchParams
}: { 
  params: Promise<{ ownerId: string; petId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireRole(["admin", "veterinarian"]);
  const { ownerId, petId } = await params;
  const resolvedSearchParams = await searchParams;
  const isFromPets = resolvedSearchParams?.from === "pets";
  
  const pet = await getStaffPetRecord(ownerId, petId);
  if (!pet) notFound();

  const backHref = isFromPets ? "/dashboard?tab=pets" : `/user/${ownerId}`;
  const backLabel = isFromPets ? "Back to pets" : "Back to owner record";

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">
      <Link href={backHref} className="inline-flex min-h-12 items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden="true" />
        {backLabel}
      </Link>
      <header className="border-b border-border pb-6">
        <p className="text-sm font-medium text-muted-foreground">Pet record</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{pet.name}</h1>
        <p className="mt-3 text-sm capitalize text-muted-foreground">{[pet.species === "other" ? pet.species_detail : pet.species, pet.breed, pet.sex].filter(Boolean).join(" · ")}</p>
      </header>
      <dl className="grid gap-6 border-y border-border py-5 text-sm sm:grid-cols-2">
        <div><dt className="text-muted-foreground">Date of birth</dt><dd className="mt-1 font-medium text-foreground">{pet.date_of_birth ?? "Not recorded"}</dd></div>
        <div><dt className="text-muted-foreground">Age</dt><dd className="mt-1 font-medium text-foreground">{pet.age === null ? "Not recorded" : `${pet.age} years`}</dd></div>
        <div><dt className="text-muted-foreground">Colour</dt><dd className="mt-1 font-medium text-foreground">{pet.color ?? "Not recorded"}</dd></div>
        <div><dt className="text-muted-foreground">Notes</dt><dd className="mt-1 font-medium text-foreground">{pet.notes ?? "No notes recorded"}</dd></div>
      </dl>
      <section aria-labelledby="owners-heading"><h2 id="owners-heading" className="border-b border-border pb-3 text-lg font-semibold text-foreground">Authorized owners</h2><ul className="divide-y divide-border">{pet.owners.map((owner: any) => <li key={owner.id} className="flex min-h-16 flex-col justify-center gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"><p className="font-medium text-foreground">{owner.fullName || owner.email || "Owner profile"}</p><p className="text-sm capitalize text-muted-foreground">{owner.relationship.replace("_", " ")}{owner.isPrimaryContact ? " · Primary contact" : ""}</p></li>)}</ul></section>
      <section aria-labelledby="medical-record-heading" className="border-y border-border py-5"><div className="flex items-start gap-3"><ClipboardList className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden="true" /><div><h2 id="medical-record-heading" className="text-lg font-semibold text-foreground">Medical record</h2><p className="mt-1 text-sm text-muted-foreground">No clinical records have been created for this pet yet. Encounters and signed medical history will appear here once the clinical workspace is available.</p></div></div></section>
    </div>
  );
}
