"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle, Trash2, Receipt, Loader2, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { createInvoice, addInvoiceItem, finalizeInvoice } from "@/services/billing";
import Link from "next/link";

interface Owner {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
}

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  isVatable: boolean;
}

const VAT_RATE = 0.12;

function calcTotals(items: LineItem[]) {
  let vatableSales = 0;
  let vatExemptSales = 0;

  for (const item of items) {
    const lineTotal = item.quantity * item.unitPrice;
    if (item.isVatable) {
      vatableSales += lineTotal;
    } else {
      vatExemptSales += lineTotal;
    }
  }

  const vatAmount = vatableSales * VAT_RATE;
  const total = vatableSales + vatAmount + vatExemptSales;
  return { vatableSales, vatExemptSales, vatAmount, total };
}

export function InvoiceBuilder({ owners }: { owners: Owner[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [ownerId, setOwnerId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: "", quantity: 1, unitPrice: 0, isVatable: true },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [saveMode, setSaveMode] = useState<"draft" | "finalize">("draft");

  const addLine = () =>
    setLineItems((prev) => [...prev, { description: "", quantity: 1, unitPrice: 0, isVatable: true }]);

  const removeLine = (idx: number) =>
    setLineItems((prev) => prev.filter((_, i) => i !== idx));

  const updateLine = <K extends keyof LineItem>(idx: number, key: K, value: LineItem[K]) =>
    setLineItems((prev) => prev.map((item, i) => (i === idx ? { ...item, [key]: value } : item)));

  const { vatableSales, vatExemptSales, vatAmount, total } = calcTotals(lineItems);

  const fmt = (n: number) =>
    n.toLocaleString("en-PH", { style: "currency", currency: "PHP" });

  async function handleSubmit(mode: "draft" | "finalize") {
    setError(null);
    setSaveMode(mode);

    if (!ownerId) {
      setError("Please select a client/owner.");
      return;
    }
    if (lineItems.some((item) => !item.description.trim())) {
      setError("All line items must have a description.");
      return;
    }

    startTransition(async () => {
      try {
        const invoice = await createInvoice({
          ownerId,
          dueDate: dueDate || undefined,
        });

        for (const item of lineItems) {
          if (item.description.trim()) {
            await addInvoiceItem(invoice.id, item);
          }
        }

        if (mode === "finalize") {
          await finalizeInvoice(invoice.id);
        }

        router.push(`/dashboard/billing/${invoice.id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/billing"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Invoices
        </Link>
        <div className="flex items-center gap-3">
          <Receipt className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">New Invoice</h1>
        </div>
      </div>

      {/* Client & Date */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Invoice Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="owner-select" className="text-sm font-medium text-foreground">
              Client / Owner <span className="text-destructive">*</span>
            </label>
            <select
              id="owner-select"
              value={ownerId}
              onChange={(e) => setOwnerId(e.target.value)}
              className="flex h-12 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Select a client...</option>
              {owners.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.full_name ?? "Unnamed"} {o.email ? `— ${o.email}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="due-date" className="text-sm font-medium text-foreground">
              Due Date (optional)
            </label>
            <Input
              id="due-date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="min-h-[48px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Line Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Column headers */}
          <div className="hidden sm:grid grid-cols-[1fr_80px_120px_80px_36px] gap-2 text-xs text-muted-foreground font-medium px-1">
            <span>Description</span>
            <span>Qty</span>
            <span>Unit Price (₱)</span>
            <span className="text-center">VATable?</span>
            <span />
          </div>

          {lineItems.map((item, idx) => (
            <div key={idx} className="grid grid-cols-[1fr_80px_120px_80px_36px] gap-2 items-center">
              <Input
                placeholder="Service or item"
                value={item.description}
                onChange={(e) => updateLine(idx, "description", e.target.value)}
                className="min-h-[48px]"
                aria-label="Description"
              />
              <Input
                type="number"
                min={1}
                step={1}
                value={item.quantity}
                onChange={(e) => updateLine(idx, "quantity", Number(e.target.value))}
                className="min-h-[48px]"
                aria-label="Quantity"
              />
              <Input
                type="number"
                min={0}
                step={0.01}
                value={item.unitPrice}
                onChange={(e) => updateLine(idx, "unitPrice", Number(e.target.value))}
                className="min-h-[48px]"
                aria-label="Unit Price"
              />
              <div className="flex justify-center items-center">
                <input
                  type="checkbox"
                  checked={item.isVatable}
                  onChange={(e) => updateLine(idx, "isVatable", e.target.checked)}
                  aria-label="VATable"
                  className="h-5 w-5 rounded border-border text-primary focus:ring-ring cursor-pointer"
                />
              </div>
              <button
                onClick={() => removeLine(idx)}
                disabled={lineItems.length === 1}
                aria-label="Remove line"
                className="flex items-center justify-center h-12 w-9 rounded-md text-muted-foreground hover:text-destructive disabled:opacity-30 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}

          <Button variant="outline" size="sm" onClick={addLine} className="mt-2">
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Line Item
          </Button>
        </CardContent>
      </Card>

      {/* Totals */}
      <Card>
        <CardContent className="pt-6">
          <dl className="space-y-2 text-sm max-w-xs ml-auto">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">VATable Sales</dt>
              <dd className="font-medium">{fmt(vatableSales)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">VAT Exempt Sales</dt>
              <dd className="font-medium">{fmt(vatExemptSales)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">VAT (12%)</dt>
              <dd className="font-medium">{fmt(vatAmount)}</dd>
            </div>
            <div className="flex justify-between border-t border-border pt-2 mt-2">
              <dt className="text-foreground font-semibold text-base">Total Amount Due</dt>
              <dd className="font-bold text-base text-primary">{fmt(total)}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <p className="text-sm text-destructive font-medium" role="alert">
          {error}
        </p>
      )}

      {/* Actions */}
      <Card>
        <CardFooter className="flex flex-col sm:flex-row gap-3 pt-6">
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => handleSubmit("draft")}
            disabled={isPending}
          >
            {isPending && saveMode === "draft" ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : null}
            Save as Draft
          </Button>
          <Button
            className="w-full sm:w-auto"
            onClick={() => handleSubmit("finalize")}
            disabled={isPending}
          >
            {isPending && saveMode === "finalize" ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : null}
            Finalize Invoice
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
