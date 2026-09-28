
import { AlertTriangle } from 'lucide-react';

interface AlarmStatsBarProps {
  count: number;
}

export function AlarmStatsBar({ count }: AlarmStatsBarProps) {
  return (
    <div className="bg-background/95 backdrop-blur-sm rounded-lg shadow-md border border-border px-3 py-1.5 flex items-center gap-2">
      <AlertTriangle className="h-4 w-4 text-destructive" />
      <span className="text-xs font-semibold text-foreground">Active Alarms</span>
      <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-destructive/15 text-destructive text-xs font-extrabold">
        {count}
      </span>
    </div>
  );
}
