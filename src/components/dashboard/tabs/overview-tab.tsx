"use client";

import { PawPrint, Users, CalendarDays, ArrowRight, ShieldCheck, Sparkles, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
    description: "View pet records & medical history",
    badge: "Pet Registry",
    tab: "pets" as DashboardTabId,
    feature: "pets" as const,
    color: "from-emerald-500/10 to-teal-500/5 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    iconBg: "bg-emerald-500 text-white dark:bg-emerald-600",
  },
  {
    icon: Users,
    label: "Owners",
    description: "Owner profiles & co-owner links",
    badge: "Client Directory",
    tab: "owners" as DashboardTabId,
    feature: "owners" as const,
    color: "from-blue-500/10 to-indigo-500/5 text-blue-600 dark:text-blue-400 border-blue-500/20",
    iconBg: "bg-blue-500 text-white dark:bg-blue-600",
  },
  {
    icon: CalendarDays,
    label: "Appointments",
    description: "Schedule visits & check-in patients",
    badge: "Booking Hub",
    tab: "appointments" as DashboardTabId,
    feature: "appointments" as const,
    color: "from-amber-500/10 to-orange-500/5 text-amber-600 dark:text-amber-400 border-amber-500/20",
    iconBg: "bg-amber-500 text-white dark:bg-amber-600",
  },
];

export function OverviewTab({ displayName, setTab, role }: OverviewTabProps) {
  const visibleCards = statCards.filter((card) => isFeatureEnabled(card.feature, role));
  const todayDateStr = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-6">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Sparkles className="w-3.5 h-3.5" />
                Welcome Back
              </span>
              {role && (
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/60 px-2.5 py-0.5 text-xs font-medium text-foreground capitalize">
                  <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                  {role}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Hello, {displayName}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Here is what is happening at your clinic today.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground bg-muted/40 border border-border/60 rounded-2xl px-4 py-2.5 self-start sm:self-auto">
            <Clock className="w-4 h-4 text-primary shrink-0" />
            <span>{todayDateStr}</span>
          </div>
        </div>
      </div>

      {/* Feature Navigation Grid */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 px-1">
          Quick Access Hub
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleCards.map(({ icon: Icon, label, description, badge, tab, color, iconBg }) => (
            <Card
              key={tab}
              className={`group relative overflow-hidden transition-all duration-200 hover:shadow-md hover:border-primary/40 bg-gradient-to-br ${color} cursor-pointer`}
              onClick={() => setTab(tab)}
            >
              <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconBg} shadow-sm transition-transform duration-200 group-hover:scale-105`}>
                    <Icon className="w-6 h-6" strokeWidth={1.75} />
                  </div>
                  <span className="text-[11px] font-semibold tracking-wide uppercase px-2.5 py-1 rounded-full bg-background/80 border border-border/60 text-muted-foreground backdrop-blur-xs">
                    {badge}
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                    {label}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {description}
                  </p>
                </div>

                <div className="pt-2 flex items-center text-xs font-semibold text-primary gap-1 group-hover:translate-x-1 transition-transform">
                  <span>Open {label.toLowerCase()}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Action Tiles */}
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-4">
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-foreground">Common Actions</h3>
          <p className="text-xs sm:text-sm text-muted-foreground">Shortcuts to manage records and schedules.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {visibleCards.map(({ icon: Icon, label, description, tab }) => (
            <Button
              key={tab}
              variant="outline"
              onClick={() => setTab(tab)}
              className="h-auto p-4 flex items-start gap-3 text-left justify-start rounded-xl border-border/80 hover:bg-muted/50 hover:border-primary/40 transition-all min-h-[52px]"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="font-semibold text-sm text-foreground block truncate">
                  Manage {label}
                </span>
                <span className="text-xs text-muted-foreground line-clamp-1">
                  {description}
                </span>
              </div>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

