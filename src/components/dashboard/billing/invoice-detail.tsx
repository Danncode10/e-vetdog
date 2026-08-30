"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Receipt, ChevronLeft, CheckCircle2, AlertCircle,
  Clock, Ban, Loader2, CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { finalizeInvoice, voidInvoice } from "@/services/billing";
import { RecordPaymentDialog } from "@/components/dashboard/billing/record-payment-dialog";
import type { InvoiceWithDetails } from "@/services/billing";
import Link from "next/link";

const STATUS_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  draft: {
    label: "Draft",
    icon: <Clock className="h-4 w-4" />,
    color: "text-muted-foreground",
  },
  unpaid: {
    label: "Unpaid",
    icon: <AlertCircle className="h-4 w-4" />,
    color: "text-destructive",
  },
  partial: {
    label: "Partially Paid",
    icon: <CreditCard className="h-4 w-4" />,
    color: "text-blue-600 dark:text-blue-400",
  },
  paid: {
    label: "Paid",
    icon: <CheckCircle2 className="h-4 w-4" />,
    color: "text-emerald-600 dark:text-emerald-400",
  },
  voided: {
    label: "Voided",
    icon: <Ban className="h-4 w-4" />,
    color: "text-muted-foreground",
  },
};

const METHOD_LABELS: Record<string, string> = {
  cash: "Cash",
  gcash: "GCash",
  card: "Card",
  bank_transfer: "Bank Transfer",
};

function fmt(n: number | string) {
  return Number(n).toLocaleString("en-PH", { style: "currency", currency: "PHP" });
}

function fmtDate(d: string) {
  return new Date(d).toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function InvoiceDetail({ invoice }: { invoice: InvoiceWithDetails }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  const statusMeta = STATUS_META[invoice.status] ?? STATUS_META.draft;
  const totalPaid = invoice.payments.reduce((sum, p) => sum + Number(p.amount_paid), 0);
  const balance = Number(invoice.total_amount) - totalPaid;
  const canFinalize = invoice.status === "draft" && invoice.invoice_items.length > 0;
  const canPay = invoice.status === "unpaid" || invoice.status === "partial";
  const canVoid = invoice.status === "draft" || invoice.status === "unpaid";

  function handleFinalize() {
    setError(null);
    startTransition(async () => {
      try {
        await finalizeInvoice(invoice.id);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to finalize invoice.");
      }
    });
  }

  function handleVoid() {
    if (!confirm("Are you sure you want to void this invoice? This cannot be undone.")) return;
    setError(null);
    startTransition(async () => {
      try {
        await voidInvoice(invoice.id);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to void invoice.");
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link
        href="/dashboard/billing"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        All Invoices
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Receipt className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground font-mono">
              {invoice.invoice_number || "Pending Number"}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Issued {fmtDate(invoice.issue_date)}
              {invoice.due_date && ` · Due ${new Date(invoice.due_date).toLocaleDateString("en-PH")}`}
            </p>
          </div>
        </div>

        <span className={`flex items-center gap-1.5 font-medium text-sm ${statusMeta.color}`}>
          {statusMeta.icon}
          {statusMeta.label}
        </span>
      </div>

      {/* Client info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Billed To</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-1">
          <p className="font-semibold text-foreground">{invoice.owner?.full_name ?? "Unknown Client"}</p>
          {invoice.owner?.email && <p className="text-muted-foreground">{invoice.owner.email}</p>}
          {invoice.owner?.phone && <p className="text-muted-foreground">{invoice.owner.phone}</p>}
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Line Items</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {invoice.invoice_items.length === 0 ? (
            <p className="text-sm text-muted-foreground px-6 py-4 italic">No items yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-6 py-3 font-medium text-muted-foreground">Description</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Qty</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Unit Price</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">VAT</th>
                  <th className="text-right px-6 py-3 font-medium text-muted-foreground">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {invoice.invoice_items.map((item) => {
                  const subtotal = Number(item.quantity) * Number(item.unit_price);
                  return (
                    <tr key={item.id}>
                      <td className="px-6 py-3 text-foreground">{item.description}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{Number(item.quantity)}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{fmt(item.unit_price)}</td>
                      <td className="px-4 py-3 text-center hidden sm:table-cell">
                        {item.is_vatable ? (
                          <Badge variant="outline" className="text-xs">VAT</Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">Exempt</span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-right font-medium">{fmt(subtotal)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Totals */}
      <Card>
        <CardContent className="pt-6">
          <dl className="space-y-2 text-sm max-w-xs ml-auto">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">VATable Sales</dt>
              <dd>{fmt(invoice.vatable_sales)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">VAT Exempt</dt>
              <dd>{fmt(invoice.vat_exempt_sales)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">VAT (12%)</dt>
              <dd>{fmt(invoice.vat_amount)}</dd>
            </div>
            <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
              <dt>Total Due</dt>
              <dd className="text-primary">{fmt(invoice.total_amount)}</dd>
            </div>
            {totalPaid > 0 && (
              <>
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <dt>Total Paid</dt>
                  <dd>−{fmt(totalPaid)}</dd>
                </div>
                <div className="flex justify-between border-t border-border pt-2 font-bold text-base">
                  <dt>Balance</dt>
                  <dd className={balance <= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}>
                    {balance <= 0 ? "Settled" : fmt(balance)}
                  </dd>
                </div>
              </>
            )}
          </dl>
        </CardContent>
      </Card>

      {/* Payment History */}
      {invoice.payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-6 py-3 font-medium text-muted-foreground">Receipt #</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Method</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Reference</th>
                  <th className="text-right px-6 py-3 font-medium text-muted-foreground">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {invoice.payments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="px-6 py-3 font-mono text-xs font-medium text-foreground">
                      {payment.receipt_number || "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                      {fmtDate(payment.payment_date)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary">{METHOD_LABELS[payment.method] ?? payment.method}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                      {payment.reference_number ?? "—"}
                    </td>
                    <td className="px-6 py-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                      {fmt(payment.amount_paid)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {error && (
        <p className="text-sm text-destructive font-medium" role="alert">
          {error}
        </p>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        {canFinalize && (
          <Button onClick={handleFinalize} disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Finalize Invoice
          </Button>
        )}
        {canPay && (
          <Button onClick={() => setShowPaymentDialog(true)} disabled={isPending}>
            <CreditCard className="h-4 w-4 mr-2" />
            Record Payment
          </Button>
        )}
        {canVoid && (
          <Button
            variant="outline"
            onClick={handleVoid}
            disabled={isPending}
            className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
          >
            Void Invoice
          </Button>
        )}
      </div>

      {/* Payment Dialog */}
      <RecordPaymentDialog
        invoiceId={invoice.id}
        balance={balance}
        open={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
