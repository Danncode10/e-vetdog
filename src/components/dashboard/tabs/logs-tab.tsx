"use client";

import * as React from "react";
import {
  ScrollText,
  Search,
  Calendar,
  Stethoscope,
  Receipt,
  ShieldCheck,
  Filter,
  Clock,
  User,
  RefreshCw,
  Sparkles,
  Activity,
  Layers,
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

const CATEGORY_META = {
  all: { label: "All Activity", icon: Layers, color: "text-foreground" },
  appointment: {
    label: "Appointments",
    icon: Calendar,
    color: "text-blue-600 dark:text-blue-400",
    badgeBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  },
  clinical: {
    label: "Clinical & EMR",
    icon: Stethoscope,
    color: "text-purple-600 dark:text-purple-400",
    badgeBg: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  },
  billing: {
    label: "Billing & Receipts",
    icon: Receipt,
    color: "text-emerald-600 dark:text-emerald-400",
    badgeBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  staff: {
    label: "Staff & Security",
    icon: ShieldCheck,
    color: "text-amber-600 dark:text-amber-400",
    badgeBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
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

  // Client-side filtering for fast interactive feedback
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
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* Top Header Card */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ScrollText className="size-5" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Clinic Audit & Activity Logs</h1>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                {logs.length} events
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Real-time audit trail of staff diagnoses, status updates, billings, and schedule configurations.
            </p>
          </div>

          <Button
            variant="outline"
            onClick={() => loadLogs(true)}
            disabled={refreshing || loading}
            className="min-h-10 rounded-xl gap-2 font-medium self-start sm:self-auto cursor-pointer"
          >
            <RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh Logs
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {(["all", "appointment", "clinical", "billing", "staff"] as const).map((cat) => {
            const meta = CATEGORY_META[cat];
            const Icon = meta.icon;
            const isSelected = category === cat;
            const count = counts[cat];

            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/60"
                }`}
              >
                <Icon className="size-3.5" />
                <span>{meta.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                    isSelected ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[260px] md:max-w-xs w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by actor, patient, receipt..."
            className="min-h-10 w-full rounded-xl border border-input bg-background pl-9 pr-4 text-xs text-foreground outline-none transition-all placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>

      {/* Logs Feed */}
      {loading ? (
        <Card className="rounded-2xl border border-border bg-card">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <RefreshCw className="size-6 animate-spin text-primary" />
            <p className="text-sm font-medium text-muted-foreground">Loading clinic audit logs...</p>
          </CardContent>
        </Card>
      ) : filteredLogs.length === 0 ? (
        <Card className="rounded-2xl border border-border bg-card">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <Activity className="size-6" />
            </div>
            <div>
              <p className="text-base font-semibold text-foreground">No logs found</p>
              <p className="text-xs text-muted-foreground mt-1">
                {search ? "No activity matches your search query." : "No activity recorded in this category yet."}
              </p>
            </div>
            {search && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearch("")}
                className="mt-2 rounded-xl text-xs"
              >
                Clear Search
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
          <div className="divide-y divide-border/60">
            {filteredLogs.map((log) => {
              const meta = CATEGORY_META[log.category];
              const Icon = meta.icon;

              return (
                <div
                  key={log.id}
                  className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 p-4 sm:p-5 hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-start gap-3.5">
                    {/* Category Icon */}
                    <div
                      className={`flex size-9 shrink-0 items-center justify-center rounded-xl border ${meta.badgeBg}`}
                    >
                      <Icon className="size-4.5" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-foreground">{log.action}</span>
                        {log.target && (
                          <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-semibold text-foreground/80 font-mono">
                            {log.target.label}
                          </span>
                        )}
                      </div>

                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        {log.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-foreground/80">
                          <User className="size-3 text-muted-foreground" />
                          {log.actor.name}
                        </span>
                        <span className="text-muted-foreground text-[10px]">·</span>
                        <span className="rounded-full bg-primary/10 px-2 py-0.2 text-[10px] font-semibold text-primary capitalize">
                          {log.actor.role || "staff"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Timestamp */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between text-xs text-muted-foreground shrink-0 sm:pl-4">
                    <span className="font-semibold text-foreground text-[11px]">{timeAgo(log.timestamp)}</span>
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="size-3" />
                      {formatDateTime(log.timestamp)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
