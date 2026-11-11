# Candidate Journey and Process Architecture — 2026-11-12

## Product north star
One existing Telegram mini-app should answer three questions on every visit: Where am I in my candidacy journey? What is my next appropriate action? What evidence shows progress? This is a nonpartisan readiness and campaign operations tool, not an election outcome predictor or automated voter persuasion engine.

## Candidate lifecycle
1. Entry: verify Telegram initData; explain privacy, consent, free vs paid features; choose explore, preparing, registered, campaigning, election completed.
2. Context onboarding: election type (city council, parliament, other), jurisdiction, relevant dates, eligibility uncertainty, experience, available time, team size, budget range, key needs. Make optional fields skippable; avoid collecting unnecessary sensitive data.
3. Diagnostic: short self-assessment across legal awareness, issue research, public speaking, operations, team, financial planning and wellbeing. Explain confidence/limits; do not claim objective electability.
4. Personalized roadmap: phase-aware goals, deadlines, task dependencies, 7-day plan, 30-day milestones, relevant courses, compliance reminders.
5. Learning and practice: laws with source/date, speech rehearsal with opt-in media, debates, public-policy research, issue prioritization, ethics and accessibility.
6. Execution: task/calendar/meeting tracking, team roles, documents, budgets, expenses, publishing calendar for general public information, consented communication.
7. Review loop: daily next action, weekly review, overdue tasks, progress and quality indicators, change plan when election stage or availability changes.
8. Election/post-election: legal deadline checklist, archive, financial reconciliation, lessons learned, public accountability, future civic work.

## Primary user journeys
New exploratory user -> 2-minute onboarding -> quick diagnostic -> starter plan -> first task.
Returning active candidate -> today's priorities -> task detail -> completion evidence -> updated progress.
Candidate with team -> invite with scoped role -> assign task -> approve/reject -> audit trail.
Candidate practicing speech -> choose skill -> record with explicit consent -> feedback -> next practice.
Candidate checking rules -> jurisdiction/date -> verified official sources -> disclaimer and next action.
Candidate reviewing budget -> log expense -> categorize -> compliance warning -> export.
Candidate ending campaign -> archive and retention options -> outcome-neutral retrospective.

## Domain model
CandidateProfile, ElectionContext, JourneyStage, ReadinessAssessment, Goal, Task, TaskEvent, CalendarEvent, LearningModule, LearningProgress, PracticeSession, TeamMembership, Permission, Expense, Document, ContentDraft, Subscription, Entitlement, NotificationPreference, AuditEvent. Every user-owned record has immutable owner identity and explicit workspace authorization. Stage transitions are event-driven, idempotent and reversible with audit history.

## Screens and navigation
Bottom navigation: Today, Roadmap, Work, Learn, Profile. Today is dynamic, with one next-best action and 3 priorities, stage badge, deadlines and alerts. Work contains tasks/calendar/team/expenses. Learn contains assessments, courses, speech practice, verified legal resources. Advanced features appear contextually rather than as dozens of equal cards.

## Decision rules
Eligibility and election deadlines must be verified against dated official sources and jurisdiction; otherwise display 'needs verification'. Recommendations are informational, not legal advice. Never infer political affiliation or sensitive beliefs. Do not create targeted political persuasion, microtargeting or manipulative messaging. AI feedback is optional, labeled, budget-limited, and not used to fabricate credentials, endorsements or results.

## Acceptance criteria
First-time user can reach a useful first task in under 3 minutes without payment. Returning user reaches next action in 2 taps. Each core task has owner, due date, status and audit record. Cross-user data access denied. Every stage transition has explicit criteria and recovery. Empty/error/offline states and Persian RTL mobile 320/375/430 are tested. Analytics focus on task completion and user-reported usefulness, not election success.

## Implementation sequence
J0 Map current live UI/API to journeys and identify dead ends.
J1 Implement candidate context and resumable onboarding; preserve existing accounts.
J2 Build stage-aware Today dashboard and roadmap service.
J3 Unify tasks, calendar, goals and progress with one domain model.
J4 Connect courses, diagnostics and practice to roadmap recommendations.
J5 Add team, budget, content and admin permissions with audit trails.
J6 Add consented AI and safe subscriptions, verify privacy and reliability.

## Release
Use the existing main Worker and preserve live user data. Deliver in reversible feature increments after exact route/schema/authorization checks. Do not confuse a UI preview on the main URL with production database integration. Keep the news Worker separate.