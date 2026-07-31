# ProcureTrack — Handover for Codex / ChatGPT

> **Purpose:** Give another AI (or engineer) enough context to continue work immediately.  
> **Repo root:** `procure-flow-thai-main/`  
> **Branch (as of handover):** `checkpoint/step-6-verified`  
> **HEAD reference:** `f80f73a` — `feat(step9-10): financial milestones, flexible dates, and dual-date baseline/actual`  
> **Companion docs:** `project-rules.md` (architecture rules + audit), `supabase/migrations/`

---

## 1. Project Overview & Tech Stack

### What ProcureTrack is

**ProcureTrack** is a Thai government procurement companion app (“กระดาษทดพัสดุ”) for **e-GP** workflows — **not** a replacement for the real e-GP system.

- Officers still enter full detail in **e-GP**; this app tracks **milestones**, **compliance gates**, **alerts**, and **executive visibility**.
- Core workflow = **10 steps** (e-bidding / construction-oriented), with a shorter path for some “specific method” procurements (`dynamic-stepper.ts`).
- Concept: store only **keywords that drive calculation and error-catching** (dates, amounts, committees) — see `project-rules.md`.

### Tech stack

| Layer | Choice |
|--------|--------|
| UI | **React 19** + **TypeScript** |
| Routing / SSR | **TanStack Router** + **TanStack Start** (`@tanstack/react-start`) |
| Data fetching | **TanStack Query** |
| Styling | **Tailwind CSS v4** + Radix UI primitives |
| Backend / Auth / DB | **Supabase** (`@supabase/supabase-js`) — Auth, Postgres, Storage, **RLS** |
| Dates (UI) | Buddhist era (พ.ศ.) via `src/lib/thai-date.ts` + `ThaiDatePicker` / `ChronologicalDatePicker` |
| Workday calendar | **`src/lib/workdays.ts`** — Thai holidays, workday counts, Step 3–7 deadline logic |
| PDF / export | jspdf, html2canvas, xlsx, jszip |
| Dev | Vite 7 (`npm run dev` → typically `http://localhost:8080` or next free port) |

### Critical architecture rules (do not regress)

From `project-rules.md`:

1. **Prefer JSON in `procurement_steps.note`** (`__STEP_FORM__:…`) for step form payloads — **do not** casually add new columns on `projects`.
2. **Stepper / timeline highlight** must follow **`activeStep`** (what the user is viewing), not only `project.current_step`.
3. Historical / read-only steps must keep **Next navigation** (navigate only — no save/validation).
4. **GitHub = code only.** Project data lives in **Supabase Cloud**; another machine sees data only after login with the **same org-bound account**.

### Key directories

```
src/
  routes/projects_.$projectId.tsx   # Parent: loads steps, owns Step state, save/complete
  components/steps/ProjectStepForms.tsx  # Step 1–10 form UIs (incl. Step10DetailForm)
  lib/step-form.ts                  # Types, normalize, compliance, note serialize/parse
  lib/step10-contract.ts            # Step 10 penalty, amendments, warranty
  lib/step10-guideline.ts           # Rates / constants for Step 10
  lib/step7-lg-expiry.ts            # LG min expiry, duration, warranty years (Step 7)
  lib/workdays.ts                   # Calendar / workday engine
  lib/chronological-date-*.ts       # Global date chain + validator
  lib/organization-projects.ts      # Org-scoped project list (auth + RLS)
supabase/migrations/                # Schema evolution
```

---

## 2. Current Implementation Progress (Step 1 – 10)

Status is **implementation-oriented** (code exists and gates run). “Verified” checkpoints exist as git branches `checkpoint/step-N-verified` for earlier steps; current working branch advanced through Step 9–10 features.

| Step | Focus | Done (in code) | Known gaps / pending |
|------|--------|----------------|----------------------|
| **1** | Plan / project basics, budget, e-GP id, result unit | Smart checklist, create-project modal, compliance, low-budget → specific method lock | No UI for `procurement_path` (self/external); BOQ only in guideline text |
| **2** | Committees + median price | Dual committees, appointment chrono, median approval date vs appointment, docs | — |
| **3** | TOR / publication / hearing | Publication windows, workday rules, hearing skip path | Skipping hearing **empties** compliance → can advance without hearing docs (by design/pain) |
| **4** | Bid result / winner / committees | Winner + amounts, inspection committee stored, timeline from Step 3 | Split pre/post-bid historically; keep amount sources consistent for later steps |
| **5** | Winner announcement + standstill | Announcement ≥ approval+1 workday, result notification date, docs | — |
| **6** | Appeal | Status routing, CGD path, **pending blocks** Steps 7–10 | — |
| **7** | Invite to sign + performance bond / LG | Notice outcome, bond 5% validation, `contract_duration_days`, LG min expiry auto-fill, Thai dates | Acceptance often needs manual screen proof; legacy duration migrate softened (no silent legacy fill) |
| **8** | Contract signing + guarantee | Signed date gates, guarantee amount vs min | Sync from Step 7 bond where mapped |
| **9** | Contract schedule / e-GP essential publication | Duration hydrate from Step 7, installment schedule, financial milestones, e-GP ≤15 calendar days | Dual baseline/actual date work recent (`f80f73a`) |
| **10** | Contract administration | Installments accordion, amendments + PDF, dual dates, penalty, warranty phase, committee display from Step 4 | See §3 & §5 |

**Workflow variants:** e-bidding-style 10 steps vs shorter **specific-method** path — `src/lib/dynamic-stepper.ts`, `project-workflow-core.ts`.

---

## 3. Step 10 Detail & Recent Fixes

### Entry points

- UI: `Step10DetailForm` in `src/components/steps/ProjectStepForms.tsx`
- Domain logic: `src/lib/step10-contract.ts`, `src/lib/step10-guideline.ts`
- Parent wiring / save: `src/routes/projects_.$projectId.tsx`
- Types / note I/O: `Step10InspectionRow`, `Step10FormData`, `loadStep10FormFromNote` in `src/lib/step-form.ts`
- Recent commits: `0525435` (amendments + compliance), `f80f73a` (financial milestones + dual-date baseline/actual)

### Features

#### A) Contract amendment history (ขยายเวลา + PDF)

- Type `Step10ContractAmendment`: `{ id, amendment_date, description, extended_contract_end_date?, approval_document_type? }`
- Effective contract end = latest amendment with `extended_contract_end_date`, else Step 9 base end (`resolveEffectiveContractEndDate`)
- Each amendment requires approval PDF; `document_type` pattern  
  `เอกสารอนุมัติแก้ไขสัญญา / บันทึกข้อความขยายเวลา (ครั้งที่ N) [amendment-id]`
- Signing/amendment date bounds: helpers `step10AmendmentMinSigningDate`, `step10AmendmentMaxSigningDate`, etc.
- Applying an amendment (`applyStep10ContractAmendment` in parent) appends to log and can recompute installment planned (adjusted) dates

#### B) Dual dates: baseline vs adjusted vs actuals

Per installment (`Step10InspectionRow`):

| Field | Role |
|--------|------|
| `baseline_planned_completion_date` | Contract baseline from Step 7/9 — **read-only** |
| `planned_completion_date` | **Adjusted** due date — drives lateness / penalty; editable only when linked to an amendment (`adjusted_date_amendment_id`) |
| `delivery_date` | Actual delivery (ส่งมอบจริง) |
| `inspection_date` | Actual inspection (ตรวจรับจริง) |
| `supervisor_report_date` | Construction supervisor report (if construction type) |

Chronological rules (also in `chronological-date-validator.ts`):  
delivery ≥ contract start; inspection ≥ delivery; inspection ≥ supervisor report (when used).

#### C) Daily penalty (calendar days — รวมวันหยุด)

`computeStep10InstallmentPenalty` in `step10-contract.ts`:

- Late iff `actualDeliveryISO > plannedISO`
- `daysLate` = **calendar** days between planned and actual (`countCalendarDaysBetweenISO`) — **not** workdays
- Base amount (`getStep10PenaltyBaseAmount`):
  - **construction:** full contract amount
  - **general:** contract amount ÷ installment count
- Penalty ≈ `base × (rate%/100) × daysLate`
- Construction: clamp rate to min/max; enforce **minimum baht/day** (`STEP10_CONSTRUCTION_MIN_PENALTY_PER_DAY_BAHT`)
- Live / cumulative helpers: `computeStep10InstallmentPenaltyLive`, `computeStep10TotalAccumulatedPenalty`

#### D) Inspection committee inherited from Step 4

- Parent: `step10InspectionCommitteeDisplay = resolveStep4InspectionCommitteeDisplay(mergedStep4BidResult, step2Committees)`
- Passed into `Step10DetailForm` as **display** (not a separate Step 10 committee editor)

#### E) Defect liability / warranty phase (≥ 2 years)

- Regulation framing: defect warranty **≥ 2 years** (`STEP10_DEFECT_WARRANTY_YEARS_MIN`)
- Years may inherit from Step 7 (`defect_warranty_years` / `resolveStep7DefectWarrantyYears`) and be edited on Step 10
- On successful close of Step 10: project `status → warranty`; set  
  `projects.warranty_started_at` (last installment inspection) and  
  `projects.warranty_end_date` (+ N calendar years)
- Warranty security: retention % and/or bank guarantee; BG expiry must cover warranty end (`isStep10BgExpiryShortOfWarranty`)
- Migration: `supabase/migrations/20260613120000_project_warranty_phase.sql`

#### F) Docs & payment gates

- Per-installment required docs (delivery letter, inspection report, site photos, invoice, supervisor report for construction) via `STEP10_INSTALLMENT_DOC`
- Payment status advances gated by docs + supervisor verification (`canAdvanceStep10PaymentStatus`)
- Archive / close project: all installments inspection-passed + docs (`canArchiveStep10Project` / compliance in `getStep10ComplianceIssues`)

---

## 4. Database & State Management Pipeline

### Schema (Step 10–relevant)

**Tables (conceptual):**

| Table | Role |
|--------|------|
| `organizations` | Tenant |
| `profiles` | `id` = auth user; **`organization_id`** FK — required to see projects |
| `projects` | Project header: budget, method, `current_step`, `status`, org FK; Step 10 columns `warranty_started_at`, `warranty_end_date` (+ other dashboard columns from earlier migrations) |
| `procurement_steps` | One row per step (1–10): `status`, `note`, checklist columns, responsible text |
| `project_documents` (or equivalent docs table used by upload helpers) | Uploaded files keyed by project + step + `document_type` |
| `committees` / related | Step 2 (+ Step 4 members embedded in Step 4 note JSON) |
| Storage buckets | e.g. construction photos / step docs (see storage policies in migrations) |

**Foreign keys (pattern):**  
`projects.organization_id → organizations`; `procurement_steps.project_id → projects`; documents → project (and step).

**RLS:**  
Org isolation — authenticated users only see rows for their `profiles.organization_id` (example policy style in `20260625120000_bidders_grants_and_rls.sql`). **No login / wrong org ⇒ empty project lists** (not a “machine-local data” issue).

**Where Step 10 form lives:**  
Almost all Step 10 structured data is in **`procurement_steps.note`** for `step_number = 10`, as JSON after marker `__STEP_FORM__:`:

```json
{
  "project_type": "construction" | "general",
  "inspectionRows": [ /* Step10InspectionRow[] */ ],
  "contractAmendments": [ /* Step10ContractAmendment[] */ ],
  "defect_warranty_years": 2,
  "warrantySecurity": { ... },
  "checklist": { ... }
}
```

**Projects table (Step 10):** only summary fields like warranty dates / `status=warranty` — not the full milestone array.

### State pipeline (Parent ↔ Child)

```
projects_.$projectId.tsx  (Parent)
  │  useState: step10InspectionRows, step10ContractAmendments,
  │            step10ProjectType, step10DefectWarrantyYears, step10WarrantySecurity
  │  useMemo: planned/baseline dates, effective end, committee display, contract amount
  │  load: loadStep10FormFromNote(current.note) when entering step 10
  │  save: serialize Step10FormData into step note + optional project warranty columns
  │
  └──► Step10DetailForm  (Child — controlled)
         props: inspectionRows / onInspectionRowsChange
                contractAmendments / onContractAmendmentsChange
                onApplyContractAmendment
                installmentPlannedDates / installmentBaselineDates
                docBinder (uploads), warranty props, readOnly, …
         local UI: accordion open installment, amendment draft drawer/form, penalty live display
```

- **Milestone array** = `inspectionRows` (length from Step 9 `total_installment_count`)
- **Amendment log** = `contractAmendments` (+ PDF rows in docs by `document_type`)
- **Drawer / accordion** = local UI state inside `Step10DetailForm`; persistence only via parent callbacks → save draft / complete step

---

## 5. Known Issues & Technical Debt

1. **`procurement_path=external`** — bypass Steps 1–7 exists in workflow code; **no create-project UI** to choose it (`project-rules.md`).
2. **Step 3 skip hearing** — compliance returns empty → can advance without hearing package.
3. **Data vs code confusion** — GitHub push does not sync project records; multi-device demos need **same Supabase account + org**. Empty dashboard after login usually means wrong user/org, not missing git data. Dashboard now surfaces logged-in email when project list is empty (`organization-projects.ts` / `dashboard.tsx`).
4. **LAN / present demos** — `localhost` is machine-local; office IP (`http://<LAN-IP>:8081`) needs same network + Windows Firewall; public tunnels may fail without admin/network allow.
5. **Step 7 LG UX** — min-date vs chronological lock / stale expiry previously blocked calendar clicks; auto-fill sync via `syncStep7LgExpiryWithMin` — retest when changing duration/signed date.
6. **Schema drift** — some features use insert/select fallbacks when columns missing; prefer applying migrations under `supabase/migrations/` + `scripts/apply-*.mjs` rather than adding more fallbacks.
7. **Large files** — `ProjectStepForms.tsx` and `step-form.ts` are very large; prefer extracting Step modules when touching heavily.
8. **Console seed logs** — various `console.log` debug banners remain in step forms; clean up when polishing.
9. **Chronological validation** — global chain + Step 10 installment field keys; avoid re-merging previous-step milestone min onto LG expiry (Step 7 already special-cased).
10. **Acceptance / QA** — Step 7 has `scripts/verify-step7-acceptance.mjs` (logic only); Step 10 lacks an equivalent automated acceptance script.

### Suggested next work for Codex

- Confirm Step 9→10 baseline/adjusted date edge cases after amendments  
- Add Step 10 acceptance script (penalty calendar days, warranty ≥2y, amendment PDF gate)  
- Wire `procurement_path` UI if product still wants central-procurement bypass  
- Reduce `ProjectStepForms.tsx` size by extracting `Step10DetailForm` to its own file  

### Commands

```bash
npm install
npm run dev          # local UI
npm run build        # typecheck + production build
node scripts/verify-step7-acceptance.mjs   # Step 7 logic checks
```

Copy `.env` with `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` (or publishable key) — **never commit secrets**.

---

*Generated for AI handoff. Prefer this file + `project-rules.md` + migrations over guessing schema or inventing new `projects` columns.*
