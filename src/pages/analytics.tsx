import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useUser } from '../context/UserContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { Clock, CheckCircle2, Flame, AlertCircle, TrendingUp, TrendingDown, Lightbulb } from 'lucide-react';
import { cn } from '../lib/utils';

const mockWeeklyData = [
  { day: 'Mon', focus: 4.5, maintenance: 2.0 },
  { day: 'Tue', focus: 5.0, maintenance: 1.5 },
  { day: 'Wed', focus: 3.5, maintenance: 3.0 },
  { day: 'Thu', focus: 6.0, maintenance: 1.0 },
  { day: 'Fri', focus: 4.0, maintenance: 2.5 },
  { day: 'Sat', focus: 2.0, maintenance: 1.0 },
  { day: 'Sun', focus: 1.0, maintenance: 0.5 },
];

const mockCategoryData = [
  { name: 'Frontend', value: 45, color: '#10b981' },
  { name: 'Backend', value: 25, color: '#3b82f6' },
  { name: 'Design', value: 15, color: '#8b5cf6' },
  { name: 'Planning', value: 15, color: '#f59e0b' },
];

const metrics = [
  { title: 'Total Focus Hours', value: '26.0h', trend: '+12%', isPositive: true, icon: Clock },
  { title: 'Tasks Completed', value: '34', trend: '+5%', isPositive: true, icon: CheckCircle2 },
  { title: 'Current Streak', value: '7 days', trend: 'Best: 14', isPositive: true, icon: Flame },
  { title: 'Missed Deadlines', value: '2', trend: '-1', isPositive: true, icon: AlertCircle },
];

const insights = [
  "Thursday was your most productive day with 6 hours of deep focus.",
  "You've been spending more time on Frontend tasks compared to last week.",
  "Consider taking a lighter day on Saturday to recover your energy.",
];

export default function AnalyticsView() {
  const { userState, tasks, habits } = useUser();

  const completedTasksCount = tasks.filter(t => t.realityState.effectivePercent >= 100).length;
  const activeTasksCount = tasks.filter(t => t.realityState.effectivePercent < 100).length;
  const totalHabitCompletions = habits.reduce((acc, h) => acc + h.completedDates.length, 0);
  const maxHabitStreak = habits.length > 0 ? Math.max(...habits.map(h => h.streak)) : 0;
  const currentOverallStreak = Math.max(userState.streakCount || 0, maxHabitStreak);

  const dynamicMetrics = useMemo(() => [
    { title: 'Total Focus Hours', value: `${((userState.focusMinutesToday || 1560) / 60).toFixed(1)}h`, trend: '+12%', isPositive: true, icon: Clock },
    { title: 'Tasks Completed', value: `${completedTasksCount}`, trend: `Active: ${activeTasksCount}`, isPositive: true, icon: CheckCircle2 },
    { title: 'Current Streak', value: `${currentOverallStreak} days`, trend: `Best: ${Math.max(currentOverallStreak, 14)}`, isPositive: true, icon: Flame },
    { title: 'Habit Actions', value: `${totalHabitCompletions}`, trend: `${habits.length} habits active`, isPositive: true, icon: CheckCircle2 },
  ], [userState, tasks, habits, completedTasksCount, activeTasksCount, currentOverallStreak, totalHabitCompletions]);

  const actualCategoryData = useMemo(() => {
    const counts: Record<string, number> = { Study: 0, Career: 0, Health: 0, Personal: 0, Academic: 0 };
    tasks.forEach(t => {
      const cat = t.category || 'Study';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    habits.forEach(h => {
      const cat = h.category || 'Personal';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    
    const colors: Record<string, string> = {
      Academic: '#a855f7',
      Study: '#a855f7',
      Career: '#3b82f6',
      Health: '#10b981',
      Personal: '#f59e0b',
    };

    const parsed = Object.entries(counts)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({
        name: name === 'Academic' ? 'Study' : name,
        value,
        color: colors[name] || '#a855f7'
      }));

    if (parsed.length === 0) {
      return [
        { name: 'Study', value: 3, color: '#a855f7' },
        { name: 'Career', value: 2, color: '#3b82f6' },
        { name: 'Health', value: 1, color: '#10b981' },
      ];
    }
    return parsed;
  }, [tasks, habits]);

  return (
    <div className="p-8 pt-16 md:pt-20 max-w-7xl mx-auto w-full flex flex-col gap-8 h-full overflow-y-auto">
      <div>
        <h1 className="text-3xl font-display font-bold text-[var(--text-primary)]">Analytics</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Track your productivity trends and insights.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dynamicMetrics.map((metric, i) => {
          const Icon = metric.icon;
          return (
            <Card key={i} className="bg-[var(--bg-secondary)] border-[var(--border-subtle)]">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wider">{metric.title}</p>
                    <h3 className="text-3xl font-black font-mono text-[var(--text-primary)] mt-2">{metric.value}</h3>
                  </div>
                  <div className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--accent-primary)]">
                    <Icon size={20} />
                  </div>
                </div>
                <div className={cn(
                  "flex items-center gap-1 mt-4 text-sm font-bold",
                  metric.isPositive ? "text-emerald-500" : "text-red-500"
                )}>
                  {metric.isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  <span>{metric.trend}</span>
                  <span className="text-[var(--text-secondary)] ml-1 font-normal text-xs">vs last cycle</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-[var(--bg-secondary)] border-[var(--border-subtle)]">
          <CardHeader>
            <CardTitle className="text-xl font-display">Focus vs Maintenance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockWeeklyData}>
                  <XAxis 
                    dataKey="day" 
                    stroke="var(--text-secondary)" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    stroke="var(--text-secondary)" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => `${value}h`}
                  />
                  <Tooltip 
                    cursor={{ fill: 'var(--bg-primary)', opacity: 0.4 }}
                    contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: 'var(--text-primary)' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', color: 'var(--text-primary)' }} />
                  <Bar dataKey="focus" name="Deep Focus" stackId="a" fill="var(--accent-primary)" radius={[0, 0, 4, 4]} />
                  <Bar dataKey="maintenance" name="Maintenance" stackId="a" fill="var(--text-secondary)" opacity={0.3} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-[var(--bg-secondary)] border-[var(--border-subtle)]">
            <CardHeader>
              <CardTitle className="text-xl font-display">Category Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={actualCategoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {actualCategoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: 'var(--text-primary)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                {actualCategoryData.map((category, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                    <span className="text-sm font-bold text-[var(--text-secondary)]">{category.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-primary)] border-[var(--border-subtle)]">
            <CardHeader>
              <CardTitle className="text-xl font-display flex items-center gap-2 text-[var(--accent-primary)]">
                <Lightbulb size={20} /> Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {insights.map((insight, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] mt-2 shrink-0" />
                    <p className="text-sm text-[var(--text-primary)] leading-relaxed">{insight}</p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
