"use client";

import Link from "next/link";
import { PlusCircle, Receipt, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Tables } from "@/types/supabase";

type Invoice = Tables<"invoices"> & {
  owner: { id: string; full_name: string | null; email: string | null } | null;
};

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  draft: { label: "Draft", variant: "secondary" },
  unpaid: { label: "Unpaid", variant: "destructive" },
  partial: { label: "Partial", variant: "default" },
  paid: { label: "Paid", variant: "outline" },
  voided: { label: "Voided", variant: "secondary" },
};

const STATUS_COLORS: Record<string, string> = {
  draft: "text-muted-foreground",
  unpaid: "text-destructive",
  partial: "text-blue-600 dark:text-blue-400",
  paid: "text-emerald-600 dark:text-emerald-400",
  voided: "text-muted-foreground line-through",
};

function fmt(n: number | string) {
  return Number(n).toLocaleString("en-PH", { style: "currency", currency: "PHP" });
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function InvoiceList({ invoices }: { invoices: Invoice[] }) {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Receipt className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Invoices</h1>
          <Badge variant="secondary" className="ml-1">
            {invoices.length}
          </Badge>
        </div>
        <Link
          href="/dashboard/billing/new"
          className="inline-flex items-center justify-center min-h-12 px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          New Invoice
        </Link>
      </div>

      {/* Empty state */}
      {invoices.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <FileText className="h-12 w-12 text-muted-foreground/40" />
            <div className="text-center">
              <p className="text-foreground font-medium">No invoices yet</p>
              <p className="text-muted-foreground text-sm mt-1">
                Create your first invoice to get started.
              </p>
            </div>
            <Link
              href="/dashboard/billing/new"
              className="inline-flex items-center justify-center min-h-12 px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              New Invoice
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Invoice table */}
      {invoices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-muted-foreground font-normal">
              All Invoices
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="text-left px-6 py-3 font-medium text-muted-foreground">Invoice #</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Client</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Date</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Total</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {invoices.map((invoice) => {
                    const statusConfig = STATUS_CONFIG[invoice.status] ?? {
                      label: invoice.status,
                      variant: "secondary" as const,
                    };
                    return (
                      <tr key={invoice.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs font-medium text-foreground">
                          {invoice.invoice_number || (
                            <span className="text-muted-foreground italic">Pending...</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-medium text-foreground">
                            {invoice.owner?.full_name ?? "Unknown"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {invoice.owner?.email ?? ""}
                          </div>
                        </td>
                        <td className="px-4 py-4 hidden sm:table-cell text-muted-foreground">
                          {fmtDate(invoice.issue_date)}
                        </td>
                        <td className={`px-4 py-4 text-right font-semibold ${STATUS_COLORS[invoice.status] ?? ""}`}>
                          {fmt(invoice.total_amount)}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                        </td>
                        <td className="px-4 py-4">
                          <Link
                            href={`/dashboard/billing/${invoice.id}`}
                            className="inline-flex items-center justify-center min-h-8 h-8 px-3 text-xs font-medium rounded-lg bg-transparent hover:bg-muted text-foreground transition-colors"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
