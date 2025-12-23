import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Pause, RotateCcw, CheckCircle } from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { Button } from '../components/Button';
import { useAuthStore } from '../store/auth-store';
import { useAppStore } from '../store/app-store';

type SessionType = 'focus25' | 'focus50' | 'break5' | 'break15';
const SESSION_CONFIG: Record<SessionType, { label: string; minutes: number; type: 'focus' | 'break' }> = {
  focus25: { label: 'Focus 25m', minutes: 25, type: 'focus' },
  focus50: { label: 'Focus 50m', minutes: 50, type: 'focus' },
  break5: { label: 'Short Break 5m', minutes: 5, type: 'break' },
  break15: { label: 'Long Break 15m', minutes: 15, type: 'break' },
};

export function PomodoroPage() {
  const { user } = useAuthStore();
  const { createStudySession, studySessions, fetchStudySessions } = useAppStore();
  const navigate = useNavigate();
  const [sessionType, setSessionType] = useState<SessionType>('focus25');
  const [timeRemaining, setTimeRemaining] = useState(SESSION_CONFIG.focus25.minutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);

  useEffect(() => { if (user) fetchStudySessions(user.id); }, [user, fetchStudySessions]);

  const todaysSessions = studySessions.filter((s) => { const today = new Date(); const sessionDate = new Date(s.created_at); return sessionDate.getDate() === today.getDate() && sessionDate.getMonth() === today.getMonth() && sessionDate.getFullYear() === today.getFullYear(); });
  const todaysFocusMinutes = todaysSessions.filter((s) => s.session_type === 'focus').reduce((sum, s) => sum + s.minutes, 0);

  const handleSessionComplete = useCallback(async () => {
    if (!user) return;
    const config = SESSION_CONFIG[sessionType];
    await createStudySession(user.id, config.minutes, config.type);
    setCompletedSessions((prev) => prev + 1);
    setIsRunning(false);
  }, [user, sessionType, createStudySession]);

  useEffect(() => {
    let interval: number;
    if (isRunning && timeRemaining > 0) {
      interval = window.setInterval(() => {
        setTimeRemaining((prev) => { if (prev <= 1) { handleSessionComplete(); return 0; } return prev - 1; });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeRemaining, handleSessionComplete]);

  const handleSessionTypeChange = (type: SessionType) => { setSessionType(type); setTimeRemaining(SESSION_CONFIG[type].minutes * 60); setIsRunning(false); };
  const handleStart = () => { if (!user) { navigate('/auth'); return; } setIsRunning(true); };
  const handlePause = () => setIsRunning(false);
  const handleReset = () => { setTimeRemaining(SESSION_CONFIG[sessionType].minutes * 60); setIsRunning(false); };
  const formatTime = (seconds: number) => { const m = Math.floor(seconds / 60); const s = seconds % 60; return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`; };

  const progress = 1 - timeRemaining / (SESSION_CONFIG[sessionType].minutes * 60);
  const circumference = 2 * Math.PI * 120;
  const strokeDashoffset = circumference * (1 - progress);
  const isLowTime = timeRemaining < 60 && timeRemaining > 0;
  const config = SESSION_CONFIG[sessionType];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <GlassCard className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div><p className="text-xs text-cyan-300 uppercase tracking-[0.3em]">Focus</p><h3 className="text-2xl font-bold text-white">Pomodoro Timer</h3><p className="text-slate-300 text-sm">Stay focused, take breaks, log your study time.</p></div>
          <select value={sessionType} onChange={(e) => handleSessionTypeChange(e.target.value as SessionType)} className="bg-slate-900/70 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50" disabled={isRunning}>
            {Object.entries(SESSION_CONFIG).map(([key, conf]) => <option key={key} value={key}>{conf.label}</option>)}
          </select>
        </div>
        <div className="flex flex-col items-center gap-8">
          <div className="relative">
            <svg width="280" height="280" className="transform -rotate-90">
              <circle cx="140" cy="140" r="120" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
              <circle cx="140" cy="140" r="120" fill="none" stroke={isLowTime ? '#f87171' : config.type === 'focus' ? '#22d3ee' : '#34d399'} strokeWidth="8" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} className="transition-all duration-1000" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-5xl font-bold font-mono ${isLowTime ? 'text-red-400' : 'text-white'}`}>{formatTime(timeRemaining)}</span>
              <span className="text-sm text-slate-400 mt-2">{config.type === 'focus' ? 'Focus Time' : 'Break Time'}</span>
            </div>
          </div>
          <div className="flex gap-3">
            {!isRunning ? <Button onClick={handleStart}><Play className="w-5 h-5" />Start</Button> : <Button onClick={handlePause} variant="secondary"><Pause className="w-5 h-5" />Pause</Button>}
            <Button variant="ghost" onClick={handleReset}><RotateCcw className="w-5 h-5" />Reset</Button>
          </div>
          <p className={`text-sm ${isRunning ? 'text-cyan-300' : timeRemaining === 0 ? 'text-emerald-300' : 'text-slate-400'}`}>{isRunning ? 'In session... Stay focused!' : timeRemaining === 0 ? 'Session complete! Great work!' : 'Ready to focus.'}</p>
        </div>
      </GlassCard>
      <div className="grid md:grid-cols-2 gap-6">
        <GlassCard className="p-6">
          <h4 className="text-lg font-semibold text-white mb-4">Today's Progress</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between"><span className="text-slate-400">Focus Time</span><span className="text-xl font-bold text-white">{todaysFocusMinutes} min</span></div>
            <div className="flex items-center justify-between"><span className="text-slate-400">Sessions Completed</span><span className="text-xl font-bold text-white">{todaysSessions.filter((s) => s.session_type === 'focus').length}</span></div>
            <div className="w-full bg-white/10 rounded-full h-3"><div className="bg-gradient-to-r from-cyan-400 to-blue-500 h-3 rounded-full transition-all" style={{ width: `${Math.min(100, (todaysFocusMinutes / 120) * 100)}%` }} /></div>
            <p className="text-xs text-slate-500">Goal: 120 minutes</p>
          </div>
        </GlassCard>
        <GlassCard className="p-6">
          <h4 className="text-lg font-semibold text-white mb-4">Session Tips</h4>
          <ul className="space-y-3 text-sm text-slate-300">
            <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />Remove distractions before starting</li>
            <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />Take short breaks to maintain focus</li>
            <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />Stay hydrated during study sessions</li>
            <li className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />Review notes after each focus block</li>
          </ul>
        </GlassCard>
      </div>
    </div>
  );
}