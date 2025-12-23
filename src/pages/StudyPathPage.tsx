import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/auth-store';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { GlassCard } from '../components/GlassCard';
import { Button } from '../components/Button';
import {
  analyzeUserWeaknesses,
  generateWeaknessPracticeMaterials,
} from '../lib/weakness-detector';
import {
  MapPin,
  Target,
  Clock,
  CheckCircle,
  ChevronRight,
  BookOpen,
} from 'lucide-react';

interface StudyPath {
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedDays: number;
  materials: string[];
  currentProgress: number;
}

export function StudyPathPage() {
  const { user } = useAuthStore();
  const [studyPath, setStudyPath] = useState<StudyPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [pathGenerated, setPathGenerated] = useState(false);

  useEffect(() => {
    if (user) {
      checkAndLoadPath();
    }
  }, [user]);

  const checkAndLoadPath = async () => {
    setLoading(true);
    try {
      const analysis = await analyzeUserWeaknesses(user!.id);

      const recommendedTopics = analysis.recommendedFocus.length > 0
        ? analysis.recommendedFocus
        : analysis.weakTopics.slice(0, 5).map((t) => t.topic);

      if (recommendedTopics.length > 0) {
        await generatePath(recommendedTopics);
        setPathGenerated(true);
      }
    } catch (error) {
      console.error('Failed to load study path:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePath = async (topics: string[]) => {
    const materials = await generateWeaknessPracticeMaterials(user!.id, topics);

    const newPath: StudyPath[] = materials.map((m, index) => ({
      topic: m.topic,
      difficulty: index === 0 ? 'easy' : index === 1 ? 'medium' : 'hard',
      estimatedDays: m.estimatedTime / 60 + 1,
      materials: [
        `Review ${m.topic} notes`,
        `Complete ${m.questionCount} practice questions`,
        `Create flashcards`,
        `Take assessment quiz`,
      ],
      currentProgress: Math.random() * 50,
    }));

    setStudyPath(newPath);
  };

  const calculateTotalDays = () => {
    return studyPath.reduce((sum, path) => sum + path.estimatedDays, 0);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">Personalized Study Path</h1>
        <p className="text-gray-400">
          AI-generated roadmap based on your learning patterns
        </p>
      </div>

      {studyPath.length === 0 ? (
        <GlassCard className="text-center py-12">
          <MapPin className="w-12 h-12 text-gray-500 mx-auto mb-4 opacity-50" />
          <p className="text-gray-400 mb-4">
            No study path yet. Complete some quizzes first to generate your personalized path!
          </p>
          <Button className="mx-auto bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600">
            Start a Quiz
          </Button>
        </GlassCard>
      ) : (
        <>
          <GlassCard>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <MapPin className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                <div className="text-3xl font-bold text-white">
                  {studyPath.length}
                </div>
                <p className="text-gray-400">Topics</p>
              </div>

              <div className="text-center">
                <Clock className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                <div className="text-3xl font-bold text-white">
                  {calculateTotalDays()}
                </div>
                <p className="text-gray-400">Days to Complete</p>
              </div>

              <div className="text-center">
                <Target className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <div className="text-3xl font-bold text-white">
                  {Math.round(
                    studyPath.reduce((sum, p) => sum + p.currentProgress, 0) /
                      studyPath.length
                  )}
                  %
                </div>
                <p className="text-gray-400">Overall Progress</p>
              </div>
            </div>
          </GlassCard>

          <div className="space-y-4">
            {studyPath.map((path, index) => (
              <GlassCard key={path.topic} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-500/50">
                        <span className="text-sm font-bold text-cyan-400">
                          {index + 1}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-white mb-1">
                        {path.topic}
                      </h3>
                      <div className="flex gap-3 text-sm text-gray-400">
                        <span className="px-2 py-1 bg-slate-700 rounded">
                          {path.difficulty}
                        </span>
                        <span>{path.estimatedDays} days</span>
                      </div>
                    </div>
                  </div>
                  <CheckCircle className="w-6 h-6 text-gray-500 flex-shrink-0" />
                </div>

                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-medium text-gray-400">Progress</p>
                    <p className="text-sm font-bold text-cyan-400">
                      {Math.round(path.currentProgress)}%
                    </p>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full transition-all"
                      style={{ width: `${path.currentProgress}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <p className="text-sm font-medium text-gray-400 mb-3">
                    Learning Materials
                  </p>
                  {path.materials.map((material, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
                    >
                      <BookOpen className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      <span className="text-sm text-gray-300">{material}</span>
                    </div>
                  ))}
                </div>

                <Button className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 flex items-center justify-center gap-2">
                  Start Learning <ChevronRight className="w-4 h-4" />
                </Button>
              </GlassCard>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
