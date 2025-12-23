import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Play, RotateCcw, Send, Clock, CheckCircle, XCircle } from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { Button } from '../components/Button';
import { useAuthStore } from '../store/auth-store';
import { useAppStore } from '../store/app-store';
import { generateQuizFromSummary } from '../lib/ai-service';
import type { QuizQuestion } from '../types/database';

export function QuizPage() {
  const { user } = useAuthStore();
  const { notes, fetchNotes, currentQuiz, currentAnswers, setCurrentQuiz, setAnswer, clearQuiz, submitQuizAttempt } = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>((location.state as { noteId?: string })?.noteId || null);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [questionCount, setQuestionCount] = useState(5);
  const [timerMinutes, setTimerMinutes] = useState(15);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [timerActive, setTimerActive] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ score: number; correct: number; total: number } | null>(null);

  useEffect(() => { if (user) fetchNotes(user.id); }, [user, fetchNotes]);
  useEffect(() => { if (notes.length > 0 && !selectedNoteId) setSelectedNoteId(notes[0].id); }, [notes, selectedNoteId]);
  useEffect(() => {
    let interval: number;
    if (timerActive && timeRemaining !== null && timeRemaining > 0) {
      interval = window.setInterval(() => {
        setTimeRemaining((prev) => { if (prev === null || prev <= 1) { setTimerActive(false); return 0; } return prev - 1; });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, timeRemaining]);

  const selectedNote = notes.find((n) => n.id === selectedNoteId);

  const handleGenerate = async () => {
    if (!selectedNote?.summary) return;
    setGenerating(true); setSubmitted(false); setResult(null);
    try {
      const questions = await generateQuizFromSummary(selectedNote.summary, difficulty, questionCount);
      setCurrentQuiz(questions);
      setTimeRemaining(timerMinutes * 60);
      setTimerActive(true);
    } finally { setGenerating(false); }
  };

  const handleSubmit = async () => {
    if (!user || currentQuiz.length === 0) return;
    let correct = 0;
    currentQuiz.forEach((q) => { if (currentAnswers[q.id] === q.correctIndex) correct++; });
    const score = Math.round((correct / currentQuiz.length) * 100);
    setResult({ score, correct, total: currentQuiz.length });
    setSubmitted(true); setTimerActive(false);
    await submitQuizAttempt(user.id, selectedNoteId, difficulty, currentQuiz, currentAnswers);
  };

  const handleReattempt = () => { clearQuiz(); setSubmitted(false); setResult(null); setTimeRemaining(timerMinutes * 60); };
  const handleReset = () => { if (confirm('Reset quiz?')) { clearQuiz(); setSubmitted(false); setResult(null); setTimeRemaining(null); setTimerActive(false); } };
  const formatTime = (seconds: number) => { const m = Math.floor(seconds / 60); const s = seconds % 60; return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`; };

  if (!user) return <GlassCard className="p-8 text-center"><h2 className="text-xl font-bold text-white mb-4">Sign in to take quizzes</h2><Button onClick={() => navigate('/auth')}>Sign In</Button></GlassCard>;

  return (
    <GlassCard className="p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div><p className="text-xs text-cyan-300 uppercase tracking-[0.3em]">Step 3</p><h3 className="text-2xl font-bold text-white">AI Quiz Generator</h3><p className="text-slate-300 text-sm">MCQs with explanations by difficulty.</p></div>
        <div className="flex flex-wrap gap-2 items-center">
          <select value={selectedNoteId || ''} onChange={(e) => setSelectedNoteId(e.target.value)} className="bg-slate-900/70 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50" disabled={generating || currentQuiz.length > 0}>
            {notes.map((note) => <option key={note.id} value={note.id}>{note.title}</option>)}
          </select>
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')} className="bg-slate-900/70 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50" disabled={generating || currentQuiz.length > 0}>
            <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
          </select>
          <input type="number" min={1} max={10} value={questionCount} onChange={(e) => setQuestionCount(Math.min(10, Math.max(1, parseInt(e.target.value) || 5)))} className="w-20 bg-slate-900/70 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50" disabled={generating || currentQuiz.length > 0} title="Number of questions" />
          <Button onClick={handleGenerate} loading={generating} disabled={!selectedNote?.summary}>Generate</Button>
        </div>
      </div>
      {currentQuiz.length > 0 && (
        <div className="flex items-center gap-4 mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
          <Clock className={`w-5 h-5 ${timeRemaining && timeRemaining < 60 ? 'text-red-400' : 'text-slate-400'}`} />
          <span className={`text-lg font-mono font-semibold ${timeRemaining && timeRemaining < 60 ? 'text-red-400' : 'text-white'}`}>{timeRemaining !== null ? formatTime(timeRemaining) : '--:--'}</span>
          <Button variant="ghost" onClick={() => setTimerActive(!timerActive)}>{timerActive ? 'Pause' : 'Resume'}</Button>
        </div>
      )}
      {result && (
        <div className={`mb-6 p-6 rounded-xl border ${result.score >= 70 ? 'bg-emerald-500/10 border-emerald-500/30' : result.score >= 50 ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
          <p className={`text-2xl font-bold ${result.score >= 70 ? 'text-emerald-300' : result.score >= 50 ? 'text-yellow-300' : 'text-red-300'}`}>Score: {result.score}% ({result.correct}/{result.total} correct)</p>
        </div>
      )}
      <div className="space-y-4">
        {currentQuiz.length === 0 ? <div className="text-center py-12"><p className="text-slate-400">{notes.length === 0 ? 'Upload notes first to generate quizzes.' : 'Select a note and generate a quiz to start.'}</p></div> : currentQuiz.map((q, qIdx) => <QuizQuestionCard key={q.id} question={q} index={qIdx} selectedAnswer={currentAnswers[q.id]} onSelect={(ansIdx) => setAnswer(q.id, ansIdx)} submitted={submitted} disabled={submitted} />)}
      </div>
      {currentQuiz.length > 0 && (
        <div className="flex gap-3 mt-6 justify-center">
          {!submitted ? <Button onClick={handleSubmit}><Send className="w-4 h-4" />Submit</Button> : <Button onClick={handleReattempt}><Play className="w-4 h-4" />Reattempt</Button>}
          <Button variant="danger" onClick={handleReset}><RotateCcw className="w-4 h-4" />Reset</Button>
        </div>
      )}
    </GlassCard>
  );
}

function QuizQuestionCard({ question, index, selectedAnswer, onSelect, submitted, disabled }: { question: QuizQuestion; index: number; selectedAnswer?: number; onSelect: (index: number) => void; submitted: boolean; disabled: boolean; }) {
  const isCorrect = selectedAnswer === question.correctIndex;
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
      <p className="text-white font-semibold mb-4"><span className="text-cyan-400">Q{index + 1}.</span> {question.question}</p>
      <div className="space-y-2">
        {question.options.map((opt, optIdx) => {
          const isSelected = selectedAnswer === optIdx;
          const isCorrectOption = question.correctIndex === optIdx;
          let optionClass = 'bg-white/5 border-white/10 hover:bg-white/10';
          if (submitted) { if (isCorrectOption) optionClass = 'bg-emerald-500/20 border-emerald-500/50'; else if (isSelected && !isCorrect) optionClass = 'bg-red-500/20 border-red-500/50'; }
          else if (isSelected) optionClass = 'bg-cyan-500/20 border-cyan-500/50';
          return (
            <label key={optIdx} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${optionClass} ${disabled ? 'cursor-default' : ''}`}>
              <input type="radio" name={`q-${question.id}`} checked={isSelected} onChange={() => onSelect(optIdx)} disabled={disabled} className="w-4 h-4 accent-cyan-500" />
              <span className="text-sm text-slate-200 flex-1">{opt}</span>
              {submitted && isCorrectOption && <CheckCircle className="w-5 h-5 text-emerald-400" />}
              {submitted && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-400" />}
            </label>
          );
        })}
      </div>
      {submitted && <div className="mt-4 p-3 bg-slate-900/50 rounded-lg"><p className="text-sm text-slate-300"><span className="text-cyan-400 font-medium">Explanation:</span> {question.explanation}</p></div>}
    </div>
  );
}