# FocusForge AI — Hackathon Deliverables

This document contains all the required deliverables for the FocusForge AI hackathon submission based on the Master Prompt.

## 1. Product Requirements Document (PRD)
**Product Name:** FocusForge AI
**Positioning:** "Every other productivity app tracks whether you obeyed it. FocusForge tracks whether your life actually moved forward — and fixes the gap when it doesn't."
**Target Audience:** Students (college, competitive exams, self-learners) and professionals.
**Core Insight:** Truth reconciliation over mere gamification. The product compares "Reality State" vs "Planned State" to find the "Reality Gap".
**Key Features:**
- Reality Sync Engine & Forgiveness Window
- Risk Engine for deterministic deadline probability
- Priority Engine for dynamic task ranking
- AI Planner (Recovery Plans & Extension Drafts)
- Execution Layer (Focus Timer)
- Motivation Layer (XP, Streaks, Evolution Hooks)

## 2. System Architecture Diagram (6-Layer Pipeline)
```text
[ Reality Sync Engine ]
       |
       v  (Provides Progress Gap: Expected % - Effective %)
[ Risk Engine ]
       |
       v  (Calculates 0-100 Risk Score using Urgency, Lag Bias, Workload)
[ Priority Engine ]
       |
       v  (Ranks tasks using Risk, AI Importance, Deadline, Effort)
[ AI Planner ]
       |
       v  (Generates Recovery Plan or Extension Draft if Risk > Threshold)
[ Execution Layer ]
       |  ^
       v  | (Focus Sessions update Reality Sync Engine)
[ Motivation Layer ]
          (Awards XP, preserves Streaks via Forgiveness Window)
```

## 3. Database Schema & 8. Firestore Collections Spec
**Collections:** 
- `users/{userId}`
- `tasks/{taskId}`
- `focusSessions/{sessionId}`

```typescript
// Please refer to the initial prompt constraints for the exact TypeScript interface.
// Collections mapping:
// - `users` -> Stores UserProfile (xp, level, streak, historicalLagByCategory, dailyFocusCapacityHours)
// - `tasks` -> Stores Task (id, priorityScore, riskEngine, realityState, plannedState, recoveryPlan)
// - `focusSessions` -> Denormalized to user/task on write.
```

## 4. User Flow (Demo Narrative Sequence)
1. **The Problem:** User observes generic calendar failure.
2. **Reality Sync:** User opens FocusForge, Forgiveness Window prompts them, user logs reality, Gap computed (60% vs 15%).
3. **Risk Engine:** Risk score jumps to 78 (Red Tier). Breakdown shows lag pace.
4. **AI Planner:** Triggers Recovery Plan. One-tap schedule acceptance.
5. **Execution:** User starts Focus Session. Completes session. Inferred Progress jumps to 38%. Risk score drops to 54 (Yellow).
6. **Motivation:** XP Toast triggers. 
7. **Success:** Timeline view resolves from Red -> Green.

## 5. Wireframes (Must-Have Screens)
- **Dashboard:** Hero unit for current Character Evolution, Quick stat widgets (XP/Streak), active Risk/Priority queue module.
- **Task Creation Modal:** Title, Date, Estimate inputs + AI "Importance" suggestion toast.
- **Risk Analysis View:** Overlay/Detail component for a task showing the equation breakdown (Gap, Urgency, Historical lag).
- **AI Recovery Plan Modal:** Glassmorphism overlay showing suggested re-schedule with "Accept" or "Draft Extension" CTAs.
- **Focus Timer (Execution):** Minimal overlay or bottom bar with 25/5 or 90min deep work modes.
- **Forgiveness Window Modal:** Softly styled "Did you complete this?" check on app load.

## 6. AI Agent Workflow Diagram (Layers 3 & 4)
```text
[ Task Creation ] --> [ Gemini Call: Suggest Importance ]
                           |
                     (Task Saved & Tracked)
                           |
                 [ Progress Gap Detected ]
                           |
                    Is Required Effort > Remaining Capacity?
                           |
             -----------------------------
            |                            |
          [ YES ]                      [ NO ]
            v                            v
  [ Gemini: Extension Draft ]   [ Gemini: Recovery Plan ]
     (Draft email to prof)        (Generate new schedule)
            |                            |
            v                            v
      [ User Reviews ]             [ User Accepts ]
```

## 7. Exact Risk Score & Priority Score Logic
**Risk Score (0-100):**
`RiskScore = (0.40 * NormalizedProgressGap) + (0.25 * UrgencyPressure) + (0.20 * HistoricalLagBias) + (0.15 * WorkloadDensity)`
*Where Probability = AvailableRemainingCapacity / RequiredRemainingEffort.*

**Priority Score:**
`PriorityScore = (0.35 * RiskScore) + (0.30 * Importance) + (0.20 * DeadlineProximity) + (0.15 * (1 / EstimatedEffort))`
*(Importance mapped to weights: Critical=1.0, High=0.8, Medium=0.5, Low=0.2)*

## 9. API Route Structure
All Gemini interactions remain secure server-side via Next.js API Routes:
- `POST /api/gemini/suggest-importance`
- `POST /api/gemini/recovery-plan`
- `POST /api/gemini/extension-draft`

## 10. MVP Roadmap
| Tier | Features |
|---|---|
| **Must Have** | Dashboard, Task Creation (AI Importance), Reality Sync, Forgiveness Window, Risk Analysis View, AI Recovery Plan, Focus Timer, Evolution clip trigger. |
| **Nice to Have** | Landing Page, Simple Auth, Extension Draft screen, True Timeline Strip, Light/Dark toggle. |
| **Future Scope** | True OAuth Calendars, Voice Assistant, Boss Battles, Study Room Builder, Full Analytics, Auto-send emails. |

## 11. Hackathon Pitch Deck Structure
- **Slide 1:** Hook ("Every other app tracks if you obeyed it...")
- **Slide 2:** The Problem (The "Reality Gap")
- **Slide 3:** The Solution (Deterministic Risk Engine + AI Recovery)
- **Slide 4:** Live Demo (The 4-minute narrative)
- **Slide 5:** Architecture & 6-Layer Pipeline
- **Slide 6:** Why truth reconciliation over gamification matters.

## 12. Competitive Analysis
| Feature | FocusForge AI | Todoist / Motion | Google Calendar |
|---|---|---|---|
| **Underlying Philosophy** | Truth Reconciliation | Task Completion | Time Blocking |
| **Progress Tracking** | Expected vs. Reality | Boolean (Done/Not Done)| None |
| **Recovery Mechanism**| Automated AI Rescheduling| Manual Rescheduling | Manual Rescheduling |
| **Late Work Handling** | Forgiveness Window | Overdue Penalty / Guilt| Ignored |

## 13. Future Scope Document
Features explicitly omitted from MVP but planned for scaling:
- Deep bidirectional syncing with Google/Outlook calendars.
- AI Voice Assistant for frictionless mobile task entry and updates.
- Co-op Boss Battles / Guild mechanics for team learning.
- Subject-level progression trees.
- Fully automated, AI-negotiated deadline extension via direct API to email services.
