# PROMPTS.md — AI Tooling Chat History

**Tool:** Claude Code (Anthropic), Claude Sonnet 5, agentic CLI mode — file read/write/edit, shell execution, and live browser verification via Playwright.

**Role in this project:** an active pair-programmer across the full lifecycle — spec-to-tests, implementation, debugging against a real running stack, refactor judgment, and documentation — not a one-off autocomplete tool.

This document is the transparency record the kata requires: what was asked, in what order, and why each prompt was shaped the way it was. A note on sourcing: this project was built across a long session that included one context-window compaction partway through. Phases 1–6 are reconstructed from git history and a structured development summary generated at compaction time, and are written here as accurate paraphrase of intent and requirements rather than character-for-character transcript. Phases 7 onward are verbatim.

---

## Prompt Engineering Methodology

Five principles governed every feature prompt in this project:

**1. Specify before generating.** Every feature prompt front-loaded exact requirements — field names, table columns, filter sets, status values — before any code was written. Ambiguity left in a prompt gets resolved by the model guessing, and a wrong guess is far more expensive to unwind than a few extra lines of spec.

**2. TDD as a process constraint, not a suggestion.** Every feature prompt required a literal Red → Green → Refactor sequence with a matching commit at each step, not "write some tests." That distinction shows up directly in the commit log: `test:` commits that fail on their own, followed by `feat:` commits that turn them green, followed by `refactor:` commits only where genuine duplication had actually accumulated.

**3. Reuse is named explicitly, per component.** "Never duplicate existing functionality" is a rule that erodes fast if left abstract — a capable assistant will rationalize a rebuild as "cleaner." Naming the exact thing to reuse (the Invoice component, the Purchase API, the Pagination component) closed that gap.

**4. Green tests are necessary, not sufficient.** The automated suites mock the API boundary on the frontend and use a test database on the backend, so neither can catch integration bugs — a wrong DB port, a CSS stacking-context bug, a migration that never actually ran against the live database. Every feature that touched the running stack was verified with a real browser against the real dev servers before being called done.

**5. Ask at genuine forks; decide at everything else.** When a feature had a full spec, the instruction was to execute autonomously and not interrupt for permission between steps. When a feature had no spec at all — nothing to build against — the instruction was to stop and ask a concrete, multiple-choice question rather than pick an interpretation and build hundreds of lines against a guess.

---

## Phase 1 — Project Bootstrap

**Commits:** `Initial commit`, `nitial project structure`

Scaffolded the architecture the rest of the project builds on: FastAPI with a layered router → service → repository structure, SQLAlchemy models against a real Dockerized PostgreSQL instance (the kata explicitly rules out in-memory/SQLite), JWT auth scaffolding, and a Vite + React + Tailwind frontend shell.

## Phase 2 — Vehicle Inventory & Purchases

**Commits:** `test: add purchase history tests` → `feat: add purchase model` → `feat: implement purchase repository` → `feat: implement purchase service` → `feat: add purchase history API` → `refactor: connect purchase endpoint to purchase service`

Delivered the kata's core surface: full vehicle CRUD, the search endpoint (make/model/category/price range), the purchase endpoint that decrements stock, and the admin-gated restock endpoint. The six-commit sequence is itself the TDD evidence — each layer (model → repository → service → API → integration) landed as its own reviewable step.

## Phase 3 — Dashboard Analytics, First Pass

**Commits:** `test: add dashboard analytics tests` → `feat: implement dashboard repository` → `feat: implement dashboard analytics endpoints`, plus `fix: restore purchase history serialization` and `test: restore green test suite`

A regression surfaced mid-phase — a change broke previously-passing tests. The instruction was to restore a fully green suite before adding anything further, rather than layering new work on top of known-broken tests.

## Phase 4 — Customer Frontend: Dashboard, Registration, Navigation, Vehicle Detail

A long, paired sequence of `test:`/`feat:` commits built the customer-facing app: the registration form (initially over-scoped with address/city/state fields, then explicitly trimmed back — a case of a prompt actively *reducing* scope after review rather than only adding), a responsive navbar with a hamburger menu and profile dropdown, vehicle images and a detail page, sorting and pagination on the showroom, and a portal-rendered `Modal` component.

One detail worth preserving: the `Modal` was rebuilt to render through `createPortal(..., document.body)` after a live-browser test caught a CSS bug that a mocked component test couldn't — a modal visually escaping its intended position whenever an ancestor had an active `transform` (`hover:-translate-y-0.5` on the vehicle card triggers a CSS "containing block"). JSDOM doesn't lay out transforms, so this was only findable by actually looking at a rendered page.

## Phase 5 — Currency Localization to INR

**Commits:** `feat: switch currency formatting to INR and add luxury/pickup categories`, `test(frontend): expect INR currency formatting for realistic demo pricing`

A direct instruction moved every price-displaying surface from USD to INR (`₹`, `en-IN` locale, lakh/crore digit grouping) for demo data that reads as realistic rather than placeholder.

## Phase 6 — Customer Management (Admin)

**Commits:** `test: add failing tests for admin customer management` → `feat: add admin customer management with search, pagination, and profile modal` → `refactor(frontend): extract shared useAsyncList hook, deduplicating load/loading/error state in admin list pages`

The refactor here is principle 3 in action: the `useAsyncList` hook was only extracted once the same load/loading/error pattern appeared independently on a *second* admin page, not preemptively on the first.

---

## Phase 7 — Purchase Management (Admin Orders)

The most detailed feature prompt of the project:

> Create a complete admin order management module at route `/admin/purchases`, wired into the existing `AdminLayout` navigation. Reuse the existing Purchase model, Purchase APIs, Invoice component, and PurchaseModal logic wherever possible — never duplicate existing functionality. Follow strict TDD: RED → GREEN → REFACTOR, each with a commit.
>
> Order table columns: Invoice Number, Order ID, Customer, Customer Email, Vehicle, Purchase Date, Payment Method, Quantity, GST, Total, Status. Support search by invoice/customer/email/vehicle; filter by payment method, order status, and date range; sort by newest/oldest/highest/lowest amount; reuse the existing pagination component.
>
> Order Details Modal must reuse the existing Invoice component (not rebuild it), including the Print button. Status is demo-only — Completed/Pending/Cancelled, badge colors, no real payment gateway. Reuse shared loading/error/empty state patterns. Must be responsive: desktop table, tablet responsive, mobile cards.
>
> REFACTOR step: look for duplicated filtering, sorting, pagination, or modal logic — extract only if genuine duplication exists, do not over-engineer.
>
> Report using this exact format: Feature completed / Files changed / Tests passed / Suggested RED commit / Suggested GREEN commit / Suggested REFACTOR commit / Next feature — then continue automatically into the next roadmap item (Admin Settings → Dashboard Analytics Improvements → Final UI/UX Polish) without asking for permission between features.

**Why it's structured this way:** reuse constraints are named per-component rather than stated as a general principle, because a vague instruction gives the model room to rationalize a rebuild. The exact column and filter list removes any need for the model to invent scope. The mandated report format makes output auditable at a glance across a long run of features, without re-reading a full diff each time. The "continue automatically" clause is a deliberate throughput decision — once a spec is this explicit, pausing for permission between every feature buys no additional safety, only latency.

**Outcome:** this prompt surfaced a real gap — `payment_method` and `status` didn't exist on the `Purchase` model at all. Rather than let the model guess how to retrofit history, two explicit product decisions were made in follow-up: keep `total_price` stored pre-GST (GST is computed for display only, protecting historical revenue figures the dashboard already depends on), and default unset payment methods on legacy rows to `"unknown"`. Delivered as three commits: `test: add failing specs for Purchase Management (admin orders)` → `feat: implement Purchase Management (admin orders)` → `refactor: extract shared usePagination hook` — the third independent occurrence of the same pagination-state pattern, now finally justifying extraction.

## Phase 8 — Admin Settings

The roadmap named "Admin Settings" as the next feature with zero further spec — no field list, no column list, nothing to build against, unlike every feature before it. Rather than invent scope, the follow-up was a direct, structured clarifying question:

> What should the Admin Settings page (`/admin/settings`) contain?
> — Dealership profile · Admin account & security · App preferences · Notification preferences

**Answer:** *Admin account & security.*

Inspecting the existing codebase against that scope showed `Profile.jsx` already implemented exactly that — profile editing plus change-password. Building a second, near-identical page would have broken the standing reuse rule from Phase 7, so the resolution was to route `/admin/settings` at the existing `Profile` component rather than write new UI — still delivered as a full RED (a routing test asserting the settings URL renders the profile heading) → GREEN (one line: point the route at the existing component) cycle, because a route change is a behavior change worth a regression test regardless of size.

**Follow-up, from clicking through the running app rather than reading the diff:**

> `http://localhost:5173/admin/profile` and `http://localhost:5173/admin/settings` both are same so remove any one

Resolved by removing the now-redundant `/admin/profile` nav entry and route, keeping `/admin/settings` as the single entry point — the name given in the original roadmap.

## Phase 9 — Dashboard Analytics Improvements

With no further spec provided, scope was derived from the codebase's actual state rather than invented: a real formatting bug, where the dashboard used a local `en-US` currency formatter instead of the shared `formatMoney` (`en-IN`) utility every other screen had already standardized on; and two new breakdowns — orders by status, orders by payment method — directly enabled by the `status`/`payment_method` columns Phase 7 had added and left otherwise unused. This phase is a deliberate contrast with Phase 8: when the codebase itself points at the next logical increment, build it; when it doesn't, ask.

## Phase 10 — Housekeeping Under a Hard Deadline

> after this final check all the file and folder, if the file and folder is not commit then commit it, and check all file if not use in project then delete and if code is optimize then optimize. you have only 30 minutes

Followed shortly after by:

> screenshots folder is important
>
> in screenshot also add user side photo, register.png and purchase.png payment etc, add all the png photo to show the project good
>
> in custmer side this type of photo [reference image: a clean vehicle grid with only a Purchase button] not include reset delet option

The last of these caught a real mistake in progress: the first pass of "customer-side" screenshots had been captured while logged in as an **admin** account, so the vehicle grid showed Restock/Delete controls a real customer would never see. The fix was to register a genuine `customer`-role account and recapture — not crop the image or explain the discrepancy away, since a screenshot in a README claiming to show the customer experience should actually show the customer experience.

Under the stated time limit, priority was set deliberately: finish the in-flight feature to a safe, fully tested checkpoint → commit everything legitimately outstanding (a large batch of core application files — `main.jsx`, `index.css`, several shared hooks and components — had been sitting uncommitted for most of the project's history) → restore a missing root `.gitignore` (its absence was why IDE and coverage artifacts were about to leak into a commit) → delete the one file confirmed genuinely orphaned (`AdminHome.jsx`, superseded, referenced nowhere) → capture and correct screenshots → write this documentation. A full-repo speculative "optimize everything" pass was explicitly not attempted in the time remaining — a shallow sweep across an entire codebase produces churn, not value, and "give your best" pointed clearly at documentation quality over speculative refactors.

## Phase 11 — The Kata Brief

The full original kata specification — tech stack constraints, required endpoints, the TDD/commit/AI-transparency policy, and the deliverables list — was shared partway through the build, after most of the feature work above was already underway. It confirmed the architecture already in place (FastAPI + PostgreSQL + JWT + React/Tailwind, RESTful endpoints matching the required paths, admin-gated destructive and restock actions) satisfied the brief, and directly drove this documentation pass: a full `README.md` rewrite covering setup, screenshots, the AI usage section, and the test report — plus this file.

---

## Reflection

The single highest-value pattern across this build was treating the assistant's default behavior as something to actively steer, not something to trust by default. Left alone, a capable coding assistant will over-build (inventing scope for an unspecified "Admin Settings" instead of asking), under-verify (trusting a green mocked test suite over an actual browser), and quietly widen the blast radius of a routine request (sweeping unrelated pre-existing files into a "cleanup" commit). Every prompt in this log that reads as unusually specific — exact table columns, an exact commit-message format, "ask, don't guess" as a standing rule — exists because a looser version of that instruction was effectively tried across the earlier, less-specified phases of this project, and the output had to be walked back.

The second pattern worth naming: verification does not stop being necessary just because the test suite is green. More than once in this project, passing `pytest`/`vitest` was necessary but not sufficient — the real bug (a database port mismatch, a CSS stacking-context bug, a migration that silently never ran) only surfaced when the assistant was pushed to open a real browser against the real running servers and look. AI-assisted development doesn't remove the need for that discipline; if anything it raises the stakes, since a model will report success with full confidence based on the tests it can see, with no innate signal that those tests are mocking away the exact integration surface where the actual bug lives.
