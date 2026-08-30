-- Triggers and Functions for Sequential Numbering (Invoices & Receipts)

-- Create Sequences
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1;
CREATE SEQUENCE IF NOT EXISTS receipt_number_seq START 1;

-- Function for Invoice Numbering
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
        NEW.invoice_number := 'INV-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('invoice_number_seq')::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_invoice_number
BEFORE INSERT ON invoices
FOR EACH ROW
EXECUTE FUNCTION generate_invoice_number();

-- Function for Receipt Numbering (Payments)
CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.receipt_number IS NULL OR NEW.receipt_number = '' THEN
        NEW.receipt_number := 'RCPT-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('receipt_number_seq')::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_receipt_number
BEFORE INSERT ON payments
FOR EACH ROW
EXECUTE FUNCTION generate_receipt_number();


-- RLS Policies

ALTER TABLE "invoices" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "invoice_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payment_corrections" ENABLE ROW LEVEL SECURITY;

-- Invoices: Owners can view their own, Staff/Admins can view and manage all
CREATE POLICY "owners view own invoices" ON public.invoices FOR SELECT TO authenticated USING (owner_id = (select auth.uid()));
CREATE POLICY "staff manage invoices" ON public.invoices FOR ALL TO authenticated USING ((select private.is_admin()) OR (SELECT role FROM public.profiles WHERE id = (select auth.uid())) = 'veterinarian'::public.user_role) WITH CHECK ((select private.is_admin()) OR (SELECT role FROM public.profiles WHERE id = (select auth.uid())) = 'veterinarian'::public.user_role);

-- Invoice Items: Owners can view items for their invoices, Staff/Admins can manage all
CREATE POLICY "owners view own invoice items" ON public.invoice_items FOR SELECT TO authenticated USING (invoice_id IN (SELECT id FROM public.invoices WHERE owner_id = (select auth.uid())));
CREATE POLICY "staff manage invoice items" ON public.invoice_items FOR ALL TO authenticated USING ((select private.is_admin()) OR (SELECT role FROM public.profiles WHERE id = (select auth.uid())) = 'veterinarian'::public.user_role) WITH CHECK ((select private.is_admin()) OR (SELECT role FROM public.profiles WHERE id = (select auth.uid())) = 'veterinarian'::public.user_role);

-- Payments: Owners can view their own payments, Staff/Admins can manage all
CREATE POLICY "owners view own payments" ON public.payments FOR SELECT TO authenticated USING (invoice_id IN (SELECT id FROM public.invoices WHERE owner_id = (select auth.uid())));
CREATE POLICY "staff manage payments" ON public.payments FOR ALL TO authenticated USING ((select private.is_admin()) OR (SELECT role FROM public.profiles WHERE id = (select auth.uid())) = 'veterinarian'::public.user_role) WITH CHECK ((select private.is_admin()) OR (SELECT role FROM public.profiles WHERE id = (select auth.uid())) = 'veterinarian'::public.user_role);

-- Payment Corrections: Only Staff/Admins can manage and view corrections
CREATE POLICY "staff manage payment corrections" ON public.payment_corrections FOR ALL TO authenticated USING ((select private.is_admin()) OR (SELECT role FROM public.profiles WHERE id = (select auth.uid())) = 'veterinarian'::public.user_role) WITH CHECK ((select private.is_admin()) OR (SELECT role FROM public.profiles WHERE id = (select auth.uid())) = 'veterinarian'::public.user_role);