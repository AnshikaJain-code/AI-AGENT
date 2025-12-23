import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export async function initializeUserStats(userId: string) {
  const { data: existing } = await supabase
    .from('user_stats')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (!existing) {
    await supabase.from('user_stats').insert({
      user_id: userId,
      current_streak: 0,
      longest_streak: 0,
      total_study_minutes: 0,
      weak_topics: [],
      mastery_score: 0,
    });
  }
}

export async function updateStreakIfNeeded(userId: string): Promise<number> {
  const { data: stats } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (!stats) return 0;

  const lastStudyDate = stats.last_study_date
    ? new Date(stats.last_study_date)
    : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let newStreak = stats.current_streak;
  let newLongestStreak = stats.longest_streak;

  if (lastStudyDate) {
    const lastDate = new Date(lastStudyDate);
    lastDate.setHours(0, 0, 0, 0);

    const daysDiff = Math.floor(
      (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff === 1) {
      newStreak = stats.current_streak + 1;
    } else if (daysDiff > 1) {
      newStreak = 1;
    }
  } else {
    newStreak = 1;
  }

  if (newStreak > newLongestStreak) {
    newLongestStreak = newStreak;
  }

  await supabase
    .from('user_stats')
    .update({
      current_streak: newStreak,
      longest_streak: newLongestStreak,
      last_study_date: today.toISOString(),
    })
    .eq('user_id', userId);

  return newStreak;
}

export async function updateStudyTime(
  userId: string,
  minutesToAdd: number
): Promise<number> {
  const { data: stats } = await supabase
    .from('user_stats')
    .select('total_study_minutes')
    .eq('user_id', userId)
    .maybeSingle();

  const newTotal = (stats?.total_study_minutes || 0) + minutesToAdd;

  await supabase
    .from('user_stats')
    .update({
      total_study_minutes: newTotal,
    })
    .eq('user_id', userId);

  return newTotal;
}

export async function updateWeakTopics(
  userId: string,
  quizDetails: Array<{
    question: string;
    topic?: string;
    isCorrect: boolean;
  }>
) {
  const { data: stats } = await supabase
    .from('user_stats')
    .select('weak_topics')
    .eq('user_id', userId)
    .maybeSingle();

  const weakTopics = new Map<string, number>();

  (stats?.weak_topics || []).forEach((topic) => {
    weakTopics.set(topic, (weakTopics.get(topic) || 0) + 1);
  });

  quizDetails.forEach((detail) => {
    if (!detail.isCorrect && detail.topic) {
      weakTopics.set(detail.topic, (weakTopics.get(detail.topic) || 0) + 1);
    }
  });

  const topWeakTopics = Array.from(weakTopics.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([topic]) => topic);

  await supabase
    .from('user_stats')
    .update({
      weak_topics: topWeakTopics,
    })
    .eq('user_id', userId);

  return topWeakTopics;
}

export async function calculateMasteryScore(userId: string): Promise<number> {
  const { data: attempts } = await supabase
    .from('quiz_attempts')
    .select('score, difficulty')
    .eq('user_id', userId);

  if (!attempts || attempts.length === 0) return 0;

  const difficultyWeights = { easy: 1, medium: 2, hard: 3 };
  let weightedScore = 0;
  let totalWeight = 0;

  attempts.forEach((attempt) => {
    const weight = difficultyWeights[attempt.difficulty];
    weightedScore += (attempt.score / 100) * weight;
    totalWeight += weight;
  });

  return totalWeight > 0 ? (weightedScore / totalWeight) * 100 : 0;
}

export async function updateMasteryScore(userId: string): Promise<number> {
  const score = await calculateMasteryScore(userId);

  await supabase
    .from('user_stats')
    .update({
      mastery_score: score,
    })
    .eq('user_id', userId);

  return score;
}

export async function checkAndAwardAchievements(
  userId: string
): Promise<string[]> {
  const { data: stats } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  const { data: badges } = await supabase
    .from('achievement_badges')
    .select('*');

  const { data: earned } = await supabase
    .from('user_achievements')
    .select('badge_id')
    .eq('user_id', userId);

  const earnedIds = new Set(earned?.map((e) => e.badge_id) || []);
  const newAchievements: string[] = [];

  if (!stats || !badges) return newAchievements;

  for (const badge of badges) {
    if (earnedIds.has(badge.id)) continue;

    let shouldAward = false;

    switch (badge.requirement_type) {
      case 'streak':
        shouldAward = stats.current_streak >= badge.requirement_value;
        break;
      case 'time':
        shouldAward = stats.total_study_minutes >= badge.requirement_value;
        break;
      case 'accuracy':
        shouldAward = stats.mastery_score >= badge.requirement_value;
        break;
    }

    if (shouldAward) {
      await supabase.from('user_achievements').insert({
        user_id: userId,
        badge_id: badge.id,
      });
      newAchievements.push(badge.id);
    }
  }

  return newAchievements;
}
