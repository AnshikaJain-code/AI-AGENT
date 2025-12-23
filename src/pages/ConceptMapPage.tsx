import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/auth-store';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { GlassCard } from '../components/GlassCard';
import { Button } from '../components/Button';
import { Database } from '../types/database';
import { Plus, Trash2, Edit2, Zap } from 'lucide-react';

type ConceptMap = Database['public']['Tables']['concept_map']['Row'];

interface Concept {
  id: string;
  name: string;
  level: number;
}

export function ConceptMapPage() {
  const { user } = useAuthStore();
  const [maps, setMaps] = useState<ConceptMap[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMap, setSelectedMap] = useState<ConceptMap | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ subject: '', concepts: '' });

  useEffect(() => {
    if (user) {
      loadMaps();
    }
  }, [user]);

  const loadMaps = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('concept_map')
        .select('*')
        .eq('user_id', user!.id);
      setMaps(data || []);
    } catch (error) {
      console.error('Failed to load concept maps:', error);
    } finally {
      setLoading(false);
    }
  };

  const createMap = async () => {
    if (!formData.subject || !formData.concepts || !user) return;

    try {
      const concepts = formData.concepts
        .split(',')
        .map((c, i) => ({ id: `c-${i}`, name: c.trim(), level: 0 }));

      const { data: newMap } = await supabase
        .from('concept_map')
        .insert({
          user_id: user.id,
          subject: formData.subject,
          concepts: { items: concepts },
          relationships: { edges: [] },
        })
        .select()
        .single();

      if (newMap) {
        setMaps((prev) => [...prev, newMap]);
        setFormData({ subject: '', concepts: '' });
        setShowForm(false);
      }
    } catch (error) {
      console.error('Failed to create concept map:', error);
    }
  };

  const deleteMap = async (id: string) => {
    try {
      await supabase.from('concept_map').delete().eq('id', id);
      setMaps((prev) => prev.filter((m) => m.id !== id));
      setSelectedMap(null);
    } catch (error) {
      console.error('Failed to delete concept map:', error);
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Concept Maps</h1>
          <p className="text-gray-400">Visualize topic relationships and connections</p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Map
        </Button>
      </div>

      {showForm && (
        <GlassCard>
          <h3 className="text-xl font-semibold text-white mb-4">Create Concept Map</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Subject
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, subject: e.target.value }))
                }
                placeholder="e.g., Biology, Physics"
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Concepts (comma-separated)
              </label>
              <textarea
                value={formData.concepts}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, concepts: e.target.value }))
                }
                placeholder="e.g., Cell, Mitochondria, DNA, Photosynthesis"
                rows={4}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 resize-none"
              />
            </div>
            <div className="flex gap-3">
              <Button
                onClick={createMap}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
              >
                Create Map
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

      {maps.length === 0 ? (
        <GlassCard className="text-center py-12">
          <Zap className="w-12 h-12 text-gray-500 mx-auto mb-4 opacity-50" />
          <p className="text-gray-400 mb-4">No concept maps yet. Create one to visualize your topics!</p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {maps.map((map) => (
            <GlassCard
              key={map.id}
              className="cursor-pointer hover:border-cyan-400/50 transition-all p-4"
              onClick={() => setSelectedMap(map)}
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold text-white">{map.subject}</h3>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteMap(map.id);
                  }}
                  className="text-red-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-slate-800 rounded-lg p-3 mb-3">
                <div className="flex flex-wrap gap-2">
                  {Array.isArray(map.concepts) ? (
                    (map.concepts as any[]).map((c, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-cyan-500/20 text-cyan-300 rounded text-xs"
                      >
                        {c.name || c}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500 text-xs">No concepts</span>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button className="flex-1 bg-slate-700 hover:bg-slate-600 text-sm py-2">
                  <Edit2 className="w-3 h-3 mr-1" />
                  Edit
                </Button>
                <Button className="flex-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-sm py-2">
                  View Map
                </Button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {selectedMap && (
        <GlassCard className="border-l-4 border-cyan-500">
          <h3 className="text-xl font-semibold text-white mb-4">
            {selectedMap.subject} - Map Preview
          </h3>
          <div className="bg-slate-800 rounded-lg p-6 mb-4">
            <svg className="w-full h-64 bg-slate-900 rounded" viewBox="0 0 400 300">
              <circle cx="200" cy="150" r="40" fill="#06b6d4" opacity="0.3" stroke="#06b6d4" />
              <text x="200" y="150" textAnchor="middle" dy="0.3em" fill="#fff" className="text-xs font-bold">
                {selectedMap.subject}
              </text>

              {Array.isArray(selectedMap.concepts) &&
                (selectedMap.concepts as any[]).slice(0, 4).map((concept, i) => {
                  const angle = (i * Math.PI * 2) / 4;
                  const x = 200 + Math.cos(angle) * 120;
                  const y = 150 + Math.sin(angle) * 120;

                  return (
                    <g key={i}>
                      <line
                        x1="200"
                        y1="150"
                        x2={x}
                        y2={y}
                        stroke="#64748b"
                        strokeWidth="1"
                      />
                      <circle cx={x} cy={y} r="30" fill="#0891b2" opacity="0.3" stroke="#0891b2" />
                      <text
                        x={x}
                        y={y}
                        textAnchor="middle"
                        dy="0.3em"
                        fill="#fff"
                        className="text-xs"
                      >
                        {typeof concept === 'string'
                          ? concept.substring(0, 8)
                          : concept.name?.substring(0, 8)}
                      </text>
                    </g>
                  );
                })}
            </svg>
          </div>
          <button
            onClick={() => setSelectedMap(null)}
            className="text-sm text-gray-400 hover:text-gray-300 transition-colors"
          >
            Close
          </button>
        </GlassCard>
      )}
    </div>
  );
}
