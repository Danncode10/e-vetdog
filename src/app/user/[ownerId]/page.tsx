import Link from "next/link";
import { ArrowLeft, PawPrint } from "lucide-react";
import { getOwnerRegistryDetail } from "@/services/pets";
import { requireRole } from "@/services/authorization";
import { notFound } from "next/navigation";

export default async function OwnerRecordPage({ params }: { params: Promise<{ ownerId: string }> }) {
  await requireRole(["admin", "veterinarian"]);
  const { ownerId } = await params;
  const owner = await getOwnerRegistryDetail(ownerId);
  if (!owner) notFound();

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">
      <Link href="/dashboard?tab=owners" className="inline-flex min-h-12 items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to owners
      </Link>
      <header className="border-b border-border pb-6">
        <p className="text-sm font-medium text-muted-foreground">Owner record</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{owner.fullName || "Owner profile"}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{owner.email || "Email not recorded"}{owner.phone ? ` · ${owner.phone}` : ""}</p>
      </header>
      <section aria-labelledby="linked-pets-heading">
        <div className="flex items-center justify-between gap-4 border-b border-border pb-3">
          <h2 id="linked-pets-heading" className="text-lg font-semibold text-foreground">Linked pets</h2>
          <span className="text-sm text-muted-foreground">{owner.linkedPets.length === 1 ? "1 pet" : `${owner.linkedPets.length} pets`}</span>
        </div>
        {owner.linkedPets.length === 0 ? (
          <div className="flex min-h-40 flex-col items-center justify-center text-center"><PawPrint className="mb-3 size-8 text-muted-foreground" strokeWidth={1.5} /><p className="text-sm text-muted-foreground">No pets are linked to this owner.</p></div>
        ) : (
          <ul className="divide-y divide-border">
            {owner.linkedPets.map((pet) => (
              <li key={pet.id}>
                <Link href={`/user/${owner.id}/pet/${pet.id}`} className="flex min-h-16 items-center justify-between gap-4 py-4 transition-colors hover:text-primary">
                  <div><p className="font-medium text-foreground">{pet.name}</p><p className="mt-1 text-sm capitalize text-muted-foreground">{[pet.species, pet.breed].filter(Boolean).join(" · ")}</p></div>
                  <span className="text-right text-sm capitalize text-muted-foreground">{pet.relationship.replace("_", " ")}{pet.isPrimaryContact ? " · Primary contact" : ""}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
