---
title: Bug Triage Recommendations
created: '2026-04-17T00:00:00Z'
modified: '2026-04-17T00:00:00Z'
tags:
  - qa
  - devops
  - triage
  - release
order: 2
---
# Bug Triage Recommendations

DevOps review of `bug-triage.csv` — 2026-04-17. Bugs ranked by trust, reminder, onboarding, and subscription impact. Fix order below is the recommended sequence for the current release cycle.

## Highest-Risk Issues (Trust-Critical)

### 1. RT-4 — Reminder sent 2 hours late  `BLOCKER`
- **Severity:** Critical. Unchanged. This is the single worst bug in the board.
- **Why it leads the list:** Breaks the core product promise. Every late reminder is a user deciding the app cannot be trusted. We have zero delivery telemetry today, so we cannot even measure how often this happens in the wild.
- **DevOps action:**
  - Do not ship P2 (Smarter Timing) until CTO root-cause findings land (due 2026-04-18).
  - Instrument reminder delivery latency and success rate **before** any fix ships, so the fix is measurable. These are Tier 1 metrics per `release-checklist/monitoring-requirements.md`.
  - Server-triggered push is the expected fix direction — plan rollback via feature flag from day one, because this touches the core delivery path.
- **Go/no-go for next release:** RT-4 must either be shipped with monitoring proving >95% on-time delivery, or explicitly excluded from the release notes and kept behind a flag.

### 2. PC-3 — Trial paywall dismiss button clipped  `SHIP THIS SPRINT`
- **Severity:** High. Unchanged.
- **Why it matters to DevOps:** Two compounding risks — trial-to-paid conversion drop and App Store rejection. Reviewers test small devices; a trapped paywall is a guideline violation.
- **DevOps action:**
  - Land in this sprint (Tier 1 plan already includes it).
  - Capture trial-to-paid conversion baseline **before** the fix ships, so we can detect regressions within the first 48h of rollout.
  - Add paywall dismiss tap event to analytics if not already instrumented — we need to prove users can escape.

### 3. SK-2 — Streak resets after timezone change  `FIX BEFORE P3`
- **Severity:** High. Status moved from "Investigating" to "Fix Scoped" — CTO confirmed UTC storage fix.
- **Why it matters:** Retention damage is silent. Users who lose a streak churn without filing a ticket. Compounds over weeks.
- **DevOps action:**
  - SK-6 timezone test suite must ship **with** the fix, not after. DST, date-line, and mid-day transitions are the high-risk edges.
  - Stage rollout: 10% → 50% → 100% with streak-break-rate alerting. A spike post-deploy = regression, roll back.
  - Not a current-sprint blocker, but do not let it slip past P3.

## Medium-Risk

### 4. OB-5 — Imported contact nickname not shown  `SHIP THIS SPRINT`
- **Severity:** Medium. Unchanged.
- **DevOps action:** Ship alongside OB-6 analytics so onboarding step 1 drop-off baseline is clean from day one. Low operational risk; no rollback gymnastics needed.

## Low-Risk

### 5. Reply suggestion card flickers  `BACKLOG`
- **Severity:** Low. Unchanged.
- **DevOps action:** Do not let this displace trust-critical work. Revisit only in P4.

## Recommended Fix Order for Next Release

1. **PC-3** — ship this sprint. Bounded, <1 day, App Store risk.
2. **OB-5** — ship this sprint alongside OB-6 instrumentation.
3. **RT-4** — gate P2 on this. Instrument first, fix second.
4. **SK-2** — ship with SK-6 test suite before P3.
5. **Reply flicker** — backlog, P4 or later.

## Monitoring Gates (must be green before promotion to 100%)

| Bug | Metric | Threshold | Source |
|-----|--------|-----------|--------|
| RT-4 | Reminder delivery latency (p95) | <15 min late | Server logs (once server-push exists) |
| RT-4 | Reminder delivery success rate | >95% | Server logs |
| PC-3 | Trial-to-paid conversion | No drop vs 7-day baseline | Revenue analytics |
| PC-3 | Paywall dismiss event count | Non-zero on small devices | Analytics |
| SK-2 | Streak break rate | No spike vs 7-day baseline | App DB |
| OB-5 | Onboarding step 1 completion | No drop vs baseline | Analytics (OB-6) |

## Rollback Readiness

Every fix above must ship behind a feature flag or be trivially revertible via App Store / Play Store rollback (see `release-checklist/ob2-rollback-runbook.md`). RT-4 and SK-2 are the two bugs where a bad fix can do more damage than the bug itself — they are the highest priority for kill-switch coverage.

```cabinet
SUMMARY: DevOps triage — RT-4 leads; PC-3 & OB-5 ship this sprint; SK-2 gated on test suite before P3.
CONTEXT: Reviewed 5 bugs in qa/bug-triage.csv; added fix order and monitoring gates.
ARTIFACT: qa/triage-recommendations.md
```
