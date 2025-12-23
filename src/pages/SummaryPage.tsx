import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Trash2, ArrowRight, FileText, Loader2 } from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { Button } from '../components/Button';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { useAuthStore } from '../store/auth-store';
import { useAppStore } from '../store/app-store';
import { summarizeText } from '../lib/ai-service';
import { supabase } from '../lib/supabase';

export function SummaryPage() {
  const { user } = useAuthStore();
  const { notes, fetchNotes, deleteNote } = useAppStore();
  const navigate = useNavigate();
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => { if (user) fetchNotes(user.id); }, [user, fetchNotes]);
  useEffect(() => { if (notes.length > 0 && !selectedNoteId) setSelectedNoteId(notes[0].id); }, [notes, selectedNoteId]);

  const selectedNote = notes.find((n) => n.id === selectedNoteId);

  const handleRegenerate = async () => {
    if (!selectedNote) return;
    setRegenerating(true);
    try {
      const newSummary = await summarizeText(selectedNote.raw_text);
      await supabase.from('notes').update({ summary: newSummary, updated_at: new Date().toISOString() }).eq('id', selectedNote.id);
      if (user) fetchNotes(user.id);
    } finally { setRegenerating(false); }
  };

  const handleDelete = async () => {
    if (!selectedNote || !confirm('Delete this note?')) return;
    await deleteNote(selectedNote.id);
    setSelectedNoteId(null);
  };

  if (!user) return <GlassCard className="p-8 text-center"><h2 className="text-xl font-bold text-white mb-4">Sign in to view summaries</h2><Button onClick={() => navigate('/auth')}>Sign In</Button></GlassCard>;

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1">
        <GlassCard className="p-4">
          <h3 className="text-lg font-semibold text-white mb-4">Your Notes</h3>
          {notes.length === 0 ? (
            <div className="text-center py-8"><FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" /><p className="text-slate-400 text-sm mb-4">No notes yet</p><Button onClick={() => navigate('/upload')} variant="secondary">Upload Notes</Button></div>
          ) : (
            <ul className="space-y-2">
              {notes.map((note) => (
                <li key={note.id}><button onClick={() => setSelectedNoteId(note.id)} className={`w-full text-left px-4 py-3 rounded-xl transition ${selectedNoteId === note.id ? 'bg-cyan-500/20 border border-cyan-500/30' : 'bg-white/5 border border-white/10 hover:bg-white/10'}`}><p className="text-sm font-medium text-white truncate">{note.title}</p><p className="text-xs text-slate-400 mt-1">{new Date(note.created_at).toLocaleDateString()}</p></button></li>
              ))}
            </ul>
          )}
        </GlassCard>
      </div>
      <div className="lg:col-span-2">
        <GlassCard className="p-8">
          <div className="flex items-center justify-between mb-4">
            <div><p className="text-xs text-cyan-300 uppercase tracking-[0.3em]">Step 2</p><h3 className="text-2xl font-bold text-white">AI Summary</h3><p className="text-slate-300 text-sm">{selectedNote ? selectedNote.title : 'Select a note to view'}</p></div>
            {selectedNote && (
              <div className="flex gap-2">
                <Button variant="ghost" onClick={handleRegenerate} loading={regenerating}><RefreshCw className="w-4 h-4" />Regenerate</Button>
                <Button variant="danger" onClick={handleDelete}><Trash2 className="w-4 h-4" /></Button>
              </div>
            )}
          </div>
          <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-5 min-h-[400px]">
            {regenerating ? (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                  <div>
                    <p className="text-white font-medium">Generating summary...</p>
                    <p className="text-sm text-slate-400">AI is analyzing your notes</p>
                  </div>
                </div>
                <SkeletonLoader variant="paragraph" count={3} />
              </div>
            ) : selectedNote?.summary ? (
              <pre className="text-sm text-slate-200 whitespace-pre-wrap font-sans leading-relaxed">{selectedNote.summary}</pre>
            ) : (
              <p className="text-slate-400 text-sm">{notes.length === 0 ? 'Upload notes to generate a summary.' : 'Select a note from the list.'}</p>
            )}
          </div>
          {selectedNote?.summary && (
            <div className="mt-4 flex gap-3">
              <Button onClick={() => navigate('/quiz', { state: { noteId: selectedNote.id } })}>Generate Quiz<ArrowRight className="w-4 h-4" /></Button>
              <Button variant="secondary" onClick={() => navigate('/predictor')}>Use in Predictor</Button>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}