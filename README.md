# Clinic AI — WhatsApp Appointment Platform

Multi-tenant SaaS that gives each clinic an AI WhatsApp agent which answers questions,
checks **real** availability, books appointments, and sends reminders — with an internal
admin panel for configuration and a read-only client portal for reporting.

---

## The one architectural rule

**The AI is not the booking engine.**

```
WhatsApp  →  webhook  →  agent (Gemini)  →  tool call  →  backend service  →  PostgreSQL
                             ▲                                                    │
                             └───────────── validated result ─────────────────────┘
```

- Gemini never touches the database. It can only call the ten tools in
  [`src/lib/ai/tools.ts`](src/lib/ai/tools.ts), each of which validates its arguments with Zod and
  runs under a tenant scope pinned to the conversation's clinic.
- Availability comes from one place: [`availability-core.ts`](src/lib/booking/availability-core.ts),
  a pure function. The agent may only offer a time that function returned.
- A booking is real only when PostgreSQL accepts it. The application-level availability
  check produces good error messages; **a gist exclusion constraint is what prevents double
  booking.**

---

## Quick start

```bash
npm install
cp .env.example .env          # then fill in the secrets below
npx prisma migrate deploy
npm run db:seed               # prints generated passwords once
npm run dev
```

Generate the three required secrets:

```bash
openssl rand -base64 48   # AUTH_SECRET
openssl rand -base64 32   # ENCRYPTION_KEY (must decode to exactly 32 bytes)
openssl rand -base64 32   # CRON_SECRET
```

No PostgreSQL installed? The test harness downloads a throwaway one:

```bash
npm run test:db
```

---

## Verification status

Everything below was run in this repository.

| Check | Command | Result |
| --- | --- | --- |
| Types | `npm run typecheck` | pass |
| Lint | `npm run lint` | pass, 0 problems |
| Production build | `npm run build` | pass, 34 routes |
| Tests (pure) | `npm test` | 86 pass, 24 skipped (no DB) |
| Tests (with database) | `npm run test:db` | **110 pass, 0 skipped** |
| Migrations | `prisma migrate deploy` | both applied cleanly |
| Seed | `npm run db:seed` | 2 clinics, 3 accounts |

The integration suite runs against a real PostgreSQL instance because the guarantees under
test are database guarantees. It caught one genuine bug during development — see
*Concurrency* below.

---

## Layout

```
prisma/
  schema.prisma                     25 models, all instants timestamptz
  migrations/
    20260101000000_init/            generated
    20260101000100_booking_integrity/  hand-written: btree_gist, exclusion constraint, CHECKs
src/
  env.ts                            zod-validated, server-only
  middleware.ts                     edge fast-reject (not the authorization boundary)
  lib/
    tenancy/scope.ts                ← tenant isolation lives here
    auth/                           session (jose), password (bcrypt), guards, login throttling
    booking/
      availability-core.ts          pure scheduling engine, no I/O
      availability.service.ts       assembles DB inputs for the engine
      booking.service.ts            transactional create / cancel / reschedule
      constants.ts                  blocking statuses — kept in sync with the SQL predicate
    ai/                             gemini.ts · prompts.ts · tools.ts · agent.ts
    whatsapp/                       client.ts · signature.ts · webhook.ts
    reminders/                      scheduler.ts (idempotent) · dispatcher.ts (claim-then-send)
    analytics/ clinics/ directory/ leads/ conversations/
    crypto.ts logger.ts audit.ts rate-limit.ts errors.ts
  app/
    admin/…                         13 sections, super-admin only
    portal/…                        5 sections, read-only, single tenant
    api/…                           auth · webhooks · cron · availability · appointments
  components/                       ui primitives · data tables · charts · forms
tests/                              110 tests
scripts/with-test-db.mjs            ephemeral PostgreSQL for integration tests
```

---

## Double-booking prevention

Four layers, in increasing order of authority:

1. **The engine** never generates a slot that collides with an existing booking.
2. **A pre-check** inside `createAppointment` re-runs availability before writing.
3. **A partial unique index** on `(doctorId, startsAt)` for active statuses.
4. **A gist exclusion constraint** — the actual guarantee:

```sql
ALTER TABLE "Appointment"
  ADD CONSTRAINT "Appointment_no_overlap_per_doctor"
  EXCLUDE USING gist (
    "doctorId"                                          WITH =,
    tstzrange("blockStartsAt", "blockEndsAt", '[)')     WITH &&
  )
  WHERE (status IN ('PENDING','CONFIRMED','COMPLETED','NO_SHOW'));
```

Two concurrent requests both pass the pre-check; exactly one commits and the other receives
SQLSTATE `23P01`, which surfaces to the patient as *"that slot was just booked — I can offer
4:00 PM or 6:30 PM instead."*

**Buffers are enforced by the database too.** The constraint guards
`[blockStartsAt, blockEndsAt)` where `blockEndsAt = endsAt + bufferMinutes`, rather than the
appointment interval itself. Denormalising into plain columns is what keeps the index
expression immutable, which an exclusion constraint requires.

### The bug the tests caught

Prisma models only a handful of driver errors. An exclusion-constraint violation is not one
of them: it arrives as `PrismaClientUnknownRequestError` with **no structured code**, the
SQLSTATE present only inside the message string. The original conflict classifier missed it,
so under an 8-way concurrent burst the losing request raised a 500 instead of degrading
gracefully. Fixed in [`src/lib/db/prisma.ts`](src/lib/db/prisma.ts), with a regression test in
`tests/security.test.ts`.

---

## Timezones

Every instant is stored as `timestamptz` in UTC. Every wall-clock concept — opening hours,
breaks, holidays — is stored as *minutes from local midnight* plus an ISO weekday, and is
resolved against the clinic's IANA timezone only at the moment a concrete date is known.
[`src/lib/time/timezone.ts`](src/lib/time/timezone.ts) is the single place the two meet.

Two consequences worth knowing:

- **Spring-forward gaps are skipped, not shifted.** You cannot hold a 02:30 appointment on a
  day where 02:30 never happens, so `localMinutesToInstant` returns `null` and the slot is
  simply not offered.
- **Duration is elapsed time, not wall-clock arithmetic.** A 30-minute appointment consumes
  30 real minutes whether or not the clocks change during it. Deriving the end by adding 30
  to a local minute offset silently dropped valid slots around a transition — there is a test
  for both hemispheres.

---

## Tenant isolation

Every service function takes a `TenantScope` as its first argument, and the only way to
obtain one is through a guard that derives it from a verified session:

| Scope | Who | Reach |
| --- | --- | --- |
| `PLATFORM` | `SUPER_ADMIN` | every clinic; must still name one explicitly for writes |
| `CLINIC` | `CLIENT` | exactly one clinic, permanently |
| `SYSTEM` | webhook / agent / cron | one clinic, no human actor |

A client asking for another clinic's id gets a **403, not a silent narrowing** — quiet
narrowing would hide IDOR probes. `assertOwned` returns an identical message for
"doesn't exist" and "isn't yours", so ids cannot be enumerated. Route protection in
`middleware.ts` is a convenience; the scope layer is the control.

---

## Reminders

Rules are per clinic (`offsetMinutes`, e.g. 1440 and 120). Idempotency is structural: a
unique key on `(appointmentId, offsetMinutes)` means re-running the scheduler converges
rather than stacking duplicates.

Dispatch **claims before sending** — a conditional `UPDATE … WHERE status = 'SCHEDULED'`
that must affect exactly one row. Overlapping cron runs and retried invocations are therefore
both safe. This biases towards *never send twice* over *never miss one*, which is the right
trade-off for an appointment reminder; failures fall back to `SCHEDULED` for up to 3 attempts
and then park as `FAILED` for operator attention.

```bash
*/5 * * * * curl -fsS -X POST -H "Authorization: Bearer $CRON_SECRET" \
  https://your-domain/api/cron/reminders
```

Cancelling, rescheduling or completing an appointment stands down its pending reminders in
the same transaction.

---

## WhatsApp

Inbound: `POST /api/webhooks/whatsapp`. Order is deliberate — **rate limit → signature →
parse → process**. The HMAC is verified against the *raw* body before anything is parsed, so
a forged payload never reaches the schema, the database, or the model. An unset
`WHATSAPP_APP_SECRET` **fails closed**.

De-duplication has two independent layers, because Meta retries aggressively and a duplicate
means either a duplicate reply or a duplicate booking:

1. `ProcessedEvent(scope, key)` — insert-wins ledger on the provider message id.
2. `Message.externalId` — unique per clinic.

The message id also seeds tool idempotency keys, so a replay that somehow reached the agent
would still resolve to the same appointment.

Authentic deliveries always return `200`, even on processing failure: a retry storm against a
persistent application bug is worse than one lost delivery, and the failure is captured in
`SystemLog` where it is visible in the admin UI.

---

## The AI layer

Ten tools, and nothing else is expressible:

```
get_clinic_information  get_services  get_doctors  get_available_slots
create_appointment  get_my_appointments  cancel_appointment  reschedule_appointment
update_lead  escalate_to_human
```

`create_appointment` takes a **`slot_token`** issued by `get_available_slots` — there is no
free-text date parameter, so the model cannot assert a time. A fabricated token gains nothing:
it still has to survive the availability re-check and the database constraint.

The system prompt is assembled entirely from clinic configuration; where configuration is
missing it says so rather than leaving a gap the model would fill. The agent loop is bounded
at 6 tool rounds, and on the final round the tools are withheld so the model must produce
prose. If Gemini is unconfigured, disabled, or fails, the patient gets a neutral holding
reply and a human picks it up — the fallback never implies availability.

Ownership is re-checked server-side: `cancel_appointment` and `reschedule_appointment` filter
on `patientId` as well as `clinicId`, so a guessed id cannot touch another patient's booking.

---

## Security

- **Auth** — httpOnly `SameSite=Lax` JWT cookie (`jose`), bcrypt cost 12, uniform failure
  messages with a dummy comparison for unknown emails, 5-failure lockout.
- **Revocation** — `sessionVersion` on the user; every request re-reads the session from the
  database, so deactivation takes effect immediately rather than at token expiry.
- **Secrets at rest** — WhatsApp credentials are AES-256-GCM encrypted. They are write-only in
  the UI: a blank field keeps the stored value, and no code path returns a decrypted
  credential. The admin screens show presence flags only.
- **Errors** — only `AppError` messages reach a client; anything else collapses to a generic
  500 with a correlation id logged server-side.
- **Logging** — recursive redaction of secret-shaped keys at any depth, with a cycle guard.
- **Rate limiting** — per-policy fixed windows. The default store is **in-process**, so limits
  are per instance; `RATE_LIMIT_REDIS_URL` is reserved for a shared store.
- **Audit** — append-only `AuditLog` for every configuration change and lifecycle transition.
- Open-redirect guard on `?next=`, security headers in `next.config.ts`, `robots: noindex`.

---

## Configuration required before going live

| Variable | Needed for |
| --- | --- |
| `DATABASE_URL` | everything; the first deploy needs rights to `CREATE EXTENSION btree_gist` |
| `AUTH_SECRET` | sessions (≥32 chars) |
| `ENCRYPTION_KEY` | integration credentials (base64, exactly 32 bytes) |
| `CRON_SECRET` | `/api/cron/reminders` |
| `GEMINI_API_KEY` | the assistant; without it inbound messages get the holding reply |
| `WHATSAPP_APP_SECRET` | webhook signatures — **unset means every webhook is rejected** |
| `WHATSAPP_VERIFY_TOKEN` | Meta's subscription handshake |
| `APP_URL` | absolute links and the `Secure` cookie flag |

Per clinic, in the admin panel: WhatsApp phone number ID + access token, at least one doctor
with a schedule, at least one active service with a doctor assigned, and the assistant
enabled. `/admin/clinics/[id]` shows a readiness strip for exactly these.

---

## Known limitations

Stated plainly rather than buried:

- **Rate limiting is per-instance.** Behind N replicas the effective ceiling is N × limit.
  Wire up Redis before relying on it as a hard quota.
- **No outbound human-reply composer.** Escalated conversations are visible and the AI stands
  down, but staff reply from WhatsApp directly; the `HUMAN` message sender and
  `sentByUserId` column exist for it.
- **Doctor and service editing is read-only in the UI.** The service layer
  (`saveDoctor` / `saveService`, with full validation, tenant checks and audit) and the admin
  list views are complete; the create/edit forms are not wired up. Seed or API for now.
- **`maxDuration = 60` on the reminder cron** suits a few hundred reminders per run. Beyond
  that, move dispatch to a queue.
- **Fall-back DST hours are conservative.** During the repeated hour the engine offers the
  first occurrence only, trading one hour of yearly capacity for unambiguous appointment times.

---

## Commands

```bash
npm run dev            # development server
npm run build          # production build
npm run typecheck      # tsc --noEmit
npm run lint           # eslint
npm test               # pure tests; DB suites skip loudly
npm run test:db        # full suite against an ephemeral PostgreSQL
npm run db:migrate     # create a migration (development)
npm run db:deploy      # apply migrations (production)
npm run db:seed        # demo clinics + accounts
npm run db:studio      # Prisma Studio
```
