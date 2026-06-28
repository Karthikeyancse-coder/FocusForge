import React, { useState } from "react";
import { motion } from "motion/react";
import { Trophy, Medal, CheckSquare, Zap } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { useUser } from "../context/UserContext";

// DEMO USERS: Sample data, not real users.
const SAMPLE_USERS = [
  {
    id: "1",
    name: "Alex K.",
    streak: 12,
    completedThisWeek: 15,
    completedAllTime: 120,
    reliabilityThisWeek: 94,
    reliabilityAllTime: 92,
    isCurrentUser: false,
  },
  {
    id: "2",
    name: "Sarah J.",
    streak: 5,
    completedThisWeek: 8,
    completedAllTime: 85,
    reliabilityThisWeek: 87,
    reliabilityAllTime: 89,
    isCurrentUser: false,
  },
  {
    id: "3",
    name: "David W.",
    streak: 21,
    completedThisWeek: 25,
    completedAllTime: 310,
    reliabilityThisWeek: 76,
    reliabilityAllTime: 81,
    isCurrentUser: false,
  },
  {
    id: "4",
    name: "Emma T.",
    streak: 2,
    completedThisWeek: 12,
    completedAllTime: 65,
    reliabilityThisWeek: 61,
    reliabilityAllTime: 65,
    isCurrentUser: false,
  },
  {
    id: "5",
    name: "James L.",
    streak: 8,
    completedThisWeek: 18,
    completedAllTime: 140,
    reliabilityThisWeek: 48,
    reliabilityAllTime: 52,
    isCurrentUser: false,
  },
];

export function calculateReliabilityScore(tasks: any[]): number {
  if (!tasks.length) return 0;

  let totalReliability = 0;
  let count = 0;

  for (const t of tasks) {
    if (t.realityState?.effectivePercent >= 100) {
      const estimated = t.estimatedEffortHours || 1; // prevent div by zero
      const actual =
        (t.realityState.focusSessions?.reduce(
          (acc: number, s: any) => acc + s.durationMinutes,
          0,
        ) || 0) / 60;

      const taskReliability = Math.max(
        0,
        1 - Math.abs(actual - estimated) / estimated,
      );
      totalReliability += taskReliability;
      count++;
    }
  }

  return count > 0 ? Math.round((totalReliability / count) * 100) : 0;
}

export default function Leaderboard() {
  const { userState, tasks } = useUser();
  const [timeframe, setTimeframe] = useState<"All Time" | "This Week">(
    "This Week",
  );

  // Calculate current user's stats
  const completedTasksAllTime = tasks.filter(
    (t) => t.realityState?.effectivePercent >= 100,
  );
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const completedTasksThisWeek = completedTasksAllTime.filter((t) => {
    const lastFocus =
      t.realityState?.focusSessions?.[t.realityState.focusSessions.length - 1]
        ?.date;
    const completedAt = t.realityState?.completedAt || lastFocus;
    return completedAt && new Date(completedAt) > oneWeekAgo;
  });

  const currentUserData = {
    id: userState.id,
    name: userState.name + " (You)",
    streak: userState.streakCount || 0,
    completedThisWeek: completedTasksThisWeek.length,
    completedAllTime: completedTasksAllTime.length,
    reliabilityThisWeek: calculateReliabilityScore(completedTasksThisWeek),
    reliabilityAllTime: calculateReliabilityScore(completedTasksAllTime),
    isCurrentUser: true,
  };

  const allUsersRaw = [...SAMPLE_USERS, currentUserData];

  const allUsers = allUsersRaw
    .map((u) => ({
      ...u,
      displayReliability:
        timeframe === "This Week"
          ? u.reliabilityThisWeek
          : u.reliabilityAllTime,
      displayCompleted:
        timeframe === "This Week" ? u.completedThisWeek : u.completedAllTime,
    }))
    .sort((a, b) => {
      if (b.displayReliability !== a.displayReliability) {
        return b.displayReliability - a.displayReliability;
      }
      return b.displayCompleted - a.displayCompleted;
    });

  const currentUserIndex = allUsers.findIndex((u) => u.isCurrentUser);
  const currentUserObj = allUsers[currentUserIndex];

  return (
    <div className="max-w-4xl mx-auto pt-[20px] pb-[120px] px-[16px] md:py-8 md:px-0 md:pb-8">
      <div className="flex flex-col md:flex-row items-center md:items-end md:justify-between mb-[20px] md:mb-2 gap-4 md:gap-0">
        <div className="text-center md:text-left">
          <h1 className="text-[32px] md:text-3xl font-display font-black text-[var(--text-primary)] uppercase tracking-tight flex items-center justify-center md:justify-start gap-2 md:gap-3 leading-[1.5] md:leading-none">
            <Trophy className="text-amber-500 w-7 h-7 md:w-8 md:h-8" />
            Leaderboard
          </h1>
          <p className="text-[17px] md:text-base text-[var(--text-secondary)] mt-2 font-medium">
            Who's keeping their word, not just who's busiest.
          </p>
        </div>
        <div className="flex justify-center">
          <div className="flex gap-[8px] md:gap-2 bg-[var(--bg-secondary)] p-1 rounded-lg border border-[var(--border-subtle)]">
            {["This Week", "All Time"].map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t as any)}
                className={`px-[16px] md:px-4 h-[40px] md:h-auto py-1.5 rounded-md text-[13px] md:text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center ${timeframe === t ? "bg-[var(--accent-primary)] text-black" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>
      <p className="text-[13px] md:text-xs text-[var(--text-muted)] mb-8 max-w-2xl text-center md:text-left mx-auto md:mx-0 leading-[1.5]">
        Reliability Score reflects how closely your actual effort matched what
        you said it would take — not just how many tasks you finished.
      </p>

      <div className="flex flex-col gap-4">
        <Card className="border border-[var(--border-subtle)] bg-[var(--bg-primary)] overflow-hidden rounded-[18px] md:rounded-2xl shadow-xl">
          <CardContent className="p-0 flex flex-col relative gap-0">
            {allUsers.map((user, index) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                key={user.id}
                className={`flex items-center gap-3 md:gap-6 p-[14px] md:p-6 h-[72px] md:h-auto border-b border-[var(--border-subtle)] last:border-0 ${user.isCurrentUser ? "bg-[var(--accent-primary)]/10 border-l-4 border-l-[var(--accent-primary)]" : "hover:bg-[var(--bg-secondary)] border-l-4 border-l-transparent"}`}
              >
                <div className="flex items-center justify-center w-8 md:w-12 text-lg md:text-2xl font-black text-[var(--text-muted)]">
                  {index === 0 ? (
                    <Medal className="text-amber-500 w-[24px] h-[24px] md:w-8 md:h-8" />
                  ) : index === 1 ? (
                    <Medal className="text-gray-400 w-[20px] h-[20px] md:w-7 md:h-7" />
                  ) : index === 2 ? (
                    <Medal className="text-amber-700 w-[20px] h-[20px] md:w-7 md:h-7" />
                  ) : (
                    `#${index + 1}`
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3
                    className={`text-[18px] md:text-lg font-bold flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap ${user.isCurrentUser ? "text-[var(--accent-primary)]" : "text-[var(--text-primary)]"}`}
                  >
                    {user.name}
                  </h3>
                  <div className="flex items-center gap-[10px] md:gap-4 mt-0.5 md:mt-1">
                    <div className="flex items-center gap-1">
                      <CheckSquare
                        className="text-[var(--text-muted)] w-[14px] h-[14px] md:w-3 md:h-3"
                      />
                      <span className="text-[12px] md:text-xs font-bold text-[var(--text-secondary)]">
                        {user.displayCompleted}{" "}
                        <span className="uppercase tracking-widest text-[10px] text-[var(--text-muted)]">
                          Tasks
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Zap className="text-amber-500 w-[14px] h-[14px] md:w-3 md:h-3" />
                      <span className="text-[12px] md:text-xs font-bold text-[var(--text-secondary)]">
                        {user.streak}{" "}
                        <span className="uppercase tracking-widest text-[10px] text-[var(--text-muted)]">
                          Streak
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <div className="text-[24px] md:text-4xl font-mono font-black text-[var(--text-primary)] tracking-tighter">
                    {user.displayReliability}
                    <span className="text-[14px] md:text-xl text-[var(--accent-primary)]">
                      %
                    </span>
                  </div>
                  <p className="text-[11px] md:text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-bold mt-0.5 md:mt-1">
                    Reliability
                  </p>
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>

        {currentUserIndex > 4 && (
          <Card className="border border-[var(--accent-primary)]/50 bg-[var(--accent-primary)]/10 overflow-hidden rounded-[18px] md:rounded-2xl shadow-xl mt-4">
            <CardContent className="p-0">
              <div className="px-[16px] md:px-6 pt-3 pb-1 border-b border-[var(--border-subtle)] border-opacity-50">
                <span className="text-[11px] md:text-[10px] font-bold text-[var(--accent-primary)] uppercase tracking-widest">
                  Your Rank
                </span>
              </div>
              <div className="flex items-center gap-3 md:gap-6 p-[16px] md:p-6 h-[72px] md:h-auto border-l-4 border-l-[var(--accent-primary)]">
                <div className="flex items-center justify-center w-8 md:w-12 text-lg md:text-xl font-black text-[var(--text-muted)]">
                  #{currentUserIndex + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-[18px] md:text-lg font-bold text-[var(--accent-primary)] flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
                    {currentUserObj.name}
                  </h3>
                  <div className="flex items-center gap-[10px] md:gap-4 mt-0.5 md:mt-1">
                    <div className="flex items-center gap-1">
                      <CheckSquare
                        className="text-[var(--text-muted)] w-[14px] h-[14px] md:w-3 md:h-3"
                      />
                      <span className="text-[12px] md:text-xs font-bold text-[var(--text-secondary)]">
                        {currentUserObj.displayCompleted}{" "}
                        <span className="uppercase tracking-widest text-[10px] text-[var(--text-muted)]">
                          Tasks
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Zap className="text-amber-500 w-[14px] h-[14px] md:w-3 md:h-3" />
                      <span className="text-[12px] md:text-xs font-bold text-[var(--text-secondary)]">
                        {currentUserObj.streak}{" "}
                        <span className="uppercase tracking-widest text-[10px] text-[var(--text-muted)]">
                          Streak
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <div className="text-[24px] md:text-4xl font-mono font-black text-[var(--text-primary)] tracking-tighter">
                    {currentUserObj.displayReliability}
                    <span className="text-[14px] md:text-xl text-[var(--accent-primary)]">
                      %
                    </span>
                  </div>
                  <p className="text-[11px] md:text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-bold mt-0.5 md:mt-1">
                    Reliability
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
