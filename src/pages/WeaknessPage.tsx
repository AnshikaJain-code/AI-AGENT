import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/auth-store';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { GlassCard } from '../components/GlassCard';
import { analyzeUserWeaknesses } from '../lib/weakness-detector';
import { AlertCircle, TrendingDown, BookOpen, Zap, Info } from 'lucide-react';

interface WeakTopic {
  topic: string;
  accuracy: number;
  totalAttempts: number;
  correctCount: number;
}

const MOCK_DATA: WeakTopic[] = [
  { topic: 'Calculus', accuracy: 65, totalAttempts: 20, correctCount: 13 },
  { topic: 'Linear Algebra', accuracy: 72, totalAttempts: 18, correctCount: 13 },
  { topic: 'Probability', accuracy: 58, totalAttempts: 15, correctCount: 9 },
  { topic: 'Statistics', accuracy: 78, totalAttempts: 22, correctCount: 17 },
  { topic: 'Differential Equations', accuracy: 62, totalAttempts: 16, correctCount: 10 },
];

export function WeaknessPage() {
  const { user } = useAuthStore();
  const [weakTopics, setWeakTopics] = useState<WeakTopic[]>([]);
  const [overallAccuracy, setOverallAccuracy] = useState(0);
  const [recommendedFocus, setRecommendedFocus] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [showMockData, setShowMockData] = useState(false);

  useEffect(() => {
    if (user) {
      analyzeWeaknesses();
    }
  }, [user]);

  const analyzeWeaknesses = async () => {
    setLoading(true);
    try {
      const analysis = await analyzeUserWeaknesses(user!.id);
      if (analysis.weakTopics.length === 0) {
        setShowMockData(true);
        setWeakTopics(MOCK_DATA);
        setOverallAccuracy(67);
        setRecommendedFocus(['Probability', 'Differential Equations', 'Calculus']);
      } else {
        setShowMockData(false);
        setWeakTopics(analysis.weakTopics);
        setOverallAccuracy(analysis.overallAccuracy);
        setRecommendedFocus(analysis.recommendedFocus);
      }
    } catch (error) {
      console.error('Failed to analyze weaknesses:', error);
      setShowMockData(true);
      setWeakTopics(MOCK_DATA);
      setOverallAccuracy(67);
      setRecommendedFocus(['Probability', 'Differential Equations', 'Calculus']);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 80) return 'text-green-400';
    if (accuracy >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getAccuracyBg = (accuracy: number) => {
    if (accuracy >= 80) return 'bg-green-500/10 border-green-500/30';
    if (accuracy >= 60) return 'bg-yellow-500/10 border-yellow-500/30';
    return 'bg-red-500/10 border-red-500/30';
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">Weakness Analysis</h1>
        <p className="text-gray-400">Identify areas that need improvement</p>
      </div>

      {showMockData && (
        <GlassCard className="border-l-4 border-blue-500 bg-blue-500/5">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-white mb-1">Sample Analysis</h3>
              <p className="text-sm text-gray-400">
                This is sample data to demonstrate the weakness analysis feature. Take some quizzes to see your personalized analysis.
              </p>
            </div>
          </div>
        </GlassCard>
      )}

      <GlassCard>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-cyan-400 mb-2">
              {Math.round(overallAccuracy)}%
            </div>
            <p className="text-gray-400">Overall Accuracy</p>
          </div>

          <div className="text-center">
            <div className="text-4xl font-bold text-emerald-400 mb-2">
              {weakTopics.length}
            </div>
            <p className="text-gray-400">Topics Analyzed</p>
          </div>

          <div className="text-center">
            <div className="text-4xl font-bold text-amber-400 mb-2">
              {recommendedFocus.length}
            </div>
            <p className="text-gray-400">Focus Areas</p>
          </div>
        </div>
      </GlassCard>

      {recommendedFocus.length > 0 && (
        <GlassCard className="border-l-4 border-amber-500 bg-amber-500/5">
          <div className="flex gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">
                Recommended Focus
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {recommendedFocus.map((topic) => (
                  <button
                    key={topic}
                    onClick={() => setSelectedTopic(topic)}
                    className="text-left px-4 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 transition-colors"
                  >
                    <Zap className="w-4 h-4 inline mr-2" />
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </GlassCard>
      )}

      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Topic Performance</h2>
        <div className="grid gap-4">
          {weakTopics.map((topic) => (
              <GlassCard
                key={topic.topic}
                className={`p-5 border cursor-pointer hover:border-cyan-400/50 transition-all ${getAccuracyBg(
                  topic.accuracy
                )}`}
                onClick={() => setSelectedTopic(topic.topic)}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {topic.topic}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {topic.correctCount} correct out of {topic.totalAttempts}{' '}
                      attempts
                    </p>
                  </div>
                  <div className={`text-2xl font-bold ${getAccuracyColor(topic.accuracy)}`}>
                    {Math.round(topic.accuracy)}%
                  </div>
                </div>

                <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      topic.accuracy >= 80
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                        : topic.accuracy >= 60
                          ? 'bg-gradient-to-r from-yellow-500 to-amber-500'
                          : 'bg-gradient-to-r from-red-500 to-rose-500'
                    }`}
                    style={{ width: `${topic.accuracy}%` }}
                  />
                </div>

                {topic.accuracy < 70 && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-amber-300">
                    <TrendingDown className="w-4 h-4" />
                    Needs improvement
                  </div>
                )}
              </GlassCard>
            ))}
        </div>
      </div>

      {selectedTopic && (
        <GlassCard className="border-l-4 border-blue-500 bg-blue-500/5">
          <h3 className="text-lg font-semibold text-white mb-4">
            Recommended Practice: {selectedTopic}
          </h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-slate-800 rounded-lg">
              <BookOpen className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-white">Review Materials</p>
                <p className="text-sm text-gray-400">
                  Review your notes on {selectedTopic}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-slate-800 rounded-lg">
              <Zap className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-white">Practice Quiz</p>
                <p className="text-sm text-gray-400">
                  Take a focused quiz on {selectedTopic}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-slate-800 rounded-lg">
              <BookOpen className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-white">Flashcard Review</p>
                <p className="text-sm text-gray-400">
                  Review flashcards related to {selectedTopic}
                </p>
              </div>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
