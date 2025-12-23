import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: { value: number; isPositive: boolean };
  gradient?: string;
  className?: string;
}

export function StatCard({ label, value, icon: Icon, trend, gradient = 'from-cyan-500 to-blue-500', className = '' }: StatCardProps) {
  return (
    <div className={`glass-card rounded-2xl p-5 relative overflow-hidden group hover:scale-105 transition-transform ${className}`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5 group-hover:opacity-10 transition-opacity`} />

      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <p className="text-sm font-medium text-slate-400">{label}</p>
          {Icon && (
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} opacity-20 flex items-center justify-center`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
          )}
        </div>

        <div className="flex items-end justify-between">
          <p className="text-3xl font-bold text-white">{value}</p>

          {trend && (
            <div className={`flex items-center gap-1 text-xs font-semibold ${trend.isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
              <span>{trend.isPositive ? '+' : ''}{trend.value}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}