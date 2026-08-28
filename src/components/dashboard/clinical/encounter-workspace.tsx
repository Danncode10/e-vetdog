"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  PawPrint,
  Clock,
  Calendar,
  Save,
  CheckCircle,
  FileText,
  History,
  ArrowLeft,
  Plus,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { saveEncounterDraft, signEncounter } from "@/services/clinical";
import Link from "next/link";

interface EncounterWorkspaceProps {
  encounterData: any;
  history: any[];
  petProfile: any;
  profile: any;
}

export function EncounterWorkspace({
  encounterData,
  history,
  petProfile,
  profile,
}: EncounterWorkspaceProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState<"current" | "history">("current");
  const [isSaving, setIsSaving] = React.useState(false);

  const enc = encounterData.encounter;
  const initialNote = encounterData.notes || {};
  
  const [encounterNotes, setEncounterNotes] = React.useState(enc.notes || "");
  const [chiefComplaint, setChiefComplaint] = React.useState(initialNote.chief_complaint || "");
  const [subjective, setSubjective] = React.useState(initialNote.subjective || "");
  const [objective, setObjective] = React.useState(initialNote.objective || "");
  const [assessment, setAssessment] = React.useState(initialNote.assessment || "");
  const [plan, setPlan] = React.useState(initialNote.plan || "");

  const [diagnoses, setDiagnoses] = React.useState<any[]>(encounterData.diagnoses || []);
  const [treatments, setTreatments] = React.useState<any[]>(encounterData.treatments || []);
  const [prescriptions, setPrescriptions] = React.useState<any[]>(encounterData.prescriptions || []);

  const isSigned = enc.status === "signed";

  const addDiagnosis = () => setDiagnoses([...diagnoses, { description: "", diagnosis_code: "", notes: "" }]);
  const updateDiagnosis = (i: number, field: string, value: string) => {
    const updated = [...diagnoses];
    updated[i][field] = value;
    setDiagnoses(updated);
  };
  const removeDiagnosis = (i: number) => setDiagnoses(diagnoses.filter((_, idx) => idx !== i));

  const addTreatment = () => setTreatments([...treatments, { name: "", description: "", cost: 0 }]);
  const updateTreatment = (i: number, field: string, value: string) => {
    const updated = [...treatments];
    updated[i][field] = value;
    setTreatments(updated);
  };
  const removeTreatment = (i: number) => setTreatments(treatments.filter((_, idx) => idx !== i));

  const addPrescription = () => setPrescriptions([...prescriptions, { medication_name: "", dosage: "", frequency: "", duration: "", instructions: "" }]);
  const updatePrescription = (i: number, field: string, value: string) => {
    const updated = [...prescriptions];
    updated[i][field] = value;
    setPrescriptions(updated);
  };
  const removePrescription = (i: number) => setPrescriptions(prescriptions.filter((_, idx) => idx !== i));

  const handleSaveDraft = async () => {
    if (isSigned) return;
    setIsSaving(true);
    try {
      await saveEncounterDraft(enc.id, {
        encounterNotes,
        clinicalNote: {
          chief_complaint: chiefComplaint,
          subjective,
          objective,
          assessment,
          plan,
        },
        diagnoses,
        treatments,
        prescriptions,
      });
      router.refresh();
      alert("Draft saved successfully!");
    } catch (e) {
      console.error(e);
      alert("Failed to save draft.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignRecord = async () => {
    if (isSigned) return;
    if (!confirm("Are you sure you want to sign this encounter? Once signed, it cannot be modified directly.")) return;
    
    setIsSaving(true);
    try {
      // First save draft, then sign
      await saveEncounterDraft(enc.id, {
        encounterNotes,
        clinicalNote: {
          chief_complaint: chiefComplaint,
          subjective,
          objective,
          assessment,
          plan,
        },
        diagnoses,
        treatments,
        prescriptions,
      });
      await signEncounter(enc.id);
      router.refresh();
      alert("Encounter signed successfully!");
    } catch (e) {
      console.error(e);
      alert("Failed to sign record.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 px-4 py-6 md:px-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <Link href={`/dashboard/appointments/${enc.appointment_id}`} className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-2">
            <ArrowLeft className="h-3 w-3" /> Back to Appointment
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Encounter Workspace
            {isSigned && <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full border border-green-200">Signed</span>}
            {!isSigned && <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full border border-amber-200">Draft</span>}
          </h1>
        </div>
        {!isSigned && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSaveDraft} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" /> {isSaving ? "Saving..." : "Save Draft"}
            </Button>
            <Button variant="default" onClick={handleSignRecord} disabled={isSaving}>
              <CheckCircle className="h-4 w-4 mr-2" /> Sign Record
            </Button>
          </div>
        )}
      </div>

      {/* Patient Info */}
      <div className="bg-card border border-border p-4 rounded-xl flex items-center gap-4">
        <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
          <PawPrint className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold">{petProfile?.name || "Patient"}</h2>
          <p className="text-sm text-muted-foreground capitalize">
            {[petProfile?.species, petProfile?.breed, petProfile?.age ? `${petProfile.age} yrs` : null].filter(Boolean).join(" • ")}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab("current")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold border-b-2 ${
            activeTab === "current" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileText className="h-4 w-4" /> Current Visit
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold border-b-2 ${
            activeTab === "history" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <History className="h-4 w-4" /> Medical History
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "current" && (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* SOAP Notes */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">SOAP Notes</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Chief Complaint / Notes</label>
                  <Textarea value={chiefComplaint} onChange={(e: any) => setChiefComplaint(e.target.value)} disabled={isSigned} placeholder="Reason for visit..." className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Subjective</label>
                  <Textarea value={subjective} onChange={(e: any) => setSubjective(e.target.value)} disabled={isSigned} placeholder="History, client observations..." className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Objective</label>
                  <Textarea value={objective} onChange={(e: any) => setObjective(e.target.value)} disabled={isSigned} placeholder="Exam findings, vitals..." className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Assessment</label>
                  <Textarea value={assessment} onChange={(e: any) => setAssessment(e.target.value)} disabled={isSigned} placeholder="Differentials, working diagnosis..." className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Plan</label>
                  <Textarea value={plan} onChange={(e: any) => setPlan(e.target.value)} disabled={isSigned} placeholder="Treatment plan, diagnostics, follow-up..." className="mt-1" />
                </div>
              </div>
            </div>

            {/* Right Column: Diagnoses, Treatments, Prescriptions */}
            <div className="space-y-6">
              {/* Diagnoses */}
              <div className="bg-muted/30 p-4 rounded-xl border border-border">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-semibold">Diagnoses</h3>
                  {!isSigned && <Button size="sm" variant="ghost" onClick={addDiagnosis}><Plus className="h-4 w-4" /></Button>}
                </div>
                <div className="space-y-3">
                  {diagnoses.length === 0 && <p className="text-xs text-muted-foreground">No diagnoses added.</p>}
                  {diagnoses.map((d, i) => (
                    <div key={i} className="flex gap-2">
                      <Input placeholder="Code (opt)" value={d.diagnosis_code || ""} onChange={(e: any) => updateDiagnosis(i, "diagnosis_code", e.target.value)} disabled={isSigned} className="w-24" />
                      <Input placeholder="Description" value={d.description || ""} onChange={(e: any) => updateDiagnosis(i, "description", e.target.value)} disabled={isSigned} className="flex-1" />
                      {!isSigned && <Button size="icon" variant="ghost" onClick={() => removeDiagnosis(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Treatments */}
              <div className="bg-muted/30 p-4 rounded-xl border border-border">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-semibold">Treatments</h3>
                  {!isSigned && <Button size="sm" variant="ghost" onClick={addTreatment}><Plus className="h-4 w-4" /></Button>}
                </div>
                <div className="space-y-3">
                  {treatments.length === 0 && <p className="text-xs text-muted-foreground">No treatments added.</p>}
                  {treatments.map((t, i) => (
                    <div key={i} className="flex gap-2">
                      <Input placeholder="Name" value={t.name || ""} onChange={(e: any) => updateTreatment(i, "name", e.target.value)} disabled={isSigned} className="flex-1" />
                      <Input type="number" placeholder="Cost" value={t.cost || ""} onChange={(e: any) => updateTreatment(i, "cost", e.target.value)} disabled={isSigned} className="w-24" />
                      {!isSigned && <Button size="icon" variant="ghost" onClick={() => removeTreatment(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Prescriptions */}
              <div className="bg-muted/30 p-4 rounded-xl border border-border">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-semibold">Prescriptions</h3>
                  {!isSigned && <Button size="sm" variant="ghost" onClick={addPrescription}><Plus className="h-4 w-4" /></Button>}
                </div>
                <div className="space-y-3">
                  {prescriptions.length === 0 && <p className="text-xs text-muted-foreground">No prescriptions added.</p>}
                  {prescriptions.map((p, i) => (
                    <div key={i} className="space-y-2 border-b border-border/50 pb-2 last:border-0 last:pb-0">
                      <div className="flex gap-2">
                        <Input placeholder="Medication" value={p.medication_name || ""} onChange={(e: any) => updatePrescription(i, "medication_name", e.target.value)} disabled={isSigned} className="flex-1" />
                        {!isSigned && <Button size="icon" variant="ghost" onClick={() => removePrescription(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                      </div>
                      <div className="flex gap-2">
                        <Input placeholder="Dosage" value={p.dosage || ""} onChange={(e: any) => updatePrescription(i, "dosage", e.target.value)} disabled={isSigned} className="w-1/3" />
                        <Input placeholder="Freq." value={p.frequency || ""} onChange={(e: any) => updatePrescription(i, "frequency", e.target.value)} disabled={isSigned} className="w-1/3" />
                        <Input placeholder="Dur." value={p.duration || ""} onChange={(e: any) => updatePrescription(i, "duration", e.target.value)} disabled={isSigned} className="w-1/3" />
                      </div>
                      <Input placeholder="Instructions" value={p.instructions || ""} onChange={(e: any) => updatePrescription(i, "instructions", e.target.value)} disabled={isSigned} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "history" && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Past Medical Records</h3>
          {history.length === 0 ? (
             <p className="text-sm text-muted-foreground">No signed past encounters found.</p>
          ) : (
             <div className="space-y-4">
               {history.map((h: any) => (
                 <div key={h.encounter.id} className="border border-border bg-card p-4 rounded-xl shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span className="font-semibold">{new Date(h.encounter.signed_at).toLocaleDateString()}</span>
                      <span className="text-xs text-muted-foreground ml-2">Vet: {h.encounter.veterinarian?.full_name}</span>
                    </div>
                    {h.notes?.chief_complaint && (
                      <div className="mt-2 text-sm">
                        <span className="font-medium">Reason: </span> {h.notes.chief_complaint}
                      </div>
                    )}
                    {h.diagnoses?.length > 0 && (
                      <div className="mt-2 text-sm">
                        <span className="font-medium">Diagnoses: </span> 
                        {h.diagnoses.map((d: any) => d.description).join(", ")}
                      </div>
                    )}
                    {h.treatments?.length > 0 && (
                      <div className="mt-2 text-sm">
                        <span className="font-medium">Treatments: </span> 
                        {h.treatments.map((t: any) => t.name).join(", ")}
                      </div>
                    )}
                 </div>
               ))}
             </div>
          )}
        </div>
      )}
    </div>
  );
}
