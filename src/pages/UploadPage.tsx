import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { Button } from '../components/Button';
import { useAuthStore } from '../store/auth-store';
import { useAppStore } from '../store/app-store';
import { extractTextFromFile, summarizeText } from '../lib/ai-service';

interface FileItem { file: File; status: 'pending' | 'processing' | 'done' | 'error'; text?: string; }

export function UploadPage() {
  const { user } = useAuthStore();
  const { createNote } = useAppStore();
  const navigate = useNavigate();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [textInput, setTextInput] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    if (files.length + newFiles.length > 5) { setError('Maximum 5 files allowed'); return; }
    setFiles((prev) => [...prev, ...newFiles.map((file) => ({ file, status: 'pending' as const }))]);
    setError('');
  }, [files.length]);

  const removeFile = (index: number) => setFiles((prev) => prev.filter((_, i) => i !== index));

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (files.length + droppedFiles.length > 5) { setError('Maximum 5 files allowed'); return; }
    setFiles((prev) => [...prev, ...droppedFiles.map((file) => ({ file, status: 'pending' as const }))]);
    setError('');
  }, [files.length]);

  const handleProcess = async () => {
    if (!user) { navigate('/auth'); return; }
    if (!textInput.trim() && files.length === 0) { setError('Please upload files or paste text'); return; }
    setProcessing(true); setError('');
    try {
      const extractedTexts: string[] = [];
      if (textInput.trim()) extractedTexts.push(textInput.trim());
      for (let i = 0; i < files.length; i++) {
        setFiles((prev) => prev.map((f, idx) => idx === i ? { ...f, status: 'processing' } : f));
        try {
          const text = await extractTextFromFile(files[i].file);
          extractedTexts.push(`--- ${files[i].file.name} ---\n${text}`);
          setFiles((prev) => prev.map((f, idx) => idx === i ? { ...f, status: 'done', text } : f));
        } catch { setFiles((prev) => prev.map((f, idx) => idx === i ? { ...f, status: 'error' } : f)); }
      }
      const combinedText = extractedTexts.join('\n\n');
      const summary = await summarizeText(combinedText);
      const title = files.length > 0 ? files[0].file.name.replace(/\.[^/.]+$/, '') : 'Notes ' + new Date().toLocaleDateString();
      await createNote(user.id, title, combinedText, summary);
      navigate('/summary');
    } catch { setError('Failed to process notes. Please try again.'); } finally { setProcessing(false); }
  };

  if (!user) return <GlassCard className="p-8 text-center"><h2 className="text-xl font-bold text-white mb-4">Sign in to upload notes</h2><Button onClick={() => navigate('/auth')}>Sign In</Button></GlassCard>;

  return (
    <GlassCard className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div><p className="text-xs text-cyan-300 uppercase tracking-[0.3em]">Step 1</p><h3 className="text-2xl font-bold text-white">Upload & Extract</h3><p className="text-slate-300 text-sm">PDF / text / image. Upload up to 5 files.</p></div>
        <span className="px-3 py-1 text-xs rounded-full bg-cyan-500/20 text-cyan-200 border border-cyan-400/30">Secure</span>
      </div>
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <label className="border-2 border-dashed border-white/10 rounded-2xl p-6 flex flex-col gap-3 items-center justify-center cursor-pointer hover:border-cyan-400/50 transition min-h-[200px]" onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
          <input type="file" className="hidden" accept=".pdf,.txt,image/*" multiple onChange={handleFileSelect} disabled={processing} />
          <Upload className="w-12 h-12 text-slate-400" />
          <p className="text-slate-200 font-semibold text-center">Drop your notes or click to upload</p>
          <p className="text-slate-400 text-sm text-center">Up to 5 files (PDF, TXT, or images)</p>
        </label>
        <div className="bg-white/5 rounded-2xl p-4 border border-white/10 space-y-3">
          <p className="text-sm text-slate-200 font-semibold">Or paste text</p>
          <textarea value={textInput} onChange={(e) => setTextInput(e.target.value)} className="w-full h-32 bg-slate-900/50 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500/50" placeholder="Paste your notes here..." disabled={processing} />
          <Button onClick={handleProcess} loading={processing} className="w-full">Process Notes</Button>
        </div>
      </div>
      {error && <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-200 text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}
      <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
        <p className="text-sm text-slate-200 font-semibold mb-2">Selected files</p>
        {files.length === 0 ? <p className="text-slate-500 text-sm">No files selected.</p> : (
          <ul className="space-y-2">
            {files.map((item, idx) => (
              <li key={idx} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
                <div className="flex items-center gap-3"><FileText className="w-4 h-4 text-slate-400" /><span className="text-sm text-slate-200">{item.file.name}</span><span className="text-xs text-slate-400">{Math.round(item.file.size / 1024)} KB</span></div>
                <div className="flex items-center gap-2">
                  {item.status === 'processing' && <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />}
                  {item.status === 'done' && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                  {item.status === 'error' && <AlertCircle className="w-4 h-4 text-red-400" />}
                  <button onClick={() => removeFile(idx)} className="p-1 hover:bg-white/10 rounded" disabled={processing}><X className="w-4 h-4 text-slate-400" /></button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </GlassCard>
  );
}