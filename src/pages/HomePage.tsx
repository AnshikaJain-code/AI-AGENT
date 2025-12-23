import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Upload, FileText, Brain, ArrowRight, TrendingUp, Network, RotateCw, AlertCircle, Route, Users } from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { StatCard } from '../components/StatCard';
import { Button } from '../components/Button';
import { useAuthStore } from '../store/auth-store';
import { useAppStore } from '../store/app-store';

export function HomePage() {
  const { user } = useAuthStore();
  const { notes, quizAttempts, studySessions, fetchNotes, fetchQuizAttempts, fetchStudySessions } = useAppStore();

  useEffect(() => {
    if (user) {
      fetchNotes(user.id);
      fetchQuizAttempts(user.id);
      fetchStudySessions(user.id);
    }
  }, [user, fetchNotes, fetchQuizAttempts, fetchStudySessions]);

  const totalAttempts = quizAttempts.length;
  const avgScore = totalAttempts ? Math.round(quizAttempts.reduce((sum, a) => sum + a.score, 0) / totalAttempts) : 0;
  const focusSessions = studySessions.filter((s) => s.session_type === 'focus');
  const totalStudyMinutes = focusSessions.reduce((sum, s) => sum + s.minutes, 0);

  const calculateStreak = () => {
    if (!user) return 0;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const activityDates = new Set<string>();
    quizAttempts.forEach((a) => { const date = new Date(a.created_at); date.setHours(0, 0, 0, 0); activityDates.add(date.toISOString()); });
    studySessions.forEach((s) => { const date = new Date(s.created_at); date.setHours(0, 0, 0, 0); activityDates.add(date.toISOString()); });
    let streak = 0;
    const checkDate = new Date(today);
    while (true) {
      if (activityDates.has(checkDate.toISOString())) { streak++; checkDate.setDate(checkDate.getDate() - 1); }
      else if (streak === 0) { checkDate.setDate(checkDate.getDate() - 1); if (!activityDates.has(checkDate.toISOString())) break; }
      else break;
    }
    return streak;
  };

  const streak = calculateStreak();
  const latestSummary = notes[0]?.summary || 'No summary yet. Upload your notes to begin.';
  const advancedFeatures = [
    { title: 'Exam Prediction', description: 'AI analyzes patterns to predict likely exam questions and topics', icon: TrendingUp, to: '/predictor', gradient: 'from-cyan-500/20 to-blue-500/20' },
    { title: 'Concept Mapping', description: 'Visualize relationships between topics with interactive concept maps', icon: Network, to: '/concept-map', gradient: 'from-blue-500/20 to-purple-500/20' },
    { title: 'SRS Flashcards', description: 'Spaced repetition system optimizes review timing for long-term retention', icon: RotateCw, to: '/flashcards', gradient: 'from-purple-500/20 to-pink-500/20' },
    { title: 'Weakness Detection', description: 'Identify knowledge gaps and get targeted practice recommendations', icon: AlertCircle, to: '/weakness', gradient: 'from-pink-500/20 to-rose-500/20' },
    { title: 'Study Path', description: 'Personalized learning roadmap based on your performance and goals', icon: Route, to: '/study-path', gradient: 'from-rose-500/20 to-orange-500/20' },
    { title: 'Community Tips', description: 'Proven study strategies and insights from top-performing students', icon: Users, to: '/tips', gradient: 'from-orange-500/20 to-cyan-500/20' },
  ];

  return (
    <div className="space-y-8">
      <GlassCard gradient="cyan" className="p-8 md:p-10">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-6">
            <div className="inline-block">
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-300 font-semibold mb-2">Revise faster. Learn smarter.</p>
              <div className="h-0.5 w-20 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full"></div>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
              Your AI-Powered <span className="text-gradient">Study Companion</span>
            </h2>
            <p className="text-slate-300 text-lg leading-relaxed">Engineered for engineering students. Master complex concepts, predict exam patterns, identify knowledge gaps, and optimize your study strategy with AI-powered insights.</p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link to={user ? '/upload' : '/auth'}><Button variant="gradient" size="lg">Get Started<ArrowRight className="w-5 h-5" /></Button></Link>
              <Link to="/dashboard"><Button variant="secondary" size="lg">View Dashboard</Button></Link>
            </div>
          </div>
          <div className="bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-transparent border border-cyan-500/20 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-cyan-200 font-semibold">Latest Summary Preview</p>
              <FileText className="w-5 h-5 text-cyan-400" />
            </div>
            <p className="text-slate-100 text-sm leading-relaxed line-clamp-4 mb-6">{latestSummary.substring(0, 200)}{latestSummary.length > 200 ? '...' : ''}</p>
            <div className="grid grid-cols-3 gap-3">
              <StatCard label="Quizzes" value={totalAttempts} gradient="from-cyan-500/20 to-blue-500/20" />
              <StatCard label="Avg Score" value={`${avgScore}%`} gradient="from-blue-500/20 to-cyan-500/20" />
              <StatCard label="Streak" value={`${streak}d`} gradient="from-emerald-500/20 to-cyan-500/20" />
            </div>
          </div>
        </div>
      </GlassCard>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <h3 className="text-2xl font-bold text-white">Advanced Features</h3>
          <div className="h-px flex-1 bg-gradient-to-r from-cyan-500/50 to-transparent"></div>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {advancedFeatures.map((feature) => {
            const Icon = feature.icon;
            return (
              <Link key={feature.title} to={feature.to}>
                <GlassCard hover gradient="blue" className="p-6 h-full group">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">{feature.title}</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">{feature.description}</p>
                </GlassCard>
              </Link>
            );
          })}
        </div>
      </div>
      {user && totalStudyMinutes > 0 && (
        <GlassCard gradient="emerald" className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-lg">
                <Brain className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-1">Total Focus Time</p>
                <p className="text-3xl font-bold text-white">{totalStudyMinutes} <span className="text-lg text-slate-400">minutes</span></p>
              </div>
            </div>
            <Link to="/pomodoro"><Button variant="gradient" size="lg">Start Pomodoro</Button></Link>
          </div>
        </GlassCard>
      )}
      <GlassCard gradient="slate" className="p-8 text-center">
        <h3 className="text-2xl font-bold text-white mb-6">Built for Performance</h3>
        <div className="flex flex-wrap justify-center items-center gap-8">
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center">
              <span className="text-2xl font-bold text-cyan-400">⚛️</span>
            </div>
            <p className="text-white font-semibold">React</p>
            <p className="text-slate-400 text-xs">UI Framework</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center">
              <span className="text-2xl font-bold text-emerald-400">🤖</span>
            </div>
            <p className="text-white font-semibold">Gemini AI</p>
            <p className="text-slate-400 text-xs">AI Engine</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 flex items-center justify-center">
              <span className="text-2xl font-bold text-green-400">⚡</span>
            </div>
            <p className="text-white font-semibold">Supabase</p>
            <p className="text-slate-400 text-xs">Database & Auth</p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}