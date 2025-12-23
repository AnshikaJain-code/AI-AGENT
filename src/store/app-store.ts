import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Note, QuizAttempt, StudySession, QuizQuestion, QuizDetail } from '../types/database';

interface AppState {
  notes: Note[];
  quizAttempts: QuizAttempt[];
  studySessions: StudySession[];
  currentQuiz: QuizQuestion[];
  currentAnswers: Record<string, number>;
  loading: boolean;
  fetchNotes: (userId: string) => Promise<void>;
  createNote: (userId: string, title: string, rawText: string, summary: string) => Promise<Note | null>;
  deleteNote: (noteId: string) => Promise<void>;
  fetchQuizAttempts: (userId: string) => Promise<void>;
  submitQuizAttempt: (userId: string, noteId: string | null, difficulty: 'easy' | 'medium' | 'hard', questions: QuizQuestion[], answers: Record<string, number>) => Promise<QuizAttempt | null>;
  fetchStudySessions: (userId: string) => Promise<void>;
  createStudySession: (userId: string, minutes: number, sessionType: 'focus' | 'break') => Promise<void>;
  setCurrentQuiz: (quiz: QuizQuestion[]) => void;
  setAnswer: (questionId: string, answerIndex: number) => void;
  clearQuiz: () => void;
  resetAllData: (userId: string) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  notes: [],
  quizAttempts: [],
  studySessions: [],
  currentQuiz: [],
  currentAnswers: {},
  loading: false,
  fetchNotes: async (userId: string) => {
    set({ loading: true });
    const { data } = await supabase.from('notes').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    set({ notes: data || [], loading: false });
  },
  createNote: async (userId: string, title: string, rawText: string, summary: string) => {
    const { data, error } = await supabase.from('notes').insert({ user_id: userId, title, raw_text: rawText, summary }).select().single();
    if (error || !data) return null;
    set((state) => ({ notes: [data, ...state.notes] }));
    return data;
  },
  deleteNote: async (noteId: string) => {
    await supabase.from('notes').delete().eq('id', noteId);
    set((state) => ({ notes: state.notes.filter((n) => n.id !== noteId) }));
  },
  fetchQuizAttempts: async (userId: string) => {
    const { data } = await supabase.from('quiz_attempts').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    set({ quizAttempts: (data || []) as QuizAttempt[] });
  },
  submitQuizAttempt: async (userId: string, noteId: string | null, difficulty: 'easy' | 'medium' | 'hard', questions: QuizQuestion[], answers: Record<string, number>) => {
    let correct = 0;
    const details: QuizDetail[] = questions.map((q) => {
      const userAnswer = answers[q.id] ?? null;
      const isCorrect = userAnswer === q.correctIndex;
      if (isCorrect) correct++;
      return { questionId: q.id, question: q.question, userAnswer, correctAnswer: q.correctIndex, isCorrect };
    });
    const score = Math.round((correct / questions.length) * 100);
    const { data, error } = await supabase.from('quiz_attempts').insert({ user_id: userId, note_id: noteId, difficulty, score, total_questions: questions.length, correct_answers: correct, details }).select().single();
    if (error || !data) return null;
    set((state) => ({ quizAttempts: [data as QuizAttempt, ...state.quizAttempts] }));
    return data as QuizAttempt;
  },
  fetchStudySessions: async (userId: string) => {
    const { data } = await supabase.from('study_sessions').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    set({ studySessions: data || [] });
  },
  createStudySession: async (userId: string, minutes: number, sessionType: 'focus' | 'break') => {
    const { data, error } = await supabase.from('study_sessions').insert({ user_id: userId, minutes, session_type: sessionType }).select().single();
    if (!error && data) set((state) => ({ studySessions: [data, ...state.studySessions] }));
  },
  setCurrentQuiz: (quiz: QuizQuestion[]) => set({ currentQuiz: quiz, currentAnswers: {} }),
  setAnswer: (questionId: string, answerIndex: number) => set((state) => ({ currentAnswers: { ...state.currentAnswers, [questionId]: answerIndex } })),
  clearQuiz: () => set({ currentQuiz: [], currentAnswers: {} }),
  resetAllData: async (userId: string) => {
    await Promise.all([
      supabase.from('notes').delete().eq('user_id', userId),
      supabase.from('quiz_attempts').delete().eq('user_id', userId),
      supabase.from('study_sessions').delete().eq('user_id', userId),
    ]);
    set({ notes: [], quizAttempts: [], studySessions: [], currentQuiz: [], currentAnswers: {} });
  },
}));