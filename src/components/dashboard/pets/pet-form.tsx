"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { PetFormInput } from "@/services/pets";

const speciesOptions = ["dog", "cat", "bird", "rabbit", "reptile", "other"] as const;
const sexOptions = ["male", "female", "unknown"] as const;

const breedSuggestions: Record<PetFormInput["species"], string[]> = {
  dog: ["Aspin", "Beagle", "Chihuahua", "Dachshund", "Golden Retriever", "Labrador Retriever", "Pomeranian", "Shih Tzu"],
  cat: ["Puspin", "Persian", "Siamese", "British Shorthair", "Maine Coon", "Ragdoll"],
  bird: ["Budgerigar", "Cockatiel", "Lovebird", "African Grey Parrot"],
  rabbit: ["Holland Lop", "Lionhead", "Netherland Dwarf", "Mini Rex"],
  reptile: ["Bearded Dragon", "Leopard Gecko", "Red-Eared Slider", "Ball Python"],
  other: [],
};

export const emptyPetForm: PetFormInput = {
  name: "",
  species: "dog",
  speciesDetail: "",
  breed: "",
  sex: "unknown",
  dateOfBirth: "",
  age: "",
  color: "",
  notes: "",
};

export function PetForm({
  initialValue = emptyPetForm,
  title,
  description,
  submitLabel,
  onCancel,
  onSubmit,
}: {
  initialValue?: PetFormInput;
  title: string;
  description: string;
  submitLabel: string;
  onCancel: () => void;
  onSubmit: (value: PetFormInput) => Promise<void>;
}) {
  const [value, setValue] = React.useState(initialValue);
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();
  const breedListId = `breed-suggestions-${value.species}`;

  const setField = <K extends keyof PetFormInput>(field: K, fieldValue: PetFormInput[K]) => {
    setValue((current) => ({ ...current, [field]: fieldValue }));
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await onSubmit(value);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "We could not save this pet.");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-6 sm:grid-cols-2" onSubmit={submit}>
          <label className="grid gap-2 text-sm font-medium text-foreground">
            Pet name
            <input value={value.name} onChange={(event) => setField("name", event.target.value)} required className="min-h-12 rounded-md border border-input bg-background px-3 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </label>
          <label className="grid gap-2 text-sm font-medium text-foreground">
            Species
            <select value={value.species} onChange={(event) => setField("species", event.target.value as PetFormInput["species"])} className="min-h-12 rounded-md border border-input bg-background px-3 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring">
              {speciesOptions.map((species) => <option key={species} value={species}>{species === "other" ? "Other — please specify" : species}</option>)}
            </select>
          </label>
          {value.species === "other" && <label className="grid gap-2 text-sm font-medium text-foreground sm:col-span-2">
            Please specify the species
            <input value={value.speciesDetail} onChange={(event) => setField("speciesDetail", event.target.value)} required className="min-h-12 rounded-md border border-input bg-background px-3 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </label>}
          <label className="grid gap-2 text-sm font-medium text-foreground">
            Breed
            <input value={value.breed} onChange={(event) => setField("breed", event.target.value)} list={breedListId} aria-describedby="breed-help" className="min-h-12 rounded-md border border-input bg-background px-3 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            <span id="breed-help" className="text-xs font-normal text-muted-foreground">Search a suggestion or enter a breed not listed.</span>
            <datalist id={breedListId}>{breedSuggestions[value.species].map((breed) => <option key={breed} value={breed} />)}</datalist>
          </label>
          <label className="grid gap-2 text-sm font-medium text-foreground">
            Sex
            <select value={value.sex} onChange={(event) => setField("sex", event.target.value as PetFormInput["sex"])} className="min-h-12 rounded-md border border-input bg-background px-3 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring">
              {sexOptions.map((sex) => <option key={sex} value={sex}>{sex}</option>)}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium text-foreground">
            Date of birth
            <input type="date" value={value.dateOfBirth} onChange={(event) => setField("dateOfBirth", event.target.value)} className="min-h-12 rounded-md border border-input bg-background px-3 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </label>
          <label className="grid gap-2 text-sm font-medium text-foreground">
            Age (years)
            <input type="number" min="0" step="1" value={value.age} onChange={(event) => setField("age", event.target.value)} className="min-h-12 rounded-md border border-input bg-background px-3 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </label>
          <label className="grid gap-2 text-sm font-medium text-foreground sm:col-span-2">
            Notes
            <textarea value={value.notes} onChange={(event) => setField("notes", event.target.value)} rows={4} className="rounded-md border border-input bg-background px-3 py-3 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </label>
          {error && <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive sm:col-span-2">{error}</p>}
          <div className="flex flex-col-reverse gap-3 sm:col-span-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={onCancel} disabled={isPending}>Cancel</Button>
            <Button type="submit" disabled={isPending}>{isPending && <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />}{submitLabel}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
