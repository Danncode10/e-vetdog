# E-VetDoc

A single-clinic veterinary management system for pet owners, veterinarians, appointments, medical records, invoicing, and receipts.

## What the MVP includes

E-VetDoc supports three roles:

- **Admin** — manages owners, pets, appointments, walk-ins, services, invoices, payments, receipts, and reports.
- **Veterinarian** — manages encounters, diagnoses, treatments, signed clinical records, amendments, and prescriptions.
- **Owner** — accesses only pets linked to their profile, plus their appointments, permitted medical history, invoices, and receipts.

The MVP is for one clinic. Multi-clinic support, online payments, and advanced laboratory integrations are intentionally out of scope.

## Core workflows

1. An owner selects a linked pet and requests an appointment.
2. An admin schedules the request or records a walk-in check-in.
3. A veterinarian reviews the pet's history, documents the encounter, and signs the final clinical record or prescription.
4. An admin creates an itemized invoice and records an in-clinic cash payment.
5. The owner views permitted pet history, appointment details, invoices, and printable receipts.

Appointment states are `requested`, `confirmed/scheduled`, `completed`, `cancelled`, and `no-show`.

## Important product rules

- An owner can have multiple pets; a pet can have multiple authorized owners through `pet_owners`.
- Clinical records remain editable as drafts. A veterinarian signs final records; later changes create amendments.
- Invoice and receipt numbers are separate, sequential, human-readable identifiers.
- The first payment method is staff-recorded cash. Payments are never overwritten; corrections remain linked to the original payment.
- Signed medical records are never overwritten; later corrections are recorded as amendments with an author, timestamp, and reason.
- Invoice numbers and receipt numbers are separate sequential identifiers, such as `INV-2026-00001` and `RCT-2026-00001`.
- Owners see only information related to pets linked through `pet_owners`; admins and veterinarians have distinct operational access.

See [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md) for the detailed MVP decisions, workflow rules, scope limits, and data-model direction.

## Development

```bash
pnpm install
pnpm dev
```

Copy `.env.example` to `.env.local` and provide the required Supabase values before running database commands. Never commit `.env.local`.

## Database workflow

Database schema is authored in `db/schema/` with Drizzle.

```bash
pnpm db:generate
pnpm db:migrate
```

Review each generated SQL migration before applying it. Application data access belongs in `src/services/`; UI components must not contain database queries.

Every exposed table requires explicit Row Level Security policies. Keep owner access restricted through the `pet_owners` relationship and preserve signed clinical/payment history through amendment and correction records.

## Project planning

Create a non-draft GitHub Project in Board/Kanban layout with these statuses:

```text
Backlog → Ready → In progress → Done
```

Copy its canonical URL (for example, `https://github.com/users/your-owner/projects/1`) into `GITHUB_PROJECT_URL` in `.env.local`. Omit any `/views/...` suffix or query string. Then run `/masterplan-init` to produce and sync the Phase 0 plan. The command derives the owner, project number, and API ID automatically.
