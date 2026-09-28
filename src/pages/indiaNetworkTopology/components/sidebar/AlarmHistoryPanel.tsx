import { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Clock, Crosshair, RefreshCw, Volume2, VolumeX, Server, Shield, X, Radio, Zap, BarChart3 } from 'lucide-react';
import { OtsInsightsDialog } from './OtsInsightsDialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../../../components/ui/dialog';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import { ScrollArea } from '../../../../components/ui/scroll-area';
import type { FiberAlarm } from '../../types/alarmTypes';
import { ALARM_COLOR } from '../../types/alarmTypes';

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

function severityColor(sev: string) {
  const s = sev?.toLowerCase() || '';
  if (s === 'critical') return 'bg-red-600 text-white';
  if (s === 'major') return 'bg-orange-500 text-white';
  if (s === 'minor') return 'bg-amber-500 text-white';
  return 'bg-muted text-foreground';
}

interface AlarmHistoryPanelProps {
  alarms: FiberAlarm[];
  onZoomToAlarm: (alarm: FiberAlarm) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export function AlarmHistoryPanel({ alarms, onZoomToAlarm, onRefresh, isLoading }: AlarmHistoryPanelProps) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const prevAlarmsRef = useRef<string[]>([]);
  const initialLoadRef = useRef(true);
  const soundPlayedRef = useRef(false);

  const [notifications, setNotifications] = useState<{ alarm: FiberAlarm; id: string; timestamp: number }[]>([]);
  const [insightsOpen, setInsightsOpen] = useState(false);
  const [insightsSpanId, setInsightsSpanId] = useState('');
  const [insightsRouteName, setInsightsRouteName] = useState('');

  const openInsights = (spanId: string, alarm?: FiberAlarm) => {
    setInsightsSpanId(spanId);
    setInsightsRouteName(alarm?.nodeName ? `${alarm.nodeName} · ${spanId}` : spanId);
    setInsightsOpen(true);
  };

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
      const newNotifs = newAlarms.slice(0, 3).map(alarm => ({
        alarm,
        id: `notif-${Date.now()}-${alarm.id}`,
        timestamp: Date.now(),
      }));
      setNotifications(prev => [...newNotifs, ...prev].slice(0, 5));
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
      setNotifications(prev => (prev.length === 0 ? prev : prev.slice(0, -1)));
    }, 8000);
    return () => clearTimeout(timer);
  }, [notifications]);

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <>
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 bg-background/95 backdrop-blur-sm shadow-lg border-border"
          >
            <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
            <span className="text-xs font-medium">Active Alarms</span>
            {alarms.length > 0 && (
              <Badge variant="destructive" className="h-5 min-w-5 px-1 text-[10px]">
                {alarms.length}
              </Badge>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl z-[2147483647]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-destructive/15 flex items-center justify-center">
                  <AlertTriangle className="h-4.5 w-4.5 text-destructive" />
                </div>
                <div>
                  <span className="text-base">Active Alarms</span>
                  <span className="text-xs text-muted-foreground font-normal ml-2">({alarms.length} total)</span>
                </div>
              </DialogTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  title={soundEnabled ? 'Mute alarm sounds' : 'Enable alarm sounds'}
                >
                  {soundEnabled ? (
                    <Volume2 className="h-4 w-4 text-primary" />
                  ) : (
                    <VolumeX className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
                {onRefresh && (
                  <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading} className="gap-1.5">
                    <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                )}
              </div>
            </div>
          </DialogHeader>

          {/* Summary stats bar */}
          {alarms.length > 0 && (() => {
            const spanGroups = new Map<string, FiberAlarm[]>();
            alarms.forEach(a => {
              const key = a.spanId || a.id;
              if (!spanGroups.has(key)) spanGroups.set(key, []);
              spanGroups.get(key)!.push(a);
            });
            const critCount = alarms.filter(a => a.trapSeverity?.toLowerCase() === 'critical').length;
            const majorCount = alarms.filter(a => a.trapSeverity?.toLowerCase() === 'major').length;
            const minorCount = alarms.filter(a => !['critical', 'major'].includes(a.trapSeverity?.toLowerCase() || '')).length;

            return (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border mb-1">
                <div className="flex items-center gap-2">
                  <Radio className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-semibold text-muted-foreground">{spanGroups.size} Spans</span>
                </div>
                <div className="h-4 w-px bg-border" />
                {critCount > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-600" />
                    <span className="text-xs font-bold text-red-600">{critCount}</span>
                    <span className="text-[11px] text-muted-foreground">Critical</span>
                  </div>
                )}
                {majorCount > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
                    <span className="text-xs font-bold text-orange-600">{majorCount}</span>
                    <span className="text-[11px] text-muted-foreground">Major</span>
                  </div>
                )}
                {minorCount > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                    <span className="text-xs font-bold text-amber-600">{minorCount}</span>
                    <span className="text-[11px] text-muted-foreground">Minor</span>
                  </div>
                )}
              </div>
            );
          })()}

          <ScrollArea className="max-h-[60vh]">
            {alarms.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
                  <Zap className="h-6 w-6 text-emerald-500" />
                </div>
                <span className="text-sm font-medium">No active alarms</span>
                <p className="text-xs mt-1">All systems operating normally</p>
              </div>
            ) : (
              <div className="space-y-2 pr-2">
                {(() => {
                  const spanGroups = new Map<string, FiberAlarm[]>();
                  alarms.forEach(a => {
                    const key = a.spanId || a.id;
                    if (!spanGroups.has(key)) spanGroups.set(key, []);
                    spanGroups.get(key)!.push(a);
                  });

                  return Array.from(spanGroups.entries()).map(([spanId, groupAlarms]) => {
                    const sevOrder = ['critical', 'major', 'minor'];
                    const highest = groupAlarms.reduce((best, a) => {
                      const aIdx = sevOrder.indexOf((a.trapSeverity || '').toLowerCase());
                      const bIdx = sevOrder.indexOf((best.trapSeverity || '').toLowerCase());
                      return (aIdx !== -1 && (bIdx === -1 || aIdx < bIdx)) ? a : best;
                    }, groupAlarms[0]);
                    const highSev = (highest.trapSeverity || '').toLowerCase();
                    const borderColor = highSev === 'critical' ? 'border-l-red-600' : highSev === 'major' ? 'border-l-orange-500' : 'border-l-amber-500';

                    return (
                      <div
                        key={spanId}
                        className={`rounded-lg border border-border bg-card overflow-hidden cursor-pointer hover:shadow-md transition-all border-l-4 ${borderColor}`}
                        onClick={() => onZoomToAlarm(groupAlarms[0])}
                      >
                        {/* Span header */}
                        <div className="flex items-center justify-between p-3 bg-muted/30">
                          <div className="flex items-center gap-2 min-w-0 flex-wrap">
                            <div className="h-6 w-6 rounded-md bg-destructive/15 flex items-center justify-center shrink-0">
                              <Radio className="h-3 w-3 text-destructive" />
                            </div>
                            <span className="font-bold font-mono text-sm text-foreground">{spanId}</span>
                            {groupAlarms.length > 1 && (
                              <Badge variant="destructive" className="text-[10px] px-1.5 h-4">
                                {groupAlarms.length} alarms
                              </Badge>
                            )}
                            {highest.trapSeverity && (
                              <Badge className={`text-[10px] px-1.5 h-4 ${severityColor(highest.trapSeverity)}`}>
                                {highest.trapSeverity}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {spanId && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 gap-1 text-xs"
                                title="Open OTS Insights for this span"
                                onClick={(e) => { e.stopPropagation(); openInsights(spanId, groupAlarms[0]); }}
                              >
                                <BarChart3 className="h-3 w-3" />
                                Insights
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 gap-1 text-xs"
                              title="Zoom to alarm"
                              onClick={(e) => { e.stopPropagation(); onZoomToAlarm(groupAlarms[0]); }}
                            >
                              <Crosshair className="h-3 w-3" />
                              Locate
                            </Button>
                          </div>
                        </div>

                        {/* Individual alarms within span */}
                        <div className="divide-y divide-border/50">
                          {groupAlarms.map((alarm) => (
                            <div key={alarm.id} className="px-3 py-2.5 hover:bg-accent/20 transition-colors">
                              <div className="flex items-center gap-2 mb-1.5">
                                <Zap className="h-3 w-3 text-destructive shrink-0" />
                                <span className="font-semibold text-xs text-foreground truncate flex-1">{alarm.trapType}</span>
                                {alarm.trapSeverity && groupAlarms.length > 1 && (
                                  <Badge className={`text-[9px] px-1 h-3.5 ${severityColor(alarm.trapSeverity)}`}>
                                    {alarm.trapSeverity}
                                  </Badge>
                                )}
                              </div>
                              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1.5">
                                  <Server className="h-3 w-3 shrink-0 text-muted-foreground/60" />
                                  <span className="truncate"><span className="text-muted-foreground/70">Node:</span> <span className="font-semibold text-foreground">{alarm.nodeName}</span></span>
                                </div>
                                {alarm.ifDescr && (
                                  <div className="flex items-center gap-1.5">
                                    <Radio className="h-3 w-3 shrink-0 text-muted-foreground/60" />
                                    <span className="truncate"><span className="text-muted-foreground/70">Port:</span> <span className="font-mono font-semibold text-foreground">{alarm.ifDescr}</span></span>
                                  </div>
                                )}
                                <div className="flex items-center gap-1.5">
                                  <Clock className="h-3 w-3 shrink-0 text-muted-foreground/60" />
                                  <span className="truncate"><span className="text-muted-foreground/70">Time:</span> <span className="font-semibold text-foreground">{alarm.rcvdTime}</span></span>
                                </div>
                                {alarm.vendor && (
                                  <div className="flex items-center gap-1.5">
                                    <Shield className="h-3 w-3 shrink-0 text-muted-foreground/60" />
                                    <span className="truncate"><span className="text-muted-foreground/70">Vendor:</span> <span className="font-semibold text-foreground">{alarm.vendor}</span></span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Notification toasts */}
      <div className="fixed top-16 right-4 z-[2147483647] flex flex-col gap-2 w-80 pointer-events-none">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            className="pointer-events-auto bg-background backdrop-blur-md border rounded-lg shadow-2xl p-3 animate-in slide-in-from-right-full duration-300 cursor-pointer hover:bg-muted/50 transition-colors"
            style={{ borderLeftWidth: 4, borderLeftColor: ALARM_COLOR }}
            onClick={() => {
              onZoomToAlarm(notif.alarm);
              dismissNotification(notif.id);
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 min-w-0">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-destructive" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                    <Badge
                      className="text-[10px] px-1.5 py-0 shrink-0"
                      style={{ backgroundColor: ALARM_COLOR, color: '#fff' }}
                    >
                      ALARM
                    </Badge>
                    {notif.alarm.trapSeverity && (
                      <Badge className={`text-[10px] px-1.5 py-0 shrink-0 ${severityColor(notif.alarm.trapSeverity)}`}>
                        {notif.alarm.trapSeverity}
                      </Badge>
                    )}
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
                  {notif.alarm.spanId && (
                    <button
                      className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-semibold text-primary hover:underline"
                      onClick={(e) => {
                        e.stopPropagation();
                        openInsights(notif.alarm.spanId, notif.alarm);
                      }}
                    >
                      <BarChart3 className="h-3 w-3" />
                      View Insights
                    </button>
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
        ))}
      </div>

      <OtsInsightsDialog
        open={insightsOpen}
        onClose={() => setInsightsOpen(false)}
        spanId={insightsSpanId}
        adapter="MCP"
        routeName={insightsRouteName}
      />
    </>
  );
}
