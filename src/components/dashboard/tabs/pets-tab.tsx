"use client";

import * as React from "react";
import { PawPrint, Pencil, Plus, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PetForm } from "@/components/dashboard/pets/pet-form";
import { listPetsForCurrentUser, updateOwnedPet, type PetFormInput } from "@/services/pets";
import type { UserRole } from "@/lib/dashboard-features";

type PetRecord = Awaited<ReturnType<typeof listPetsForCurrentUser>>[number];
type PetOwnerLink = {
  owner_profile_id: string;
  is_primary_contact: boolean;
};

function toPetForm(pet: PetRecord): PetFormInput {
  return {
    name: pet.name,
    species: pet.species,
    speciesDetail: pet.species_detail ?? "",
    breed: pet.breed ?? "",
    sex: pet.sex,
    dateOfBirth: pet.date_of_birth ?? "",
    age: pet.age?.toString() ?? "",
    color: pet.color ?? "",
    notes: pet.notes ?? "",
  };
}

function primaryOwnerId(pet: PetRecord): string | null {
  const ownerLinks = pet.pet_owners as unknown as PetOwnerLink[];
  return ownerLinks.find((link) => link.is_primary_contact)?.owner_profile_id ?? ownerLinks[0]?.owner_profile_id ?? null;
}

export function PetsTab({ role }: { role: UserRole }) {
  const router = useRouter();
  const [pets, setPets] = React.useState<PetRecord[]>([]);
  const [query, setQuery] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [editingPet, setEditingPet] = React.useState<PetRecord | null>(null);

  const loadPets = React.useCallback(async () => {
    try {
      const records = await listPetsForCurrentUser();
      setPets(records);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "We could not load the pet registry.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const timer = window.setTimeout(() => { void loadPets(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadPets]);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredPets = pets.filter((pet) => [pet.name, pet.species, pet.species_detail, pet.breed].filter(Boolean).join(" ").toLowerCase().includes(normalizedQuery));
  const canEdit = role === "owner" || role === "admin";
  const canOpenRecord = role === "admin" || role === "veterinarian";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Pet registry</h2>
          <p className="mt-1 text-sm text-muted-foreground">{role === "owner" ? "Keep the details for your linked pets current." : "Search patients and open their read-only records."}</p>
        </div>
        {role === "owner" && <Button onClick={() => router.push("/dashboard/pets/new")}><Plus className="mr-2 size-4" aria-hidden="true" />Add pet</Button>}
      </div>

      <label className="relative block">
        <span className="sr-only">Search pets</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name, species, or breed" className="min-h-12 w-full rounded-md border border-input bg-background pl-10 pr-4 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring" />
      </label>

      {error && <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</p>}
      {editingPet && <PetForm initialValue={toPetForm(editingPet)} title="Update pet details" description="Only information you are permitted to manage can be changed here." submitLabel="Save changes" onCancel={() => setEditingPet(null)} onSubmit={async (value) => { await updateOwnedPet(editingPet.id, value); setEditingPet(null); setIsLoading(true); await loadPets(); }} />}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2"><div className="h-40 animate-pulse rounded-lg bg-muted" /><div className="h-40 animate-pulse rounded-lg bg-muted" /></div>
      ) : filteredPets.length === 0 ? (
        <Card><CardContent className="flex min-h-56 flex-col items-center justify-center p-6 text-center"><PawPrint className="mb-4 size-10 text-muted-foreground" strokeWidth={1.5} /><p className="font-medium text-foreground">{query ? "No pets match that search." : "No pets are available yet."}</p>{query && <p className="mt-1 text-sm text-muted-foreground">Try a different name, species, or breed.</p>}</CardContent></Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredPets.map((pet) => {
            const ownerProfileId = primaryOwnerId(pet);
            return <Card key={pet.id}><CardHeader className="flex-row items-start justify-between gap-4 space-y-0"><div><CardTitle className="text-lg">{pet.name}</CardTitle><CardDescription className="mt-1 capitalize">{[pet.species === "other" ? pet.species_detail : pet.species, pet.breed, pet.sex].filter(Boolean).join(" · ")}</CardDescription></div>{canEdit && <Button variant="outline" onClick={() => setEditingPet(pet)}><Pencil className="mr-2 size-4" aria-hidden="true" />Edit</Button>}</CardHeader><CardContent className="space-y-3">{pet.date_of_birth && <dl className="border-t pt-3 text-sm"><dt className="text-muted-foreground">Date of birth</dt><dd className="mt-1 text-foreground">{pet.date_of_birth}</dd></dl>}{role !== "owner" && pet.pet_owners.length > 0 && <div className="border-t pt-3"><p className="text-sm font-medium text-foreground">Authorized owners</p><ul className="mt-2 space-y-2">{pet.pet_owners.map((link: { id: string; is_primary_contact: boolean; profiles: { full_name: string | null; email: string | null } | null }) => <li key={link.id} className="text-sm text-muted-foreground">{link.profiles?.full_name || link.profiles?.email || "Owner profile"}{link.is_primary_contact ? " · Primary contact" : ""}</li>)}</ul></div>}</CardContent>{canOpenRecord && <CardFooter><Button type="button" variant="outline" className="w-full sm:w-auto" disabled={!ownerProfileId} onClick={() => ownerProfileId && router.push(`/user/${ownerProfileId}/pet/${pet.id}`)}>Open pet record</Button></CardFooter>}</Card>;
          })}
        </div>
      )}
    </div>
  );
}
