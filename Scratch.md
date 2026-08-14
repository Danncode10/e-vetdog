# E-VetDoc — MVP Product Scratchpad

> Working product-design record based on the discovery report and decisions made during MVP planning. This is not a database migration or final technical specification.

## 1. Product identity

| Item | Decision |
| --- | --- |
| Product name | **E-VetDoc** |
| Repository | https://github.com/Danncode10/e-vetdog |
| Product type | Web-based veterinary clinic management system |
| One-liner | A single-clinic veterinary management system for pet owners, veterinarians, appointments, medical records, invoicing, and receipts. |
| Primary environment | A modern browser with clinic internet access and an optional printer. |

E-VetDoc gives owners a self-service portal while giving clinic staff a single workspace to manage patient care, appointments, clinical history, and in-clinic billing.

## 2. MVP boundary

The MVP is for **one veterinary clinic only**. It is not a multi-tenant SaaS at this stage.

This means the MVP must **not** introduce:

- A `clinics` table, clinic memberships, organization records, or `clinic_id` on records.
- Cross-clinic access rules or per-clinic configuration.
- Online payment gateways, mobile-payment integrations, or payment webhooks.
- Advanced laboratory integrations.
- Full confinement and surgery workflows unless the core consultation flow is complete and they become necessary.
- Backup/recovery or privacy/compliance work beyond the authorization needed to keep each owner's data separate.

The MVP should still preserve clinical and payment history instead of allowing critical records to be silently overwritten.

## 3. Users and access boundaries

There are three application roles.

| Role | What the role can do | What the role cannot do |
| --- | --- | --- |
| **Admin** | Manage owner profiles, pets, appointment schedules, walk-ins, veterinarian accounts, services, invoices, payments, receipts, and basic reports. | Cannot sign a veterinarian's clinical record or prescription unless they are also assigned the veterinarian role. |
| **Veterinarian** | View assigned/current appointments and pet history; create consultations, diagnoses, treatments, medical notes, and prescriptions; sign records and create amendments. | Cannot access unrelated system settings or change payment history unless separately given admin access. |
| **Owner** | Register and sign in; maintain their profile; request and view appointments; view pets linked to them; view their pets' permitted medical history, invoices, and receipts; print appointment information. | Cannot access another owner's pets, records, appointments, invoices, or receipts. |

The system itself may generate notifications, receipts, and PDFs, but it acts only through server-side code and must preserve the same owner/staff access rules.

## 4. Owner and pet relationship

An owner may have multiple pets. A pet may have multiple authorized owners, such as family members or co-owners.

```text
profiles
  ├─ role: admin | veterinarian | owner
  └─< pet_owners >─ pets
```

`pet_owners` is the single source of truth for an owner's connection to a pet. Do not also store a competing direct `owner_id` on `pets`.

Suggested relationship fields:

| Field | Purpose |
| --- | --- |
| `pet_id` | The linked pet. |
| `owner_profile_id` | The linked owner profile. |
| `relationship` | For example: owner, co-owner, family member, caretaker. |
| `is_primary_contact` | Identifies the clinic's preferred contact for the pet. |
| `can_view_medical_records` | Controls whether this owner may see medical history. |
| `can_receive_notifications` | Controls appointment and billing notifications. |

Each pet should have a profile that covers at least name, species, breed, sex, date of birth or age, and any relevant owner relationship/contact information.

## 5. Core user journeys

### Owner appointment journey

1. The owner registers or signs in.
2. The owner selects one of their linked pets.
3. The owner requests an appointment for a service such as consultation or vaccination.
4. An admin reviews and schedules the request.
5. The owner can view the appointment status and print its details.
6. After the visit, the owner can view permitted medical information, invoices, and receipts.

### Clinic check-in and consultation journey

1. An admin reviews the schedule or records a walk-in in the logbook/check-in flow.
2. The veterinarian opens the pet profile and reviews longitudinal history.
3. The veterinarian records the encounter, including notes, diagnosis, treatment, medication, and any prescription.
4. The veterinarian signs the finalized clinical record.
5. The clinic prepares an invoice for services and products related to the visit.

### Payment and receipt journey

1. An admin creates or updates the invoice and its line items.
2. The owner pays at the clinic; the initial supported method is cash.
3. An authorized admin records the payment amount, method, time, optional reference/notes, and staff member who entered it.
4. The system issues a receipt that the owner can view and print.
5. A payment error is handled through a correction record rather than editing or deleting the original payment.

## 6. Appointment and visit management

The MVP needs online appointment requests and clinic-managed scheduling, plus a walk-in logbook/check-in flow.

Minimum appointment status lifecycle:

```text
requested → confirmed/scheduled → completed
                         ├──────→ cancelled
                         └──────→ no-show
```

Each appointment should capture the pet, requested service, scheduled date/time when confirmed, relevant owner note/reason for visit, current status, and status-history timestamps. Staff and veterinarians need schedule and appointment-detail views; owners need access only to appointments for their linked pets.

Open scheduling decisions to finalize before implementation:

- Standard appointment duration by service.
- Veterinarian availability and whether appointments can overlap.
- Cancellation and rescheduling rules.
- Whether an owner may cancel a confirmed appointment online.
- The minimum data required for a walk-in check-in.

## 7. Clinical record model and policy

Clinical history must be longitudinal: staff and veterinarians can review prior encounters for a pet, while owners can access only records for pets linked to them and allowed by the relationship rule.

The core clinical record is an **encounter** or consultation. It may contain:

- Presenting concern and clinical notes.
- Medical-history questionnaire details: acquisition/origin, living environment, diet, appetite and attitude, drinking habits, symptoms, prior veterinary history, examinations, and vaccinations/preventives.
- Diagnoses.
- Treatments and medications administered or recommended.
- Prescriptions and prescription items.
- Optional attachments or document metadata when needed later.

### Signing and amendment policy

1. A veterinarian creates an encounter as a draft.
2. Draft records may be edited by their veterinarian author under the intended role rules.
3. The veterinarian signs the completed record.
4. A signed record is never directly overwritten.
5. A later change creates an amendment connected to the signed encounter and records the author, timestamp, change reason, and amended content.
6. Only a veterinarian can sign clinical records and prescriptions.

This policy keeps the medical history understandable while providing a traceable correction path for the MVP.

## 8. Invoices, payments, and receipts

Invoices represent charges for services or products. They should contain an invoice header, itemized lines, totals, state, and a connection to the relevant pet/appointment or encounter when applicable.

Minimum invoice states:

```text
unpaid → partially paid → paid
  └──────────────────────→ voided
paid ────────────────────→ refunded/corrected
```

### Numbering and correction policy

- Invoice numbers are sequential and human-readable, for example `INV-2026-00001`.
- Receipt numbers are separate and sequential, for example `RCT-2026-00001`.
- Payments record amount, method, payment date/time, optional reference or notes, and the admin who recorded them.
- The first payment method is staff-recorded **cash payment**.
- A recorded payment is not overwritten or deleted.
- Mistakes use a linked void, refund, or correction record that retains the original payment and records the reason.
- Owners can view their invoices and receipts. Admins can generate a printable receipt.

Tax treatment and the precise fields/states required for refunds still need a business decision before the invoice schema is finalized.

## 9. MVP modules and screens

| Module | MVP capability |
| --- | --- |
| Authentication and roles | Sign in/out, registration for owners, role-aware routes, profiles for admin and veterinarian accounts. |
| Owner and pet registry | Owner profiles, pet profiles, pet-owner links, patient search/list for staff. |
| Appointments and visits | Appointment requests, scheduling, statuses, appointment history, walk-ins, and check-in logbook. |
| Clinical workspace | Pet history, consultations/encounters, diagnoses, treatments, and signed prescriptions. |
| Billing | Invoices, itemized charges, cash-payment recording, invoice state, and correction records. |
| Owner portal | Owner pet list, appointments, permitted medical records, invoices, receipts, and printable appointment details. |
| Documents and reports | Printable patient record, prescription, invoice, and receipt; basic patient, diagnosis, and payment reporting. |
| Notifications | Appointment status/reminder and receipt notifications, beginning with the simplest supported delivery channel. |

## 10. Initial data-model direction

The schema should keep identity, ownership, appointments, clinical history, and finance distinct:

```text
profiles ──< pet_owners >── pets
pets ──< appointments >── services
appointments ──< encounters ──< diagnoses
encounters ──< treatments
encounters ──< prescriptions ──< prescription_items
appointments / encounters ──< invoices ──< invoice_items
invoices ──< payments ──< payment_corrections
payments ──< receipts
profiles / pets / appointments / invoices ──< notifications
```

The final schema should use generated Supabase types and RLS policies that enforce the role boundaries described above. The exact table names and columns remain a later schema-design task.

## 11. Delivery order

1. Define roles, profiles, owner-pet access, and role-aware authorization.
2. Build the owner and pet registry.
3. Build appointment requests, scheduling, statuses, walk-ins, and check-in.
4. Build the veterinarian clinical workspace and signing/amendment flow.
5. Build invoices, cash payments, receipts, and corrections.
6. Add owner-facing history, invoice, receipt, and printable-document views.
7. Add basic notifications and operational reports after the core workflows work end-to-end.

## 12. Decisions still needed before schema work

- Appointment durations, availability, double-booking, cancellation, and no-show rules.
- Required clinical questionnaire fields and diagnosis vocabulary.
- Prescription layout and required medication fields.
- Tax rules, receipt wording, and exact refund/correction behavior.
- Which document PDFs are required for the first release.
- Which notification channel is first: in-app, email, or both.

