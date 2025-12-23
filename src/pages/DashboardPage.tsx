import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, TrendingUp, Target, Award, Clock, Flame, Brain, BookOpen, Zap, Lightbulb, CheckSquare, TrendingDown, Sparkles } from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { Button } from '../components/Button';
import { ContributionHeatmap } from '../components/ContributionHeatmap';
import { useAuthStore } from '../store/auth-store';
import { useAppStore } from '../store/app-store';
import { format, subDays, isSameDay } from 'date-fns';

export function DashboardPage() {
  const { user } = useAuthStore();
  const { notes, quizAttempts, studySessions, fetchNotes, fetchQuizAttempts, fetchStudySessions, resetAllData } = useAppStore();
  const navigate = useNavigate();
  const [expandedFeature, setExpandedFeature] = useState<string | null>(null);

  useEffect(() => { if (user) { fetchNotes(user.id); fetchQuizAttempts(user.id); fetchStudySessions(user.id); } }, [user, fetchNotes, fetchQuizAttempts, fetchStudySessions]);

  const stats = useMemo(() => {
    const totalAttempts = quizAttempts.length;
    const avgScore = totalAttempts ? Math.round(quizAttempts.reduce((sum, a) => sum + a.score, 0) / totalAttempts) : 0;
    const bestScore = totalAttempts ? Math.max(...quizAttempts.map((a) => a.score)) : 0;
    const byDifficulty = { easy: quizAttempts.filter((a) => a.difficulty === 'easy').length, medium: quizAttempts.filter((a) => a.difficulty === 'medium').length, hard: quizAttempts.filter((a) => a.difficulty === 'hard').length };
    const focusSessions = studySessions.filter((s) => s.session_type === 'focus');
    const totalStudyMinutes = focusSessions.reduce((sum, s) => sum + s.minutes, 0);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const activityDates = new Set<string>();
    quizAttempts.forEach((a) => { const date = new Date(a.created_at); date.setHours(0, 0, 0, 0); activityDates.add(date.toISOString()); });
    studySessions.forEach((s) => { const date = new Date(s.created_at); date.setHours(0, 0, 0, 0); activityDates.add(date.toISOString()); });
    let streak = 0; const checkDate = new Date(today);
    for (let i = 0; i < 365; i++) { if (activityDates.has(checkDate.toISOString())) { streak++; checkDate.setDate(checkDate.getDate() - 1); } else if (i === 0) { checkDate.setDate(checkDate.getDate() - 1); } else break; }
    const recentAttempts = quizAttempts.slice(-5);
    const recentTrend = recentAttempts.length > 1 ? (recentAttempts[recentAttempts.length - 1].score - recentAttempts[0].score) / recentAttempts.length : 0;
    return { totalAttempts, avgScore, bestScore, byDifficulty, totalStudyMinutes, streak, recentTrend: Math.round(recentTrend) };
  }, [quizAttempts, studySessions]);

  const insights = useMemo(() => {
    const tips = [];
    if (stats.avgScore < 60) tips.push("Your average score is below 60%. Try reviewing easier topics first.");
    if (stats.byDifficulty.hard === 0 && stats.byDifficulty.easy > 5) tips.push("Ready to challenge yourself? Try some hard quizzes!");
    if (stats.streak === 0) tips.push("Start your learning streak today! Complete one quiz to begin.");
    if (stats.totalStudyMinutes === 0) tips.push("You haven't studied yet. Start a study session to build your streak.");
    return tips.length > 0 ? tips : ["Keep up the great work! You're making consistent progress."];
  }, [stats]);

  const activityData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      const quizCount = quizAttempts.filter((a) => isSameDay(new Date(a.created_at), date)).length;
      const studyMins = studySessions.filter((s) => s.session_type === 'focus' && isSameDay(new Date(s.created_at), date)).reduce((sum, s) => sum + s.minutes, 0);
      return { date: format(date, 'EEE'), quizzes: quizCount, studyMinutes: studyMins };
    });
  }, [quizAttempts, studySessions]);

  const handleReset = async () => { if (!user) return; if (confirm('Reset all progress?')) await resetAllData(user.id); };

  if (!user) return <GlassCard className="p-8 text-center"><h2 className="text-xl font-bold text-white mb-4">Sign in to view dashboard</h2><Button onClick={() => navigate('/auth')}>Sign In</Button></GlassCard>;

  const features = [
    { id: 'goals', icon: CheckSquare, label: 'Goals', color: 'cyan', description: 'Set and track learning goals' },
    { id: 'insights', icon: Lightbulb, label: 'Insights', color: 'yellow', description: 'AI-powered learning recommendations' },
    { id: 'trends', icon: TrendingDown, label: 'Trends', color: 'emerald', description: 'Performance analysis & patterns' },
    { id: 'rewards', icon: Sparkles, label: 'Rewards', color: 'violet', description: 'Achievements and badges' },
  ];

  return (
    <div className="flex gap-6">
      <div className="w-full space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-gray-400">Your learning progress at a glance</p>
        </div>

        <ContributionHeatmap
          quizAttempts={quizAttempts}
          uploads={notes}
          currentStreak={stats.streak}
        />

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <GlassCard className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-sm mb-1">Attempts</p>
                <p className="text-3xl font-bold text-white">{stats.totalAttempts}</p>
              </div>
              <Target className="w-5 h-5 text-cyan-400 opacity-50" />
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-sm mb-1">Avg Score</p>
                <p className="text-3xl font-bold text-white">{stats.avgScore}%</p>
              </div>
              <TrendingUp className="w-5 h-5 text-emerald-400 opacity-50" />
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-sm mb-1">Best Score</p>
                <p className="text-3xl font-bold text-white">{stats.bestScore}%</p>
              </div>
              <Award className="w-5 h-5 text-yellow-400 opacity-50" />
            </div>
          </GlassCard>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Quick Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              const colorMap: Record<string, string> = {
                cyan: 'border-cyan-500 bg-cyan-500/5 hover:bg-cyan-500/10',
                yellow: 'border-yellow-500 bg-yellow-500/5 hover:bg-yellow-500/10',
                emerald: 'border-emerald-500 bg-emerald-500/5 hover:bg-emerald-500/10',
                violet: 'border-violet-500 bg-violet-500/5 hover:bg-violet-500/10',
              };
              const colorClass = colorMap[feature.color] || colorMap.cyan;

              return (
                <div
                  key={feature.id}
                  onMouseEnter={() => setExpandedFeature(feature.id)}
                  onMouseLeave={() => setExpandedFeature(null)}
                  className={`border-l-4 rounded-lg p-4 transition-all duration-300 cursor-pointer ${colorClass}`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="font-semibold text-white text-sm">{feature.label}</span>
                  </div>
                  {expandedFeature === feature.id && (
                    <p className="text-xs text-gray-400 animate-in fade-in duration-300">{feature.description}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Last 7 Days Activity</h3>
            <div className="space-y-3">
              {activityData.map((day, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <span className="w-12 text-sm font-medium text-slate-400">{day.date}</span>
                  <div className="flex-1">
                    <div className="h-6 bg-gradient-to-r from-cyan-500/30 to-blue-500/30 rounded-full overflow-hidden" style={{ width: `${Math.max(20, Math.min(100, (day.quizzes + day.studyMinutes / 10) * 10))}%` }} />
                  </div>
                  <span className="text-xs text-slate-400 w-24 text-right">{day.quizzes}Q • {day.studyMinutes}m</span>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Smart Insights</h3>
            <div className="space-y-3">
              {insights.map((insight, idx) => (
                <div key={idx} className="flex gap-3 p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                  <Lightbulb className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-300">{insight}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Quizzes</h3>
          {quizAttempts.length === 0 ? (
            <p className="text-slate-400 text-center py-8">No quiz attempts yet. Start learning!</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {quizAttempts.slice(0, 10).map((attempt) => (
                <div key={attempt.id} className="flex items-center justify-between p-3 bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-colors border border-slate-700">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${attempt.score >= 70 ? 'text-emerald-300' : attempt.score >= 50 ? 'text-yellow-300' : 'text-red-300'}`}>{attempt.score}%</span>
                      <span className="text-xs text-gray-500">({attempt.correct_answers}/{attempt.total_questions})</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded font-medium ${attempt.difficulty === 'easy' ? 'bg-emerald-500/20 text-emerald-300' : attempt.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-red-500/20 text-red-300'}`}>
                      {attempt.difficulty}
                    </span>
                    <span className="text-xs text-gray-500">{format(new Date(attempt.created_at), 'MMM d')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        <GlassCard className="p-6 bg-gradient-to-r from-red-500/10 to-transparent border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">Reset Progress</h3>
              <p className="text-gray-400 text-sm">Clear all your quiz attempts and sessions. This action cannot be undone.</p>
            </div>
            <Button variant="danger" onClick={handleReset}>
              <Trash2 className="w-4 h-4" />
              Reset All
            </Button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}