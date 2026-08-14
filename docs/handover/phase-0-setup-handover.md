# E-VetDoc Phase 0 handover runbook

Use this runbook in order. Each section maps to one task in `MASTERPLAN.md` and ends with a simple completion check. Do not copy secrets into this file, Git, chat, or screenshots.

## Before you start

The handover developer needs access to:

- The E-VetDoc repository.
- The E-VetDoc Supabase project.
- The E-VetDoc Google Cloud OAuth project.
- A test email inbox they control.

Keep these values in a password manager or approved secret store only: `DATABASE_URL`, Supabase service-role key, Gmail App Password, Google Client Secret, and personal tokens.

## P0.1 — Connect Supabase

**Purpose:** Connect the local app to the correct hosted Supabase project.

### Do this

1. Clone the repository and run:

   ```bash
   pnpm install
   cp .env.example .env.local
   ```

2. Use `.env.example` as the local configuration contract. Ask the project owner to provision the required values through a secure channel; do not add values to this handover guide.
3. The developer must set these variables in their own untracked `.env.local` file:

   | Variable | Obtain it from |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → Data API |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → Data API |
   | `SUPABASE_PROJECT_ID` | Supabase → Project Settings → General |
   | `DATABASE_URL` | Supabase → Connect |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → Data API; server-only |
   | `NEXT_PUBLIC_SITE_NAME` | Product configuration |
   | `NEXT_PUBLIC_SITE_URL` | Local or production app origin |

4. Run `pnpm dev`, then open `http://localhost:3000/login`.

### Done when

- The app starts locally.
- The login page loads without a Supabase configuration error.
- No secret was committed or shared in a ticket.

## P0.2 — Configure email authentication

**Purpose:** Let new users confirm their email and recover their account safely.

### Do this in Supabase

1. Open **Authentication → URL Configuration**.
2. Set **Site URL** to:

   ```text
   http://localhost:3000
   ```

3. Add these **Redirect URLs**:

   ```text
   http://localhost:3000/auth/callback
   http://localhost:3000/reset-password
   ```

4. Open **Authentication → Providers**. Keep email/password enabled and require email confirmation for new owner accounts.
5. Open **Authentication → Emails → SMTP Settings**:
   - Enable **Custom SMTP**.
   - Host: `smtp.gmail.com`
   - Port: `465`
   - Username: approved clinic Gmail address
   - Password: Gmail App Password
   - Sender: approved clinic email and E-VetDoc display name
6. Open **Authentication → Emails → Templates**. Paste the repository HTML into the matching template:

   | Supabase template | Subject | File to copy |
   | --- | --- | --- |
   | Confirm sign up | `Confirm your E-VetDoc email` | [`confirm-signup.html`](../supabase/email-templates/confirm-signup.html) |
   | Reset password | `Reset your E-VetDoc password` | [`reset-password.html`](../supabase/email-templates/reset-password.html) |

   Keep `{{ .ConfirmationURL }}` unchanged in both templates.

### Test it

1. Create a new account with a fresh inbox.
2. Open the confirmation email and confirm it returns to the app.
3. Request a password reset, use the newest email, set a new password, and sign in.

### Done when

Confirmation and reset emails arrive, their links work, and the new password can sign in.

## P0.3 — Preserve the approved E-VetDoc UI

**Purpose:** Keep the calm clinic-oriented visual direction intact while the project changes hands.

### Do this

1. Read `PROJECT_CONTEXT.md` before changing copy, theme, or UI.
2. Preserve the existing page structure, navigation, login behavior, and responsive behavior.
3. Use only Tailwind/Shadcn semantic tokens; do not add hard-coded color utility classes.
4. Check `/login` at mobile width (375px) and desktop width after UI changes.

### Done when

The landing and login screens still use E-VetDoc copy and are readable, responsive, and functional.

## P0.4 — Configure Google sign-in

**Purpose:** Allow an approved Google account to sign in through Supabase and reach `/dashboard`.

### A. Do this in Google Cloud

1. Select the dedicated **E-VetDoc Google OAuth** project; do not use a project belonging to another product.
2. Search for **Google Auth Platform**.
3. In **Branding**, set the E-VetDoc name, support email, and developer contact email.
4. In **Audience**:
   - Use **External**.
   - Keep the status **Testing**. Do not click **Publish app**.
   - Under **Test users**, add the Gmail account used for testing.
   - If Google says the account is ineligible but it already appears in the Test users table, close the error: it is already added.
5. In **Data Access**, make sure `openid` is present. Do not add sensitive or restricted scopes.
6. In **Clients**, create a client:

   | Field | Value |
   | --- | --- |
   | Application type | Web application |
   | Name | `E-VetDoc local development` |
   | Authorized JavaScript origin | `http://localhost:3000` |
   | Authorized redirect URI | Copy the callback URL shown by Supabase Google provider; format: `https://<SUPABASE_PROJECT_REF>.supabase.co/auth/v1/callback` |

7. Copy the Client ID and Client Secret. Keep the secret private.

### B. Do this in Supabase

1. Open **Authentication → Providers → Google**. Some dashboard versions call this **Sign In / Providers**.
2. Enable **Sign in with Google**.
3. Paste the Google Client ID and Client Secret, then click **Save**.
4. Recheck **Authentication → URL Configuration** contains:

   ```text
   Site URL:      http://localhost:3000
   Redirect URL:  http://localhost:3000/auth/callback
   Redirect URL:  http://localhost:3000/reset-password
   ```

### C. Test it

1. Run `pnpm dev`.
2. Open `http://localhost:3000/login`.
3. Click **Continue with Google** and choose a Google OAuth test user.
4. Confirm the browser ends at `/dashboard`.

### Important distinction

Google Cloud needs the **Google → Supabase** URL shown by the Supabase Google provider:

```text
https://<SUPABASE_PROJECT_REF>.supabase.co/auth/v1/callback
```

Supabase needs the **Supabase → app** URL:

```text
http://localhost:3000/auth/callback
```

Do not swap these URLs.

### Done when

An account listed as a Google test user reaches `/dashboard` after clicking **Continue with Google**.

## P0.5 — Hand over hero media

**Purpose:** Deliver approved visual assets without changing the existing hero behavior by accident.

### Deliver these files

```text
public/hero-poster.avif
public/hero-background.webm
public/hero-background.mp4
```

Also hand over the asset source, licence/usage confirmation, intended desktop/mobile crop, and concise alt text. Review the hero on mobile and desktop, including reduced-motion fallback.

### Done when

The hero text remains readable, the subject survives the mobile crop, and the supplied media has approved usage rights.

## P0.6 — Final quality review

**Purpose:** Catch launch blockers after authentication and hero work are complete.

### Run

```bash
pnpm lint
pnpm build
```

Then check:

- `/login` works on mobile and desktop.
- Email confirmation, password reset, and Google sign-in reach the correct destination.
- No secrets appear in Git, logs, or screenshots.
- The landing page has clear E-VetDoc messaging and accessible image text.

Record any failure as a GitHub issue. Do not mark the review complete based only on a visual glance.

### Done when

The checks pass or every known failure has an assigned follow-up issue.

## P0.7 — Keep this runbook current

When a setting, provider, URL, or workflow changes, update this file in the same pull request. Never add credentials. Update the status of the matching `MASTERPLAN.md` task and GitHub Project card when the work is actually complete.

## Production switch-over

Only after the production domain exists:

1. Change Supabase **Site URL** to the production origin.
2. Add production `/auth/callback` and `/reset-password` redirect URLs in Supabase.
3. Add the production origin to Google Cloud's Authorized JavaScript origins.
4. Add the approved production domain to Google Auth Platform Branding.
5. Run the three auth tests again against production.

## Helpful references

- [`MASTERPLAN.md`](../../MASTERPLAN.md)
- [`PROJECT_CONTEXT.md`](../../PROJECT_CONTEXT.md)
- [`social-auth.md`](../dannflow_docs/social-auth.md)
- [`auth-redirect-and-email-setup.md`](../supabase/auth-redirect-and-email-setup.md)
