import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import type { FiberAlarm, PlotAlarmLink, SitePairGroup } from '../types/alarmTypes';
import { fetchAlarmDetails, fetchPlotAlarms } from '../services/alarmApi';

interface UseAlarmDataReturn {
  alarms: FiberAlarm[];
  plotAlarmLinks: PlotAlarmLink[];
  sitePairGroups: SitePairGroup[];
  isLoading: boolean;
  fetchAlarms: () => Promise<void>;
  spanHasAlarm: (spanId: string) => boolean;
  getAlarmsForSpan: (spanId: string) => FiberAlarm[];
  alarmCount: number;
  isWsConnected: boolean;
  lastUpdated: Date | null;
}

/** Map raw WS alarm objects to FiberAlarm[] */
function mapWsAlarms(data: any[]): FiberAlarm[] {
  return data
    .filter((a) => a.clear_Time === null || a.clear_Time === undefined)
    .map((a, i) => ({
      id: `ws-alarm-${i}-${a.NodeName || a.nodeName}-${a.parameter12 || a.spanId || ''}`,
      nodeName: a.NodeName || a.nodeName || '',
      trapType: a.traptype || a.trapType || '',
      ifDescr: a.IfDescr || a.ifDescr || '',
      rcvdTime: a.rcvd_Time || a.rcvdTime || '',
      clearTime: a.clear_Time ?? a.clearTime ?? null,
      trapSeverity: a.TrapSeverity || a.trapSeverity || '',
      spanId: a.parameter12 || a.spanId || '',
      vendor: a.vendor || '',
    }));
}

/** Create a consistent pair key from two site names */
function makePairKey(siteA: string, siteB: string): string {
  return [siteA, siteB].sort().join('::');
}

/** Group plotAlarm links by site pair */
function groupBySitePair(links: PlotAlarmLink[]): SitePairGroup[] {
  const map = new Map<string, SitePairGroup>();
  for (const link of links) {
    if (!link.latitudeA || !link.longitudeA || !link.latitudeB || !link.longitudeB) continue;
    const key = makePairKey(link.erpSiteNameA, link.erpSiteNameB);
    if (!map.has(key)) {
      map.set(key, {
        pairKey: key,
        siteA: link.erpSiteNameA,
        siteB: link.erpSiteNameB,
        latA: link.latitudeA,
        lonA: link.longitudeA,
        latB: link.latitudeB,
        lonB: link.longitudeB,
        spans: [],
      });
    }
    map.get(key)!.spans.push(link);
  }
  return Array.from(map.values());
}

export function useAlarmData(enabled: boolean): UseAlarmDataReturn {
  const [alarms, setAlarms] = useState<FiberAlarm[]>([]);
  const [plotAlarmLinks, setPlotAlarmLinks] = useState<PlotAlarmLink[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isWsConnected, setIsWsConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const clientRef = useRef<Client | null>(null);

  // ---- HTTP fetch (fallback / manual refresh) ----
  const fetchAlarms = useCallback(async () => {
    if (!enabled) return;
    setIsLoading(true);
    try {
      const [alarmData, plotData] = await Promise.all([
        fetchAlarmDetails(),
        fetchPlotAlarms(),
      ]);
      setAlarms(alarmData);
      setPlotAlarmLinks(plotData);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch alarms:', err);
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  // ---- STOMP WebSocket ----
  useEffect(() => {
    if (!enabled) return;

    const wsUrl = `https://ngossprod.lightstorm.in/indiabackend/ws`;

    let client: Client;
    try {
      client = new Client({
        webSocketFactory: () => new SockJS(wsUrl) as any,
        reconnectDelay: 10000,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,
        debug: () => {},
        onConnect: () => {
          setIsWsConnected(true);
          // No toast on connect — silent connection

          client.subscribe('/topic/alarms', (message) => {
            try {
              const raw = JSON.parse(message.body);
              const arr = Array.isArray(raw) ? raw : [raw];
              const mapped = mapWsAlarms(arr);
              setAlarms(mapped);
              setLastUpdated(new Date());
            } catch (err) {
              console.error('[STOMP] Failed to parse alarm message:', err);
            }
          });
        },
        onDisconnect: () => {
          setIsWsConnected(false);
        },
        onStompError: (frame) => {
          console.error('[STOMP] Error:', frame.headers['message']);
          // Silent — no toast for WS errors
        },
        onWebSocketError: () => {
          // Silent — connection will retry automatically
          console.warn('[STOMP] WebSocket connection failed, will retry...');
        },
      });

      client.activate();
      clientRef.current = client;
    } catch (err) {
      console.warn('[STOMP] Failed to initialize WebSocket:', err);
    }

    return () => {
      try {
        if (clientRef.current) {
          clientRef.current.deactivate();
          clientRef.current = null;
        }
      } catch { /* ignore cleanup errors */ }
      setIsWsConnected(false);
    };
  }, [enabled]);

  // Build spanId → alarms lookup for O(1) matching
  const spanIdAlarmMap = useMemo(() => {
    const map = new Map<string, FiberAlarm[]>();
    for (const alarm of alarms) {
      if (!alarm.spanId) continue;
      const existing = map.get(alarm.spanId) || [];
      existing.push(alarm);
      map.set(alarm.spanId, existing);
    }
    return map;
  }, [alarms]);

  const spanHasAlarm = useCallback((spanId: string): boolean => {
    return spanIdAlarmMap.has(spanId);
  }, [spanIdAlarmMap]);

  const getAlarmsForSpan = useCallback((spanId: string): FiberAlarm[] => {
    return spanIdAlarmMap.get(spanId) || [];
  }, [spanIdAlarmMap]);

  // Group plot alarm links by site pair
  const sitePairGroups = useMemo(() => groupBySitePair(plotAlarmLinks), [plotAlarmLinks]);

  return {
    alarms,
    plotAlarmLinks,
    sitePairGroups,
    isLoading,
    fetchAlarms,
    spanHasAlarm,
    getAlarmsForSpan,
    alarmCount: alarms.length,
    isWsConnected,
    lastUpdated,
  };
}
