
import { useEffect, useRef, useState, useCallback } from 'react';
import { AlertTriangle, X, Volume2, VolumeX } from 'lucide-react';
import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import { ALARM_COLOR } from '../../types/alarmTypes';
import type { FiberAlarm } from '../../types/alarmTypes';
import type { FiberRoute } from '../../types/fiberTypes';

interface AlarmNotificationProps {
  alarms: FiberAlarm[];
  routes: FiberRoute[];
  onZoomToAlarm?: (alarm: FiberAlarm, route: FiberRoute | undefined) => void;
}

function playAlarmSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.frequency.value = 880;
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.8);
  } catch {
    // Audio not available
  }
}

interface NotificationItem {
  alarm: FiberAlarm;
  id: string;
  timestamp: number;
}

export function AlarmNotification({ alarms, routes, onZoomToAlarm }: AlarmNotificationProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const prevAlarmsRef = useRef<string[]>([]);
  const initialLoadRef = useRef(true);
  const soundPlayedRef = useRef(false);

  const findRouteForAlarm = useCallback((alarm: FiberAlarm): FiberRoute | undefined => {
    return routes.find(r => r.spanid && r.spanid === alarm.spanId);
  }, [routes]);

  useEffect(() => {
    if (alarms.length === 0) return;

    const currentIds = alarms.map(a => a.id);
    const prevIds = prevAlarmsRef.current;

    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      prevAlarmsRef.current = currentIds;
      return;
    }

    const newAlarmIds = currentIds.filter(id => !prevIds.includes(id));
    if (newAlarmIds.length > 0) {
      const newAlarms = alarms.filter(a => newAlarmIds.includes(a.id));
      const newNotifs: NotificationItem[] = newAlarms.slice(0, 3).map(alarm => ({
        alarm,
        id: `notif-${Date.now()}-${alarm.id}`,
        timestamp: Date.now(),
      }));
      setNotifications(prev => [...newNotifs, ...prev].slice(0, 5));
      // Play sound only once per batch
      if (soundEnabled && !soundPlayedRef.current) {
        soundPlayedRef.current = true;
        playAlarmSound();
        setTimeout(() => { soundPlayedRef.current = false; }, 5000);
      }
    }

    prevAlarmsRef.current = currentIds;
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

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setSoundEnabled(!soundEnabled)}
        className="gap-1.5 bg-background/95 backdrop-blur-sm shadow-lg border-border"
        title={soundEnabled ? 'Mute alarm sounds' : 'Enable alarm sounds'}
      >
        {soundEnabled ? (
          <Volume2 className="h-3.5 w-3.5 text-primary" />
        ) : (
          <VolumeX className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </Button>

      <div className="fixed top-16 right-4 z-[2147483647] flex flex-col gap-2 w-80 pointer-events-none">
        {notifications.map((notif) => {
          const route = findRouteForAlarm(notif.alarm);
          return (
            <div
              key={notif.id}
              className="pointer-events-auto bg-background backdrop-blur-md border rounded-lg shadow-2xl p-3 animate-in slide-in-from-right-full duration-300 cursor-pointer hover:bg-muted/50 transition-colors"
              style={{ borderLeftWidth: 4, borderLeftColor: ALARM_COLOR }}
              onClick={() => {
                onZoomToAlarm?.(notif.alarm, route);
                dismissNotification(notif.id);
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 min-w-0">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-destructive" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      <Badge
                        className="text-[10px] px-1.5 py-0 shrink-0"
                        style={{ backgroundColor: ALARM_COLOR, color: '#fff' }}
                      >
                        ALARM
                      </Badge>
                      <span className="text-xs font-bold truncate">{notif.alarm.trapType}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-tight">
                      <span className="font-semibold text-foreground">{notif.alarm.nodeName}</span>
                      {' · '}
                      <span className="font-mono">{notif.alarm.spanId}</span>
                    </p>
                    {notif.alarm.ifDescr && (
                      <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                        Port: <span className="font-mono font-semibold">{notif.alarm.ifDescr}</span>
                      </p>
                    )}
                    {route && (
                      <p className="text-[11px] text-muted-foreground leading-tight mt-0.5 truncate">
                        {route.linkName}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  className="h-5 w-5 shrink-0 flex items-center justify-center rounded hover:bg-muted transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    dismissNotification(notif.id);
                  }}
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
