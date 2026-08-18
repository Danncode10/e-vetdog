export type DashboardTabId =
  | "overview"
  | "pets"
  | "owners"
  | "appointments"
  | "settings";

export type FeatureFlag =
  | "always"
  | "pets"
  | "owners"
  | "appointments";

interface TabConfig {
  id: DashboardTabId;
  label: string;
  feature: FeatureFlag;
}

export const TAB_CONFIG: TabConfig[] = [
  { id: "overview",     label: "Overview",     feature: "always" },
  { id: "pets",        label: "Pets",         feature: "pets" },
  { id: "owners",      label: "Owners",       feature: "owners" },
  { id: "appointments", label: "Appointments", feature: "appointments" },
  { id: "settings",    label: "Settings",     feature: "always" },
];

export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return flag === "always" || flag === "pets" || flag === "owners" || flag === "appointments";
}

export function getEnabledTabs(): TabConfig[] {
  return TAB_CONFIG.filter((t) => isFeatureEnabled(t.feature));
}
