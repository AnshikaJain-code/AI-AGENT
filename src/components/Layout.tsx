import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Upload, LayoutDashboard, Sparkles, Brain, ChevronDown, FileText, Zap, Award, AlertCircle, MapPin, Network, Users, Timer, LogOut, Menu, X } from 'lucide-react';
import { useAuthStore } from '../store/auth-store';

const primaryNavItems = [
  { to: '/upload', label: 'Upload' },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/predictor', label: 'Predictor' },
  { to: '/quiz', label: 'Quiz' },
];

const moreNavItems = [
  { to: '/summary', label: 'Summary', icon: FileText },
  { to: '/flashcards', label: 'Flashcards', icon: Zap },
  { to: '/achievements', label: 'Achievements', icon: Award },
  { to: '/weakness', label: 'Weakness', icon: AlertCircle },
  { to: '/study-path', label: 'Study Path', icon: MapPin },
  { to: '/concepts', label: 'Concepts', icon: Network },
  { to: '/community', label: 'Community', icon: Users },
  { to: '/pomodoro', label: 'Pomodoro', icon: Timer },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const { user, signOut } = useAuthStore();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMoreDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <header className="fixed top-0 left-0 right-0 z-50 pt-4 px-4">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 group flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center group-hover:scale-105 transition-transform duration-300 shadow-lg shadow-cyan-500/30">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-xs font-semibold text-cyan-400 tracking-wider">AI-POWERED</span>
                <span className="text-lg font-bold text-white">EasyStudy</span>
              </div>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center justify-center flex-1 max-w-2xl">
            <div className="flex items-center gap-1 px-4 py-2.5 rounded-full bg-slate-900/70 backdrop-blur-md border border-white/10 shadow-xl shadow-black/20">
              {primaryNavItems.map((item) => {
                const isActive = location.pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                      isActive
                        ? 'bg-cyan-500/20 text-cyan-300 shadow-lg shadow-cyan-500/20'
                        : 'text-slate-300 hover:text-cyan-300 hover:shadow-[0_0_15px_rgba(34,211,238,0.3)]'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}

              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setMoreDropdownOpen(!moreDropdownOpen)}
                  className={`flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                    moreDropdownOpen
                      ? 'bg-cyan-500/20 text-cyan-300'
                      : 'text-slate-300 hover:text-cyan-300 hover:shadow-[0_0_15px_rgba(34,211,238,0.3)]'
                  }`}
                >
                  More
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${moreDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {moreDropdownOpen && (
                  <div className="absolute top-full right-0 mt-2 w-56 bg-slate-900/90 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl shadow-black/30 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="py-2">
                      {moreNavItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.to;
                        return (
                          <Link
                            key={item.to}
                            to={item.to}
                            onClick={() => setMoreDropdownOpen(false)}
                            className={`flex items-center gap-3 px-4 py-2.5 transition-all duration-200 ${
                              isActive
                                ? 'bg-cyan-500/20 text-cyan-300'
                                : 'text-slate-300 hover:text-cyan-300 hover:bg-white/5 hover:shadow-[0_0_10px_rgba(34,211,238,0.2)]'
                            }`}
                          >
                            <Icon className="w-4 h-4 flex-shrink-0" />
                            <span className="text-sm font-medium">{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </nav>

          <div className="flex items-center gap-3 flex-shrink-0">
            {user ? (
              <div className="hidden lg:flex items-center gap-3">
                <div className="flex items-center gap-2.5 px-3 py-2 bg-slate-900/70 backdrop-blur-md rounded-full border border-white/10">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-xs font-semibold">
                    {user.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="text-sm text-slate-200 max-w-[120px] truncate">{user.email}</span>
                </div>
                <button
                  onClick={signOut}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/70 backdrop-blur-md border border-white/10 text-sm text-slate-300 hover:bg-red-500/20 hover:border-red-500/30 hover:text-red-300 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-all duration-200"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden xl:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <Link
                to="/auth"
                className="hidden lg:flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-semibold text-sm hover:shadow-lg hover:shadow-cyan-500/40 transition-all duration-200 active:scale-95"
              >
                Sign In
              </Link>
            )}

            <button
              className="lg:hidden p-2.5 rounded-full bg-slate-900/70 backdrop-blur-md border border-white/10 hover:bg-slate-800/70 transition-all"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
            </button>
          </div>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-xl" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative h-full flex flex-col pt-20 pb-6 px-4 overflow-y-auto">
            <div className="flex flex-col gap-2 mb-6">
              {primaryNavItems.map((item) => {
                const isActive = location.pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-6 py-4 rounded-2xl text-base font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-cyan-500/20 text-cyan-300 shadow-lg shadow-cyan-500/20'
                        : 'bg-slate-900/70 text-slate-300 hover:text-cyan-300 hover:bg-slate-800/70'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>

            <div className="border-t border-white/10 pt-4 mb-6">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2 mb-3">More</div>
              <div className="flex flex-col gap-2">
                {moreNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.to;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-6 py-3.5 rounded-2xl text-base font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-cyan-500/20 text-cyan-300 shadow-lg shadow-cyan-500/20'
                          : 'bg-slate-900/70 text-slate-300 hover:text-cyan-300 hover:bg-slate-800/70'
                      }`}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {user ? (
              <div className="mt-auto space-y-3">
                <div className="flex items-center gap-3 px-6 py-4 bg-slate-900/70 rounded-2xl border border-white/10">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-sm font-semibold">
                    {user.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="text-sm text-slate-300 truncate">{user.email}</span>
                </div>
                <button
                  onClick={() => { signOut(); setMobileMenuOpen(false); }}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-500/30 transition-all duration-200"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Sign Out</span>
                </button>
              </div>
            ) : (
              <Link
                to="/auth"
                onClick={() => setMobileMenuOpen(false)}
                className="mt-auto flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-semibold"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}

      <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}