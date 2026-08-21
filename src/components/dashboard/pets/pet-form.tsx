"use client";

import * as React from "react";
import dogBreeds from "dog-breeds/dog-breeds.json";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { PetFormInput } from "@/services/pets";

const speciesOptions = ["dog", "cat", "bird", "rabbit", "reptile", "other"] as const;
const sexOptions = ["male", "female", "unknown"] as const;

const breedSuggestions: Record<PetFormInput["species"], string[]> = {
  dog: dogBreeds.map((breed) => breed.name),
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
  const [showBreedResults, setShowBreedResults] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();
  const matchingBreeds = breedSuggestions[value.species]
    .filter((breed) => breed.toLowerCase().includes(value.breed.trim().toLowerCase()))
    .slice(0, 12);

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
    <form className="w-full" onSubmit={submit}>
      <Card className="w-full">
        <CardHeader className="space-y-2">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <label className="grid min-w-0 gap-2 text-sm font-medium text-foreground">
            Pet name
            <input value={value.name} onChange={(event) => setField("name", event.target.value)} required className="min-h-12 rounded-md border border-input bg-background px-3 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </label>
          <label className="grid min-w-0 gap-2 text-sm font-medium text-foreground">
            Species
            <select value={value.species} onChange={(event) => setField("species", event.target.value as PetFormInput["species"])} className="min-h-12 rounded-md border border-input bg-background px-3 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring">
              {speciesOptions.map((species) => <option key={species} value={species}>{species === "other" ? "Other — please specify" : species}</option>)}
            </select>
          </label>
          {value.species === "other" && <label className="grid min-w-0 gap-2 text-sm font-medium text-foreground md:col-span-2">
            Please specify the species
            <input value={value.speciesDetail} onChange={(event) => setField("speciesDetail", event.target.value)} required className="min-h-12 rounded-md border border-input bg-background px-3 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </label>}
          <label className="grid min-w-0 gap-2 text-sm font-medium text-foreground">
            Breed
            <span className="relative">
              <input value={value.breed} onFocus={() => setShowBreedResults(true)} onChange={(event) => { setField("breed", event.target.value); setShowBreedResults(true); }} onBlur={() => window.setTimeout(() => setShowBreedResults(false), 150)} role="combobox" aria-expanded={showBreedResults} aria-controls="breed-results" aria-autocomplete="list" className="min-h-12 w-full rounded-md border border-input bg-background px-3 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring" />
              {showBreedResults && matchingBreeds.length > 0 && <ul id="breed-results" role="listbox" className="absolute left-0 top-full z-20 mt-2 max-h-56 w-full overflow-y-auto rounded-md border border-border bg-card p-1 shadow-md">{matchingBreeds.map((breed) => <li key={breed} role="option" aria-selected={value.breed === breed}><Button type="button" variant="outline" className="min-h-12 w-full justify-start rounded-sm border-0 bg-transparent px-3 text-left shadow-none hover:bg-muted" onMouseDown={(event) => { event.preventDefault(); setField("breed", breed); setShowBreedResults(false); }}>{breed}</Button></li>)}</ul>}
            </span>
            <span className="text-xs font-normal text-muted-foreground">{value.species === "dog" ? "Search all 554 dog breeds, or enter a breed not listed." : "Search a suggestion or enter a breed not listed."}</span>
          </label>
          <label className="grid min-w-0 gap-2 text-sm font-medium text-foreground">
            Sex
            <select value={value.sex} onChange={(event) => setField("sex", event.target.value as PetFormInput["sex"])} className="min-h-12 rounded-md border border-input bg-background px-3 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring">
              {sexOptions.map((sex) => <option key={sex} value={sex}>{sex}</option>)}
            </select>
          </label>
          <label className="grid min-w-0 gap-2 text-sm font-medium text-foreground">
            Date of birth
            <input type="date" value={value.dateOfBirth} onChange={(event) => setField("dateOfBirth", event.target.value)} className="min-h-12 rounded-md border border-input bg-background px-3 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </label>
          <label className="grid min-w-0 gap-2 text-sm font-medium text-foreground">
            Age (years)
            <input type="number" min="0" step="1" value={value.age} onChange={(event) => setField("age", event.target.value)} className="min-h-12 rounded-md border border-input bg-background px-3 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </label>
          <label className="grid min-w-0 gap-2 text-sm font-medium text-foreground md:col-span-2">
            Notes
            <textarea value={value.notes} onChange={(event) => setField("notes", event.target.value)} rows={4} className="min-h-32 rounded-md border border-input bg-background px-3 py-3 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </label>
          </div>
          {error && <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</p>}
        </CardContent>
        <CardFooter className="flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-end">
          <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={onCancel} disabled={isPending}>Cancel</Button>
          <Button type="submit" className="w-full sm:w-auto" disabled={isPending}>{isPending && <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />}{submitLabel}</Button>
        </CardFooter>
      </Card>
    </form>
  );
}
