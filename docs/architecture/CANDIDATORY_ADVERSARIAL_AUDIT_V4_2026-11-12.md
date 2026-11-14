# Candidatory — Independent Adversarial Audit v4 (2026-11-12)

**Status: NOT 10/10; conditional GO for development, NO-GO for full production cutover.**
Scoring is evidence-weighted, not aspirational. Verified sources: v2/v3 specs, miniapp schema/worker/auth, live Worker version 3c35231f with REVIEW_DB routing, read-only D1 table-name comparison. No full penetration test or real Telegram acceptance performed.

Mean provisional score: 6.69/10 (unweighted; not a release score).

| Dimension | Score | Blocking evidence |
|---|---:|---|
| Product vision and boundaries | 9/10 | Clear scope; missing validated market/user research and explicit success hypothesis |
| Candidate lifecycle and exception paths | 8/10 | State list exists; transition matrix, triggers and conflict resolution not executable |
| Onboarding and personalization | 8/10 | MVP journey exists; question logic, abandonment measurement and field schema incomplete |
| Feature completeness and prioritization | 8/10 | Broad feature coverage; dependency graph, exclusion list and release sequencing unproven |
| UX and accessibility | 7/10 | Design intentions documented; no verified live WebView user test or accessibility report |
| Data model and migrations | 5/10 | Live REVIEW_DB differs from DB; column/index parity and restore not proven |
| API and source architecture | 5/10 | Multiple source trees and live preview route; no canonical reproducible build proven |
| Identity, privacy and security | 7/10 | Good controls in spec and isolated auth; live route-by-route enforcement unverified |
| Legal content governance | 6/10 | Versioning proposed; jurisdiction owner, source lifecycle and legal review unassigned |
| AI governance and cost | 7/10 | Consent/quotas specified; live provider limits, audit and failure test missing |
| Teams, finance and subscriptions | 6/10 | Roles/ledger proposed; authorization and payment state-machine E2E missing |
| QA and release readiness | 5/10 | Many regression assets; signed two-user WebView, backup restore and public smoke missing |
| Operations and sustainability | 6/10 | SLOs proposed; incident ownership, alerting and capacity evidence missing |

## Critical defects that must be resolved before any claim of 10/10
A. One canonical build must reproduce current live route/API contracts; production currently serves preview UI via REVIEW_DB.
B. Read-only full D1 schema/indices/FKs diff, migration ledger, verified backup/restore and data reconciliation are required.
C. Explicit state transition table with event, actor, guard, source, effects, rollback, test for every transition.
D. Real two-account Telegram WebView negative authorization tests, media/receipt privacy, admin RBAC and AI quotas.
E. Versioned legal source governance with named reviewer, jurisdiction, effective dates, revalidation and stale-source behavior.
F. Complete journey maps for explorer, candidate, collaborator, admin and withdrawal/closure, with measurable usability tests.
G. Process-to-API-to-entity-to-test traceability and evidence URL for each acceptance criterion.
H. Operational on-call, logging, privacy retention/export/deletion, RPO/RTO and release rollback rehearsal.

## Audit-grade scoring policy
0-3 missing, 4-5 proposed/fragmented, 6-7 implemented or specified with material gaps, 8 well-specified with partial test evidence, 9 verified across major cases, 10 independently evidenced across functional, security, performance, accessibility and recovery tests. No score 10 without reproducible artifacts and real environment evidence.

## Remediation backlog ordered by risk
P0-1 canonical source and route inventory; P0-2 schema diff and backups; P0-3 signed identity and authorization; P0-4 executable lifecycle transition matrix; P0-5 journey traceability matrix; P1-1 accessible MVP vertical slice; P1-2 legal source governance; P1-3 AI/financial safeguards; P1-4 two-account live acceptance; P2 operational readiness and monitoring.

## Evidence register
VERIFIED: repo v2/v3 and miniapp files exist; live main Worker deployment version and REVIEW_DB routing; five feature tables present only in REVIEW_DB by table-name inventory.
PARTIAL: isolated auth implementation and many CI tests; no verified complete live enforcement.
UNVERIFIED: production migration safety, actual user journey usability, legal source ownership, backup restoration, payment correctness and live two-user tests.

## Next implementation gate
Create machine-readable process contracts and traceability manifest, then write tests for invariants and compare schema in read-only mode. Only then implement reversible feature slices. Never fabricate scores or mark untested requirements as passed.