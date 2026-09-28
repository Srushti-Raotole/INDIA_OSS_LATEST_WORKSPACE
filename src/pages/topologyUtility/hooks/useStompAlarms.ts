import { useState, useEffect, useCallback, useRef } from 'react';
import { WS_TOPOLOGY_ALARMS_URL } from '../../../api/config';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { toast } from 'sonner';

export interface StompAlarmData {
  link_id?: string;
  source_label?: string;
  target_label?: string;
  traptype?: string;
  alarmName?: string;
  TrapSeverity?: string;
  severity?: string;
  max_rcvd_time?: string;
  spanLossTx?: string;
  spanLossRx?: string;
  fiberDistance?: string;
  designLoss?: string;
  [key: string]: any;
}

interface UseStompAlarmsOptions {
  enabled: boolean;
  vendor?: string;
  topologyId?: string;
  baseUrl?: string; // defaults to /ws-alarms
  onAlarms?: (alarms: StompAlarmData[]) => void;
}

export function useStompAlarms({
  enabled,
  vendor,
  topologyId,
  baseUrl,
  onAlarms,
}: UseStompAlarmsOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const clientRef = useRef<Client | null>(null);

  const connect = useCallback(() => {
    if (!vendor || !topologyId || !enabled) return;

    // Determine WS endpoint — use relative path or full URL
    const wsUrl = baseUrl || WS_TOPOLOGY_ALARMS_URL;

    const client = new Client({
      webSocketFactory: () => new SockJS(wsUrl) as any,
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: (msg) => {
        // Uncomment for debugging: console.log('[STOMP]', msg);
      },
      onConnect: () => {
        setIsConnected(true);
        setLastSyncTime(new Date());
        toast.success('WebSocket connected', { description: 'Live link alarms enabled' });

        // Subscribe to link alarms topic
        const destination = `/topic/alarms/${vendor}/${topologyId}`;
        client.subscribe(destination, (message) => {
          try {
            const data = JSON.parse(message.body);
            const alarms: StompAlarmData[] = Array.isArray(data) ? data : [data];
            setLastSyncTime(new Date());
            onAlarms?.(alarms);
          } catch (err) {
            console.error('[STOMP] Failed to parse alarm message:', err);
          }
        });
      },
      onDisconnect: () => {
        setIsConnected(false);
      },
      onStompError: (frame) => {
        console.error('[STOMP] Error:', frame.headers['message']);
        toast.error('WebSocket error', { description: frame.headers['message'] });
      },
    });

    client.activate();
    clientRef.current = client;
  }, [enabled, vendor, topologyId, baseUrl, onAlarms]);

  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.deactivate();
      clientRef.current = null;
    }
    setIsConnected(false);
    toast.info('WebSocket disconnected');
  }, []);

  useEffect(() => {
    if (enabled && vendor && topologyId) {
      connect();
    }
    return () => {
      if (clientRef.current) {
        clientRef.current.deactivate();
        clientRef.current = null;
        setIsConnected(false);
      }
    };
  }, [enabled, vendor, topologyId]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    isConnected,
    lastSyncTime,
    connect,
    disconnect,
  };
}
