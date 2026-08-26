"use client";

import * as React from "react";
import { Search, Users, Mail, Phone, PawPrint, ExternalLink, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { listOwnerRegistry } from "@/services/pets";
import type { UserRole } from "@/lib/dashboard-features";

type OwnerRecord = Awaited<ReturnType<typeof listOwnerRegistry>>[number];

function getInitials(name?: string | null, email?: string | null): string {
  if (name && name.trim()) {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (email) return email.slice(0, 2).toUpperCase();
  return "OW";
}

export function OwnersTab({ role }: { role: UserRole }) {
  const router = useRouter();
  const [owners, setOwners] = React.useState<OwnerRecord[]>([]);
  const [query, setQuery] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

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
    `${owner.full_name ?? ""} ${owner.email ?? ""} ${owner.phone ?? ""}`
      .toLowerCase()
      .includes(normalizedQuery)
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Owner Directory</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Lookup pet owner accounts and access their linked patient records.
        </p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 w-4 h-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by owner name, email, or phone…"
          className="min-h-12 w-full rounded-xl border border-input bg-card pl-10 pr-10 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground rounded-md"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </p>
      )}

      {/* Owners Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-44 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : filteredOwners.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <Users className="mx-auto h-10 w-10 text-muted-foreground mb-3" strokeWidth={1.5} />
          <p className="font-semibold text-foreground">
            {query ? "No owner profiles match that search." : "No owner profiles found."}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {query
              ? "Try searching by a different name, email address, or phone number."
              : "Owner accounts will appear here once registered."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredOwners.map((owner) => {
            const initials = getInitials(owner.full_name, owner.email);
            const petCount = owner.pet_owners.length;

            return (
              <div
                key={owner.id}
                className="group relative flex flex-col rounded-2xl border border-border bg-card overflow-hidden transition-shadow hover:shadow-md"
              >
                <div className="p-5 flex-1 space-y-4">
                  {/* Header with Avatar Initials */}
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary font-bold text-base border border-primary/20">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-base font-bold text-foreground truncate leading-tight">
                          {owner.full_name || "Owner Profile"}
                        </h3>
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-2.5 py-0.5 text-xs font-semibold text-muted-foreground shrink-0 border border-border/50">
                          <PawPrint className="w-3 h-3 text-primary" />
                          {petCount} {petCount === 1 ? "Pet" : "Pets"}
                        </span>
                      </div>

                      <div className="space-y-1 text-xs text-muted-foreground pt-1">
                        {owner.email && (
                          <div className="flex items-center gap-1.5 truncate">
                            <Mail className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                            <span className="truncate">{owner.email}</span>
                          </div>
                        )}
                        {owner.phone && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                            <span>{owner.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Link */}
                <div className="border-t border-border px-5 py-3 bg-muted/20">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full gap-2 text-xs h-9"
                    onClick={() => router.push(`/user/${owner.id}`)}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open Owner Profile & Records
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

