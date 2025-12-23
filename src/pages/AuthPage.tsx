import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, BookOpen, XCircle } from 'lucide-react';
import { useAuthStore } from '../store/auth-store';
import { GlassCard } from '../components/GlassCard';
import { Button } from '../components/Button';

export function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { signIn, signUp, loading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Please fill in all fields'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    const result = isSignUp ? await signUp(email, password) : await signIn(email, password);
    if (result.error) setError(result.error);
    else navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-xl shadow-cyan-500/20 animate-float">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">Welcome to <span className="text-gradient">EaseStudy</span></h1>
          <p className="text-slate-400 text-lg">Your AI-powered learning assistant</p>
        </div>
        <GlassCard gradient="cyan" className="p-8 md:p-10">
          <h2 className="text-2xl font-bold text-white mb-6">{isSignUp ? 'Create an account' : 'Sign in to continue'}</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-900/50 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all" placeholder="you@example.com" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-900/50 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all" placeholder="Enter your password" />
              </div>
              <p className="mt-2 text-xs text-slate-500">Must be at least 6 characters</p>
            </div>
            {error && <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200 text-sm font-medium flex items-start gap-3"><XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />{error}</div>}
            <Button type="submit" loading={loading} variant="gradient" size="lg" className="w-full">{isSignUp ? 'Create Account' : 'Sign In'}<ArrowRight className="w-5 h-5" /></Button>
          </form>
          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <button onClick={() => { setIsSignUp(!isSignUp); setError(''); }} className="text-sm text-slate-400 hover:text-cyan-300 transition-colors font-medium">{isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}</button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}