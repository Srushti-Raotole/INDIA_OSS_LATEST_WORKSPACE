import { useState, useEffect, useMemo } from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { DynamicTableRow } from '../../store/types';
import BarChartTemplate from '../../components/faults/active/faults/Graphs/BarChartTemplate';
import GraphTemplateSeverityTrend from '../../components/faults/active/faults/Graphs/SeverityCountTrendGraph';
import axiosClient from "@/api/axiosClient";
import { FETCH_ACTIVE_FAULTS_TABLE_DATA } from "@/api/apis";
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import TrapDetailsDialog from '../../components/faults/active/faults/Dialog/TrapDetailsDialog';
import AlarmSummaryCardsInsideSidebar from '../../components/faults/active/faults/AlarmSummaryCardSidebar';
import ActiveFaultsTableForSidebar from '../../components/faults/active/faults/ActiveFaultTableForSidebar';
import { logActivity } from '../../utils/activityLogger';
import FullPageLoader from '../../components/common/FullPageLoader';
import { Grid, Typography } from '@mui/material';

/* ===== Local storage key ===== */
const STORAGE_KEY = 'active_faults_last_payload_v1';

/* ===== utils & mapping ===== */
const norm = (v?: string | null) => (v ?? '').toString().trim();
const up = (v?: string | null) => norm(v).toUpperCase();

const ALARM_SEVERITIES = ['Critical', 'Major', 'Minor'] as const;
const PRESET_SOURCES = ['CONC', 'ADVA', 'IFNR', 'TLMR', 'EPNM', 'MCP', 'NFMT'] as const;

function mapSeverity(s?: string) {
  const u = (s ?? '').toUpperCase();
  if (u === 'CRI' || u === 'CRITICAL') return 'Critical';
  if (u === 'MAJ' || u === 'MAJOR') return 'Major';
  if (u === 'MIN' || u === 'MINOR' || u === 'MINORWARN') return 'Minor';
  if (u === 'WARN' || u === 'WARNING') return 'Warning';
  if (u === 'INFO' || u === 'INFORMATIONAL') return 'Info';
  if (u === 'CLEAR' || u === 'CLEARED') return 'Clear';
  return s ?? '';
}

function normalizeSeverity(s: string) {
  const u = s?.toUpperCase?.() ?? '';
  if (u === 'MINORWARN' || u === 'MINOR') return 'Minor';
  if (u === 'MAJOR') return 'Major';
  if (u === 'CRITICAL') return 'Critical';
  if (u === 'WARNING' || u === 'WARN') return 'Warning';
  if (u === 'INFO' || u === 'INFORMATIONAL') return 'Info';
  if (u === 'CLEAR' || u === 'CLEARED') return 'Clear';
  return s || '';
}

function shouldHighlightRow(row: DynamicTableRow) {
  const msg = (row['Clear Time'] ?? '').toString().trim().toUpperCase();
  return msg !== '' && msg !== 'NA';
}

const dtoToRow = (dto: any): DynamicTableRow => ({
  Adapter: dto.adapterName ?? '',
  Severity: mapSeverity(dto.severity),
  Alarm: dto.trapType ?? '',
  Client: dto.clientType ?? '',
  Technology: dto.vendor ?? '',
  'Device Name': dto.nodeName ?? '',
  Source: dto.senderIp ?? '',
  'Trap Source': dto.trpSource ?? '',
  'Port Name': dto.ifDesc ?? '',
  Tag: dto.tag ?? '',
  'Device Type': dto.nodeType ?? '',
  Description: dto.desc ?? '',
  'No. of Service Affected': dto.numberOfServiceAffecting ?? dto.noOfServiceAffected ?? '',
  'NMS Received Time': dto.recTime ?? '',
  'Update Time': dto.updateTime ?? '',
  'OSS Insertion Time': dto.insertionTime ?? '',
  'Clear Time': dto.clearTime ?? '',
  'Ack Status': dto.ackStat ?? '',
  'Ack Time': dto.ackTime ?? '',
  'Ack Msg': dto.ackMsg ?? '',
  'Ack User': dto.ackUser ?? '',
  'Ticket Status': dto.ticketStatus ?? '',
  'Object Ref': dto.ref ?? '',
  'Alarm Id': dto.alarmId ?? '',
  'Internal TicketId': dto.trapId ?? '',
  'External TicketId': dto.ticket ?? '',
  Circle: dto.circle ?? '',
  City: dto.city ?? '',
  'ERP Site ID': dto.erpSiteId ?? '',
  __adapterName: dto.adapterName ?? '',
  __vendor: dto.vendor ?? '',
  __rec_time: dto.recTime ?? '',
});

const defaultVisibleColumns = [
  'Adapter', 'Severity', 'Alarm', 'Technology', 'Client', 'Device Name', 'Circle', 'City', 'ERP Site ID',
  'Source', 'Port Name', 'Tag', 'External TicketId','Ticket Status', 'Description', 'Ack Time', 'Ack Msg', 'Ack User',
  'Clear Msg', 'Clear User', 'NMS Received Time', 'Clear Time', 'OSS Insertion Time', 'Internal TicketId',
];

const columnOrder = [
  'Adapter', 'Severity', 'Alarm', 'Client', 'Technology', 'Device Name', 'Port Name', 'Tag', 'Source',
  'Circle', 'City', 'ERP Site ID', 'Device Type', 'Description', 'Ack Status', 'Ack Time', 'Ack Msg',
  'Ack User', 'Clear Msg', 'Clear User', 'Object Ref', 'Trap Source', 'NMS Received Time', 'Update Time',
  'Clear Time', 'OSS Insertion Time', 'Alarm Id', 'Internal TicketId', 'External TicketId','Ticket Status', 'No. of Service Affected',
];

function groupByAdapterAndSeverity(rows: DynamicTableRow[]) {
  const result: Record<string, Record<string, number>> = {};
  for (const src of PRESET_SOURCES) {
    result[src] = {};
    for (const sev of ALARM_SEVERITIES) result[src][sev] = 0;
  }
  for (const r of rows) {
    const Adapter = up(r['Adapter'] as string) || 'UNKNOWN';
    const sevNorm = normalizeSeverity((r['Severity'] as string) ?? '');
    if (!result[Adapter]) {
      result[Adapter] = {};
      for (const s of ALARM_SEVERITIES) result[Adapter][s] = 0;
    }
    if ((ALARM_SEVERITIES as readonly string[]).includes(sevNorm)) {
      result[Adapter][sevNorm] = (result[Adapter][sevNorm] ?? 0) + 1;
    }
  }
  return result;
}

function buildBarDataset(rows: DynamicTableRow[]) {
  const grouped = groupByAdapterAndSeverity(rows);
  const header = ['Adapter', ...ALARM_SEVERITIES];
  const Adapters = [...PRESET_SOURCES, ...Object.keys(grouped).filter((a) => !PRESET_SOURCES.includes(a as any))];
  const body = Adapters.map((Adapter) => {
    const sevMap = grouped[Adapter] || {};
    return [Adapter, ...ALARM_SEVERITIES.map((s) => sevMap[s] ?? 0)];
  });
  return [header, ...body];
}

type SeriesPoint = { time: Date; value: number };
type Series = { name: string; data: SeriesPoint[] };

function buildSeverityTrend(
  rows: DynamicTableRow[],
  minutesWindow = 10,
  severities: readonly string[] = ['Critical', 'Major', 'Minor']
): Series[] {
  const now = new Date();
  const buckets: Date[] = Array.from({ length: minutesWindow }, (_, i) => {
    const t = new Date(now);
    t.setSeconds(0, 0);
    t.setMinutes(t.getMinutes() - (minutesWindow - 1 - i));
    return t;
  });

  const first = buckets[0].getTime();
  const last = buckets[buckets.length - 1].getTime();
  const countMap: Record<number, Record<string, number>> = {};

  for (const b of buckets) {
    countMap[b.getTime()] = {};
    for (const s of severities) countMap[b.getTime()][s] = 0;
  }

  for (const r of rows) {
    const tsRaw = r['NMS Received Time'] as string;
    if (!tsRaw) continue;
    const ts = new Date(tsRaw);
    if (isNaN(ts.getTime())) continue;

    const snapped = new Date(ts);
    snapped.setSeconds(0, 0);
    const key = snapped.getTime();
    if (key < first || key > last) continue;

    const sevNorm = normalizeSeverity(r['Severity'] as string);
    if ((severities as readonly string[]).includes(sevNorm)) {
      countMap[key][sevNorm] = (countMap[key][sevNorm] ?? 0) + 1;
    }
  }

  return severities.map((s) => ({
    name: s,
    data: buckets.map((b) => ({ time: b, value: countMap[b.getTime()][s] ?? 0 })),
  }));
}

function safeSetItem(key: string, value: string) {
  try {
    if (value.length > 4 * 1024 * 1024) return;
    localStorage.setItem(key, value);
  } catch (e) {
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      try { localStorage.removeItem(key); } catch { }
    }
  }
}

function loadInitialRowsFromCache(): DynamicTableRow[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

export default function ActiveFaultTest() {
  const [open, setOpen] = useState(false);
  const [openTrapDetails, setOpenTrapDetails] = useState(false); //  FIXED: Added missing state variable

  const [trapSelected, setTrapSelected] = useState<string[]>([]);
  const [tableData, setTableData] = useState<DynamicTableRow[]>(() => loadInitialRowsFromCache());
  const [finalFilteredData, setFinalFilteredData] = useState<DynamicTableRow[]>(() => loadInitialRowsFromCache());
  const [alarmSeveritySelected, setAlarmSeveritySelected] = useState<string>('ALL');
  const [alarmSourceSelected, setAlarmSourceSelected] = useState<string>('ALL');
  const [popUpDataRow, setPopUpDataRow] = useState<DynamicTableRow | null>(null);
  const [viewGraph, setViewGraph] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const TABLE_ID = 'active-faults-table';

  const persistTableData = (rows: DynamicTableRow[]) => {
    setTableData(rows);
    setFinalFilteredData(rows);
    safeSetItem(STORAGE_KEY, JSON.stringify(rows));
  };

  const fetchFaultsData = async () => {
    try {
      setIsLoading(true);
      const response = await axiosClient.get(FETCH_ACTIVE_FAULTS_TABLE_DATA, {});
      if (response.status === 200) {
        const rows = (response.data ?? []).map(dtoToRow);
        persistTableData(rows);
      } else {
        setTableData([]); setFinalFilteredData([]);
      }
    } catch {
      setTableData([]); setFinalFilteredData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    logActivity({ activity: "Active Fault page opened", actionName: "ACTIVE_FAULT_PAGE", module: "FAULTS" });
    fetchFaultsData();
  }, []);

  useEffect(() => {
    let isActive = true;
    const socket = new SockJS(`${window.location.origin}/indiabackend/ws`);
    const client = new Client({
      webSocketFactory: () => socket as any,
      reconnectDelay: 5000,
      onConnect: () => {
        if (!isActive) return;
        client.subscribe(`/topic/active-traps`, (message) => {
          if (!isActive || !message.body) return;
          const payload = JSON.parse(message.body).map(dtoToRow);
          persistTableData(payload);
        });
      },
    });
    client.activate();
    return () => { isActive = false; client.deactivate(); };
  }, []);

  useEffect(() => {
    let filtered = [...tableData];
    if (alarmSeveritySelected !== 'ALL') {
      filtered = filtered.filter((row) => normalizeSeverity(norm(row['Severity'] as string)) === alarmSeveritySelected);
    }
    if (alarmSourceSelected !== 'ALL') {
      filtered = filtered.filter((row) => up(row['Adapter'] as string) === alarmSourceSelected);
    }
    if (trapSelected.length > 0) {
      filtered = filtered.filter((row) => trapSelected.includes(norm(row['Alarm'] as string)));
    }
    setFinalFilteredData(filtered);
  }, [tableData, alarmSeveritySelected, alarmSourceSelected, trapSelected]);

  const barData = useMemo(() => buildBarDataset(finalFilteredData), [finalFilteredData]);
  const hasRows = finalFilteredData.length > 0;

  return (
    <Box
      sx={{
        display: 'flex',
        height: '100%',
        width: '100%',
        overflow: 'hidden',
        backgroundColor: '#f1f5f9'
      }}
    >
      {/* ================= IN-PAGE SIDEBAR (FLEX COLLAPSE INSTEAD OF FIXED DRAWER) ================= */}
      <Box
        sx={{
          width: open ? { xs: '250px', lg: '300px' } : 0,
          minWidth: open ? { xs: '250px', lg: '300px' } : 0,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          overflowY: 'auto',
          overflowX: 'hidden',
          borderRight: open ? '1px solid #e2e8f0' : 'none',
          backgroundColor: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, borderBottom: '1px solid #e2e8f0' }}>
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: '#1e293b', letterSpacing: '0.05em' }}>
            Active Alarms
          </Typography>
          <IconButton onClick={() => setOpen(false)} size="small" sx={{ bgcolor: '#f1f5f9', '&:hover': { bgcolor: '#e2e8f0' } }}>
            <ChevronLeftIcon sx={{ fontSize: 18, color: '#475569' }} />
          </IconButton>
        </Box>
        <Box sx={{ p: 1 }}>
          <AlarmSummaryCardsInsideSidebar
            tableData={tableData}
            alarmSeveritySelected={alarmSeveritySelected}
            setAlarmSeveritySelected={setAlarmSeveritySelected}
            alarmSourceSelected={alarmSourceSelected}
            setAlarmSourceSelected={setAlarmSourceSelected}
          />
        </Box>
      </Box>

      {/* ================= MAIN CONTENT ENVELOPE ================= */}
      {/* ================= MAIN CONTENT ENVELOPE ================= */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          pt: 1.5, 
          px: 1.5, 
          pb: 0,  
          gap: 1.5,
          minWidth: 0
        }}
      >
        {/* Graph Section */}
        {/* Graph Section */}
        {viewGraph && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' }, // Stack on mobile, side-by-side on desktop
              gap: 1.5,
              height: '35%',
              minHeight: 280,
              flexShrink: 0, // Prevents the table from crushing the graphs
              width: '100%'
            }}
          >
            <Box sx={{ flex: 1, minWidth: 0, height: '100%', bgcolor: '#ffffff', borderRadius: 2, border: '1px solid #e2e8f0', p: 1, overflow: 'hidden' }}>
              <BarChartTemplate title="Active alarms by Adapter" data={barData} isSidebarOpen={open} />
            </Box>

            <Box sx={{ flex: 1, minWidth: 0, height: '100%', bgcolor: '#ffffff', borderRadius: 2, border: '1px solid #e2e8f0', p: 1, overflow: 'hidden' }}>
              <GraphTemplateSeverityTrend />
            </Box>
          </Box>
        )}

        {/* Table Section */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {isLoading && !hasRows ? (
            <FullPageLoader message="Loading Active Fault Data" />
          ) : hasRows ? (
            <ActiveFaultsTableForSidebar
              columnOrder={columnOrder}
              defaultVisibleColumns={defaultVisibleColumns}
              dataObjects={finalFilteredData}
              pageSize={100}
              isActiveTab={true}
              viewGraph={viewGraph}
              setViewGraph={setViewGraph}
              tableId={TABLE_ID}
              highlightPredicate={shouldHighlightRow}
              onRowClick={(row) => { setPopUpDataRow(row as DynamicTableRow); setOpenTrapDetails(true); }}
              drawerOpen={open}
              onDrawerToggle={() => setOpen(true)}
            />
          ) : (
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 2, bgcolor: '#ffffff', border: '1px solid #e2e8f0' }}>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>No active alarms found</Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* Popups */}
      <TrapDetailsDialog open={!!openTrapDetails} onClose={() => setOpenTrapDetails(false)} popUpDataRow={popUpDataRow} />
    </Box>
  );
}