# MASTERPLAN — E-VetDoc

> E-VetDoc is a single-clinic veterinary management system for pet owners, veterinarians, appointments, medical records, invoicing, and receipts.

## **PHASE 0: DannFlow template readiness**

- [ ] **[P0.1] Connect the Supabase template environment**
  - **Goal:** Complete the template’s Supabase environment configuration and verify the tracked baseline migration against the E-VetDoc project.
  - **Dependencies:** A valid `DATABASE_URL` for Supabase project `zmdtwhqirmkptzobufio` must be available in `.env.local`.
  - **Acceptance criteria:** Required environment values are present locally; the baseline migration completes; public tables and functions are verified; generated Supabase types are current.
  - **Run:** `/setup-supabase`

- [ ] **[P0.2] Configure template authentication**
  - **Goal:** Configure the included Supabase email authentication, redirect URLs, branded email templates, and Google sign-in for E-VetDoc.
  - **Dependencies:** [P0.1].
  - **Acceptance criteria:** Email and redirect settings are documented and applied; branded templates are ready; Google sign-in is configured and verified in the template flow.
  - **Run:** `/setup-auth`

- [ ] **[P0.3] Apply the E-VetDoc overview to the template UI**
  - **Goal:** Establish the calm, clinic-oriented visual direction, semantic color system, landing-page copy, and template visual cleanup.
  - **Dependencies:** Product context is approved.
  - **Acceptance criteria:** The template clearly communicates E-VetDoc’s audience and purpose; UI changes follow the responsive, accessible Shadcn/Tailwind design rules.
  - **Run:** `/design-project`

- [ ] **[P0.4] Prepare hero media direction and handoff**
  - **Goal:** Define the hero-media brief that supports E-VetDoc’s reassuring clinic experience.
  - **Dependencies:** [P0.3].
  - **Acceptance criteria:** A reusable asset brief specifies subject, composition, tone, accessibility considerations, and required formats; assets are ready for template integration.
  - **Run:** `/hero-bg`

- [ ] **[P0.5] Complete template visual and quality review**
  - **Goal:** Review the configured template for discoverability, marketing clarity, and implementation quality before product modules are planned.
  - **Dependencies:** [P0.2], [P0.3], [P0.4].
  - **Acceptance criteria:** SEO, marketing, and code-quality review findings are resolved or documented with follow-up work for a later phase.
  - **Run:** `/seo-check`, `/marketing-check`, `/review`

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
