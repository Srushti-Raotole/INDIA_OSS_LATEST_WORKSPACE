// ============================================
// Last Capture Time Badge
// ============================================

import { useQuery } from '@tanstack/react-query';
import { Clock } from 'lucide-react';
import { fetchIPLastCaptureTime, fetchFiberLastCaptureTime } from '../../services/dashboardApi';

interface LastCaptureTimeProps {
  domain: 'IP_OPTICAL' | 'FIBER';
}

export function LastCaptureTime({ domain }: LastCaptureTimeProps) {
  const { data: captureTime, isLoading, isError } = useQuery({
    queryKey: ['last-capture-time', domain],
    queryFn: domain === 'FIBER' ? fetchFiberLastCaptureTime : fetchIPLastCaptureTime,
    staleTime: Infinity,
    retry: 1,
  });

  if (isLoading) return null;

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 rounded-md px-2.5 py-1.5 border border-border/50">
      <Clock className="h-3 w-3 shrink-0" />
      {isError ? (
        <span className="whitespace-nowrap text-destructive">Failed to fetch last update time</span>
      ) : (
        <span className="whitespace-nowrap">
          Last Updated: <span className="font-medium text-foreground">{captureTime}</span>
        </span>
      )}
    </div>
  );
}
