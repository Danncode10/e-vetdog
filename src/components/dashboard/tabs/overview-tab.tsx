"use client";

import { PawPrint, Users, CalendarDays, ArrowRight, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { DashboardTabId, UserRole } from "@/lib/dashboard-features";
import { isFeatureEnabled } from "@/lib/dashboard-features";

interface OverviewTabProps {
  displayName: string;
  setTab: (tab: DashboardTabId) => void;
  role: UserRole;
}

const statCards = [
  {
    icon: PawPrint,
    label: "Patients",
    description: "Manage pet records",
    tab: "pets" as DashboardTabId,
    feature: "pets" as const,
  },
  {
    icon: Users,
    label: "Owners",
    description: "Owner profiles and co-owners",
    tab: "owners" as DashboardTabId,
    feature: "owners" as const,
  },
  {
    icon: CalendarDays,
    label: "Appointments",
    description: "Schedule and check-ins",
    tab: "appointments" as DashboardTabId,
    feature: "appointments" as const,
  },
];

export function OverviewTab({ displayName, setTab, role }: OverviewTabProps) {
  const visibleCards = statCards.filter((card) => isFeatureEnabled(card.feature, role));
  const visibleQuickActions = statCards.filter((card) => isFeatureEnabled(card.feature, role));

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">
          Welcome back, {displayName}
        </h2>
        <p className="mt-2 text-muted-foreground text-lg">
          What would you like to do today?
        </p>
        {role && (
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-[12px] font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="capitalize">{role}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {visibleCards.map(({ icon: Icon, label, description, tab }) => (
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
          {visibleQuickActions.map(({ icon: Icon, label, description, tab }) => (
            <Button
              key={tab}
              variant="outline"
              onClick={() => setTab(tab)}
              className="h-auto py-4 flex flex-col items-start gap-1"
            >
              <Icon className="w-5 h-5 text-primary" />
              <span className="font-medium">Add New {label}</span>
              <span className="text-xs text-muted-foreground">{description}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
