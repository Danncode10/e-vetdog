# MASTERPLAN — E-VetDoc

> E-VetDoc is a single-clinic veterinary management system for pet owners, veterinarians, appointments, medical records, invoicing, and receipts.

## **PHASE 0: DannFlow template readiness**

- [x] **[P0.1] Connect the Supabase template environment**
  - **Goal:** Complete the template’s Supabase environment configuration and verify the tracked baseline migration against the E-VetDoc project.
  - **Dependencies:** A valid `DATABASE_URL` for Supabase project `zmdtwhqirmkptzobufio` must be available in `.env.local`.
  - **Acceptance criteria:** Required environment values are present locally; the baseline migration completes; public tables and functions are verified; generated Supabase types are current.
  - **Run:** `/setup-supabase`

- [x] **[P0.2] Configure template email authentication and redirects**
  - **Goal:** Configure Supabase email authentication, Gmail SMTP delivery, confirmation and recovery redirects, and branded email templates for E-VetDoc.
  - **Dependencies:** [P0.1].
  - **Acceptance criteria:** Email confirmation is enabled; SMTP delivery works; local redirect settings are applied; branded confirmation and reset templates are saved; email confirmation and password reset both complete successfully.
  - **Run:** `/setup-auth`

- [x] **[P0.3] Apply the E-VetDoc visual direction to the template UI**
  - **Goal:** Establish the calm, clinic-oriented visual direction, semantic color system, landing-page and sign-in copy, and template visual cleanup.
  - **Dependencies:** Product context is approved.
  - **Acceptance criteria:** The landing and sign-in pages clearly communicate E-VetDoc’s audience and purpose; UI changes follow the responsive, accessible Shadcn/Tailwind design rules.
  - **Run:** `/design-project`

- [x] **[P0.4] Configure Google OAuth sign-in**
  - **Goal:** Configure and verify Google sign-in through Google Cloud and Supabase Auth for E-VetDoc.
  - **Dependencies:** [P0.1], [P0.2], [P0.3].
  - **Acceptance criteria:** Google Cloud consent-screen audience and Web client are configured; the Google-to-Supabase callback URI and Supabase-to-app redirect URL are correct; the Supabase Google provider is enabled; a permitted test user signs in and reaches `/dashboard`.
  - **Run:** `/setup-auth`

- [x] **[P0.5] Prepare hero media direction and handoff**
  - **Goal:** Define the hero-media brief that supports E-VetDoc’s reassuring clinic experience.
  - **Dependencies:** [P0.3].
  - **Acceptance criteria:** A reusable asset brief specifies subject, composition, tone, accessibility considerations, and required formats; assets are ready for template integration.
  - **Run:** `/hero-bg`

- [x] **[P0.6] Complete template visual and quality review**
  - **Goal:** Review the configured template for discoverability, marketing clarity, and implementation quality before product modules are planned.
  - **Dependencies:** [P0.2], [P0.3], [P0.4], [P0.5].
  - **Acceptance criteria:** SEO, marketing, and code-quality review findings are resolved or documented with follow-up work for a later phase.
  - **Run:** `/seo-check`, `/marketing-check`, `/review`

- [x] **[P0.7] Create Phase 0 setup and handover guide**
  - **Goal:** Provide a clear, safe handover guide for another developer to configure and verify E-VetDoc's local environment, Supabase services, authentication, email delivery, Google OAuth, visual direction, and final quality checks.
  - **Dependencies:** None. The guide must clearly distinguish completed, pending, and production-only steps.
  - **Acceptance criteria:** The guide names every required dashboard location and local command; contains copy-paste values only where safe; links to reusable email templates; never contains credentials; and includes a verification and handover checklist.
  - **Run:** Review `docs/handover/phase-0-setup-handover.md`.

- [x] **[P0.8] Configure Vercel production deployment and authentication URLs**
  - **Goal:** Deploy the approved E-VetDoc build on Vercel and connect its production origin to Supabase Auth and Google OAuth without exposing credentials.
  - **Dependencies:** [P0.1], [P0.2], [P0.3], [P0.4], [P0.6], [P0.7].
  - **Acceptance criteria:** Vercel has the required production environment variables; `NEXT_PUBLIC_SITE_URL` uses the canonical HTTPS production origin; the production deployment succeeds; Supabase Site URL and redirect allow list contain the production URLs; Google Cloud has the production JavaScript origin; and email, recovery, and Google sign-in work in production.
  - **Run:** `/setup-vercel`.

---

## **PHASE 1: Identity, access, and patient registry**

**Exit state:** Admins can provision staff, owners can complete onboarding and manage only linked pets, staff can find the registry, and role/RLS isolation is verified.

- [ ] **[P1.1] Reconcile the template schema with E-VetDoc identity**
  - **Goal:** Replace the template's `admin | user` role model with the approved E-VetDoc identity model, reconcile generic dashboard tables that overlap the domain, and document any compatibility migration.
  - **Dependencies:** [P0.1].
  - **Acceptance criteria:** Roles are consistently `admin`, `veterinarian`, and `owner`; the authority model for any dual-role staff is explicit; legacy `user` data has a safe mapping; no competing appointment/service model is introduced.

- [ ] **[P1.2] Implement profiles, role policies, and guarded routes**
  - **Goal:** Implement role-aware profiles, server-side authorization helpers, dashboard redirects, and RLS policies.
  - **Dependencies:** [P1.1].
  - **Acceptance criteria:** Roles remain application data rather than editable auth metadata; every protected route denies the wrong role; profile access follows RLS; authorization logic lives in `src/services/`.

- [ ] **[P1.3] Provision and manage administrator and veterinarian accounts**
  - **Goal:** Give authorized admins a server-only account invitation/provisioning workflow and a staff-management UI.
  - **Dependencies:** [P1.2].
  - **Acceptance criteria:** Admins can create, update, and deactivate staff without exposing service credentials; confirmation behavior is clear; the final administrator cannot be accidentally removed; all actions are authorized and auditable.

- [ ] **[P1.4] Complete owner onboarding and profile management**
  - **Goal:** Deliver the owner sign-up, email-confirmation, profile-completion, and self-service profile flows.
  - **Dependencies:** [P1.2], [P0.2].
  - **Acceptance criteria:** New owners cannot access protected pages before confirmation; profile completion is labelled, accessible, and mobile-ready; owners can update only their own permitted details.

- [ ] **[P1.5] Model pets and authorized owner relationships**
  - **Goal:** Add `pets` and `pet_owners` as the sole ownership model, with explicit RLS policies and indexes.
  - **Dependencies:** [P1.2].
  - **Acceptance criteria:** A pet has name, species, breed, sex, and date of birth or age; co-owner relationship, primary-contact, medical-record, and notification permissions are supported; `pets` has no competing direct `owner_id`.

- [ ] **[P1.6] Deliver owner pet and co-owner management**
  - **Goal:** Build the owner UI and services to add, edit, and manage their linked pets and authorized co-owners.
  - **Dependencies:** [P1.5].
  - **Acceptance criteria:** Owners can manage only allowed pets; permissions are visible and safely validated; forms meet the project accessibility and responsive UI standards.

- [ ] **[P1.7] Deliver the staff owner and pet registry**
  - **Goal:** Build searchable, filterable staff views for owners and pets.
  - **Dependencies:** [P1.3], [P1.5].
  - **Acceptance criteria:** Admins and veterinarians see only the registry information their role permits; staff can search by owner and pet; empty, loading, and error states are present.

- [ ] **[P1.8] Verify Phase 1 authorization boundaries**
  - **Goal:** Add repeatable RLS and service-layer tests for profiles, staff actions, pets, and co-owners.
  - **Dependencies:** [P1.3], [P1.4], [P1.5].
  - **Acceptance criteria:** Test identities prove owners cannot access unrelated records and non-admin staff cannot administer accounts; migrations, policies, and generated types are reviewed and current.

## **PHASE 2: Appointment and check-in operations**

**Exit state:** Owners can request visits, staff can schedule or check in visits and walk-ins, and all users see the correct appointment status and detail.

- [ ] **[P2.1] Define scheduling rules and reconcile the service catalogue**
  - **Goal:** Record the MVP decisions for service duration, veterinarian assignment, double booking, cancellation/rescheduling, owner cancellation, walk-in minimum data, and whether the existing services table is evolved or replaced.
  - **Dependencies:** [P1.8].
  - **Acceptance criteria:** Each decision has an implementation rule; service names, duration, availability, and billing use have one source of truth; no unsupported scheduling behavior is implied by the UI.

- [ ] **[P2.2] Implement appointments, check-in, status history, and RLS**
  - **Goal:** Model appointments and check-in records with a complete lifecycle and immutable transition history.
  - **Dependencies:** [P2.1], [P1.5].
  - **Acceptance criteria:** Requested, scheduled/confirmed, completed, cancelled, and no-show states are supported; pet, service, owner note, scheduled time, staff actions, and transition timestamps are retained; owner access follows `pet_owners`.

- [ ] **[P2.3] Deliver the owner appointment-request flow**
  - **Goal:** Let an owner select a linked pet and service and submit an appointment request.
  - **Dependencies:** [P2.2].
  - **Acceptance criteria:** Only linked pets are selectable; the request complies with the scheduling rules; submission, validation, and confirmation states are clear on mobile and desktop.

- [ ] **[P2.4] Deliver staff appointment detail and status actions**
  - **Goal:** Build the staff appointment workspace for review, scheduling, reassignment, cancellation, completion, and no-show actions.
  - **Dependencies:** [P2.2].
  - **Acceptance criteria:** Only valid state transitions are available; transition reasons and timestamps are recorded; the detail view exposes the correct pet, owner, service, and schedule information.

- [ ] **[P2.5] Deliver walk-in check-in and the clinic logbook**
  - **Goal:** Let staff find a pet or create the permitted minimum record for a walk-in, then register clinic check-in.
  - **Dependencies:** [P2.2], [P2.1].
  - **Acceptance criteria:** Walk-ins do not bypass authorization or required data; check-in is visible to staff and veterinarians; the logbook is searchable and status-aware.

- [ ] **[P2.6] Deliver the staff schedule view**
  - **Goal:** Build an accessible day/week operational schedule using the approved scheduling rules.
  - **Dependencies:** [P2.4], [P2.5].
  - **Acceptance criteria:** The view clearly handles loading, conflicts, empty periods, and status; rescheduling behavior matches [P2.1]; it works at clinic desktop and 375px widths.

- [ ] **[P2.7] Deliver owner appointment history and printable details**
  - **Goal:** Let owners view only their linked pets' appointment history, statuses, and print-ready appointment details.
  - **Dependencies:** [P2.3], [P2.4].
  - **Acceptance criteria:** Owner views never reveal another owner's pet or contact data; printable details are accurate and use a dedicated print layout.

- [ ] **[P2.8] Emit appointment notification events and verify access**
  - **Goal:** Create the internal, recipient-aware events needed for later status updates and reminders, and test appointment RLS.
  - **Dependencies:** [P2.2], [P1.8].
  - **Acceptance criteria:** Events respect `can_receive_notifications`; Phase 2 does not promise a scheduler or email channel; RLS tests cover all appointment and status-history paths.

## **PHASE 3: Clinical workspace and signed records**

**Exit state:** Veterinarians can safely complete, sign, amend, print, and review longitudinal clinical records without altering signed history.

- [ ] **[P3.1] Model encounters and clinical-record access rules**
  - **Goal:** Add encounters and the database/service rules for clinic history, drafts, signing authority, and amendments.
  - **Dependencies:** [P2.8].
  - **Acceptance criteria:** Veterinarians can read the clinic history required for care, edit only permitted drafts, and only veterinarians can sign; signed records are not directly editable.

- [ ] **[P3.2] Build the pet history and questionnaire workspace**
  - **Goal:** Give veterinarians a longitudinal patient history and structured questionnaire for origin, environment, diet, symptoms, prior care, examinations, and vaccinations/preventives.
  - **Dependencies:** [P3.1].
  - **Acceptance criteria:** History is ordered and readable; questionnaire data is tied to the relevant encounter; UI supports draft recovery, validation, and accessible form use.

- [ ] **[P3.3] Implement diagnoses, treatments, and clinical notes**
  - **Goal:** Add structured encounter notes, diagnoses, and treatments with their service-layer operations and editor UI.
  - **Dependencies:** [P3.1].
  - **Acceptance criteria:** Presenting concern, notes, assessment, plan, diagnosis, dosage, route, and frequency are traceable; any coding vocabulary is explicitly chosen rather than assumed.

- [ ] **[P3.4] Implement prescriptions and prescription items**
  - **Goal:** Add prescriptions and itemized instructions, using a consciously scoped medication-input approach.
  - **Dependencies:** [P3.3].
  - **Acceptance criteria:** The MVP uses either approved structured free text or an explicitly planned medicine catalogue; only veterinarians create and sign prescriptions; items support clear dosage instructions.

- [ ] **[P3.5] Deliver the veterinarian encounter workspace**
  - **Goal:** Build the veterinarian dashboard and encounter workspace for today's visits, drafts, notes, diagnoses, treatments, and prescriptions.
  - **Dependencies:** [P3.2], [P3.3], [P3.4].
  - **Acceptance criteria:** The workflow is usable from the appointment/check-in context; history remains visible without leaking unauthorized data; saving and error states are clear.

- [ ] **[P3.6] Deliver signing and append-only amendment workflows**
  - **Goal:** Implement signed-record locking and linked amendments with author, timestamp, reason, and amended content.
  - **Dependencies:** [P3.5].
  - **Acceptance criteria:** Database and service protections prevent direct updates to signed content; amendments preserve the original record; the UI makes the immutable history and amendment reason clear.

- [ ] **[P3.7] Deliver printable clinical records and prescriptions**
  - **Goal:** Provide print-optimized clinical-record and prescription documents for authorized staff.
  - **Dependencies:** [P3.6].
  - **Acceptance criteria:** Documents contain accurate patient, veterinarian, clinical, and signature data; print layouts do not require a server-side PDF engine unless later approved.

- [ ] **[P3.8] Verify clinical integrity and RLS**
  - **Goal:** Add tests for clinical visibility, draft editing, signing, prescription authority, and amendments.
  - **Dependencies:** [P3.6].
  - **Acceptance criteria:** Tests prove signed content cannot be overwritten, amendments are linked and traceable, and role boundaries match the product context.

## **PHASE 4: Billing, cash payments, and receipts**

**Exit state:** Admins can issue itemized invoices, record cash payments, print receipts, and correct mistakes without rewriting financial history.

- [ ] **[P4.1] Define billing rules and implement the financial ledger schema**
  - **Goal:** Resolve tax, receipt wording, products-versus-ad-hoc-lines, and correction/refund decisions, then model invoices, items, payments, corrections, receipts, and RLS.
  - **Dependencies:** [P3.8], [P2.1].
  - **Acceptance criteria:** Invoice and receipt numbering is separate, sequential, atomic, and server-side; payment records are append-only; invoice state names and transitions are finalized and documented.

- [ ] **[P4.2] Deliver the admin invoice builder**
  - **Goal:** Let admins create itemized invoice drafts from the approved service/product or ad-hoc-line model and relate them to pets, appointments, or encounters.
  - **Dependencies:** [P4.1].
  - **Acceptance criteria:** Totals are calculated server-side; line data is validated; an invoice cannot expose unrelated pet data; draft and issuance behavior follows [P4.1].

- [ ] **[P4.3] Deliver invoice detail, status, and payment history**
  - **Goal:** Build the staff invoice detail view with state badges, itemized lines, related care context, and complete payment history.
  - **Dependencies:** [P4.2].
  - **Acceptance criteria:** Status presentation is consistent; payments and corrections remain traceable; only authorized admins can modify financial workflow state.

- [ ] **[P4.4] Record cash payments and generate receipts**
  - **Goal:** Let authorized admins record in-clinic cash payments and create linked receipts in one protected transaction.
  - **Dependencies:** [P4.3].
  - **Acceptance criteria:** Amount, method, time, optional reference/notes, and recording admin are retained; partial payment status is accurate; each receipt has an immutable unique number.

- [ ] **[P4.5] Deliver payment-correction workflows**
  - **Goal:** Implement void, refund, and adjustment records linked to the original payment, with an admin UI.
  - **Dependencies:** [P4.4].
  - **Acceptance criteria:** Original payments are never edited or deleted; correction reason, actor, time, and amount are retained; invoice totals/status correctly reflect the approved rules.

- [ ] **[P4.6] Deliver printable invoices and receipts**
  - **Goal:** Provide authorized staff with print-ready, business-approved invoice and receipt views.
  - **Dependencies:** [P4.4], [P4.5].
  - **Acceptance criteria:** Numbering, line items, payment breakdown, correction context, and clinic wording are accurate; print layouts are readable and isolated from unrelated screen UI.

- [ ] **[P4.7] Verify billing authorization and financial integrity**
  - **Goal:** Test concurrent numbering, billing RLS, state transitions, append-only payments, and corrections.
  - **Dependencies:** [P4.5].
  - **Acceptance criteria:** Tests prove non-admins cannot change payment history, duplicate numbers are prevented, and all financial records remain traceable after corrections.

## **PHASE 5: Owner portal, notifications, reports, and release verification**

**Exit state:** Owners have a controlled portal for care and billing information; staff have simple reports; notifications and end-to-end security are verified.

- [ ] **[P5.1] Deliver the owner portal and permitted pet history**
  - **Goal:** Build the owner home and pet-detail views for linked pets, upcoming appointments, recent activity, and explicitly permitted clinical history.
  - **Dependencies:** [P3.8], [P2.7].
  - **Acceptance criteria:** Medical visibility follows `can_view_medical_records`; data aggregation remains in services; owner views have complete empty, loading, and error states.

- [ ] **[P5.2] Deliver owner invoices, receipts, and billing detail**
  - **Goal:** Let owners access only their linked pets' invoices, receipts, statuses, and approved print-ready documents.
  - **Dependencies:** [P4.7], [P5.1].
  - **Acceptance criteria:** Owner billing access is not duplicated in an earlier phase; financial data follows `pet_owners`; documents expose no staff-only correction information unless approved.

- [ ] **[P5.3] Deliver role-specific printable patient documents**
  - **Goal:** Deliver full staff patient-record printing and a separately permission-filtered owner version.
  - **Dependencies:** [P5.1], [P3.7], [P4.6].
  - **Acceptance criteria:** Staff and owner documents apply distinct data rules; clinical and billing information is correct; every print view works without requiring a full PDF service.

- [ ] **[P5.4] Deliver basic operational reports**
  - **Goal:** Build date-filtered patient, diagnosis, and payment summary reports with CSV and print export where justified.
  - **Dependencies:** [P4.7], [P3.8].
  - **Acceptance criteria:** Only authorized admins access reports; totals use the financial correction rules; empty date ranges and partial data are handled clearly.

- [ ] **[P5.5] Deliver the notification centre and initial delivery channel**
  - **Goal:** Turn the appointment events from [P2.8] into a recipient-aware owner/staff notification centre and the simplest approved delivery channel.
  - **Dependencies:** [P2.8], [P5.2].
  - **Acceptance criteria:** Channel and scheduler scope are explicit; reminder delivery is not claimed without scheduling support; read state and recipient access are protected by RLS.

- [ ] **[P5.6] Run end-to-end authorization and workflow verification**
  - **Goal:** Verify the owner appointment-to-care-to-invoice-to-receipt journey and all role boundaries with automated and manual acceptance checks.
  - **Dependencies:** [P5.5], [P5.4].
  - **Acceptance criteria:** Tests prove owners cannot access another owner's pets, appointments, encounters, invoices, receipts, or notifications; admin and veterinarian restrictions hold; all migrations and generated types are current.

- [ ] **[P5.7] Complete MVP usability and release review**
  - **Goal:** Review the complete workflow for responsive design, accessibility, print quality, production configuration, and documented operational handoff.
  - **Dependencies:** [P5.6].
  - **Acceptance criteria:** Core workflows work at 375px and clinic desktop widths; interactive controls meet touch-target requirements; unresolved non-MVP ideas are documented rather than implemented.

---

## Notes

- GitHub Project: https://github.com/users/Danncode10/projects/9
- Detailed tasks use stable ordered IDs and are mirrored to real GitHub Issues.
- Later-phase placeholders intentionally have no Project cards until expanded.
