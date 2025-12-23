import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/auth-store';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { GlassCard } from '../components/GlassCard';
import { Button } from '../components/Button';
import { Database } from '../types/database';
import {
  Trophy,
  Flame,
  Users,
  Plus,
  Crown,
  Award,
  TrendingUp,
} from 'lucide-react';

type LeaderboardEntry = Database['public']['Tables']['leaderboard_cache']['Row'];
type StudyGroup = Database['public']['Tables']['study_groups']['Row'];

interface GroupWithMembers extends StudyGroup {
  memberCount: number;
}

export function LeaderboardPage() {
  const { user } = useAuthStore();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [groups, setGroups] = useState<GroupWithMembers[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'leaderboard' | 'groups'>(
    'leaderboard'
  );
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupForm, setGroupForm] = useState({
    name: '',
    description: '',
    subject: '',
    isPublic: true,
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [leaderRes, groupsRes, membersRes] = await Promise.all([
        supabase
          .from('leaderboard_cache')
          .select('*')
          .order('score', { ascending: false })
          .limit(100),
        supabase.from('study_groups').select('*'),
        supabase.from('study_group_members').select('group_id'),
      ]);

      setLeaderboard(leaderRes.data || []);

      const memberCounts = new Map<string, number>();
      (membersRes.data || []).forEach((m) => {
        memberCounts.set(
          m.group_id,
          (memberCounts.get(m.group_id) || 0) + 1
        );
      });

      const groupsWithCounts = (groupsRes.data || []).map((g) => ({
        ...g,
        memberCount: memberCounts.get(g.id) || 0,
      }));

      setGroups(groupsWithCounts);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createGroup = async () => {
    if (!groupForm.name || !user) return;

    try {
      const { data: newGroup } = await supabase
        .from('study_groups')
        .insert({
          creator_id: user.id,
          name: groupForm.name,
          description: groupForm.description || null,
          subject: groupForm.subject || null,
          is_public: groupForm.isPublic,
        })
        .select()
        .single();

      if (newGroup) {
        await supabase.from('study_group_members').insert({
          group_id: newGroup.id,
          user_id: user.id,
        });

        setGroups((prev) => [
          ...prev,
          { ...newGroup, memberCount: 1 },
        ]);
        setGroupForm({ name: '', description: '', subject: '', isPublic: true });
        setShowCreateGroup(false);
      }
    } catch (error) {
      console.error('Failed to create group:', error);
    }
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
        <h1 className="text-4xl font-bold text-white mb-2">Community</h1>
        <p className="text-gray-400">Compete with others and join study groups</p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setSelectedTab('leaderboard')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            selectedTab === 'leaderboard'
              ? 'bg-cyan-500 text-white'
              : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
          }`}
        >
          <Trophy className="w-4 h-4 inline mr-2" />
          Leaderboard
        </button>
        <button
          onClick={() => setSelectedTab('groups')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            selectedTab === 'groups'
              ? 'bg-cyan-500 text-white'
              : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
          }`}
        >
          <Users className="w-4 h-4 inline mr-2" />
          Study Groups
        </button>
      </div>

      {selectedTab === 'leaderboard' ? (
        <div className="space-y-4">
          <GlassCard>
            <h2 className="text-2xl font-bold text-white mb-6">Top Scholars</h2>

            {leaderboard.length === 0 ? (
              <p className="text-gray-400 text-center py-8">
                Start studying to appear on the leaderboard!
              </p>
            ) : (
              <div className="space-y-2">
                {leaderboard.slice(0, 20).map((entry, index) => (
                  <div
                    key={entry.id}
                    className={`flex items-center gap-4 p-4 rounded-lg transition-all ${
                      index === 0
                        ? 'bg-yellow-500/20 border border-yellow-500/50'
                        : index === 1
                          ? 'bg-gray-400/20 border border-gray-500/50'
                          : index === 2
                            ? 'bg-orange-500/20 border border-orange-500/50'
                            : 'bg-slate-800/50 hover:bg-slate-700/50'
                    }`}
                  >
                    <div className="flex-shrink-0 text-center w-10">
                      {index === 0 ? (
                        <Crown className="w-6 h-6 text-yellow-400 mx-auto" />
                      ) : index < 3 ? (
                        <Award className="w-6 h-6 text-gray-400 mx-auto" />
                      ) : (
                        <span className="text-lg font-bold text-gray-500">
                          #{index + 1}
                        </span>
                      )}
                    </div>

                    <div className="flex-1">
                      <p className="font-semibold text-white">
                        User {entry.user_id.substring(0, 8)}
                      </p>
                      {entry.streak && (
                        <div className="flex items-center gap-1 text-sm text-orange-300">
                          <Flame className="w-3 h-3" />
                          {entry.streak} day streak
                        </div>
                      )}
                    </div>

                    <div className="text-right">
                      <div className="text-xl font-bold text-cyan-400">
                        {Math.round(entry.score)}
                      </div>
                      <p className="text-xs text-gray-400">points</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={() => setShowCreateGroup(!showCreateGroup)}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Group
            </Button>
          </div>

          {showCreateGroup && (
            <GlassCard>
              <h3 className="text-xl font-semibold text-white mb-4">
                Create Study Group
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Group Name
                  </label>
                  <input
                    type="text"
                    value={groupForm.name}
                    onChange={(e) =>
                      setGroupForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="e.g., Biology Buddies"
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Description
                  </label>
                  <textarea
                    value={groupForm.description}
                    onChange={(e) =>
                      setGroupForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="What's your group about?"
                    rows={3}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Subject (optional)
                  </label>
                  <input
                    type="text"
                    value={groupForm.subject}
                    onChange={(e) =>
                      setGroupForm((prev) => ({ ...prev, subject: e.target.value }))
                    }
                    placeholder="e.g., Biology"
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <label className="flex items-center gap-3 text-white">
                  <input
                    type="checkbox"
                    checked={groupForm.isPublic}
                    onChange={(e) =>
                      setGroupForm((prev) => ({ ...prev, isPublic: e.target.checked }))
                    }
                    className="w-4 h-4"
                  />
                  Make this group public
                </label>
                <div className="flex gap-3">
                  <Button
                    onClick={createGroup}
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                  >
                    Create
                  </Button>
                  <Button
                    onClick={() => setShowCreateGroup(false)}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-gray-300"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </GlassCard>
          )}

          {groups.length === 0 ? (
            <GlassCard className="text-center py-12">
              <Users className="w-12 h-12 text-gray-500 mx-auto mb-4 opacity-50" />
              <p className="text-gray-400">
                No study groups yet. Create one or join a public group!
              </p>
            </GlassCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {groups.map((group) => (
                <GlassCard key={group.id} className="p-6 hover:border-cyan-400/50 transition-all">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {group.name}
                      </h3>
                      {group.subject && (
                        <p className="text-sm text-gray-400">{group.subject}</p>
                      )}
                    </div>
                    {group.is_public && (
                      <span className="px-2 py-1 bg-emerald-500/20 text-emerald-300 rounded text-xs">
                        Public
                      </span>
                    )}
                  </div>

                  {group.description && (
                    <p className="text-sm text-gray-400 mb-4">{group.description}</p>
                  )}

                  <div className="flex items-center gap-2 mb-4 text-sm text-gray-400">
                    <Users className="w-4 h-4" />
                    {group.memberCount} members
                  </div>

                  <Button className="w-full bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300">
                    {group.creator_id === user?.id ? 'Manage' : 'Join Group'}
                  </Button>
                </GlassCard>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
