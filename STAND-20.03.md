# Stand 20.03.2026 — Client Dashboard + Multi-User Support for Jetpack

## What was done

1. **Role-based client dashboard** — non-admin users see a simplified UI (Overview, Integrations, Settings only)
2. **Multi-user customer support** — multiple auth users can now belong to one customer via a junction table
3. **Magic link login** — passwordless auth via email OTP, no credentials to share
4. **Jetpack user setup** — fully automated SQL script creates both users + links them

---

## Changes

### 1. Migration 003 — Multi-User Customers
**File:** `supabase/migrations/003_multi_user_customers.sql`

Previously `customers.auth_user_id` was 1:1 (one user per customer). Now a `customer_users` junction table maps N auth users → 1 customer:

- **`customer_users` table** — `(auth_user_id, customer_id, role)` with roles `owner` / `member`
- **`get_user_customer_id()`** — updated SQL function checks `customer_users` first, falls back to legacy `customers.auth_user_id`
- **RLS policies** on `customers` table updated to also check the junction table
- **Existing data migrated** — all current `customers.auth_user_id` entries auto-copied into `customer_users` as `owner`

### 2. Shared Customer Lookup Helper
**File:** `src/lib/supabase/get-customer.ts`

Two reusable functions:
- `getCustomerIdForUser(supabase, userId)` → returns `customer_id` string
- `getCustomerForUser(supabase, userId)` → returns full customer record

Both check `customer_users` first, fall back to legacy `customers.auth_user_id`.

### 3. All Customer Lookups Updated
Every file that queried `customers` by `auth_user_id` now uses the shared helper:

| File | What changed |
|------|-------------|
| `src/app/dashboard/layout.tsx` | Uses `getCustomerForUser()` |
| `src/app/dashboard/page.tsx` | Uses `getCustomerForUser()` for client view |
| `src/app/api/settings/route.ts` | Uses `getCustomerIdForUser()` |
| `src/app/api/jobs/route.ts` | Uses `getCustomerIdForUser()` |
| `src/app/api/integrations/[provider]/route.ts` | Uses `getCustomerIdForUser()` |
| `src/app/onboarding/page.tsx` | Uses `getCustomerIdForUser()` |
| `src/app/dashboard/brain/page.tsx` | Uses `getCustomerIdForUser()` |

### 4. Middleware — Route Protection
**File:** `src/middleware.ts`

Admin-only route guard: `/dashboard/brain`, `/jobs`, `/skills`, `/approvals`, `/admin` → redirected to `/dashboard` for non-admin users.

### 5. Dashboard Shell — Nav Filtering + Branding
**File:** `src/app/dashboard/dashboard-shell.tsx`

- `adminOnly` flag on nav items (Brain, Jobs, Skills, Approvals)
- Clients see only **Overview**, **Integrations**, **Settings**
- Sidebar shows client display name instead of Synaptica logo
- Top bar shows "Welcome, {name}"

### 6. Overview Page — Client Welcome View
**File:** `src/app/dashboard/page.tsx`

Non-admin users get: welcome card, agent status badge, integration count, quick-link cards.

### 7. Settings — Admin Sections Hidden
**Files:** `settings-form.tsx`, `settings/page.tsx`

Clients only see **Agent Preferences** (personality, language, timezone, answer length). API key, model config, and safety limits hidden.

### 8. Settings API — Field Restriction
**File:** `src/app/api/settings/route.ts`

Backend enforcement: non-admin PATCH can only write `personality`, `answer_length`, `timezone`, `language`.

### 9. Login Page — Magic Link + Password
**File:** `src/app/login/page.tsx`

Replaced password-only login with dual-mode:
- **Default: Magic link** — user enters email, gets a login link via email, no password needed
- **Fallback: Password** — small toggle at bottom for admin password login
- Confirmation screen with "Check your email" after sending magic link
- Auth callback already handled magic links (no changes needed there)

### 10. Jetpack User Setup Script
**File:** `supabase/setup_jetpack_users.sql`

Fully automated — single SQL script that:
- Creates both auth users directly in `auth.users` (no Dashboard needed)
- Creates `auth.identities` entries (required for magic link login)
- Sets `email_confirmed_at` so they can log in immediately
- Sets `is_admin = false` in user_metadata
- Links both to `customer_id = 'jetpack-1'` via `customer_users`
- Creates `agent_config` defaults

Users:
- `daan@jetpack.berlin` (owner)
- `alejandro.landgraf@gmail.com` (member)

---

## What's NOT changed

- **Integrations page** — works identically for both roles (RLS handles scoping)
- **Login page** — same for everyone
- **Admin experience** — completely unchanged
- **Bot containers** — no changes to Docker or bot code

---

## Pre-launch checklist for Jetpack (21.03)

### Supabase SQL Editor (2 scripts, in order)
- [ ] Run `supabase/migrations/003_multi_user_customers.sql`
- [ ] Verify: `SELECT * FROM customer_users;` → existing users migrated
- [ ] Run `supabase/setup_jetpack_users.sql`
- [ ] Verify: `SELECT * FROM customer_users WHERE customer_id = 'jetpack-1';` → 2 rows

### Supabase Dashboard — Email Config
- [ ] Ensure SMTP is configured (Settings → Auth → SMTP) so magic links can be sent
- [ ] Check "Enable Email OTP" is ON in Auth → Providers → Email

### Deploy
- [ ] Deploy updated web app (login page + customer lookup changes)

### Testing
- [ ] Go to login page → enter `daan@jetpack.berlin` → receive magic link email → click → lands on restricted client dashboard
- [ ] Same for `alejandro.landgraf@gmail.com`
- [ ] Verify both see same integrations and settings for jetpack-1
- [ ] Login as admin with password → unchanged admin view
- [ ] Test the "Sign in with password instead" toggle works for admin

### Delivery
- [ ] Tell Jetpack team: "Go to app.synaptica.dev, enter your email, click the link in your inbox"
- [ ] No passwords to share
