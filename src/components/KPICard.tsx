import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    direction: 'up' | 'down';
  };
  className?: string;
}

export function KPICard({ title, value, icon: Icon, trend, className = '' }: KPICardProps) {
  return (
    <div className={`card hover:shadow-lg transition-all ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-muted-foreground mb-3" style={{ fontSize: '14px', lineHeight: '20px' }}>
            {title}
          </p>
          <p className="mb-2 truncate" style={{ fontSize: '32px', lineHeight: '40px', fontWeight: 600 }}>
            {value}
          </p>
          {trend && (
            <p className={`flex items-center gap-1 ${trend.direction === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} style={{ fontSize: '14px', lineHeight: '20px' }}>
              <span>{trend.direction === 'up' ? '↑' : '↓'}</span>
              <span>{trend.value}</span>
            </p>
          )}
        </div>
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center flex-shrink-0 shadow-sm">
          <Icon className="w-7 h-7 text-[#D4AF37]" />
        </div>
      </div>
    </div>
  );
}
