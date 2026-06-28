<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

<div align="center">

<img src="https://readme-typing-svg.demolab.com?font=Inter&size=36&duration=2800&pause=1000&color=1FA463&center=true&vCenter=true&width=700&height=70&lines=FocusForge+AI;Reality+Sync.+Not+Just+Reminders.;An+AI+Companion+That+Knows+When+You're+Lying+to+It." alt="Typing SVG" />

<br/>

<a href="https://focusforge-ai-573123672173.asia-southeast1.run.app">
  <img src="https://img.shields.io/badge/🚀_Live_Demo-1FA463?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Live Demo" />
</a>
<img src="https://img.shields.io/badge/Built_with-Gemini_API-1FA463?style=for-the-badge&logo=google-gemini&logoColor=white" alt="Gemini" />
<img src="https://img.shields.io/badge/Powered_by-Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" />
<img src="https://img.shields.io/badge/Database-Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase" />

<br/><br/>

<img src="https://img.shields.io/badge/status-hackathon%20build-1FA463?style=flat-square" alt="status" />
<img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="license" />
<img src="https://img.shields.io/github/stars/your-username/focusforge-ai?style=flat-square&color=1FA463" alt="stars" />

</div>

<br/>

> **Every other productivity app tracks whether you obeyed it. FocusForge tracks whether your life actually moved forward — and fixes the gap when it doesn't.**

Most apps assume their plan *is* reality. FocusForge doesn't. It reconciles what you said you'd do against what your Focus Timer and your own honesty say actually happened — then calculates real deadline risk from that gap, and proactively tries to fix it before you ever miss a deadline.

<br/>

<div align="center">
<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&size=18&duration=3500&pause=1200&color=6D7A6F&center=true&vCenter=true&width=600&height=30&lines=%22You+said+you'd+be+71%25+done...%22;%22...you're+actually+at+15%25.%22;Reality+Sync+catches+the+gap.+Every+time." alt="Typing SVG" />
</div>

<br/>

## 🧠 The Six-Layer Architecture

```mermaid
graph TD
    A[1. Reality Sync Engine] -->|Progress Gap| B[2. Risk Engine]
    B -->|Risk Score + Probability| C[3. Priority Engine]
    C -->|Ranked Queue| D[4. AI Planner]
    D -->|Recovery Plan| E{Feasible?}
    E -->|Yes| F[Accept Plan]
    E -->|No| G[Extension Draft]
    F --> H[5. Execution Layer]
    H -->|Focus Timer + Confirmations| A
    H --> I[6. Motivation Layer]
    I -->|XP / Streaks / Evolution| H

    style A fill:#0E0F11,stroke:#1FA463,color:#fff
    style B fill:#0E0F11,stroke:#1FA463,color:#fff
    style C fill:#0E0F11,stroke:#1FA463,color:#fff
    style D fill:#0E0F11,stroke:#1FA463,color:#fff
    style F fill:#1FA463,stroke:#1FA463,color:#fff
    style G fill:#FF5C5C,stroke:#FF5C5C,color:#fff
    style H fill:#0E0F11,stroke:#1FA463,color:#fff
    style I fill:#0E0F11,stroke:#1FA463,color:#fff
```

| Layer | Answers |
|---|---|
| 🔍 **Reality Sync** | "How far behind reality am I?" |
| 🚨 **Risk Engine** | "What are the real odds I miss this?" |
| 📊 **Priority Engine** | "Out of everything, what do I do first?" |
| 🤖 **AI Planner** | "Can this still be saved — and if not, help me ask for more time." |
| ⏱ **Execution Layer** | "Prove it. Log it." |
| 🏆 **Motivation Layer** | "Here's the receipt for your real progress." |

<br/>

## 🎬 See It In Action

<div align="center">
<img src="https://readme-typing-svg.demolab.com?font=Inter&size=14&duration=4000&pause=1500&color=1FA463&center=true&vCenter=true&width=550&height=24&lines=Risk+Score%3A+78+%F0%9F%94%B4+%E2%86%92+Run+Focus+Timer+%E2%86%92+Risk+Score%3A+54+%F0%9F%9F%A1" alt="demo flow" />

<br/><br/>

<!-- 🎥 Replace with an actual screen recording GIF of the live demo before submission -->
<img src="https://via.placeholder.com/900x500/0E0F11/1FA463?text=%E2%96%B6%EF%B8%8F+Demo+GIF+goes+here" width="80%" alt="Demo placeholder" />

</div>

<br/>

## 🛠 Tech Stack

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js_15-000000?style=flat-square&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-black?style=flat-square&logo=framer&logoColor=blue)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat-square&logo=firebase&logoColor=black)
![Gemini](https://img.shields.io/badge/Gemini_API-1FA463?style=flat-square&logo=google-gemini&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-black?style=flat-square&logo=vercel&logoColor=white)

</div>

<br/>

## 🚀 Run and Deploy Your AI Studio App

This contains everything you need to run your app locally.

**View your app in AI Studio:** [Click Here](https://focusforge-ai-573123672173.asia-southeast1.run.app)

### Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   ```bash
   npm run dev
   ```

<br/>

## 🗂 Sidebar / Page Map

```
🏠 Dashboard          — your AI Coach, today's priority queue, risk overview
🎯 Quests             — task management, AI-suggested importance
👥 Workspaces         — team Reality Sync, Reliability Score, AI Blocker Detection
🧠 Reality Sync       — the plan-vs-reality reconciliation engine
🚨 Risk Center        — every Yellow/Red task, ranked
🎯 Recovery Missions  — AI recovery plans → extension drafts, only if truly infeasible
⏱ Training           — Focus Timer, feeds Reality Sync live
📅 Calendar           — plan vs. reality, visualized
🏆 Leaderboard        — ranked by Reliability, not just raw output
👤 Character          — the receipt for your real progress, not the point
```

<br/>

## 🤝 Built For

<div align="center">

**Coding Ninjas × Google for Developers — VIBE2SHIP Hackathon**

<img src="https://readme-typing-svg.demolab.com?font=Inter&size=14&duration=3000&pause=2000&color=6D7A6F&center=true&vCenter=true&width=500&height=24&lines=Built+with+%F0%9F%9F%A2+honesty%2C+%F0%9F%94%B4+caffeine%2C+and+one+very+real+missed+to-do." alt="footer" />

</div>
