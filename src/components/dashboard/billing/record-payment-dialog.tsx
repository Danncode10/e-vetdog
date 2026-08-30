"use client";

import { useState, useTransition } from "react";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { recordPayment } from "@/services/billing";

interface RecordPaymentDialogProps {
  invoiceId: string;
  balance: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const METHODS = [
  { value: "cash", label: "Cash" },
  { value: "gcash", label: "GCash" },
  { value: "card", label: "Card" },
  { value: "bank_transfer", label: "Bank Transfer" },
] as const;

type PaymentMethod = (typeof METHODS)[number]["value"];

export function RecordPaymentDialog({
  invoiceId,
  balance,
  open,
  onOpenChange,
  onSuccess,
}: RecordPaymentDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [amount, setAmount] = useState(balance > 0 ? balance.toFixed(2) : "");
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit() {
    setError(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Please enter a valid payment amount.");
      return;
    }

    startTransition(async () => {
      try {
        await recordPayment({
          invoiceId,
          amountPaid: parsedAmount,
          method,
          referenceNumber: referenceNumber.trim() || undefined,
        });
        onOpenChange(false);
        onSuccess();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to record payment.");
      }
    });
  }

  const showRefField = method !== "cash";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <div className="bg-card rounded-xl shadow-xl border border-border overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-base font-semibold text-foreground">Record Payment</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Outstanding balance: ₱{balance.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Amount */}
          <div className="space-y-2">
            <label htmlFor="payment-amount" className="text-sm font-medium text-foreground">
              Amount Paid <span className="text-destructive">*</span>
            </label>
            <Input
              id="payment-amount"
              type="number"
              min={0.01}
              step={0.01}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="min-h-[48px]"
            />
          </div>

          {/* Method */}
          <div className="space-y-2">
            <label htmlFor="payment-method" className="text-sm font-medium text-foreground">
              Payment Method <span className="text-destructive">*</span>
            </label>
            <select
              id="payment-method"
              value={method}
              onChange={(e) => setMethod(e.target.value as PaymentMethod)}
              className="flex h-12 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {METHODS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Reference Number */}
          {showRefField && (
            <div className="space-y-2">
              <label htmlFor="ref-number" className="text-sm font-medium text-foreground">
                Reference Number{" "}
                <span className="text-muted-foreground text-xs font-normal">(optional)</span>
              </label>
              <Input
                id="ref-number"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder={method === "gcash" ? "GCash reference #" : "Transaction reference"}
                className="min-h-[48px]"
              />
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-sm text-destructive font-medium" role="alert">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 px-6 py-4 border-t border-border bg-muted/30">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className="min-h-[48px]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending}
            className="min-h-[48px]"
          >
            {isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Confirm Payment
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
