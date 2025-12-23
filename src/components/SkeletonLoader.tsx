interface SkeletonLoaderProps {
  variant?: 'paragraph' | 'card' | 'list' | 'grid';
  count?: number;
  className?: string;
}

export function SkeletonLoader({ variant = 'paragraph', count = 3, className = '' }: SkeletonLoaderProps) {
  if (variant === 'paragraph') {
    return (
      <div className={`space-y-4 ${className}`}>
        {Array.from({ length: count }).map((_, idx) => (
          <div
            key={idx}
            className="relative overflow-hidden bg-slate-800/50 backdrop-blur-md rounded-2xl p-6 border border-white/5"
          >
            <div className="space-y-3">
              <div className="h-4 bg-slate-700/70 rounded-lg w-3/4 animate-pulse" />
              <div className="h-4 bg-slate-700/70 rounded-lg w-full animate-pulse" />
              <div className="h-4 bg-slate-700/70 rounded-lg w-5/6 animate-pulse" />
            </div>
            <div className="absolute inset-0 shimmer-effect" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={`space-y-4 ${className}`}>
        {Array.from({ length: count }).map((_, idx) => (
          <div
            key={idx}
            className="relative overflow-hidden bg-slate-800/50 backdrop-blur-md rounded-xl p-4 border border-white/5"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-slate-700/70 rounded-lg animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-5 bg-slate-700/70 rounded-lg w-2/3 animate-pulse" />
                <div className="h-3 bg-slate-700/70 rounded-lg w-full animate-pulse" />
                <div className="h-3 bg-slate-700/70 rounded-lg w-4/5 animate-pulse" />
                <div className="flex gap-2 mt-3">
                  <div className="h-6 w-20 bg-slate-700/70 rounded animate-pulse" />
                  <div className="h-6 w-16 bg-slate-700/70 rounded animate-pulse" />
                  <div className="h-6 w-24 bg-slate-700/70 rounded animate-pulse" />
                </div>
              </div>
            </div>
            <div className="absolute inset-0 shimmer-effect" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div className={`space-y-3 ${className}`}>
        {Array.from({ length: count }).map((_, idx) => (
          <div
            key={idx}
            className="relative overflow-hidden bg-slate-800/50 backdrop-blur-md rounded-lg p-3 border border-white/5"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-700/70 rounded-lg w-3/4 animate-pulse" />
                <div className="h-3 bg-slate-700/70 rounded-lg w-1/2 animate-pulse" />
              </div>
              <div className="w-24 h-8 bg-slate-700/70 rounded-lg animate-pulse" />
            </div>
            <div className="absolute inset-0 shimmer-effect" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'grid') {
    return (
      <div className={`grid lg:grid-cols-2 gap-6 ${className}`}>
        {Array.from({ length: count }).map((_, idx) => (
          <div
            key={idx}
            className="relative overflow-hidden bg-slate-800/50 backdrop-blur-md rounded-xl p-6 border border-white/5"
          >
            <div className="space-y-4">
              <div className="h-5 bg-slate-700/70 rounded-lg w-1/2 animate-pulse" />
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-16 bg-slate-700/70 rounded-lg animate-pulse" />
                ))}
              </div>
            </div>
            <div className="absolute inset-0 shimmer-effect" />
          </div>
        ))}
      </div>
    );
  }

  return null;
}

export function SkeletonText({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, idx) => (
        <div
          key={idx}
          className={`h-4 bg-slate-700/70 rounded-lg animate-pulse ${
            idx === lines - 1 ? 'w-3/4' : 'w-full'
          }`}
        />
      ))}
    </div>
  );
}
