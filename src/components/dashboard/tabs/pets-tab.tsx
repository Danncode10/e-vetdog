"use client";

import { PawPrint, Loader2, Plus } from "lucide-react";

export function PetsTab() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground tracking-tight">Pets</h2>
          <p className="mt-1 text-[14px] text-muted-foreground">
            Manage patient records and ownership relationships.
          </p>
        </div>
        <button className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-[13px] font-medium hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" />
          Add Pet
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-card p-12 text-center">
        <PawPrint className="w-10 h-10 text-muted-foreground mx-auto mb-3" strokeWidth={1.5} />
        <p className="text-[14px] text-muted-foreground">
          No pets yet. Add a patient to get started.
        </p>
      </div>
    </div>
  );
}
