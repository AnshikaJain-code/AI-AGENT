import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/auth-store';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { GlassCard } from '../components/GlassCard';
import { Database } from '../types/database';
import {
  Flame,
  Award,
  Target,
  Calendar,
  Clock,
  Zap,
  Lock,
  Star,
} from 'lucide-react';

type UserStats = Database['public']['Tables']['user_stats']['Row'];
type Badge = Database['public']['Tables']['achievement_badges']['Row'];

export function AchievementsPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [userAchievements, setUserAchievements] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, badgesRes, achievementsRes] = await Promise.all([
        supabase
          .from('user_stats')
          .select('*')
          .eq('user_id', user!.id)
          .maybeSingle(),
        supabase.from('achievement_badges').select('*'),
        supabase
          .from('user_achievements')
          .select('badge_id')
          .eq('user_id', user!.id),
      ]);

      setStats(statsRes.data);
      setBadges(badgesRes.data || []);
      setUserAchievements(
        (achievementsRes.data || []).map((a) => a.badge_id)
      );
    } catch (error) {
      console.error('Failed to load achievements:', error);
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

  const getIconForBadge = (requirement: string) => {
    switch (requirement) {
      case 'streak':
        return <Flame className="w-6 h-6" />;
      case 'time':
        return <Clock className="w-6 h-6" />;
      case 'accuracy':
        return <Target className="w-6 h-6" />;
      case 'quizzes':
        return <Award className="w-6 h-6" />;
      case 'topics':
        return <Zap className="w-6 h-6" />;
      default:
        return <Star className="w-6 h-6" />;
    }
  };

  const earnedBadges = badges.filter((b) => userAchievements.includes(b.id));
  const lockedBadges = badges.filter((b) => !userAchievements.includes(b.id));

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold text-white mb-8">Achievements</h1>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <GlassCard className="text-center p-6">
            <div className="flex justify-center mb-3">
              <Flame className="w-8 h-8 text-orange-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {stats.current_streak}
            </div>
            <p className="text-gray-400 text-sm">Current Streak</p>
            <p className="text-gray-500 text-xs mt-2">
              Best: {stats.longest_streak}
            </p>
          </GlassCard>

          <GlassCard className="text-center p-6">
            <div className="flex justify-center mb-3">
              <Clock className="w-8 h-8 text-blue-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {Math.floor(stats.total_study_minutes / 60)}h
            </div>
            <p className="text-gray-400 text-sm">Total Study Time</p>
            <p className="text-gray-500 text-xs mt-2">
              {stats.total_study_minutes % 60}m today
            </p>
          </GlassCard>

          <GlassCard className="text-center p-6">
            <div className="flex justify-center mb-3">
              <Target className="w-8 h-8 text-cyan-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {Math.round(stats.mastery_score)}%
            </div>
            <p className="text-gray-400 text-sm">Mastery Score</p>
          </GlassCard>

          <GlassCard className="text-center p-6">
            <div className="flex justify-center mb-3">
              <Award className="w-8 h-8 text-yellow-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {earnedBadges.length}
            </div>
            <p className="text-gray-400 text-sm">Badges Earned</p>
            <p className="text-gray-500 text-xs mt-2">
              {lockedBadges.length} to unlock
            </p>
          </GlassCard>
        </div>
      )}

      {stats && stats.weak_topics.length > 0 && (
        <GlassCard>
          <h3 className="text-lg font-semibold text-white mb-4">
            Focus Areas
          </h3>
          <div className="flex flex-wrap gap-2">
            {stats.weak_topics.map((topic) => (
              <span
                key={topic}
                className="px-3 py-1 bg-red-500/20 text-red-300 rounded-full text-sm"
              >
                {topic}
              </span>
            ))}
          </div>
        </GlassCard>
      )}

      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Badges</h2>

        {earnedBadges.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-3 text-green-400">
              Earned
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {earnedBadges.map((badge) => (
                <GlassCard
                  key={badge.id}
                  className="p-6 text-center border border-green-500/30 bg-green-500/5 hover:bg-green-500/10 transition-colors"
                >
                  <div className="flex justify-center mb-3">
                    {getIconForBadge(badge.requirement_type)}
                  </div>
                  <h4 className="text-white font-semibold mb-2">
                    {badge.name}
                  </h4>
                  <p className="text-gray-400 text-sm mb-3">
                    {badge.description}
                  </p>
                  <div className="bg-green-500/20 border border-green-500/50 rounded px-2 py-1 inline-block text-xs text-green-300">
                    {badge.requirement_type}: {badge.requirement_value}
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        )}

        {lockedBadges.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-3 text-gray-400">
              Locked
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lockedBadges.map((badge) => {
                let progress = 0;
                if (stats) {
                  switch (badge.requirement_type) {
                    case 'streak':
                      progress = (stats.current_streak / badge.requirement_value) * 100;
                      break;
                    case 'time':
                      progress =
                        (stats.total_study_minutes / badge.requirement_value) *
                        100;
                      break;
                    case 'accuracy':
                      progress = (stats.mastery_score / badge.requirement_value) * 100;
                      break;
                  }
                }

                return (
                  <GlassCard
                    key={badge.id}
                    className="p-6 text-center opacity-50 hover:opacity-75 transition-opacity"
                  >
                    <div className="flex justify-center mb-3 text-gray-600">
                      {getIconForBadge(badge.requirement_type)}
                      <Lock className="w-3 h-3 absolute mt-2 ml-2 text-gray-500" />
                    </div>
                    <h4 className="text-gray-400 font-semibold mb-2">
                      {badge.name}
                    </h4>
                    <p className="text-gray-500 text-sm mb-3">
                      {badge.description}
                    </p>
                    <div className="mb-2 w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full transition-all"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      {Math.round(Math.min(progress, 100))}%
                    </p>
                  </GlassCard>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
