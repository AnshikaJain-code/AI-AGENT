import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/auth-store';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Button } from '../components/Button';
import { GlassCard } from '../components/GlassCard';
import {
  calculateNextReview,
  initializeFlashcardReview,
  getFlashcardsDueForReview,
} from '../lib/spaced-repetition';
import {
  updateStreakIfNeeded,
  updateStudyTime,
  checkAndAwardAchievements,
  updateMasteryScore,
} from '../lib/user-stats-service';
import { Database } from '../types/database';
import {
  RotateCw,
  Plus,
  Trash2,
  Play,
  CheckCircle,
  XCircle,
} from 'lucide-react';

type Flashcard = Database['public']['Tables']['flashcards']['Row'];
type FlashcardReview = Database['public']['Tables']['flashcard_reviews']['Row'];

interface CardWithReview extends Flashcard {
  review?: FlashcardReview;
}

export function FlashcardsPage() {
  const { user } = useAuthStore();
  const [flashcards, setFlashcards] = useState<CardWithReview[]>([]);
  const [dueCards, setDueCards] = useState<string[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newCard, setNewCard] = useState({ question: '', answer: '', topic: '' });
  const [sessionTime, setSessionTime] = useState(0);

  useEffect(() => {
    if (user) {
      loadFlashcards();
    }
  }, [user]);

  useEffect(() => {
    if (isReviewing) {
      const timer = setInterval(() => {
        setSessionTime((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isReviewing]);

  const loadFlashcards = async () => {
    setLoading(true);
    try {
      const { data: cards } = await supabase
        .from('flashcards')
        .select('*')
        .eq('user_id', user!.id);

      const { data: reviews } = await supabase
        .from('flashcard_reviews')
        .select('*')
        .eq('user_id', user!.id);

      const cardsWithReviews = (cards || []).map((card) => ({
        ...card,
        review: reviews?.find((r) => r.flashcard_id === card.id),
      }));

      setFlashcards(cardsWithReviews);

      const due = getFlashcardsDueForReview(
        cardsWithReviews.map((c) => ({
          id: c.id,
          review: c.review || initializeFlashcardReview(),
        }))
      );

      setDueCards(due);
    } catch (error) {
      console.error('Failed to load flashcards:', error);
    } finally {
      setLoading(false);
    }
  };

  const addFlashcard = async () => {
    if (!newCard.question || !newCard.answer || !user) return;

    try {
      const { data: card } = await supabase
        .from('flashcards')
        .insert({
          user_id: user.id,
          question: newCard.question,
          answer: newCard.answer,
          topic: newCard.topic || null,
        })
        .select()
        .single();

      if (card) {
        const { data: review } = await supabase
          .from('flashcard_reviews')
          .insert({
            flashcard_id: card.id,
            user_id: user.id,
            ...initializeFlashcardReview(),
          })
          .select()
          .single();

        setFlashcards((prev) => [...prev, { ...card, review }]);
        setNewCard({ question: '', answer: '', topic: '' });
        setShowForm(false);
      }
    } catch (error) {
      console.error('Failed to add flashcard:', error);
    }
  };

  const deleteFlashcard = async (cardId: string) => {
    try {
      await supabase.from('flashcards').delete().eq('id', cardId);
      setFlashcards((prev) => prev.filter((c) => c.id !== cardId));
      setDueCards((prev) => prev.filter((id) => id !== cardId));
    } catch (error) {
      console.error('Failed to delete flashcard:', error);
    }
  };

  const handleReviewResult = async (quality: 0 | 1 | 2 | 3 | 4 | 5) => {
    const currentCard = flashcards[currentCardIndex];
    if (!currentCard?.review || !user) return;

    try {
      const newReviewState = calculateNextReview(currentCard.review, {
        quality,
      });

      await supabase
        .from('flashcard_reviews')
        .update({
          ease_factor: newReviewState.easeFactor,
          interval_days: newReviewState.intervalDays,
          next_review_date: newReviewState.nextReviewDate.toISOString(),
          review_count: newReviewState.reviewCount,
          correct_count: newReviewState.correctCount,
          last_reviewed_at: new Date().toISOString(),
        })
        .eq('flashcard_id', currentCard.id);

      setFlashcards((prev) =>
        prev.map((c) =>
          c.id === currentCard.id
            ? { ...c, review: { ...c.review!, ...newReviewState } }
            : c
        )
      );

      if (currentCardIndex < dueCards.length - 1) {
        setCurrentCardIndex((prev) => prev + 1);
        setIsFlipped(false);
      } else {
        await finishSession();
      }
    } catch (error) {
      console.error('Failed to update review:', error);
    }
  };

  const finishSession = async () => {
    if (!user) return;

    const minutes = Math.floor(sessionTime / 60);
    await updateStreakIfNeeded(user.id);
    if (minutes > 0) {
      await updateStudyTime(user.id, minutes);
    }
    await updateMasteryScore(user.id);
    await checkAndAwardAchievements(user.id);

    setIsReviewing(false);
    setSessionTime(0);
    await loadFlashcards();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  if (isReviewing && dueCards.length > 0) {
    const currentCard = flashcards[currentCardIndex];

    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">
              Card {currentCardIndex + 1} of {dueCards.length}
            </h2>
            <button
              onClick={() => finishSession()}
              className="text-sm text-gray-400 hover:text-gray-200 transition-colors"
            >
              Exit Session
            </button>
          </div>

          <div className="bg-gradient-to-r from-cyan-900 to-blue-900 rounded-lg p-1 h-2">
            <div
              className="bg-gradient-to-r from-cyan-400 to-blue-400 h-full rounded-lg transition-all"
              style={{
                width: `${((currentCardIndex + 1) / dueCards.length) * 100}%`,
              }}
            />
          </div>
        </div>

        <GlassCard
          className="min-h-64 flex flex-col justify-center items-center cursor-pointer hover:scale-105 transition-transform"
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <p className="text-center text-gray-400 text-sm mb-4">
            {isFlipped ? 'Answer' : 'Question'}
          </p>
          <p className="text-center text-2xl font-semibold text-white">
            {isFlipped ? currentCard?.answer : currentCard?.question}
          </p>
          <p className="text-center text-gray-500 text-sm mt-8">
            Click to {isFlipped ? 'show question' : 'reveal answer'}
          </p>
        </GlassCard>

        {isFlipped && (
          <div className="mt-8 space-y-3">
            <p className="text-center text-gray-400 text-sm">
              How well did you remember this?
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { quality: 1, label: 'Again', color: 'from-red-600 to-red-700' },
                { quality: 2, label: 'Hard', color: 'from-orange-600 to-orange-700' },
                { quality: 3, label: 'Good', color: 'from-yellow-600 to-yellow-700' },
                { quality: 4, label: 'Easy', color: 'from-green-600 to-green-700' },
                { quality: 5, label: 'Perfect', color: 'from-blue-600 to-blue-700' },
              ].map(({ quality, label, color }) => (
                <button
                  key={quality}
                  onClick={() => handleReviewResult(quality as any)}
                  className={`py-3 rounded-lg font-semibold text-white transition-all hover:scale-105 bg-gradient-to-br ${color}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Flashcards</h1>
          <p className="text-gray-400">
            {dueCards.length} cards due for review today
          </p>
        </div>
        <div className="flex gap-3">
          {dueCards.length > 0 && (
            <Button
              onClick={() => {
                setIsReviewing(true);
                setCurrentCardIndex(0);
                setIsFlipped(false);
                setSessionTime(0);
              }}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
            >
              <Play className="w-4 h-4 mr-2" />
              Start Review ({dueCards.length})
            </Button>
          )}
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Card
          </Button>
        </div>
      </div>

      {showForm && (
        <GlassCard>
          <h3 className="text-xl font-semibold text-white mb-4">Add Flashcard</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Question
              </label>
              <input
                type="text"
                value={newCard.question}
                onChange={(e) =>
                  setNewCard((prev) => ({ ...prev, question: e.target.value }))
                }
                placeholder="Enter question"
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Answer
              </label>
              <textarea
                value={newCard.answer}
                onChange={(e) =>
                  setNewCard((prev) => ({ ...prev, answer: e.target.value }))
                }
                placeholder="Enter answer"
                rows={3}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Topic (optional)
              </label>
              <input
                type="text"
                value={newCard.topic}
                onChange={(e) =>
                  setNewCard((prev) => ({ ...prev, topic: e.target.value }))
                }
                placeholder="e.g., Biology, History"
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div className="flex gap-3">
              <Button
                onClick={addFlashcard}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
              >
                Add Card
              </Button>
              <Button
                onClick={() => setShowForm(false)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-gray-300"
              >
                Cancel
              </Button>
            </div>
          </div>
        </GlassCard>
      )}

      {flashcards.length === 0 ? (
        <GlassCard className="text-center py-12">
          <RotateCw className="w-12 h-12 text-gray-500 mx-auto mb-4 opacity-50" />
          <p className="text-gray-400">No flashcards yet. Create one to get started!</p>
        </GlassCard>
      ) : (
        <div className="grid gap-4">
          {flashcards.map((card, index) => {
            const isDue = dueCards.includes(card.id);
            const accuracy = card.review
              ? (card.review.correct_count /
                  Math.max(card.review.review_count, 1)) *
                100
              : 0;

            return (
              <GlassCard
                key={card.id}
                className="flex justify-between items-center p-4"
              >
                <div className="flex-1">
                  <p className="text-white font-semibold mb-2">{card.question}</p>
                  <div className="flex gap-4 text-sm text-gray-400">
                    {card.topic && <span>Topic: {card.topic}</span>}
                    {card.review && (
                      <>
                        <span>Reviews: {card.review.review_count}</span>
                        <span>Accuracy: {accuracy.toFixed(0)}%</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {isDue && (
                    <span className="flex items-center gap-1 text-amber-400 text-sm">
                      <RotateCw className="w-4 h-4" />
                      Due
                    </span>
                  )}
                  <button
                    onClick={() => deleteFlashcard(card.id)}
                    className="text-red-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
