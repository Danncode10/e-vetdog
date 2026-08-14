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

- [ ] **[P0.5] Prepare hero media direction and handoff**
  - **Goal:** Define the hero-media brief that supports E-VetDoc’s reassuring clinic experience.
  - **Dependencies:** [P0.3].
  - **Acceptance criteria:** A reusable asset brief specifies subject, composition, tone, accessibility considerations, and required formats; assets are ready for template integration.
  - **Run:** `/hero-bg`

- [ ] **[P0.6] Complete template visual and quality review**
  - **Goal:** Review the configured template for discoverability, marketing clarity, and implementation quality before product modules are planned.
  - **Dependencies:** [P0.2], [P0.3], [P0.4], [P0.5].
  - **Acceptance criteria:** SEO, marketing, and code-quality review findings are resolved or documented with follow-up work for a later phase.
  - **Run:** `/seo-check`, `/marketing-check`, `/review`

- [x] **[P0.7] Create Phase 0 setup and handover guide**
  - **Goal:** Provide a clear, safe handover guide for another developer to configure and verify E-VetDoc's local environment, Supabase services, authentication, email delivery, Google OAuth, visual direction, and final quality checks.
  - **Dependencies:** None. The guide must clearly distinguish completed, pending, and production-only steps.
  - **Acceptance criteria:** The guide names every required dashboard location and local command; contains copy-paste values only where safe; links to reusable email templates; never contains credentials; and includes a verification and handover checklist.
  - **Run:** Review `docs/handover/phase-0-setup-handover.md`.

---

## **PHASE 1: Foundation and access**

Expand with `/make-masterplan Phase 1` when Phase 0 is complete. No cards yet.

## **PHASE 2: Registry and appointment operations**

Expand with `/make-masterplan Phase 2` when ready. No cards yet.

## **PHASE 3: Clinical, billing, and owner portal workflows**

Expand with `/make-masterplan Phase 3` when ready. No cards yet.

---

## Notes

- GitHub Project: https://github.com/users/Danncode10/projects/9
- Detailed tasks use stable ordered IDs and are mirrored to real GitHub Issues.
- Later-phase placeholders intentionally have no Project cards until expanded.
