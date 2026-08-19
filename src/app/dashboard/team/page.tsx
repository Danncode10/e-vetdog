import { requireRole } from "@/services/authorization";
import { User, ShieldCheck } from "lucide-react";

export default async function TeamPage() {
  // Only admins can access team management
  await requireRole(["admin"]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground tracking-tight">Team Management</h2>
          <p className="mt-1 text-[14px] text-muted-foreground">Invite and manage clinic staff accounts.</p>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-[12px] font-medium">
          <ShieldCheck className="w-3.5 h-3.5" />
          Admin Only
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-12 text-center">
        <User className="w-10 h-10 text-muted-foreground mx-auto mb-3" strokeWidth={1.5} />
        <p className="text-[14px] text-muted-foreground max-w-md mx-auto">
          Staff invitation and management will be available in Phase 2. This area is restricted to administrators only.
        </p>
      </div>
    </div>
  );
}
