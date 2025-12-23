interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
  gradient?: 'cyan' | 'emerald' | 'blue' | 'none';
}

export function GlassCard({ children, className = '', onClick, hover = false, gradient = 'none' }: GlassCardProps) {
  const gradientStyles = {
    cyan: 'bg-gradient-to-br from-cyan-500/5 via-transparent to-transparent border-cyan-500/10',
    emerald: 'bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent border-emerald-500/10',
    blue: 'bg-gradient-to-br from-blue-500/5 via-transparent to-transparent border-blue-500/10',
    none: 'bg-white/[0.04] border-white/[0.08]',
  };

  const hoverStyle = hover ? 'cursor-pointer hover:bg-white/[0.06] hover:border-opacity-20 hover:scale-[1.01] transition-all duration-300' : '';

  return (
    <div onClick={onClick} className={`backdrop-blur-xl shadow-[0_20px_70px_rgba(0,0,0,0.35)] rounded-3xl border ${gradientStyles[gradient]} ${hoverStyle} ${className}`}>
      {children}
    </div>
  );
}