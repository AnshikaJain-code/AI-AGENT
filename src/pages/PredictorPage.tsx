import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, X, Loader2, Sparkles, Download, AlertTriangle, TrendingUp, Repeat, Target } from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { Button } from '../components/Button';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { useAuthStore } from '../store/auth-store';
import { extractTextFromFile, analyzePapersAndSyllabus, generatePredictedPaper } from '../lib/ai-service';
import { useToast } from '../hooks/useToast';
import type { PredictionPatterns, GeneratedPaper, PredictionConfig } from '../types/database';

interface FileItem { file: File; status: 'pending' | 'processing' | 'done' | 'error'; }

export function PredictorPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { showToast, ToastContainer } = useToast();
  const [syllabusFile, setSyllabusFile] = useState<FileItem | null>(null);
  const [syllabusText, setSyllabusText] = useState('');
  const [paperFiles, setPaperFiles] = useState<FileItem[]>([]);
  const [examName, setExamName] = useState('');
  const [totalQuestions, setTotalQuestions] = useState(20);
  const [analyzing, setAnalyzing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [patterns, setPatterns] = useState<PredictionPatterns | null>(null);
  const [generatedPaper, setGeneratedPaper] = useState<GeneratedPaper | null>(null);
  const [activeTab, setActiveTab] = useState<'patterns' | 'paper'>('patterns');

  const handleSyllabusSelect = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) setSyllabusFile({ file, status: 'pending' }); };
  const handlePapersSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    if (paperFiles.length + newFiles.length > 10) { alert('Maximum 10 past papers allowed'); return; }
    setPaperFiles((prev) => [...prev, ...newFiles.map((file) => ({ file, status: 'pending' as const }))]);
  }, [paperFiles.length]);
  const removePaperFile = (index: number) => setPaperFiles((prev) => prev.filter((_, i) => i !== index));

  const handleAnalyze = async () => {
    if (!user) { navigate('/auth'); return; }
    if (!syllabusFile && !syllabusText.trim()) {
      showToast('Please provide syllabus content (upload a file or paste text)', 'error');
      return;
    }
    if (paperFiles.length === 0) {
      showToast('Please upload at least one past paper', 'error');
      return;
    }
    setAnalyzing(true); setPatterns(null); setGeneratedPaper(null);
    showToast('Starting pattern analysis...', 'info');
    try {
      let finalSyllabusText = syllabusText;
      if (syllabusFile) {
        setSyllabusFile({ ...syllabusFile, status: 'processing' });
        finalSyllabusText = await extractTextFromFile(syllabusFile.file);
        setSyllabusFile({ ...syllabusFile, status: 'done' });
      }
      const paperTexts: string[] = [];
      for (let i = 0; i < paperFiles.length; i++) {
        setPaperFiles((prev) => prev.map((f, idx) => (idx === i ? { ...f, status: 'processing' } : f)));
        const text = await extractTextFromFile(paperFiles[i].file);
        paperTexts.push(text);
        setPaperFiles((prev) => prev.map((f, idx) => (idx === i ? { ...f, status: 'done' } : f)));
      }
      const analyzedPatterns = await analyzePapersAndSyllabus(finalSyllabusText, paperTexts);
      setPatterns(analyzedPatterns);
      setActiveTab('patterns');
      showToast('Pattern analysis completed successfully!', 'success');
    } catch (error) {
      console.error('Analysis error:', error);
      showToast('Analysis failed. Please check your API key and try again.', 'error');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleGenerate = async () => {
    if (!patterns) return;
    setGenerating(true);
    showToast('Generating predicted question paper...', 'info');
    try {
      const config: PredictionConfig = { totalQuestions, sections: [{ name: 'Section A - Short Answer', marks: 20 }, { name: 'Section B - Medium Answer', marks: 30 }, { name: 'Section C - Long Answer', marks: 50 }] };
      const paper = await generatePredictedPaper(patterns, config);
      setGeneratedPaper(paper);
      setActiveTab('paper');
      showToast('Predicted paper generated successfully!', 'success');
    } catch (error) {
      console.error('Generation error:', error);
      showToast('Paper generation failed. Please try again.', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedPaper) return;
    let content = `PREDICTED QUESTION PAPER\n${examName || 'Exam'}\nGenerated on: ${new Date().toLocaleDateString()}\n\n${'='.repeat(60)}\n\n`;
    generatedPaper.sections.forEach((section) => {
      content += `${section.name} (${section.totalMarks} marks)\n${'-'.repeat(40)}\n\n`;
      section.questions.forEach((q, idx) => { content += `Q${idx + 1}. ${q.text}\n    Topic: ${q.topic}\n    Marks: ${q.marks} | Difficulty: ${q.difficulty}\n    Probability: ${Math.round(q.probabilityScore * 100)}%\n\n`; });
      content += '\n';
    });
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `predicted-paper-${examName || 'exam'}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  if (!user) return <GlassCard className="p-8 text-center"><h2 className="text-xl font-bold text-white mb-4">Sign in to use the predictor</h2><Button onClick={() => navigate('/auth')}>Sign In</Button></GlassCard>;

  return (
    <div className="space-y-6">
      <ToastContainer />
      <GlassCard className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div><p className="text-xs text-emerald-300 uppercase tracking-[0.3em]">AI Feature</p><h3 className="text-2xl font-bold text-white">Exam Question Paper Predictor</h3><p className="text-slate-300 text-sm">Upload syllabus and past papers to predict likely exam questions.</p></div>
          <span className="px-3 py-1 text-xs rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">AI-Powered</span>
        </div>
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Syllabus</h4>
            <label className="border-2 border-dashed border-white/10 rounded-xl p-4 flex flex-col gap-2 items-center justify-center cursor-pointer hover:border-emerald-400/50 transition min-h-[120px]">
              <input type="file" className="hidden" accept=".pdf,.txt,image/*" onChange={handleSyllabusSelect} disabled={analyzing} />
              <Upload className="w-8 h-8 text-slate-400" /><p className="text-slate-300 text-sm text-center">{syllabusFile ? syllabusFile.file.name : 'Upload syllabus (PDF/TXT/Image)'}</p>
            </label>
            <textarea value={syllabusText} onChange={(e) => setSyllabusText(e.target.value)} className="w-full h-24 bg-slate-900/50 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/50" placeholder="Or paste syllabus text here..." disabled={analyzing} />
          </div>
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Past Question Papers</h4>
            <label className="border-2 border-dashed border-white/10 rounded-xl p-4 flex flex-col gap-2 items-center justify-center cursor-pointer hover:border-emerald-400/50 transition min-h-[120px]">
              <input type="file" className="hidden" accept=".pdf,.txt,image/*" multiple onChange={handlePapersSelect} disabled={analyzing} />
              <FileText className="w-8 h-8 text-slate-400" /><p className="text-slate-300 text-sm text-center">Upload past papers (up to 10)</p>
            </label>
            {paperFiles.length > 0 && (
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {paperFiles.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
                    <span className="text-sm text-slate-300 truncate">{item.file.name}</span>
                    <div className="flex items-center gap-2">{item.status === 'processing' && <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />}<button onClick={() => removePaperFile(idx)} disabled={analyzing}><X className="w-4 h-4 text-slate-400 hover:text-white" /></button></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <input type="text" value={examName} onChange={(e) => setExamName(e.target.value)} className="bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50" placeholder="Exam name (optional)" disabled={analyzing} />
          <div className="flex items-center gap-2"><label className="text-sm text-slate-400">Questions:</label><input type="number" min={5} max={50} value={totalQuestions} onChange={(e) => setTotalQuestions(Math.min(50, Math.max(5, parseInt(e.target.value) || 20)))} className="w-20 bg-slate-900/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50" disabled={analyzing} /></div>
          <Button onClick={handleAnalyze} loading={analyzing}><Sparkles className="w-4 h-4" />Analyze Patterns</Button>
        </div>
{analyzing && (
          <div className="border-t border-white/10 pt-6">
            <div className="flex items-center gap-3 mb-6">
              <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
              <div>
                <h4 className="text-lg font-semibold text-white">Analyzing patterns...</h4>
                <p className="text-sm text-slate-400">Processing syllabus and past papers with AI</p>
              </div>
            </div>
            <SkeletonLoader variant="grid" count={2} />
          </div>
        )}
        {(patterns || generatedPaper) && !analyzing && (
          <div className="border-t border-white/10 pt-6">
            <div className="flex gap-2 mb-4">
              <button onClick={() => setActiveTab('patterns')} className={`px-4 py-2 rounded-lg text-sm transition ${activeTab === 'patterns' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-white/5 text-slate-400 hover:text-white'}`}><TrendingUp className="w-4 h-4 inline mr-2" />Topic Analysis</button>
              <button onClick={() => setActiveTab('paper')} className={`px-4 py-2 rounded-lg text-sm transition ${activeTab === 'paper' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-white/5 text-slate-400 hover:text-white'}`} disabled={!generatedPaper}><Target className="w-4 h-4 inline mr-2" />Predicted Paper</button>
            </div>
            {activeTab === 'patterns' && patterns && !generating && <PatternAnalysis patterns={patterns} onGenerate={handleGenerate} generating={generating} />}
            {activeTab === 'patterns' && generating && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                  <div>
                    <h4 className="text-lg font-semibold text-white">Generating predicted paper...</h4>
                    <p className="text-sm text-slate-400">Creating questions based on analysis</p>
                  </div>
                </div>
                <SkeletonLoader variant="card" count={5} />
              </div>
            )}
            {activeTab === 'paper' && generatedPaper && <PredictedPaperView paper={generatedPaper} examName={examName} onDownload={handleDownload} />}
          </div>
        )}
      </GlassCard>
    </div>
  );
}

function PatternAnalysis({ patterns, onGenerate, generating }: { patterns: PredictionPatterns; onGenerate: () => void; generating: boolean }) {
  const sortedTopics = [...patterns.topics].sort((a, b) => b.frequency - a.frequency);
  const maxFrequency = Math.max(...patterns.topics.map((t) => t.frequency), 1);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><h4 className="text-lg font-semibold text-white">Topic Frequency Analysis</h4><Button onClick={onGenerate} loading={generating}><Target className="w-4 h-4" />Generate Predicted Paper</Button></div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h5 className="text-sm font-medium text-slate-300">Topic Heatmap</h5>
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
            {sortedTopics.map((topic, idx) => (
              <div key={idx} className="bg-white/5 rounded-lg p-3 border border-white/10">
                <div className="flex items-center justify-between mb-2"><span className="text-sm text-white font-medium truncate pr-2">{topic.name}</span><div className="flex items-center gap-2"><span className="text-xs text-slate-400">{topic.frequency} times</span><span className="text-xs text-emerald-300">{topic.totalMarks} marks</span></div></div>
                <div className="w-full bg-white/10 rounded-full h-2"><div className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-2 rounded-full transition-all" style={{ width: `${(topic.frequency / maxFrequency) * 100}%` }} /></div>
                {topic.yearsAppeared.length > 0 && <p className="text-xs text-slate-500 mt-1">Years: {topic.yearsAppeared.join(', ')}</p>}
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <h5 className="text-sm font-medium text-slate-300 flex items-center gap-2"><Repeat className="w-4 h-4" />Repeated Questions</h5>
          {patterns.repeatedQuestions.length === 0 ? <p className="text-slate-500 text-sm">No repeated questions detected.</p> : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
              {patterns.repeatedQuestions.map((rq, idx) => (
                <div key={idx} className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <div className="flex items-start gap-2 mb-2"><AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" /><p className="text-sm text-white">{rq.questionText.substring(0, 100)}...</p></div>
                  <div className="flex flex-wrap gap-2"><span className="px-2 py-0.5 text-xs bg-yellow-500/20 text-yellow-300 rounded">{rq.timesRepeated}x repeated</span><span className="px-2 py-0.5 text-xs bg-cyan-500/20 text-cyan-300 rounded">{rq.topic}</span></div>
                  {rq.variants.length > 0 && <p className="text-xs text-slate-500 mt-2">{rq.variants.length} similar variant(s) found</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PredictedPaperView({ paper, examName, onDownload }: { paper: GeneratedPaper; examName: string; onDownload: () => void }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h4 className="text-lg font-semibold text-white">{examName || 'Predicted Question Paper'}</h4><p className="text-sm text-slate-400">Total: {paper.sections.reduce((sum, s) => sum + s.questions.length, 0)} questions | {paper.sections.reduce((sum, s) => sum + s.totalMarks, 0)} marks</p></div>
        <Button onClick={onDownload} variant="secondary"><Download className="w-4 h-4" />Download</Button>
      </div>
      <div className="space-y-6">
        {paper.sections.map((section, sIdx) => (
          <div key={sIdx} className="border border-white/10 rounded-xl overflow-hidden">
            <div className="bg-white/5 px-4 py-3 border-b border-white/10"><h5 className="font-semibold text-white">{section.name}</h5><p className="text-xs text-slate-400">Total marks: {section.totalMarks}</p></div>
            <div className="divide-y divide-white/5">
              {section.questions.map((q, qIdx) => (
                <div key={q.id} className="p-4 hover:bg-white/5 transition">
                  <div className="flex items-start gap-3">
                    <span className="text-cyan-400 font-semibold text-sm">Q{qIdx + 1}.</span>
                    <div className="flex-1">
                      <p className="text-white text-sm mb-2">{q.text}</p>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-2 py-0.5 text-xs bg-slate-700 text-slate-300 rounded">{q.topic}</span>
                        <span className="px-2 py-0.5 text-xs bg-slate-700 text-slate-300 rounded">{q.marks} marks</span>
                        <span className={`px-2 py-0.5 text-xs rounded ${q.difficulty === 'easy' ? 'bg-emerald-500/20 text-emerald-300' : q.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-red-500/20 text-red-300'}`}>{q.difficulty}</span>
                        <span className={`px-2 py-0.5 text-xs rounded ${q.probabilityScore >= 0.7 ? 'bg-emerald-500/20 text-emerald-300' : q.probabilityScore >= 0.4 ? 'bg-yellow-500/20 text-yellow-300' : 'bg-slate-600 text-slate-300'}`}>{Math.round(q.probabilityScore * 100)}% likely</span>
                        {q.sourceType !== 'new' && <span className="px-2 py-0.5 text-xs bg-cyan-500/20 text-cyan-300 rounded">{q.sourceType === 'similar-to-past' ? 'Similar to past' : 'Inspired'}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}