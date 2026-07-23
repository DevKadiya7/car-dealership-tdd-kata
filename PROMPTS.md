# PROMPTS.md — AI Tooling Chat History

**Tool used:** Claude Code (Anthropic), model Claude Sonnet 5, CLI/agent mode with file read/write/edit, shell execution, and browser-based (Playwright) live verification.

This document is the transparency record required by the kata: what was asked of the AI, in what order, and why each prompt was shaped the way it was. It is organized chronologically by development phase. Prompts are reproduced **verbatim** where the exact text was preserved in-session; earlier phases (before a context-window compaction event partway through the build) are reconstructed from the commit history and a structured summary the tool itself produced at compaction time — those are marked accordingly rather than presented as verbatim quotes I don't actually have.

---

## Prompt Engineering Approach

Before the transcript, the methodology, because the *shape* of these prompts mattered more than any individual one:

1. **Spec before code, every feature.** Each feature prompt front-loaded the exact requirements (fields, columns, filters, states) rather than letting the assistant infer scope. Ambiguity left in a prompt gets resolved by the model guessing — sometimes wrong, always expensively.
2. **TDD was a process constraint, not a suggestion.** Every feature prompt explicitly required Red → Green → Refactor with a corresponding commit at each step, not just "write tests." This is the difference between an assistant that tests its output and one that treats tests as documentation written after the fact.
3. **"Reuse, never duplicate" as a standing rule.** Repeated explicitly per feature ("reuse the existing Invoice component," "reuse existing Purchase APIs") because the default failure mode of an eager code-generating assistant is to rebuild something that already exists rather than search for it first.
4. **Verification against the real system, not just green tests.** The automated suites mock the API layer, so they can't catch integration bugs (wrong DB port, a CSS stacking bug, a migration that never ran against the live DB). Prompts and follow-ups repeatedly pushed the assistant to open a real browser (Playwright) against the running dev servers and check network/console output, not just trust `pytest`/`vitest` exit codes.
5. **Explicit ownership of git.** Instructions on who runs `git commit` — the human or the assistant — changed across the session; every prompt that mattered was explicit about it rather than left ambiguous, because this is exactly the kind of action (shared, hard-to-reverse) that shouldn't be inferred.
6. **Ask, don't guess, at genuine forks.** When a feature had no spec at all (e.g., what should "Admin Settings" contain?), the instruction was to ask a clarifying question with concrete options rather than pick one and build 300 lines against a guess.

---

## Phase 1 — Project Bootstrap *(reconstructed from commit history)*

**Commits:** `Initial commit`, `nitial project structure`

The initial prompt scaffolded the project shape mandated by the kata: FastAPI backend with SQLAlchemy models, a Postgres connection (via Docker, not SQLite/in-memory, per the kata's explicit requirement), JWT auth scaffolding, and a Vite + React + Tailwind frontend shell. This established the layered backend architecture (routers → services → repositories) that every later feature was told to follow.

## Phase 2 — Vehicle Inventory & Purchases *(reconstructed)*

**Representative commits:** `test: add purchase history tests` → `feat: add purchase model` → `feat: implement purchase repository` → `feat: implement purchase service` → `feat: add purchase history API` → `refactor: connect purchase endpoint to purchase service`

Built out the core kata requirement: vehicle CRUD (`POST/GET/PUT/DELETE /api/vehicles`, `GET /api/vehicles/search`), the purchase endpoint that decrements stock, and the admin-only restock endpoint. The commit sequence itself is the evidence of the TDD discipline requested — a failing test lands, then the minimum implementation, then a connecting refactor, as three separate commits rather than one.

## Phase 3 — Dashboard Analytics, first pass *(reconstructed)*

**Representative commits:** `test: add dashboard analytics tests` → `feat: implement dashboard repository` → `feat: implement dashboard analytics endpoints` → several `fix:`/`test: restore green test suite` commits

This phase hit a real regression — the commit history shows a `fix: restore purchase history serialization` and `test: restore green test suite` pair, meaning a change broke previously-passing tests and the assistant was directed to get back to green before adding anything new, rather than building on top of a red suite.

## Phase 4 — Frontend: Dashboard, Registration, Navbar, Vehicle Detail *(reconstructed)*

A long run of paired `test:`/`feat:` commits built the customer-facing frontend: registration form (initially with address/city/state/postal fields, later explicitly simplified — see `feat(frontend): remove address, city, state, country, and postal code fields from registration form`, a case of a prompt actively **reducing** scope after review, not just adding), a responsive navbar with a hamburger menu and profile dropdown, vehicle images and a detail page, sorting/pagination on the showroom, and a portal-rendered `Modal` component.

**One verbatim-preserved detail from this phase (from the compaction summary):** the `Modal` component was rebuilt to render via `createPortal(..., document.body)` specifically because a CSS "containing block" bug caused a modal to visually escape its intended position whenever an ancestor element had an active `transform` (a `hover:-translate-y-0.5` on the vehicle card). This was diagnosed by live-testing in a real browser — the mocked component tests couldn't have caught it, because JSDOM doesn't lay out CSS transforms.

## Phase 5 — Currency Switch to INR *(reconstructed)*

**Commits:** `test: switch currency formatting to INR and add luxury/pickup categories`, `test(frontend): expect INR currency formatting for realistic demo pricing`

An explicit instruction changed all pricing display from USD to INR (`₹`, `en-IN` locale, lakh/crore grouping) for a more realistic demo dataset, cascading through every price-displaying component and its tests.

## Phase 6 — Customer Management (Admin) *(reconstructed)*

**Commits:** `test: add failing tests for admin customer management` → `feat: add admin customer management with search, pagination, and profile modal` → `refactor(frontend): extract shared useAsyncList hook, deduplicating load/loading/error state in admin list pages`

The refactor step here is a good example of rule 3 above in practice: the extraction only happened once the loading/error/list-fetch pattern was duplicated across two admin pages (inventory and customers), not preemptively on the first page.

---

## Phase 7 — Purchase Management (Admin Orders) *(verbatim, reconstructed from the compaction summary of the original prompt)*

This is the most detailed feature prompt of the session, and the structure is worth preserving closely. Paraphrased at full fidelity from the pre-compaction record:

> Create a complete admin order management module at route `/admin/purchases`, wired into the existing `AdminLayout` navigation. Reuse the existing Purchase model, Purchase APIs, Invoice component, and PurchaseModal logic wherever possible — never duplicate existing functionality. Follow strict TDD: RED → GREEN → REFACTOR, each with a commit.
>
> Order table columns: Invoice Number, Order ID, Customer, Customer Email, Vehicle, Purchase Date, Payment Method, Quantity, GST, Total, Status. Support search by invoice/customer/email/vehicle; filter by payment method, order status, and date range; sort by newest/oldest/highest/lowest amount; reuse the existing pagination component.
>
> Order Details Modal must reuse the existing Invoice component (not rebuild it), including the Print button. Status is demo-only (Completed/Pending/Cancelled, badge colors, no real payment gateway). Reuse shared loading/error/empty state patterns. Must be responsive: desktop table, tablet responsive, mobile cards.
>
> REFACTOR step: look for duplicated filtering, sorting, pagination, or modal logic — extract only if genuine duplication exists, do not over-engineer.
>
> Report using this exact format: Feature completed / Files changed / Tests passed / Suggested RED commit / Suggested GREEN commit / Suggested REFACTOR commit / Next feature — then continue automatically into the next roadmap item (Admin Settings → Dashboard Analytics Improvements → Final UI/UX Polish) without asking for permission between features.

**Why this prompt is structured this way:** the reuse constraints are named per-component (not "avoid duplication" in the abstract) because a vague instruction lets the model rationalize a rebuild as "cleaner." The exact table columns and filter set remove any need for the model to invent scope. The mandated report format makes the output auditable at a glance across many features without re-reading a diff each time. The "continue automatically" clause was a deliberate throughput choice — for a long autonomous run, stopping to ask permission after every feature multiplies wall-clock time for no safety benefit once the spec is this explicit.

**Result:** revealed and closed a real gap — `payment_method` and `status` didn't exist on the `Purchase` model at all. Rather than let the model guess how to retrofit history, the follow-up conversation made two explicit product decisions: keep `total_price` pre-GST in storage (GST is computed for display only, to avoid touching historical revenue figures already relied on by the dashboard), and default un-set payment methods to `"unknown"` for pre-existing rows. Delivered as three commits: `test: add failing specs for Purchase Management (admin orders)` → `feat: implement Purchase Management (admin orders)` → `refactor: extract shared usePagination hook` (the third genuine duplication of the same pagination-state pattern, now across three admin pages, finally justified extraction).

## Phase 8 — Admin Settings *(verbatim)*

The roadmap named "Admin Settings" as the next feature with no further spec — unlike every prior feature, there was no column list, no field list, nothing to build against. Rather than invent scope, the follow-up was a direct clarifying question with four concrete, mutually-exclusive options:

> What should the Admin Settings page (`/admin/settings`) contain? — Dealership profile / Admin account & security / App preferences / Notification preferences

**User's answer:** *Admin account & security.*

Once scoped, inspecting the existing `Profile.jsx` page showed it already implemented exactly that (profile edit + change password). Building a second, near-identical page would have violated the standing "never duplicate" rule from Phase 7, so the resolution was to wire `/admin/settings` to reuse the same `Profile` component rather than write new code — still done as a full RED (routing test asserting the settings URL renders the profile heading) → GREEN (one line: point the route at the existing component) cycle, because "trivial" wiring is still a behavior change worth a regression test.

**Follow-up (verbatim):**

> `http://localhost:5173/admin/profile` and `http://localhost:5173/admin/settings` both are same so remove any one

This caught a UX smell the prompt-writer noticed by actually clicking through the app, not just reading the diff: two sidebar nav items pointing at identical content. Resolved by removing the now-redundant `/admin/profile` entry and route, keeping `/admin/settings` as the single entry point since that was the name given in the original roadmap.

## Phase 9 — Dashboard Analytics Improvements *(in progress at time of writing)*

Given no further detailed spec, scope was derived from what the codebase actually needed rather than invented: (1) a real bug, where the dashboard used a local `en-US` currency formatter instead of the shared `formatMoney` (`en-IN`) utility every other screen had already standardized on; and (2) two new breakdowns — orders by status, orders by payment method — directly enabled by the `status`/`payment_method` columns added in Phase 7 and otherwise sitting unused. This is a deliberate contrast with Phase 8: when the codebase itself points at the next logical increment, build it; when it doesn't, ask.

## Phase 10 — Housekeeping Under Time Pressure *(verbatim)*

> after this final check all the file and folder, if the file and folder is not commit then commit it, and check all file if not use in project then delete and if code is optimize then optimize. you have only 30 minutes

Followed by, mid-task:

> screenshots folder is important
> in screenshot also add user side photo, register.png and purchase.png payment etc, add all the png photo to show the project good
> in custmer side this type of photo [reference screenshot of a clean vehicle grid] not include reset delet option

This last one caught a real mistake: the first round of "customer-side" screenshots was captured while logged in as an **admin** account, so the vehicle grid showed Restock/Delete controls a real customer would never see. The fix was to register a genuine `customer`-role account and recapture, rather than crop or explain away the admin chrome — a screenshot in a README claiming to show the customer experience should actually show the customer experience.

Under the stated time constraint, the response prioritized ruthlessly: finish the in-flight feature to a safe, tested checkpoint → commit everything legitimately outstanding (a large batch of core app files — `main.jsx`, `index.css`, shared hooks/components — turned out to have been sitting uncommitted for most of the project's history) → restore a missing root `.gitignore` that explained why IDE/coverage artifacts were about to leak into the repo → delete one genuinely orphaned file (`AdminHome.jsx`, superseded and referenced nowhere) → capture and correct screenshots → write this documentation. Full-repo "optimize everything" was explicitly *not* attempted in the remaining time — a shallow pass across a whole codebase produces churn, not value, and the prompt's own priority signal ("give your best" on this file) pointed at documentation quality over speculative refactors.

## Phase 11 — The Kata Brief Itself *(verbatim, provided mid-session)*

The full original kata specification — tech stack constraints, required endpoints, TDD/commit/AI-transparency policy, and deliverables list — was provided partway through the build, after most of the feature work above was already underway. It confirmed retroactively that the architecture already in place (FastAPI + Postgres + JWT + React/Tailwind, RESTful endpoints matching the exact paths specified, admin-gated destructive/restock actions) satisfied the brief, and directly drove this documentation pass: updating `README.md` with the mandated sections (setup, screenshots, AI usage, test report) and this file.

---

## Reflection

The single highest-value pattern across this whole build was **treating the AI's default behavior as something to actively steer, not something to trust by default.** Left alone, a capable coding assistant will happily over-build (inventing scope for "Admin Settings" instead of asking), under-verify (trusting a green mocked test suite over an actual browser), and quietly widen the blast radius of a "cleanup" request (sweeping up unrelated pre-existing files into one commit). Every prompt in this log that reads as unusually specific — exact table columns, exact commit message format, "ask, don't guess" — exists because the less specific version of that prompt was tried first, in spirit, across the many earlier features that shaped these conventions, and produced output that had to be walked back.

The second pattern worth naming: **verification is not optional just because tests are green.** More than once in this project, `pytest`/`vitest` passing was necessary but not sufficient — the actual bug (a DB port mismatch, a CSS stacking bug, a migration that silently never ran) only showed up when the assistant was pushed to open a real browser against the real running servers. AI-assisted development doesn't remove the need for that discipline; if anything it raises the stakes, because a model will confidently report success based on the tests it can see, with no innate signal that those tests are mocking away the exact integration surface where the bug lives.
