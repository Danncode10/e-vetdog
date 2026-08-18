"use client";

import { PawPrint, Users, CalendarDays, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { DashboardTabId } from "@/lib/dashboard-features";

interface OverviewTabProps {
  displayName: string;
  setTab: (tab: DashboardTabId) => void;
}

const statCards = [
  {
    icon: PawPrint,
    label: "Patients",
    description: "Manage pet records",
    tab: "pets" as DashboardTabId,
  },
  {
    icon: Users,
    label: "Owners",
    description: "Owner profiles and co-owners",
    tab: "owners" as DashboardTabId,
  },
  {
    icon: CalendarDays,
    label: "Appointments",
    description: "Schedule and check-ins",
    tab: "appointments" as DashboardTabId,
  },
];

export function OverviewTab({ displayName, setTab }: OverviewTabProps) {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">
          Welcome back, {displayName}
        </h2>
        <p className="mt-2 text-muted-foreground text-lg">
          What would you like to do today?
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statCards.map(({ icon: Icon, label, description, tab }) => (
          <Card key={tab} className="cursor-pointer hover:shadow-lg transition-shadow h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <div className="rounded-xl bg-primary p-3 text-primary-foreground">
                  <Icon className="w-5 h-5" strokeWidth={1.5} />
                </div>
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground mb-4">{description}</p>
              <Button
                variant="outline"
                className="w-full justify-between"
                onClick={() => setTab(tab)}
              >
                <span>Open</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h3 className="text-lg font-semibold text-foreground mb-3">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Button variant="outline" onClick={() => setTab("pets")} className="h-auto py-4 flex flex-col items-start gap-1">
            <PawPrint className="w-5 h-5 text-primary" />
            <span className="font-medium">Add New Pet</span>
            <span className="text-xs text-muted-foreground">Register a patient</span>
          </Button>
          <Button variant="outline" onClick={() => setTab("owners")} className="h-auto py-4 flex flex-col items-start gap-1">
            <Users className="w-5 h-5 text-primary" />
            <span className="font-medium">Add New Owner</span>
            <span className="text-xs text-muted-foreground">Register an owner</span>
          </Button>
          <Button variant="outline" onClick={() => setTab("appointments")} className="h-auto py-4 flex flex-col items-start gap-1">
            <CalendarDays className="w-5 h-5 text-primary" />
            <span className="font-medium">Schedule Visit</span>
            <span className="text-xs text-muted-foreground">Book appointment</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
