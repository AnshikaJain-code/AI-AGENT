import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/auth-store';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { GlassCard } from '../components/GlassCard';
import { Button } from '../components/Button';
import { Database } from '../types/database';
import { Plus, ThumbsUp, User, Calendar, Tag, MessageCircle } from 'lucide-react';

type StudyTip = Database['public']['Tables']['study_tips']['Row'];

interface TipWithUser extends StudyTip {
  author?: string;
}

export function StudyTipsPage() {
  const { user } = useAuthStore();
  const [tips, setTips] = useState<TipWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    topic: '',
  });
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  useEffect(() => {
    loadTips();
  }, []);

  const loadTips = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('study_tips')
        .select('*')
        .order('upvotes', { ascending: false })
        .limit(50);

      setTips(
        (data || []).map((tip) => ({
          ...tip,
          author: `User ${tip.user_id.substring(0, 8)}`,
        }))
      );
    } catch (error) {
      console.error('Failed to load tips:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTip = async () => {
    if (!formData.title || !formData.content || !user) return;

    try {
      const { data: newTip } = await supabase
        .from('study_tips')
        .insert({
          user_id: user.id,
          title: formData.title,
          content: formData.content,
          topic: formData.topic || null,
        })
        .select()
        .single();

      if (newTip) {
        setTips((prev) => [
          {
            ...newTip,
            author: `You`,
          },
          ...prev,
        ]);
        setFormData({ title: '', content: '', topic: '' });
        setShowForm(false);
      }
    } catch (error) {
      console.error('Failed to add tip:', error);
    }
  };

  const upvoteTip = async (tipId: string, currentUpvotes: number) => {
    try {
      await supabase
        .from('study_tips')
        .update({ upvotes: currentUpvotes + 1 })
        .eq('id', tipId);

      setTips((prev) =>
        prev.map((tip) =>
          tip.id === tipId ? { ...tip, upvotes: currentUpvotes + 1 } : tip
        )
      );
    } catch (error) {
      console.error('Failed to upvote tip:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  const topics = Array.from(new Set(tips.map((t) => t.topic).filter(Boolean)));
  const filteredTips = selectedTopic
    ? tips.filter((t) => t.topic === selectedTopic)
    : tips;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Study Tips</h1>
          <p className="text-gray-400">Share and learn from the community</p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          Share Tip
        </Button>
      </div>

      {showForm && (
        <GlassCard>
          <h3 className="text-xl font-semibold text-white mb-4">Share a Study Tip</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="e.g., How to remember the periodic table"
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Your Tip
              </label>
              <textarea
                value={formData.content}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, content: e.target.value }))
                }
                placeholder="Share your best study strategy..."
                rows={5}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Topic (optional)
              </label>
              <input
                type="text"
                value={formData.topic}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, topic: e.target.value }))
                }
                placeholder="e.g., Chemistry, Time Management"
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div className="flex gap-3">
              <Button
                onClick={addTip}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
              >
                Share Tip
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

      {topics.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedTopic(null)}
            className={`px-4 py-2 rounded-full font-medium transition-all ${
              selectedTopic === null
                ? 'bg-cyan-500 text-white'
                : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
            }`}
          >
            All Topics
          </button>
          {topics.map((topic) => (
            <button
              key={topic}
              onClick={() => setSelectedTopic(topic)}
              className={`px-4 py-2 rounded-full font-medium transition-all ${
                selectedTopic === topic
                  ? 'bg-cyan-500 text-white'
                  : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
              }`}
            >
              {topic}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-4">
        {filteredTips.length === 0 ? (
          <GlassCard className="text-center py-12">
            <MessageCircle className="w-12 h-12 text-gray-500 mx-auto mb-4 opacity-50" />
            <p className="text-gray-400">
              No tips yet. Be the first to share your study strategies!
            </p>
          </GlassCard>
        ) : (
          filteredTips.map((tip) => (
            <GlassCard
              key={tip.id}
              className="p-6 hover:border-cyan-400/50 transition-all"
            >
              {tip.is_featured && (
                <div className="mb-3 inline-block px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-xs font-medium">
                  Featured
                </div>
              )}

              <h3 className="text-xl font-semibold text-white mb-2">
                {tip.title}
              </h3>

              <p className="text-gray-300 mb-4 leading-relaxed">
                {tip.content}
              </p>

              <div className="flex flex-wrap gap-3 mb-4">
                {tip.topic && (
                  <div className="flex items-center gap-1 text-sm text-gray-400">
                    <Tag className="w-4 h-4" />
                    {tip.topic}
                  </div>
                )}
                <div className="flex items-center gap-1 text-sm text-gray-400">
                  <User className="w-4 h-4" />
                  {tip.author}
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-400">
                  <Calendar className="w-4 h-4" />
                  {new Date(tip.created_at).toLocaleDateString()}
                </div>
              </div>

              <button
                onClick={() => upvoteTip(tip.id, tip.upvotes)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-gray-300 transition-colors"
              >
                <ThumbsUp className="w-4 h-4" />
                Helpful ({tip.upvotes})
              </button>
            </GlassCard>
          ))
        )}
      </div>
    </div>
  );
}
