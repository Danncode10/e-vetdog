"use client";

import * as React from "react";
import {
  ScrollText,
  Search,
  Calendar,
  Stethoscope,
  Receipt,
  ShieldCheck,
  Clock,
  User,
  RefreshCw,
  Sparkles,
  Activity,
  Layers,
  X,
  TrendingUp,
  CreditCard,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getClinicActivityLogs, type ClinicActivityLog, type LogCategory } from "@/services/audit-logs";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatDateTime(isoStr: string): string {
  if (!isoStr) return "—";
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return isoStr;
  const month = MONTHS[d.getMonth()];
  const day = d.getDate();
  const year = d.getFullYear();
  let hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${month} ${day}, ${year} · ${hours}:${minutes} ${ampm}`;
}

function timeAgo(isoStr: string): string {
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins = Math.floor(diff / (1000 * 60));
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const CATEGORY_CONFIG = {
  all: {
    label: "All Activity",
    icon: Layers,
    badgeBg: "bg-muted text-foreground border-border",
    accent: "border-l-primary",
  },
  appointment: {
    label: "Appointments",
    icon: Calendar,
    badgeBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
    accent: "border-l-blue-500",
    iconBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  clinical: {
    label: "Clinical & EMR",
    icon: Stethoscope,
    badgeBg: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
    accent: "border-l-purple-500",
    iconBg: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  },
  billing: {
    label: "Billing & Receipts",
    icon: Receipt,
    badgeBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    accent: "border-l-emerald-500",
    iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  staff: {
    label: "Staff & Security",
    icon: ShieldCheck,
    badgeBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
    accent: "border-l-amber-500",
    iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
} as const;

export function LogsTab() {
  const [logs, setLogs] = React.useState<ClinicActivityLog[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [category, setCategory] = React.useState<LogCategory>("all");
  const [search, setSearch] = React.useState("");

  const loadLogs = React.useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await getClinicActivityLogs({ limit: 150 });
      setLogs(data);
    } catch (err) {
      console.error("Failed to load clinic activity logs:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  // Client-side filtering
  const filteredLogs = React.useMemo(() => {
    let result = logs;

    if (category !== "all") {
      result = result.filter((l) => l.category === category);
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (l) =>
          l.action.toLowerCase().includes(q) ||
          l.description.toLowerCase().includes(q) ||
          l.actor.name.toLowerCase().includes(q) ||
          (l.target?.label && l.target.label.toLowerCase().includes(q))
      );
    }

    return result;
  }, [logs, category, search]);

  const counts = React.useMemo(() => {
    return {
      all: logs.length,
      appointment: logs.filter((l) => l.category === "appointment").length,
      clinical: logs.filter((l) => l.category === "clinical").length,
      billing: logs.filter((l) => l.category === "billing").length,
      staff: logs.filter((l) => l.category === "staff").length,
    };
  }, [logs]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Sparkles className="size-3.5" />
                Audit & Compliance
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Stream
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Clinic Activity Logs
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
              Chronological ledger tracking staff diagnoses, appointment transitions, financial transactions, and system modifications.
            </p>
          </div>

          <Button
            variant="outline"
            onClick={() => loadLogs(true)}
            disabled={refreshing || loading}
            className="min-h-11 px-4 rounded-xl gap-2 font-semibold shadow-xs hover:bg-muted self-start sm:self-auto cursor-pointer"
          >
            <RefreshCw className={`size-4 ${refreshing ? "animate-spin text-primary" : ""}`} />
            Refresh Feed
          </Button>
        </div>

        {/* Mini Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-border/70">
          <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/50">
            <div className="text-xs font-medium text-muted-foreground">Total Activity</div>
            <div className="text-xl font-bold text-foreground mt-0.5 font-mono">{counts.all}</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-blue-500/5 border border-blue-500/15">
            <div className="text-xs font-medium text-blue-600 dark:text-blue-400">Appointments</div>
            <div className="text-xl font-bold text-foreground mt-0.5 font-mono">{counts.appointment}</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-purple-500/5 border border-purple-500/15">
            <div className="text-xs font-medium text-purple-600 dark:text-purple-400">Clinical / EMR</div>
            <div className="text-xl font-bold text-foreground mt-0.5 font-mono">{counts.clinical}</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/15">
            <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Billing Receipts</div>
            <div className="text-xl font-bold text-foreground mt-0.5 font-mono">{counts.billing}</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar Container */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          {(["all", "appointment", "clinical", "billing", "staff"] as const).map((cat) => {
            const config = CATEGORY_CONFIG[cat];
            const Icon = config.icon;
            const isSelected = category === cat;
            const count = counts[cat];

            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground border border-border"
                }`}
              >
                <Icon className="size-3.5" />
                <span>{config.label}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    isSelected ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input Box */}
        <div className="relative w-full lg:w-80 shrink-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by actor, patient, receipt #..."
            className="min-h-11 w-full rounded-xl border border-input bg-card pl-9 pr-9 text-xs text-foreground outline-none transition-all placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded-full"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Activity Timeline Cards */}
      {loading ? (
        <Card className="rounded-2xl border border-border bg-card">
          <CardContent className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <RefreshCw className="size-7 animate-spin text-primary" />
            <p className="text-sm font-semibold text-foreground">Synchronizing activity logs...</p>
            <p className="text-xs text-muted-foreground">Aggregating records from appointments, clinical EMR, and payments.</p>
          </CardContent>
        </Card>
      ) : filteredLogs.length === 0 ? (
        <Card className="rounded-2xl border border-border bg-card">
          <CardContent className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <Activity className="size-7" />
            </div>
            <div className="max-w-xs">
              <p className="text-base font-bold text-foreground">No events recorded</p>
              <p className="text-xs text-muted-foreground mt-1">
                {search ? "No activity matched your current search filters." : "No clinic activity found in this category yet."}
              </p>
            </div>
            {search && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearch("")}
                className="rounded-xl text-xs font-semibold"
              >
                Clear Search Filter
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredLogs.map((log) => {
            const config = CATEGORY_CONFIG[log.category];
            const Icon = config.icon;
            const actorInitial = log.actor.name.charAt(0).toUpperCase();

            return (
              <Card
                key={log.id}
                className="rounded-2xl border border-border bg-card shadow-2xs hover:shadow-xs transition-all duration-150 overflow-hidden"
              >
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  {/* Left Icon and Content */}
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`flex size-10 shrink-0 items-center justify-center rounded-xl border ${config.badgeBg}`}
                    >
                      <Icon className="size-5" />
                    </div>

                    <div className="space-y-1.5">
                      {/* Top Action & Target Header */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                          {log.action}
                        </span>
                        {log.target && (
                          <span className="inline-flex items-center rounded-md bg-muted/80 px-2 py-0.5 text-xs font-semibold font-mono text-foreground border border-border/60">
                            {log.target.label}
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        {log.description}
                      </p>

                      {/* Actor Pill with Avatar */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 border border-border/60 px-2.5 py-0.5 text-xs text-foreground">
                          <div className="size-4 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[9px] font-bold">
                            {actorInitial}
                          </div>
                          <span className="font-semibold text-[11px]">{log.actor.name}</span>
                        </div>
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary capitalize">
                          {log.actor.role || "staff"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Timestamp */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between text-xs shrink-0 sm:pl-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-border/60">
                    <span className="font-bold text-foreground text-xs font-mono">{timeAgo(log.timestamp)}</span>
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="size-3" />
                      {formatDateTime(log.timestamp)}
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
