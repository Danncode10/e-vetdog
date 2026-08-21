"use client";

import * as React from "react";
import { Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { listOwnerRegistry } from "@/services/pets";
import type { UserRole } from "@/lib/dashboard-features";

type OwnerRecord = Awaited<ReturnType<typeof listOwnerRegistry>>[number];
type LinkedPet = { id: string; name: string; species: string; breed: string | null };
type OwnerPetLink = {
  pet_id: string;
  relationship: string;
  is_primary_contact: boolean;
  pets: LinkedPet | LinkedPet[] | null;
};

function linkedPetsFor(owner: OwnerRecord): Array<OwnerPetLink & { pet: LinkedPet | null }> {
  return (owner.pet_owners as unknown as OwnerPetLink[]).map((link) => ({
    ...link,
    pet: Array.isArray(link.pets) ? link.pets[0] ?? null : link.pets,
  }));
}

export function OwnersTab({ role }: { role: UserRole }) {
  const [owners, setOwners] = React.useState<OwnerRecord[]>([]);
  const [query, setQuery] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedOwner, setSelectedOwner] = React.useState<OwnerRecord | null>(null);

  React.useEffect(() => {
    const loadOwners = async () => {
      try {
        const records = await listOwnerRegistry();
        setOwners(records);
        setError(null);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "We could not load the owner registry.");
      } finally {
        setIsLoading(false);
      }
    };

    if (role === "admin" || role === "veterinarian") void loadOwners();
  }, [role]);

  if (role !== "admin" && role !== "veterinarian") return null;

  const normalizedQuery = query.trim().toLowerCase();
  const filteredOwners = owners.filter((owner) =>
    `${owner.full_name ?? ""} ${owner.email ?? ""} ${owner.phone ?? ""}`.toLowerCase().includes(normalizedQuery),
  );
  const selectedOwnerPets = selectedOwner ? linkedPetsFor(selectedOwner) : [];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">Owner registry</h2>
        <p className="mt-1 text-sm text-muted-foreground">Find an owner and review the pets they are authorized to represent.</p>
      </div>

      <label className="relative block">
        <span className="sr-only">Search owners</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by owner name, email, or phone" className="min-h-12 w-full rounded-md border border-input bg-background pl-10 pr-4 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring" />
      </label>

      {error && <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</p>}

      {selectedOwner && (
        <Card>
          <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
            <div>
              <CardTitle className="text-xl">{selectedOwner.full_name || "Owner profile"}</CardTitle>
              <CardDescription className="mt-1">{selectedOwner.email || "Email not recorded"}{selectedOwner.phone ? ` · ${selectedOwner.phone}` : ""}</CardDescription>
            </div>
            <Button type="button" variant="outline" onClick={() => setSelectedOwner(null)}>Close</Button>
          </CardHeader>
          <CardContent>
            <h3 className="text-base font-semibold text-foreground">Linked pets</h3>
            {selectedOwnerPets.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">No pets are linked to this owner.</p>
            ) : (
              <ul className="mt-3 divide-y divide-border border-y border-border">
                {selectedOwnerPets.map((link) => (
                  <li key={link.pet_id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium text-foreground">{link.pet?.name ?? "Pet record"}</p>
                      {link.pet && <p className="mt-1 text-sm capitalize text-muted-foreground">{[link.pet.species, link.pet.breed].filter(Boolean).join(" · ")}</p>}
                    </div>
                    <p className="text-sm capitalize text-muted-foreground">{link.relationship.replace("_", " ")}{link.is_primary_contact ? " · Primary contact" : ""}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2"><div className="h-44 animate-pulse rounded-lg bg-muted" /><div className="h-44 animate-pulse rounded-lg bg-muted" /></div>
      ) : filteredOwners.length === 0 ? (
        <Card><CardContent className="flex min-h-56 flex-col items-center justify-center p-6 text-center"><Users className="mb-4 size-10 text-muted-foreground" strokeWidth={1.5} /><p className="font-medium text-foreground">{query ? "No owners match that search." : "No owners are available yet."}</p><p className="mt-1 text-sm text-muted-foreground">Owner profiles appear here after a confirmed account completes onboarding.</p></CardContent></Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredOwners.map((owner) => {
            const linkedPets = linkedPetsFor(owner);
            return (
              <Card key={owner.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{owner.full_name || "Owner profile"}</CardTitle>
                  <CardDescription>{owner.email || "Email not recorded"}{owner.phone ? ` · ${owner.phone}` : ""}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{linkedPets.length === 1 ? "1 linked pet" : `${linkedPets.length} linked pets`}</p>
                </CardContent>
                <CardFooter>
                  <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setSelectedOwner(owner)}>View linked pets</Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
