# PROMPTS.md — AI-Assisted Development Log

This document explains how AI tooling was used during the development of this project, and — just as importantly — how it wasn't. It's written to be read alongside the Git history, not instead of it: commit messages and diffs are the record of what changed; this file is the record of how the work was actually done.

**Tools used:** Claude Code (Anthropic), used interactively as a coding agent with file editing, shell execution, and browser-based verification capability, run against a locally hosted development environment and, for deployment work, against a separately administered Ubuntu server.

---

## AI-Assisted Development

This project was built through AI-assisted engineering, not AI-generated engineering. The distinction matters and is worth being specific about.

Within the local development session, the AI agent had the ability to directly edit files, run test suites, execute shell commands, and create Git commits. For a large share of the implementation work — writing test cases, implementing features to pass them, running `pytest`/`vitest`, and committing the result — those actions were literally carried out by the agent, inside that session, in response to direction from the developer. That direction was not "build a car dealership app" in the abstract; it was specific, feature-by-feature requirements (exact table columns, exact filter behavior, exact status values, explicit instructions to reuse existing components rather than duplicate them, explicit TDD process requirements), with the developer reviewing what came out of each step before moving to the next.

Deployment is where the division of labor becomes very concrete rather than a matter of framing: the AI agent has no access to the production/demo Ubuntu server used to run this project publicly. Every command run there — installing dependencies, running Alembic migrations, configuring systemd services, restarting processes, checking firewall rules, reading logs — was executed by the developer, in their own terminal, based on guidance and diagnosis provided in conversation. When something didn't work (a CORS error, a systemd unit not persisting across reboots, a migration failing with "multiple head revisions"), the developer reported the *actual* output back — real error text, real command output — which is what made it possible to diagnose the real cause rather than a guessed one.

So, concretely:

- **Requirements, priorities, and product decisions** were the developer's, throughout — what each feature should do, which of two duplicate UI routes to keep, how GST should be calculated versus stored, what to do when a feature had no spec at all.
- **Implementation, test-writing, and local verification** were substantially AI-executed, under direct developer instruction and with developer review of the result at each step.
- **Deployment, server administration, and real-environment validation** were entirely developer-executed, using AI-provided guidance and diagnosis.
- **Every decision to accept, reject, or redirect** — including this document's own content — was the developer's.

AI accelerated the mechanical parts of the work. It did not replace the judgment calls, and it did not have the final say on anything that shipped.

---

## Engineering Workflow

Features generally moved through the same sequence:

1. **Define the feature.** The developer specified what was needed — sometimes in detail (exact columns, filters, states for a feature like order management), sometimes as a named next step with no detail at all (e.g., "Admin Settings" with no spec), which forced a decision about whether to guess or ask.
2. **Analyze existing code.** Before writing anything new, check what already existed — is there a component, hook, or endpoint this should reuse rather than duplicate?
3. **Ask AI for an implementation approach**, including, where scope was genuinely unclear, asking the AI to pose the ambiguity back as a concrete question rather than guess.
4. **Review the generated code and tests.** Not a rubber stamp — this is where mismatches between what was asked for and what was produced got caught (see Manual Engineering Work below for specific examples).
5. **Modify or reject when necessary.** Some AI output was accepted as-is; some required correction; a couple of pieces of prior work (a hardcoded currency formatter, a duplicate admin route) were flagged for cleanup specifically because they'd drifted from the rest of the codebase's conventions.
6. **Run the application and validate behavior**, including — critically — in a real browser against a real running server, not just via a mocked test suite, since several real bugs in this project (a CSS stacking bug, a database schema drift issue, an enum value mismatch) were only ever visible that way.
7. **Fix issues found during validation.** Multiple features went through a second round of fixes after initial "green tests" turned out not to catch a real-world failure mode.
8. **Commit only after verification** — tests passing and, where applicable, manual/browser verification succeeding, not on trust that generated code was correct.

The RED → GREEN → REFACTOR discipline the kata calls for maps onto steps 3–6 above: a failing test before implementation, the minimum implementation to pass it, and a refactor step applied only when the same pattern had genuinely repeated across the codebase — not on every feature reflexively.

---

## Prompt History

The prompts below are grouped by area of the system. Early-phase entries (project bootstrap through customer management) are summarized from Git history and a development log generated partway through the project, since the literal prompt text from that period wasn't preserved verbatim. Later entries, from Purchase Management onward, are reproduced from the actual conversation.

### Project Analysis & Bootstrap

Initial direction covered the required stack (FastAPI + PostgreSQL + JWT on the backend, React + Vite + Tailwind on the frontend — matching the kata's constraints, not an AI-chosen stack), the layered router/service/repository backend structure, and the initial data models. Follow-up prompts across this phase asked for tests to precede each new piece of vehicle/purchase functionality, in line with the kata's TDD requirement.

### Authentication & Registration

Prompts here covered JWT-based register/login, then iterated on the registration form more than once — an initial version collected address/city/state/postal fields that were later explicitly removed after review, an example of a generated feature being scaled back rather than accepted wholesale.

### Purchase History & Inventory

> Reuse the existing Purchase model, Purchase APIs, Invoice component, and PurchaseModal logic wherever possible. Never duplicate existing functionality. Follow strict TDD: RED → GREEN → REFACTOR, each with a commit.

This "never duplicate" instruction recurs throughout the project and is a direct response to a known AI failure mode: left unconstrained, a coding agent will often rebuild something that already exists rather than take the time to find and reuse it.

### Dashboard Analytics

Initial analytics endpoints (summary, recent purchases, top-selling, low-stock, sales-by-category, monthly-sales) were specified and implemented in a first pass; a regression was caught by review (tests that had been passing broke), and the explicit follow-up was to restore a fully green suite before adding anything further rather than build on top of known-broken tests. Two additional endpoints (orders by status, orders by payment method) were added later, once the underlying `status`/`payment_method` fields existed and were sitting unused — a case of the codebase itself indicating the next reasonable increment, verified with the developer rather than assumed.

### Admin Dashboard UI / Order Management

> Create a complete admin order management module at route `/admin/purchases`... Order table columns: Invoice Number, Order ID, Customer, Customer Email, Vehicle, Purchase Date, Payment Method, Quantity, GST, Total, Status. Support search by invoice/customer/email/vehicle; filter by payment method, order status, and date range; sort by newest/oldest/highest/lowest amount... Order Details Modal must reuse the existing Invoice component... REFACTOR step: look for duplicated filtering, sorting, pagination, or modal logic — extract only if genuine duplication exists, do not over-engineer.

This level of specification (exact columns, exact filters, an explicit instruction not to over-engineer the refactor step) was deliberate — it left little room for the implementation to drift from what was actually needed.

### Ambiguous Scope

> What should the Admin Settings page (`/admin/settings`) contain?

When a feature was named on the roadmap with no further detail, the response was to request options rather than accept a guessed implementation — four candidate scopes were proposed (dealership profile, account & security, app preferences, notifications), and "admin account & security" was selected. That review step mattered concretely: it revealed the existing Profile page already covered that scope, so the correct move was reusing it, not building a new page.

### Debugging (Real-Environment)

Several of the most substantive prompts in this project were diagnostic, not generative, and came directly from output captured while running the application:

> `http://localhost:5173/admin/profile` and `http://localhost:5173/admin/settings` both are same so remove any one

> in api call it gives cors error

> [pasted SQLAlchemy traceback] `sqlalchemy.exc.DataError: (psycopg2.errors.InvalidTextRepresentation) invalid input value for enum userrole: "CUSTOMER"` ... check this issue

> [pasted Alembic output] `ERROR [alembic.util.messaging] Multiple head revisions are present...` getting this in alembic head

Each of these came from actually running the application — locally in a browser, or on the deployed server — and reporting what genuinely happened, not from a hypothetical description of a bug. That's what made root-causing them possible: the enum error, for instance, turned out to be a mismatch between how the database migration defined an enum type and how the ORM serialized it by default, masked locally by an earlier, unrelated inconsistency between the database's actual schema and the migration history. That diagnosis required reading the actual migration files and actual enum values, not just re-describing the symptom.

### Testing

Prompts throughout required a failing test before an implementation, and, separately, real-environment verification after: running the full `pytest`/`vitest` suites, and where the feature touched the UI, driving it with a real browser against the real running dev servers to check the console and network tab, not just trusting a green exit code from a mocked test suite.

### Refactoring

Refactor requests were scoped narrowly and only acted on when duplication was real: a shared `useAsyncList` hook was extracted only once its pattern had independently appeared on a second admin page, and a shared `usePagination` hook only once the same page-state/slice logic had appeared a third time. Both were explicit "look for genuine duplication, don't over-engineer" instructions, not open-ended refactor requests.

### Code Review / Housekeeping

> after this final check all the file and folder, if the file and folder is not commit then commit it, and check all file if not use in project then delete and if code is optimize then optimize

> in custmer side this type of photo [reference screenshot] not include reset delet option

The second of these caught a real mistake in progress — an earlier round of documentation screenshots had been captured while logged in as an admin account, so a customer-facing screenshot incorrectly showed admin-only controls. It was caught by comparing the actual screenshot against what the real customer experience should look like, and fixed by recapturing with a genuine customer account rather than editing the image.

### Interview Readiness / Transparency

This file exists because the project's own requirements call for it, and went through two full revisions during development — an initial version overstated the AI's autonomous role in the process, and a second draft was rejected for overstating manual involvement in specific actions (test runs, commits, pushes) that were, in fact, executed by the AI agent within the local session. This document is the corrected version, written to hold up under direct questioning rather than to read impressively at a glance.

---

## Manual Engineering Work

The following was performed or directed by the developer, not generated by AI:

- **Defining requirements** for every feature, including the exact scope of ambiguous items like Admin Settings, and the product-level decisions behind them (e.g., keeping GST calculated at display time rather than stored, to avoid touching historical revenue figures already relied on elsewhere).
- **Making architecture decisions** at points where the codebase could reasonably have gone more than one way — e.g., choosing to route a settings page at an existing component rather than accept a newly generated duplicate page.
- **Reviewing every implementation** before it was considered done, including reading through generated diffs and catching cases where behavior didn't match intent.
- **Requesting changes and rejections** — trimming an over-scoped registration form, requiring a restored root `.gitignore` after noticing IDE artifacts were about to be committed, insisting on a genuine customer account for customer-facing screenshots instead of an admin account's view.
- **Validating features by actually using them** — logging into the real application, clicking through real flows, and reporting real, copy-pasted error output (browser console errors, server tracebacks, `curl`/`systemctl`/`alembic` command output) rather than descriptions of expected behavior.
- **Deploying and administering the live server** — installing dependencies, configuring environment variables, writing and enabling systemd services, managing firewall rules, and restarting services after each fix, entirely in an environment the AI tooling had no direct access to.
- **Diagnosing real-world failures firsthand** — noticing that a registration attempt failed, that a CORS error appeared in the browser, that a migration command failed with a specific Alembic error, and bringing the actual output back for investigation rather than a vague symptom description.
- **Ensuring backend/frontend integration actually worked** — confirming API contracts (like lowercase role values) held end-to-end between what the database stored, what the API returned, and what the frontend expected.
- **Organizing and understanding Git history** — reviewing the commit log for structure and correctness, catching a case where a code change had already landed inside a broader commit than intended, and confirming each RED/GREEN/REFACTOR sequence actually reflected what it claimed to.
- **Understanding every accepted change** before moving on to the next — including asking follow-up questions where a diagnosis (e.g., "unhandled exceptions bypass CORS headers") needed to be verified, not just taken on faith.

---

## What This Document Is Not Claiming

For completeness, and in the interest of the same honesty this document asks of itself: within the local development session, the AI agent did directly execute a large share of the mechanical work — writing test files, implementing features, running `pytest` and `vitest`, and creating the resulting Git commits — under explicit developer instruction and subject to developer review at each step. This document does not claim those specific actions were manually typed by the developer when they were not. What it does claim is that every one of those actions happened in response to specific direction, was reviewed before being accepted, and that everything involving the live deployment — the part of this project an AI agent cannot reach — was run, debugged, and verified by the developer directly.
