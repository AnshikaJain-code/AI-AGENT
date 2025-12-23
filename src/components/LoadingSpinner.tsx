import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export function LoadingSpinner({ size = 'md', label }: LoadingSpinnerProps) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="relative">
        <div className={`${sizes[size]} rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 opacity-20 absolute inset-0 blur-xl animate-pulse`} />
        <Loader2 className={`${sizes[size]} text-cyan-400 animate-spin relative`} />
      </div>
      {label && <p className="mt-4 text-sm text-slate-400">{label}</p>}
    </div>
  );
}