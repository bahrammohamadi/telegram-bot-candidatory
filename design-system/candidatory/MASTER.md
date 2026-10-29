# Candidatory Smart — UI/UX Design System v1
Derived selectively from [UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) (MIT), reviewed 2026-10-29.

> Scope: Persian RTL Telegram Mini App, accessible civic learning, personal professional profile, workspace, quizzes, and progress. This document is a product-specific interpretation, not a copy of the upstream skill.

## Principles
1. **Action first, reading second:** Home leads with one next step (complete profile, continue a quiz, review a saved task). Long educational guidance is progressively disclosed.
2. **Mobile-first RTL:** Layout tested for 320, 375, 390, 430 px, landscape, 200% text scale, and Telegram safe area.
3. **Data over decoration:** No fabricated scores, progress percentages, or AI analysis. Charts must derive from stored and authorized user data.
4. **Privacy by design:** Do not expose personal profile data on shared/public pages; do not collect voter contact information or sensitive political traits in general-profile flows.
5. **Adaptive but calm:** Short transform/opacity transitions, reduced-motion support, no excessive effects.

## Tokens (proposed)
- Primary deep teal: `#075E56`, primary action: `#087E6B`
- Positive: `#117C63`, caution: `#A15C10`, negative: `#B43E43`
- Surface: `#F7FAF8`, card: `#FFFFFF`, text: `#162F2A`, muted text: `#405C53`
- Dark surface: `#10221D`, card: `#1A332B`, text: `#F2F8F5`
- Typography: Vazirmatn, 16px root body, 1.65 line height, minimum 12px supporting text
- Spacing: 4 / 8 / 12 / 16 / 24 / 32px; radius: 12 / 16 / 24px
- Minimum interactive target 48 CSS px on mobile where feasible, 8px gap
- Visible focus ring and accessible input labels; check WCAG 2.2 AA, >=4.5:1 normal text contrast and >=3:1 UI boundary contrast.

## Information architecture
Five primary destinations maximum:
1. **خانه** — next action, profile completeness, upcoming commitments.
2. **یادگیری** — lessons, topic search, saved courses.
3. **آزمون‌ها** — assessments, progress, personal report.
4. **برنامه‌ها** — workspace, goals, tasks, calendar.
5. **پروفایل** — professional record, privacy, subscription, settings.

Deep-link secondary features (AI, design studio, support, knowledge base, legal references) from contextual cards, not overloaded tabs.

## Screen specifications
### Home
- Greet by optional display name; one CTA based on missing critical setup.
- Compact dashboard: profile completion, next course, due tasks; avoid duplicate numbers.
- Bento layout only when content remains readable. Cards have an icon, 1-line title, 2-line maximum summary, meaningful CTA.

### Candidate Profile
- Guided 4-step wizard, autosave per step, progress indicator, review summary.
- Work history, education, skills, management/volunteer experience, objectives, learning interests, availability — optional, individually editable.
- Explicit privacy explanation. No request for national ID, exact location or voters' personal data.
- Form errors beside field, preserve edits after connectivity disruption; no forced giant form.

### Assessments
- One question per view, clear step count, persistent selected answer, Back and Next.
- Final summary with actual score; avoid portraying knowledge quiz as calibrated personality/eligibility diagnosis.
- Question option order can change per test session without altering canonical answer IDs.

### Progress
- Real data only. Show last attempt per exam, completion by category, historical trend if 2+ attempts.
- Use accessible donut + labeled horizontal bars; chart text equivalents are mandatory.
- Empty states with next action; no made-up radar plots.
- Show source and interpretation limitations under any scored visualization.

### Plans / Workspace
- List grouped by actionable state and due date. Sticky filters but preserve space for Telegram chrome.
- Clear ownership, status, date, and quick add; loading/error/empty states.

## Chart selection
- Donut: completion across six quizzes (not competency claim).
- Horizontal bars: scores by six neutral education topics; compare only equivalent items.
- Line: temporal progress for a single quiz when repeated attempts exist.
- Avoid radar comparisons with unvalidated dimensions and avoid unlabeled decorative gauges.

## Motion and feedback
- 140–220ms transitions for short interactions; never animate layout properties in long lists.
- Skeleton for slow loads, explicit offline/error message and retry; preserve form drafts.
- Use `prefers-reduced-motion`; never rely on animation to convey a state.
- Press feedback must not move adjacent controls; HapticFeedback is optional.

## Acceptance checklist
- [ ] 320 / 375 / 430 px, landscape, zoom 200%, light/dark screenshots
- [ ] RTL logical alignment and mixed Persian/Latin text tested
- [ ] No horizontal overflow, clipped card labels, or unreachable bottom controls
- [ ] 44–48 px touch targets, visible keyboard focus, semantic labels
- [ ] Text contrast >=4.5:1; status/graph never color-only
- [ ] Form errors described beside fields, offline/retry, draft persistence
- [ ] Reduced motion, screen reader reading order, no emoji as navigation icons
- [ ] No leakage of another user's candidate profile or workspace data
- [ ] Privacy export/deletion and role access tested against valid Telegram sessions
- [ ] Browser/Telegram WebView E2E tested before release

## Deployment note
The GitHub repo is NOT currently a verified source of truth for the deployed Cloudflare Worker. Do not treat edits to this document or repo miniapp as a production deployment. Establish code sync and CI before merging/releasing UI changes.
