# FocusForge AI - Data Models & Game Logic

## 1. Database Schema (Firestore Target)

### `users`
- `uid` (String)
- `email` (String)
- `displayName` (String)
- `level` (Number)
- `xp` (Number)
- `streak` (Number)
- `streakShields` (Number)
- `characterClass` (String)
- `themePreference` (String - "light" | "dark" | "system")

### `tasks`
- `id` (String)
- `userId` (String)
- `title` (String)
- `subject` (String - optional)
- `dueDate` (Timestamp)
- `progress` (Number 0-100)
- `completed` (Boolean)
- `priorityScore` (Number - computed by AI)
- `riskLevel` (String - computed)

### `bosses`
- `id` (String)
- `userId` (String)
- `name` (String)
- `totalHp` (Number)
- `currentHp` (Number)
- `associatedTaskId` (String - optional)
- `isDefeated` (Boolean)

## 2. XP Engine Logic
- Complete Focus Session: +20 XP
- Complete Normal Task: +10 XP
- Complete Important Task/High Risk Task: +30 XP
- Complete all daily tasks: +100 XP
- Complete Boss (Project deadline hit): +500 XP

## 3. Streak Engine
- The streak is updated at midnight local time.
- A streak only advances if ALL mandatory assigned tasks for the day were finished.
- For every 7 cumulative days of active streaking, +1 Streak Shield is earned.
- A Streak Shield automatically consumed to protect a streak if a mandatory task is missed.

## 4. Prioritization Engine Algo
\`\`\`typescript
function calculateAIPriority(deadline: Date, effort: number, impact: number) {
  // Base weights
  const u = urgencyFunction(deadline);
  const ei = impact / effort; // ROI of time spent
  // Resulting score
  return (u * 0.6) + (ei * 0.4);
}
\`\`\`
