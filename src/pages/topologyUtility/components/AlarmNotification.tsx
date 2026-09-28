
import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, X, Volume2, VolumeX } from 'lucide-react';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import type { ApiAlarm } from '../types';

interface AlarmNotificationProps {
  alarms: ApiAlarm[];
  onDismissAll?: () => void;
}

function playAlarmSound(severity?: string) {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    const freq = severity === 'CRITICAL' ? 880 : severity === 'MAJOR' ? 660 : 440;
    oscillator.frequency.value = freq;
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.25, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.6);
  } catch {
  }
}

interface NotificationItem {
  alarm: ApiAlarm;
  nid: string;
  timestamp: number;
}

const severityColor = (s: string) => {
  switch (s?.toUpperCase()) {
    case 'CRITICAL': return '#ef4444';
    case 'MAJOR': return '#f97316';
    case 'MINOR': return '#eab308';
    case 'WARNING': return '#f59e0b';
    default: return '#ef4444';
  }
};

export function AlarmNotification({ alarms }: AlarmNotificationProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const prevAlarmIdsRef = useRef<string[]>([]);
  const initialLoadRef = useRef(true);
  const soundPlayedRef = useRef(false);

  useEffect(() => {
    if (alarms.length === 0) {
      initialLoadRef.current = true;
      prevAlarmIdsRef.current = [];
      return;
    }

    const currentIds = alarms.map(a => a.link_id || `${a.source_label}-${a.target_label}`);
    const prevIds = prevAlarmIdsRef.current;

    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      prevAlarmIdsRef.current = currentIds;
      return;
    }

    const newIds = currentIds.filter(id => !prevIds.includes(id));
    if (newIds.length > 0) {
      const newAlarms = alarms.filter(a => {
        const aid = a.link_id || `${a.source_label}-${a.target_label}`;
        return newIds.includes(aid);
      });
      const newNotifs: NotificationItem[] = newAlarms.slice(0, 3).map((alarm, i) => ({
        alarm,
        nid: `notif-${Date.now()}-${i}`,
        timestamp: Date.now(),
      }));
      setNotifications(prev => [...newNotifs, ...prev].slice(0, 5));
      // Play sound only once per batch
      if (soundEnabled && !soundPlayedRef.current) {
        soundPlayedRef.current = true;
        playAlarmSound(newAlarms[0]?.severity);
        setTimeout(() => { soundPlayedRef.current = false; }, 5000);
      }
    }

    prevAlarmIdsRef.current = currentIds;
  }, [alarms, soundEnabled]);

  useEffect(() => {
    if (notifications.length === 0) return;
    const timer = setTimeout(() => {
      setNotifications(prev => {
        if (prev.length === 0) return prev;
        return prev.slice(0, -1);
      });
    }, 8000);
    return () => clearTimeout(timer);
  }, [notifications]);

  const dismiss = (nid: string) => {
    setNotifications(prev => prev.filter(n => n.nid !== nid));
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={() => setSoundEnabled(!soundEnabled)}
        title={soundEnabled ? 'Mute alarm sounds' : 'Enable alarm sounds'}
      >
        {soundEnabled ? (
          <Volume2 className="h-4 w-4 text-primary" />
        ) : (
          <VolumeX className="h-4 w-4 text-muted-foreground" />
        )}
      </Button>

      <div className="fixed top-16 right-4 z-[2147483647] flex flex-col gap-2 w-[360px] max-w-[calc(100vw-2rem)] pointer-events-none">
        {notifications.map((notif) => {
          const color = severityColor(notif.alarm.severity);
          return (
            <div
              key={notif.nid}
              className="pointer-events-auto bg-background backdrop-blur-md border rounded-lg shadow-2xl p-3 animate-in slide-in-from-right-full duration-300"
              style={{ borderLeftWidth: 4, borderLeftColor: color }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 min-w-0 flex-1">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" style={{ color }} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      <Badge
                        className="text-[10px] px-1.5 py-0 shrink-0 font-semibold"
                        style={{ backgroundColor: color, color: '#fff' }}
                      >
                        {notif.alarm.severity || 'ALARM'}
                      </Badge>
                      <span className="text-xs font-bold text-foreground break-words leading-tight min-w-0">
                        {notif.alarm.alarmName || notif.alarm.traptype}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-snug break-words">
                      <span className="font-semibold text-foreground">{notif.alarm.source_label}</span>
                      {' → '}
                      <span className="font-semibold text-foreground">{notif.alarm.target_label}</span>
                    </p>
                    {notif.alarm.max_rcvd_time && (
                      <p className="text-[10px] text-muted-foreground/80 mt-0.5 leading-tight">
                        {notif.alarm.max_rcvd_time}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  className="h-5 w-5 shrink-0 flex items-center justify-center rounded hover:bg-muted transition-colors"
                  onClick={() => dismiss(notif.nid)}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
