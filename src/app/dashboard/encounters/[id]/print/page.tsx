import { requireAuth } from "@/services/authorization";
import { getEncounterDetails } from "@/services/clinical";
import { notFound } from "next/navigation";
import { AutoDownloader } from "@/components/dashboard/clinical/auto-downloader";

export default async function PrintEncounterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth();
  const { id } = await params;

  let encounterData;
  try {
    encounterData = await getEncounterDetails(id);
  } catch (e) {
    console.error("Failed to load encounter for print:", e);
    notFound();
  }

  const { encounter, notes, diagnoses, treatments, prescriptions } = encounterData;
  const pet = encounter.pets;
  const vet = encounter.veterinarian;

  const formatDate = (date: string | Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    }).format(new Date(date));
  };

  const filename = `Clinical_Record_${encounter.id.split("-")[0].toUpperCase()}.pdf`;

  return <AutoDownloader filename={filename} encounterData={encounterData} />;
}
