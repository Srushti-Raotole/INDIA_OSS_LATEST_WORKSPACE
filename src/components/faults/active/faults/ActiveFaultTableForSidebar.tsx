import React, { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Button,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  CircularProgress,
  InputAdornment
} from '@mui/material';
import {
  MaterialReactTable,
  MRT_ColumnDef,
  MRT_RowSelectionState,
} from 'material-react-table';
import { DynamicTableRow } from '../../../../store/types';
import ClearTrap from './AckFavClear/ClearTrap';
import { useSnackbar } from '../../../common/SnackbarProvider';
import AcknowledgeTrap from './AckFavClear/AcknowledgeTrap';

import ExcelDownloadButton from '../../../common/ExcelDownloadButton';
import CommonDialog from '../../../common/CommonDialog.';
import TicketingPageTest from '../../../../pages/Faults/TicketingPageTest';
import AddToFavContent from './AckFavClear/AddToFav';
import { useNavigate } from 'react-router-dom';
import AutoTTDialog from '../Ticketing/AutoTTDialog';
import FullPageLoader from '../../../common/FullPageLoader';
import AlarmDetailsDialog from './Dialog/TrapDetailsDialog';
import axiosClient from "@/api/axiosClient";

import { FETCH_TICKETING_ALARMS, CREATE_TICKET } from "@/api/apis";

// ---------- Lucide React Icon Conversions ----------
import {
  ChevronRight,
  BarChart3,
  ChevronUp,
  ChevronDown,
  MoreVertical,
  Ticket,
  History,
  Bot,
  CircleX,
  CheckCircle2,
  Star,
  TicketPlus,
  Copy,
  AlertTriangle,
  Info
} from 'lucide-react';

type ApplyPayload = {
  groupIds: string[];
  adapters: string[];
  trapTypes: string[];
};

interface CommonTableProps {
  isLoading?: boolean;
  columnOrder: string[];
  dataObjects: Record<string, any>[];
  viewGraph: boolean;
  setViewGraph: (viewGraph: boolean) => void;
  pageSize?: number;
  onRowClick?: (row: Record<string, any>) => void;
  defaultVisibleColumns?: string[];
  isActiveTab?: boolean;
  tableId?: string;
  highlightPredicate?: (row: DynamicTableRow) => boolean;
  drawerWidthCss?: string;
  drawerOpen?: boolean;
  onDrawerToggle?: () => void;
}

const LOCALSTORAGE_PREFIX = 'visible_columns_map_';

const ActiveFaultsTableForSidebar: React.FC<CommonTableProps> = ({
  columnOrder,
  dataObjects,
  pageSize = 10,
  viewGraph,
  setViewGraph,
  onRowClick,
  defaultVisibleColumns,
  isLoading,
  isActiveTab = false,
  highlightPredicate,
  tableId = 'active-faults-table',
  drawerWidthCss = '20vw',
  drawerOpen = false,
  onDrawerToggle,
}) => {
  const { showMessage } = useSnackbar();
  const COLUMN_ORDER_KEY = `column_order_${tableId}`;
  const normalize = (s: any) => String(s ?? '').trim().toUpperCase();

  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  const isSm = useMediaQuery(theme.breakpoints.down('md'));
  const isMd = useMediaQuery(theme.breakpoints.down('lg'));

  const [allRows, setAllRows] = useState<Record<string, any>[]>([]);
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [adaptersForFilter, setAdaptersForFilter] = useState<Set<string>>(new Set());
  const [alarmsForFilter, setAlarmsForFilter] = useState<Set<string>>(new Set());
  const [openTrapDetails, setOpenTrapDetails] = useState(false);
  const [popUpDataRow, setPopUpDataRow] = useState<DynamicTableRow | null>(null);
  const [openTicketing, setOpenTicketing] = useState(false);
  const [autoTTData, setAutoTTData] = useState([]);
  const [actionsAnchorEl, setActionsAnchorEl] = useState<HTMLElement | null>(null);

  // States for the Ticket Creation Dialogs
  const [openTicketConfirm, setOpenTicketConfirm] = useState(false);
  const [ticketDialogMode, setTicketDialogMode] = useState<'confirm' | 'exists' | 'success' | 'loading'>('confirm');

  // Expanded state to capture more context
  const [ticketData, setTicketData] = useState<{
    adapterName: string;
    trapId: string | number;
    existingId?: string;
    newTicketId?: string;
    alarmName?: string;
    severity?: string;
    deviceName?: string;
  } | null>(null);

  useEffect(() => {
    const fetchAutoTT = async () => {
      const res = await axiosClient.get(FETCH_TICKETING_ALARMS, {
        params: { adapter: 'ALL' },
      });
      const data = res.data?.data || res.data || [];
      setAutoTTData(data);
    };
    fetchAutoTT();
  }, []);

  useEffect(() => {
    const filtered = dataObjects.filter((r) => {
      const a = normalize(r['Adapter']);
      const t = normalize(r['Alarm']);
      const adapterOk = adaptersForFilter.size === 0 || adaptersForFilter.has(a);
      const trapOk = alarmsForFilter.size === 0 || alarmsForFilter.has(t);
      return adapterOk && trapOk;
    });
    setAllRows(filtered ?? []);
    setRows(filtered ?? []);
  }, [dataObjects, adaptersForFilter, alarmsForFilter]);

  const [rowSelection, setRowSelection] = useState<MRT_RowSelectionState>({});
  const [selectedRows, setSelectedRows] = useState<DynamicTableRow[]>([]);
  const [openModel, setOpenModel] = useState(false);
  const [modelContent, setModelContent] = useState<'clear' | 'ack' | 'fav'>();
  const [openAutoTT, setOpenAutoTT] = useState(false);
  const [tableResetKey, setTableResetKey] = useState(0);
  // const [filterMode, setFilterMode] = useState<'include' | 'exclude'>('include');
  useEffect(() => {
    try {
      const key = `${LOCALSTORAGE_PREFIX}${tableId}`;
      if (localStorage.getItem(key)) localStorage.removeItem(key);
    } catch (e) {
      console.error('Failed to clear old column visibility from localStorage', e);
    }
  }, [tableId]);

  const buildVisibilityFromDefaults = (): Record<string, boolean> => {
    const visibleSet = new Set(defaultVisibleColumns ?? columnOrder);
    const visibility: Record<string, boolean> = {};
    columnOrder.forEach((col) => { visibility[col] = visibleSet.has(col); });
    return visibility;
  };

  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(
    () => buildVisibilityFromDefaults()
  );

  useEffect(() => {
    try {
      const key = `${LOCALSTORAGE_PREFIX}${tableId}`;
      const json = JSON.stringify(columnVisibility);
      if (json.length > 4 * 1024 * 1024) return;
      localStorage.setItem(key, json);
    } catch (e) {
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        localStorage.removeItem(`${LOCALSTORAGE_PREFIX}${tableId}`);
      } else {
        console.error('Failed to persist column visibility', e);
      }
    }
  }, [columnVisibility, tableId]);

  useEffect(() => {
    setColumnVisibility((prev) => {
      const visibleSet = new Set(defaultVisibleColumns ?? columnOrder);
      const next: Record<string, boolean> = {};
      columnOrder.forEach((col) => {
        next[col] = typeof prev[col] === 'boolean' ? prev[col] : visibleSet.has(col);
      });
      return next;
    });
  }, [columnOrder, defaultVisibleColumns]);

  const handleRowClick = (row: DynamicTableRow) => {
    setPopUpDataRow(row);
    setOpenTrapDetails(true);
  };

  const navigate = useNavigate();

  const [columnOrderState, setColumnOrderState] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(COLUMN_ORDER_KEY);
      return saved ? JSON.parse(saved) : columnOrder;
    } catch { return columnOrder; }
  });

  useEffect(() => {
    try { localStorage.setItem(COLUMN_ORDER_KEY, JSON.stringify(columnOrderState)); }
    catch (e) { console.error('Failed to save column order', e); }
  }, [columnOrderState]);

  const initialColumnSizes: Record<string, number> = {
    Adapter: 110, Severity: 90, Alarm: 220, Client: 160, Technology: 160,
    'Device Name': 220, Source: 180, Circle: 120, City: 160,
    'ERP Site ID': 220, 'Port Name': 180, 'No.Services_Affected': 280,
    Description: 420, 'Ack Time': 200, 'Ack Msg': 220, 'Ack User': 160,
    'Clear Msg': 220, 'Clear User': 180, 'NMS Received Time': 240,
    'OSS Insertion Time': 240, 'Internal TicketId': 200, 'Clear Time': 200,
  };

  const AdapterBadge = (raw?: string) => {
    const val = (raw ?? '').trim().toUpperCase();
    const bg =
      val === 'MCP' ? '#009688 !important' :
        val === 'NFMT' ? '#8283eb !important' :
          val === 'EPNM' ? '#4CAF50 !important' :
            val === 'CONC' ? '#FF9800 !important' :
              val === 'ADVA' ? '#9C27B0 !important' :
                val === 'IFNR' ? '#3F51B5 !important' :
                  val === 'TLMR' ? '#E91E63 !important' : '#607D8B';
    return (
      <Box sx={{
        px: 3, py: 0.1, lineHeight: 1.4, bgcolor: bg, color: '#fff',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: '10px', fontSize: '0.68rem', fontWeight: 700,
        minWidth: 64, textTransform: 'uppercase',
      }}>{val || 'NA'}</Box>
    );
  };

  const sevBadge = (raw?: string) => {
    const s = (raw ?? '').trim().toUpperCase();
    const map = {
      CRITICAL: { bg: '#D32F2F', fg: '#FFFFFF', letter: 'C' },
      MAJOR: { bg: '#F57C00', fg: '#FFFFFF', letter: 'M' },
      MINOR: { bg: '#FBC02D', fg: '#1A1A1A', letter: 'm' },
      MINORWARN: { bg: '#FBC02D', fg: '#1A1A1A', letter: 'm' },
      WARNING: { bg: '#FFEB3B', fg: '#333333', letter: 'W' },
      WARN: { bg: '#FFEB3B', fg: '#333333', letter: 'W' },
    } as const;
    const conf = (map as any)[s] ?? { bg: '#BDBDBD', fg: '#FFFFFF', letter: '•' };
    return (
      <Box component="span" sx={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 17, height: 17, bgcolor: conf.bg, color: conf.fg,
        borderRadius: '50%', fontSize: '0.62rem', fontWeight: 700,
      }} aria-label={s}>{conf.letter}</Box>
    );
  };

  const columns: MRT_ColumnDef<any>[] = useMemo(
    () => columnOrder.map((col) => {
      const isCorePinned = col === 'Adapter' || col === 'Severity' || col === 'Alarm';
      const base: MRT_ColumnDef<any> = {
        accessorFn: (row) => row[col],
        id: col, header: col,
        size: initialColumnSizes[col] ?? 140,
        enablePinning: isCorePinned,
        enableColumnDragging: !isCorePinned,
      };
      const getIsHighlighted = (rowOriginal: any) =>
        highlightPredicate?.(rowOriginal as DynamicTableRow) ?? false;

      if (col === 'Alarm') {
        base.muiTableBodyCellProps = ({ row }: any) => {
          const isHighlighted = getIsHighlighted(row.original);
          const bg = isHighlighted ? '#dcfce7' : row.index % 2 === 0 ? '#ffffff' : '#f8fafc';
          return {
            sx: {
              display: 'flex', alignItems: 'stretch', p: 0,
              fontSize: '0.68rem', whiteSpace: 'nowrap',
              backgroundColor: bg,
              'tr:hover &': { backgroundColor: '#f1f5f9 !important' },
            },
          };
        };
        base.Cell = ({ cell }) => (
          <Box sx={{
            flex: 1, width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', px: 1,
          }}>{cell.getValue<string>()}</Box>
        );
      }
      if (col === 'Adapter') {
        base.Cell = ({ cell }) => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
            {AdapterBadge(cell.getValue<string>())}
          </Box>
        );
        base.enableSorting = false;
        base.muiTableBodyCellProps = { align: 'center' as const };
      }
      if (col === 'Severity') {
        base.Cell = ({ cell }) => (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Tooltip title={(cell.getValue<string>() ?? '').toString()}>
              <span>{sevBadge(cell.getValue<string>())}</span>
            </Tooltip>
          </Box>
        );
        base.enableSorting = false;
        base.muiTableBodyCellProps = { align: 'center' as const };
      }
      return base;
    }),
    [columnOrder, highlightPredicate]
  );

  const applyGroupFilter = (payload: ApplyPayload) => {
    const adapterSet = new Set(payload.adapters.map((a) => a.toUpperCase()));
    const trapSet = new Set(payload.trapTypes.map((t) => t.toUpperCase()));
    setAdaptersForFilter(new Set(adapterSet));
    setAlarmsForFilter(new Set(trapSet));
    const filtered = allRows.filter((r) => {
      const a = normalize(r['Adapter']);
      const t = normalize(r['Alarm']);
      const adapterOk = adapterSet.size === 0 || adapterSet.has(a);
      const trapOk = trapSet.size === 0 || trapSet.has(t);
      return adapterOk && trapOk;
    });
    setRows(filtered);
    setRowSelection({});
    setSelectedRows([]);
  };

  const clearGroupFilter = () => {
    setAdaptersForFilter(new Set());
    setAlarmsForFilter(new Set());
    setRows(allRows);
    setSelectedRows([]);
    setTableResetKey((k) => k + 1);
  };

  const orderedData = useMemo(
    () => rows.map((obj) =>
      columnOrderState.reduce((acc, key) => {
        acc[key] = obj[key] ?? '';
        return acc;
      }, {} as Record<string, any>)
    ),
    [rows, columnOrderState]
  );

  const onAckDone = () => {
    setOpenModel(false);
    showMessage('Selected traps acknowledged successfully.', 'success');
    setSelectedRows([]);
    setTableResetKey((k) => k + 1);
  };

  const onClearDone = () => {
    setOpenModel(false);
    showMessage('Selected traps cleared successfully.', 'success');
    setSelectedRows([]);
    setTableResetKey((k) => k + 1);
  };

  const leftPinnedColumns = isActiveTab
    ? ['mrt-row-select', 'Adapter', 'Severity', 'Alarm']
    : ['Adapter', 'Severity', 'Alarm'];

  const btnSx = {
    minWidth: 0,
    height: 32,
    borderRadius: 1.5,
    fontSize: { xs: '0.65rem', md: '0.72rem' },
    fontWeight: 600,
    color: '#ffffff !important',
    textTransform: 'none' as const,
    boxShadow: 'none',
    px: { xs: 1.2, md: 1.8 },
    '& .MuiButton-startIcon': { mr: 0.75 },
    '& .MuiButton-startIcon > *': { color: '#ffffff !important' },
    '& .MuiButton-endIcon > *': { color: '#ffffff !important' },
    '&:hover': { boxShadow: 'none' }
  };

  // ----- HELPERS -----

  const handleCopy = (textToCopy: string, customMessage?: string) => {
    navigator.clipboard.writeText(textToCopy);
    showMessage(customMessage || 'Copied to clipboard!', 'success');
  };

  // ----- ACTION HANDLERS -----

  const triggerClear = (table: any) => {
    const selected = table.getSelectedRowModel().rows.map((r: any) => r.original as DynamicTableRow);
    if (!selected.length) return showMessage('Please select at least one row to clear.', 'warning');
    setSelectedRows(selected);
    setModelContent('clear');
    setOpenModel(true);
  };

  const triggerAck = (table: any) => {
    const selected = table.getSelectedRowModel().rows.map((r: any) => r.original as DynamicTableRow);
    if (!selected.length) return showMessage('Please select at least one row to acknowledge.', 'warning');
    setSelectedRows(selected);
    setModelContent('ack');
    setOpenModel(true);
  };

  // ----- CREATE TICKET HANDLERS -----

  const triggerCreateTicket = (table: any) => {
    const selected = table.getSelectedRowModel().rows.map((r: any) => r.original as any);

    // Strict validation: Only exactly one row allowed
    if (selected.length !== 1) {
      return showMessage('Please select exactly one row to create a ticket.', 'warning');
    }

    const row = selected[0];

    const existingExtId = row['External TicketId'] || row['External Ticket Id'] || row.externalTicketId;

    // Extracted robust payload data
    const payload = {
      adapterName: row['Adapter'] || 'EPNM',
      trapId: row.trapId || row['Trap ID'] || row['Internal TicketId'],
      alarmName: row['Alarm'],
      severity: row['Severity'],
      deviceName: row['Device Name'] || row['Node Name']
    };

    if (existingExtId && String(existingExtId).trim() !== '') {
      setTicketData({ ...payload, existingId: String(existingExtId) });
      setTicketDialogMode('exists');
      setOpenTicketConfirm(true);
    } else {
      setTicketData(payload);
      setTicketDialogMode('confirm');
      setOpenTicketConfirm(true);
    }
  };

  const executeCreateTicket = async () => {
    if (!ticketData) return;

    setTicketDialogMode('loading');

    try {
      const res = await axiosClient.post(CREATE_TICKET, {
        adapterName: ticketData.adapterName,
        trapId: ticketData.trapId
      });

      const returnedTicketId = res.data?.ticketId || res.data?.data?.ticketId || res.data?.externalTicketId || '';

      showMessage('Ticket successfully created.', 'success');
      setTicketData(prev => prev ? { ...prev, newTicketId: returnedTicketId } : null);
      setTicketDialogMode('success');

      setRowSelection({});
    } catch (error: any) {
      console.error('Create Ticket failed:', error);
      const errorMsg = error?.response?.data?.message || 'Failed to create ticket due to server error.';
      showMessage(errorMsg, 'error');

      setOpenTicketConfirm(false);
      setTicketData(null);
    }
  };
  // Helper to check for normal substring OR exact word match if wrapped in quotes ("")
  const checkMatch = (text: string, term: string) => {
    if (term.startsWith('"') && term.endsWith('"')) {
      const actualTerm = term.slice(1, -1).trim();
      if (!actualTerm) return false;
      const escaped = actualTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'i'); // \b ensures exact word boundary
      return regex.test(text);
    }
    return text.includes(term);
  };

  // 1. Filter for individual Column Search boxes
  const columnMultiOrExcludeFilter = (row: any, id: string, filterValue: any) => {
    if (!row?.original) return true;
    const cellValue = String(row.getValue(id) ?? '').toLowerCase();
    const searchTerms = String(filterValue || '').toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
    if (!searchTerms.length) return true;

    for (const term of searchTerms) {
      if (term.startsWith('!') || term.startsWith('-')) {
        const cleanTerm = term.slice(1).trim();
        if (cleanTerm && checkMatch(cellValue, cleanTerm)) return false;
      }
    }

    const includeTerms = searchTerms.filter(term => !term.startsWith('!') && !term.startsWith('-'));
    if (!includeTerms.length) return true;

    return includeTerms.some(term => checkMatch(cellValue, term));
  };

  // 2. Filter for Top-Right Global Search bar
  const globalMultiOrExcludeFilter = (row: any, _columnId: string, filterValue: any) => {
    if (!row?.original) return true;
    const searchTerms = String(filterValue || '').toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
    if (!searchTerms.length) return true;

    const allRowText = Object.values(row.original).map(val => String(val ?? '').toLowerCase()).join(' ');

    for (const term of searchTerms) {
      if (term.startsWith('!') || term.startsWith('-')) {
        const cleanTerm = term.slice(1).trim();
        if (cleanTerm && checkMatch(allRowText, cleanTerm)) return false;
      }
    }

    const includeTerms = searchTerms.filter(term => !term.startsWith('!') && !term.startsWith('-'));
    if (!includeTerms.length) return true;

    return includeTerms.some(term => checkMatch(allRowText, term));
  };


  // // 1. Filter for individual Column Search boxes
  // const columnMultiOrExcludeFilter = (row: any, id: string, filterValue: any) => {
  //   if (!row?.original) return true;
  //   const cellValue = String(row.getValue(id) ?? '').toLowerCase();
  //   const searchTerms = String(filterValue || '').toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
  //   if (!searchTerms.length) return true;

  //   // Check exclusions first (!term or -term)
  //   for (const term of searchTerms) {
  //     if (term.startsWith('!') || term.startsWith('-')) {
  //       const cleanTerm = term.slice(1).trim();
  //       if (cleanTerm && cellValue.includes(cleanTerm)) return false;
  //     }
  //   }

  //   // Check inclusions
  //   const includeTerms = searchTerms.filter(term => !term.startsWith('!') && !term.startsWith('-'));
  //   if (!includeTerms.length) return true;

  //   return includeTerms.some(term => cellValue.includes(term));
  // };

  // // 2. Filter for Top-Right Global Search bar
  // const globalMultiOrExcludeFilter = (row: any, _columnId: string, filterValue: any) => {
  //   if (!row?.original) return true;
  //   const searchTerms = String(filterValue || '').toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
  //   if (!searchTerms.length) return true;

  //   const allRowText = Object.values(row.original).map(val => String(val ?? '').toLowerCase()).join(' ');

  //   // Check exclusions first (!term or -term)
  //   for (const term of searchTerms) {
  //     if (term.startsWith('!') || term.startsWith('-')) {
  //       const cleanTerm = term.slice(1).trim();
  //       if (cleanTerm && allRowText.includes(cleanTerm)) return false;
  //     }
  //   }

  //   // Check inclusions
  //   const includeTerms = searchTerms.filter(term => !term.startsWith('!') && !term.startsWith('-'));
  //   if (!includeTerms.length) return true;

  //   return includeTerms.some(term => allRowText.includes(term));
  // };
  // ADD THIS CUSTOM FILTER FUNCTION
  const multiOrExcludeFilter = (row: any, id: string, filterValue: string | number) => {
    const cellValue = String(row.getValue(id) ?? '').toLowerCase();
    const searchTerms = String(filterValue).toLowerCase().split(',').map(s => s.trim()).filter(Boolean);

    if (!searchTerms.length) return true;

    // 1. Check exclusions first (terms starting with ! or -)
    for (const term of searchTerms) {
      if (term.startsWith('!') || term.startsWith('-')) {
        const cleanTerm = term.slice(1).trim();
        if (cleanTerm && cellValue.includes(cleanTerm)) {
          return false; // Exclude row if it matches an exclusion term
        }
      }
    }

    // 2. Check inclusions (OR logic for comma-separated terms)
    const includeTerms = searchTerms.filter(term => !term.startsWith('!') && !term.startsWith('-'));
    if (!includeTerms.length) return true; // If only exclusions were searched, keep remaining rows

    return includeTerms.some(term => cellValue.includes(term));
  };
  const handleCloseTicketDialog = () => {
    setOpenTicketConfirm(false);
    setTimeout(() => {
      setTicketData(null);
      setTicketDialogMode('confirm');
    }, 200);
  };

  if (isLoading) {
    return (
      <Box sx={{ width: '100%', height: '100%', minHeight: '60vh' }}>
        <FullPageLoader message="Loading Active Fault Data" />
      </Box>
    );
  }

  if (!dataObjects || dataObjects.length === 0) {
    return (
      <Box sx={{
        width: '100%', height: '100%', minHeight: '60vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#64748b', fontSize: '0.9rem',
      }}>No active faults found</Box>
    );
  }

  // Common UI fragment for displaying the ticket details nicely inside the dialogs
  const TicketDetailsCard = () => (
    <Box sx={{
      my: 1.5, p: 1.5, bgcolor: '#f1f5f9', borderRadius: 1, border: '1px solid #e2e8f0',
      display: 'flex', flexDirection: 'column', gap: 0.75
    }}>
      <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
        Adapter: <span style={{ fontWeight: 400 }}>{ticketData?.adapterName}</span>
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
        Trap ID: <span style={{ fontWeight: 400 }}>{ticketData?.trapId}</span>
      </Typography>

      {ticketData?.alarmName && (
        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
          Alarm: <span style={{ fontWeight: 400 }}>{ticketData.alarmName}</span>
        </Typography>
      )}

      {ticketData?.severity && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>Severity:</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {sevBadge(ticketData.severity)}
            <Typography variant="body2" sx={{ fontWeight: 400, color: '#334155', textTransform: 'capitalize' }}>
              {ticketData.severity.toLowerCase()}
            </Typography>
          </Box>
        </Box>
      )}

      {ticketData?.deviceName && (
        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
          Device: <span style={{ fontWeight: 400 }}>{ticketData.deviceName}</span>
        </Typography>
      )}
    </Box>
  );

  return (
    <Box sx={{
      p: 0, m: 0,
      height: viewGraph ? 'calc(100vh - 43vh)' : 'calc(100vh - 9vh)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      <MaterialReactTable
        key={tableResetKey}
        columns={columns}
        data={orderedData}
        enableHiding
        enableGlobalFilter
        positionGlobalFilter="right"
        state={{ columnVisibility, rowSelection, columnOrder: columnOrderState }}
        onColumnOrderChange={setColumnOrderState}
        onColumnVisibilityChange={setColumnVisibility}
        onRowSelectionChange={setRowSelection}
        muiTablePaperProps={({ table }) => ({
          sx: {
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
            borderRadius: 3, m: 0, height: '100%',
            minHeight: 0,
            overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
            border: 'none',
          },
          style: table.getState().isFullScreen ? {
            left: 0,              // Changed from drawerWidthCss to 0
            width: '100vw',       // Changed to take full viewport width
            right: 0, top: 0, bottom: 0, height: '100vh',
            maxWidth: '100vw', maxHeight: '100vh',
            margin: 0, padding: 0, position: 'fixed',
            zIndex: 9999,         // Changed from 999 to 9999 to sit above Navigation Sidebar (1200)
          } : undefined,
        })}

        // Inside your <MaterialReactTable /> props:
        // Inside your <MaterialReactTable /> props:
        filterFns={{
          multiOrExclude: columnMultiOrExcludeFilter,
          globalMultiOrExclude: globalMultiOrExcludeFilter,
        }}
        globalFilterFn="globalMultiOrExclude"
        defaultColumn={{ filterFn: 'multiOrExclude' }}
        muiSearchTextFieldProps={{
          placeholder: 'Search...',
          InputProps: {
            endAdornment: (
              <InputAdornment position="end">
                <Tooltip 
                  title={
                    <Box sx={{ p: 0.5, fontSize: '0.75rem', lineHeight: 1.6, maxWidth: 260 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: '#fff', borderBottom: '1px solid #475569', pb: 0.5 }}>
                        Search Guide
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Typography variant="caption" sx={{ color: '#e2e8f0', display: 'block' }}>
                          <b style={{ color: '#6ee7b7' }}>Include Multiple:</b><br/>
                          Type <code>MCP, ADVA</code> to show rows having <i>either</i> MCP or ADVA.
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#e2e8f0', display: 'block' }}>
                          <b style={{ color: '#fca5a5' }}>Exclude:</b><br/>
                          Type <code>-MCP</code> or <code>!MCP</code> to instantly hide all rows containing MCP.
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#e2e8f0', display: 'block' }}>
                          <b style={{ color: '#93c5fd' }}>Exact Word Match:</b><br/>
                          Type <code>"ADVA"</code> in quotes to find the exact word (this prevents matching longer words like <i>ADIANIADVAOMO2</i>).
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#e2e8f0', display: 'block' }}>
                          <b style={{ color: '#fcd34d' }}>Include & Exclude Combined:</b><br/>
                          Type <code>Major, -MCP</code> to show all Major alarms, <i>except</i> the ones from MCP.
                        </Typography>
                      </Box>
                    </Box>
                  }
                  placement="bottom-end"
                  arrow
                >
                  <IconButton edge="end" size="small" sx={{ p: 0.5, color: '#94a3b8', '&:hover': { color: '#0ea5e9' } }}>
                    <Info size={16} />
                  </IconButton>
                </Tooltip>
              </InputAdornment>
            ),
          },
        }}
        muiTableHeadCellProps={{
          align: 'left',
          sx: {
            backgroundColor: '#354a6b',
            color: '#ffffff',
            py: 0.75,
            fontSize: '0.72rem',
            fontWeight: 600,
            borderBottom: 'none',
            '& .MuiSvgIcon-root': { color: '#ffffff !important' },
            '& .Mui-TableHeadCell-Content-Labels': { color: '#ffffff' },
            '& .Mui-TableHeadCell-Content-Wrapper': { color: '#ffffff' },
            '&[data-pinned="true"]': {
              backgroundColor: '#354a6b',
              boxShadow: 'none',
              '&::after': {
                content: '""',
                position: 'absolute',
                right: 0,
                top: 0,
                bottom: 0,
                width: '1px',
                backgroundColor: 'rgba(255,255,255,0.15)',
              }
            },
          },
        }}
        muiTableContainerProps={{
          sx: {
            mt: 0,
            pt: 0,
            width: '100%', maxWidth: '100%',
            overflowY: 'auto', overflowX: 'auto', position: 'relative',
            scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 transparent',
            '&::-webkit-scrollbar': { width: '8px', height: '8px' },
            '&::-webkit-scrollbar-track': { background: 'transparent' },
            '&::-webkit-scrollbar-thumb': { background: '#cbd5e1', borderRadius: '4px' },
          },
        }}
        muiTableBodyRowProps={({ row }) => ({
          onClick: () => handleRowClick(row.original),
          sx: {
            cursor: 'pointer',
            '& td': { borderBottom: `1px solid ${theme.palette.divider}` },
          },
        })}
        muiTableBodyCellProps={({ row }) => {
          const isHighlighted = highlightPredicate?.(row.original as DynamicTableRow);
          const bg = isHighlighted ? '#dcfce7' : row.index % 2 === 0 ? '#ffffff' : '#f8fafc';
          return {
            sx: {
              py: 0.4, px: 1.2,
              fontSize: '0.68rem',
              whiteSpace: 'nowrap',
              borderRight: 'none',
              color: '#334155',
              backgroundColor: bg,
              'tr:hover &': { backgroundColor: '#f1f5f9 !important' },
            },
          };
        }}
        initialState={{
          pagination: { pageIndex: 0, pageSize },
          columnPinning: { left: leftPinnedColumns },
          sorting: [{ id: 'NMS Received Time', desc: true }],
        }}
        enableColumnOrdering
        enableColumnDragging={true}
        enableColumnResizing
        enableRowSelection={!!isActiveTab}
        // defaultColumn={{ filterFn: 'equals' }}
        displayColumnDefOptions={isActiveTab ? {
          'mrt-row-select': {
            header: '', size: 30,
            enablePinning: false, enableColumnDragging: false,
            muiTableHeadCellProps: {
              sx: {
                p: 0,
                px: 1,
                backgroundColor: '#354a6b',
                '& .MuiCheckbox-root': {
                  p: '2px',
                  '& .MuiSvgIcon-root': { fontSize: '14px' },
                  color: 'rgba(255,255,255,0.7)',
                  '&.Mui-checked': { color: '#ffffff' },
                },
              },
            },
          },
        } : undefined}
        muiSelectCheckboxProps={{
          sx: {
            padding: '2px',
            '& .MuiSvgIcon-root': { fontSize: '14px' },
            color: '#94a3b8',
            '&.Mui-checked': { color: '#354a6b' },
          },
        }}
        renderTopToolbarCustomActions={({ table }: { table: any }) =>
          isActiveTab ? (
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              flexWrap: 'nowrap',
              minWidth: 0,
              flex: 1,
              px: 1,
            }}>
              {!drawerOpen && (
                <Tooltip title="Show Alarm Count">
                  <IconButton
                    size="small"
                    onClick={onDrawerToggle}
                    sx={{
                      bgcolor: '#f1f5f9',
                      color: '#475569',
                      width: 36,
                      height: 36,
                      borderRadius: 1.5,
                      border: '1px solid #e2e8f0',
                      '&:hover': { bgcolor: '#e2e8f0' },
                    }}
                  >
                    <ChevronRight size={22} color="#475569" strokeWidth={2.5} />
                  </IconButton>
                </Tooltip>
              )}

              <ExcelDownloadButton
                data={rows}
                columnOrder={columnOrder}
                tableId={tableId}
                fileName="Active_Faults_Report"
              />

              <Tooltip title={viewGraph ? 'Hide graph' : 'Show graph'}>
                <Button
                  variant="contained"
                  onClick={() => setViewGraph(!viewGraph)}
                  startIcon={<BarChart3 size={16} color="#ffffff" />}
                  endIcon={
                    !isXs ? (viewGraph ? <ChevronUp size={16} color="#ffffff" /> : <ChevronDown size={16} color="#ffffff" />) : undefined
                  }
                  sx={{ ...btnSx, bgcolor: '#0f766e', '&:hover': { bgcolor: '#115e59' } }}
                >
                  {isSm ? '' : 'Graph'}
                </Button>
              </Tooltip>

              {!isMd && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Button
                    variant="contained"
                    onClick={() => setOpenAutoTT(true)}
                    startIcon={<Bot size={16} color="#ffffff" />}
                    sx={{ ...btnSx, bgcolor: '#0284c7', '&:hover': { bgcolor: '#0369a1' } }}
                  >
                    Auto TT
                  </Button>
                </Box>
              )}

              <Box sx={{ flex: 1, minWidth: 0 }} />

              {isMd ? (
                <>
                  <Tooltip title="Actions">
                    <IconButton
                      size="small"
                      onClick={(e) => setActionsAnchorEl(e.currentTarget)}
                      sx={{
                        bgcolor: '#f1f5f9', color: '#475569',
                        width: 32, height: 32, borderRadius: 1.5,
                        '&:hover': { bgcolor: '#e2e8f0' },
                      }}
                    >
                      <MoreVertical size={18} color="#475569" />
                    </IconButton>
                  </Tooltip>
                  <Menu
                    anchorEl={actionsAnchorEl}
                    open={Boolean(actionsAnchorEl)}
                    onClose={() => setActionsAnchorEl(null)}
                    PaperProps={{
                      elevation: 2,
                      sx: { minWidth: 190, borderRadius: 2, mt: 0.5 }
                    }}
                  >
                    <MenuItem
                      onClick={() => { setActionsAnchorEl(null); triggerCreateTicket(table); }}
                      sx={{ fontSize: '0.8rem', py: 1 }}
                    >
                      <ListItemIcon><TicketPlus size={18} color="#4f46e5" /></ListItemIcon>
                      <ListItemText>Create Ticket</ListItemText>
                    </MenuItem>

                    <MenuItem
                      onClick={() => { setActionsAnchorEl(null); triggerClear(table); }}
                      sx={{ fontSize: '0.8rem', py: 1 }}
                    >
                      <ListItemIcon><CircleX size={18} color="#be123c" /></ListItemIcon>
                      <ListItemText>Clear</ListItemText>
                    </MenuItem>
                    <MenuItem
                      onClick={() => { setActionsAnchorEl(null); triggerAck(table); }}
                      sx={{ fontSize: '0.8rem', py: 1 }}
                    >
                      <ListItemIcon><CheckCircle2 size={18} color="#0f766e" /></ListItemIcon>
                      <ListItemText>Acknowledge</ListItemText>
                    </MenuItem>
                    <MenuItem
                      onClick={() => { setActionsAnchorEl(null); setModelContent('fav'); setOpenModel(true); }}
                      sx={{ fontSize: '0.8rem', py: 1 }}
                    >
                      <ListItemIcon><Star size={18} color="#f59e0b" /></ListItemIcon>
                      <ListItemText>Add to Favourites</ListItemText>
                    </MenuItem>
                    <Tooltip
                      title={
                        <Box sx={{ p: 0.5, fontSize: '0.75rem', lineHeight: 1.6, maxWidth: 260 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: '#fff', borderBottom: '1px solid #475569', pb: 0.5 }}>
                            Smart Search Guide
                          </Typography>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Typography variant="caption" sx={{ color: '#e2e8f0', display: 'block' }}>
                              <b style={{ color: '#6ee7b7' }}>Include Multiple:</b><br />
                              Type <code>MCP, ADVA</code> to show rows having <i>either</i> MCP or ADVA.
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#e2e8f0', display: 'block' }}>
                              <b style={{ color: '#fca5a5' }}>Exclude:</b><br />
                              Type <code>-MCP</code> or <code>!MCP</code> to instantly hide all rows containing MCP.
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#e2e8f0', display: 'block' }}>
                              <b style={{ color: '#93c5fd' }}>Exact Word Match:</b><br />
                              Type <code>"ADVA"</code> in quotes to find the exact word (this prevents matching longer words like <i>ADIANIADVAOMO2</i>).
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#e2e8f0', display: 'block' }}>
                              <b style={{ color: '#fcd34d' }}>Include & Exclude Combined:</b><br />
                              Type <code>Major, -MCP</code> to show all Major alarms, <i>except</i> the ones from MCP.
                            </Typography>
                          </Box>
                        </Box>
                      }
                      placement="bottom-end"
                      arrow
                    >
                      <IconButton
                        size="small"
                        sx={{ ml: 0.5, color: '#64748b', '&:hover': { color: '#0ea5e9', bgcolor: '#f1f5f9' } }}
                      >
                        <Info size={18} />
                      </IconButton>
                    </Tooltip>
                    <MenuItem
                      onClick={() => { setActionsAnchorEl(null); navigate('/faults/ticketing'); }}
                      sx={{ fontSize: '0.8rem', py: 1 }}
                    >
                      <ListItemIcon><Ticket size={18} color="#4f46e5" /></ListItemIcon>
                      <ListItemText>Ticketing</ListItemText>
                    </MenuItem>
                    <MenuItem
                      onClick={() => { setActionsAnchorEl(null); navigate('/faults/historical'); }}
                      sx={{ fontSize: '0.8rem', py: 1 }}
                    >
                      <ListItemIcon><History size={18} color="#2563eb" /></ListItemIcon>
                      <ListItemText>Historic</ListItemText>
                    </MenuItem>
                    <MenuItem
                      onClick={() => { setActionsAnchorEl(null); setOpenAutoTT(true); }}
                      sx={{ fontSize: '0.8rem', py: 1 }}
                    >
                      <ListItemIcon><Bot size={18} color="#0284c7" /></ListItemIcon>
                      <ListItemText>Auto TT</ListItemText>
                    </MenuItem>
                  </Menu>
                </>
              ) : (
                <>
                  <Button
                    variant="contained"
                    onClick={() => triggerCreateTicket(table)}
                    startIcon={<TicketPlus size={16} color="#ffffff" />}
                    sx={{ ...btnSx, bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' } }}
                  >
                    Create Ticket
                  </Button>

                  <Button
                    variant="contained"
                    onClick={() => triggerClear(table)}
                    startIcon={<CircleX size={16} color="#ffffff" />}
                    sx={{ ...btnSx, bgcolor: '#be123c', '&:hover': { bgcolor: '#9f1239' } }}
                  >
                    Clear
                  </Button>

                  <Button
                    variant="contained"
                    onClick={() => triggerAck(table)}
                    startIcon={<CheckCircle2 size={16} color="#ffffff" />}
                    sx={{ ...btnSx, bgcolor: '#0f766e', '&:hover': { bgcolor: '#115e59' } }}
                  >
                    Acknowledge
                  </Button>

                  <Button
                    variant="contained"
                    onClick={() => { setModelContent('fav'); setOpenModel(true); }}
                    startIcon={<Star size={16} color="#ffffff" />}
                    sx={{ ...btnSx, bgcolor: '#f59e0b', '&:hover': { bgcolor: '#d97706' } }}
                  >
                    Favourites
                  </Button>
                </>
              )}
            </Box>
          ) : null
        }
        enablePagination
        enableColumnActions
        enableSorting={true}
        positionToolbarAlertBanner="none"
        enableStickyHeader
        enableStickyFooter
        enableColumnPinning
        columnFilterDisplayMode="subheader"
        // columnResizeMode="onEnd"
        columnResizeMode="onChange"
        enableGrouping
        enableDensityToggle={false}
        enableRowVirtualization
        enableColumnVirtualization
        muiPaginationProps={{
          variant: 'text', shape: 'rounded', size: 'small',
          rowsPerPageOptions: [10, 20, 50, 100, 200],
        }}
        enableBottomToolbar
        enableTopToolbar
        enableSelectAll={false}
        enableMultiRowSelection
        muiTopToolbarProps={{
          sx: {
            color: '#1e293b !important',
            backgroundColor: '#ffffff',
            '& .MuiSvgIcon-root': { color: '#64748b !important' },
            minHeight: '48px !important',
            py: 0, px: '8px', flexShrink: 0,
            borderBottom: `1px solid ${theme.palette.divider}`,

            '& .MuiToolbar-root': {
              minHeight: '48px !important',
              height: '48px',
              px: '4px',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              flexWrap: 'nowrap',
              overflow: 'hidden',
            },

            '& .MuiCollapse-root': {
              display: 'flex',
              alignItems: 'center',
              alignSelf: 'center',
              width: { xs: '110px !important', sm: '140px !important', md: '180px !important' },
              flexShrink: 0,
            },
            '& .MuiCollapse-wrapper, & .MuiCollapse-wrapperInner': {
              display: 'flex', alignItems: 'center', width: '100%',
            },
            '& .MuiTextField-root': {
              margin: 0, width: '100%',
              '& .MuiInputBase-root': {
                fontSize: '0.75rem',
                height: '32px',
                padding: '0 10px',
                backgroundColor: '#f1f5f9',
                borderRadius: '6px',
                color: '#334155 !important',
                '& fieldset': { border: 'none' },
              },
              '& .MuiInputBase-input::placeholder': {
                color: '#94a3b8 !important', opacity: 1,
              },
            },
          },
        }}
        muiBottomToolbarProps={{
          sx: {
            p: 0,
            m: 0,
            minHeight: '36px',
            height: '36px',
            flexShrink: 0,
            backgroundColor: '#ffffff',
            borderTop: `1px solid ${theme.palette.divider}`,

            '& .MuiToolbar-root': {
              minHeight: '36px !important',
              height: '36px',
              paddingTop: 0,
              paddingBottom: 0,
              marginTop: 0,
              marginBottom: 0,
            },

            '& .MuiTablePagination-root': {
              margin: 0,
              padding: 0,
              minHeight: '36px',
            },

            '& .MuiButton-root': {
              minWidth: 'auto',
              padding: '0px 2px',
              fontSize: '0.65rem',
            },

            '& .MuiIconButton-root': {
              padding: '4px',
            },

            '& .MuiInputBase-root': {
              height: '28px',
              fontSize: '0.7rem',
            },
          },
        }}
      />

      <AlarmDetailsDialog
        mode="active"
        open={openTrapDetails}
        onClose={() => setOpenTrapDetails(false)}
        popUpDataRow={popUpDataRow}
      />

      <CommonDialog
        open={openModel}
        onClose={() => setOpenModel(false)}
        title="Trap Details"
        maxWidth={modelContent === 'fav' ? 'md' : 'sm'}
      >
        {modelContent === 'clear' ? (
          <ClearTrap selectedrows={selectedRows} onDone={onClearDone} />
        ) : modelContent === 'ack' ? (
          <AcknowledgeTrap selectedrows={selectedRows} onDone={onAckDone} />
        ) : modelContent === 'fav' ? (
          <AddToFavContent
            onApplied={(payload) => applyGroupFilter(payload)}
            onCleared={() => clearGroupFilter()}
          />
        ) : null}
      </CommonDialog>

      <AutoTTDialog
        open={openAutoTT}
        onClose={() => setOpenAutoTT(false)}
        data={autoTTData}
      />

      <Dialog
        open={openTicketing}
        onClose={() => setOpenTicketing(false)}
        fullScreen
        sx={{ '& .MuiDialog-paper': { m: 0, borderRadius: 0 } }}
      >
        <Box sx={{ position: 'relative', height: 'calc(100vh - 48px)', overflow: 'hidden' }}>
          <Box sx={{ width: '100%', height: '100%' }}>
            <TicketingPageTest />
          </Box>
        </Box>
      </Dialog>


      {/* DYNAMIC TICKET CREATION DIALOG */}
      <Dialog
        open={openTicketConfirm}
        onClose={ticketDialogMode === 'loading' ? undefined : handleCloseTicketDialog}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        {/* -- MODE: WARNING / EXISTS -- */}
        {ticketDialogMode === 'exists' && (
          <>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#fef3c7', color: '#92400e', fontSize: '1rem', py: 1.5 }}>
              <AlertTriangle size={20} />
              Ticket Already Exists
            </DialogTitle>
            <DialogContent sx={{ mt: 2 }}>
              <Typography variant="body1" sx={{ color: '#334155', mb: 2 }}>
                A ticket has already been generated for this fault. You cannot create a duplicate.
              </Typography>

              <Box sx={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                p: 1.5, mb: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 1
              }}>
                <Box>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block' }}>
                    EXTERNAL TICKET ID
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#1e293b', fontWeight: 600 }}>
                    {ticketData?.existingId}
                  </Typography>
                </Box>
                <Tooltip title="Copy Ticket ID">
                  <IconButton
                    size="small"
                    onClick={() => handleCopy(ticketData?.existingId || '')}
                    sx={{ color: '#0ea5e9', '&:hover': { bgcolor: '#e0f2fe' } }}
                  >
                    <Copy size={16} />
                  </IconButton>
                </Tooltip>
              </Box>

              {/* Show Context Data */}
              <TicketDetailsCard />

            </DialogContent>
            <DialogActions sx={{ p: 2, pt: 0 }}>
              <Button onClick={handleCloseTicketDialog} variant="contained" sx={{ bgcolor: '#92400e', '&:hover': { bgcolor: '#78350f' }, textTransform: 'none', boxShadow: 'none' }}>
                Close
              </Button>
            </DialogActions>
          </>
        )}

        {/* -- MODE: CONFIRM & LOADING -- */}
        {(ticketDialogMode === 'confirm' || ticketDialogMode === 'loading') && (
          <>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#354a6b', color: '#fff', fontSize: '1rem', py: 1.5 }}>
              <TicketPlus size={18} />
              Confirm Ticket Creation
            </DialogTitle>
            <DialogContent sx={{ mt: 2 }}>
              <Typography variant="body1" sx={{ color: '#334155' }}>
                Creating a new support ticket for:
              </Typography>

              {/* Show Context Data */}
              <TicketDetailsCard />

              <Typography variant="body2" sx={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                <Info size={14} /> Are you sure you want to proceed?
              </Typography>
            </DialogContent>
            <DialogActions sx={{ p: 2, pt: 0 }}>
              <Button
                onClick={handleCloseTicketDialog}
                disabled={ticketDialogMode === 'loading'}
                sx={{ color: '#64748b', '&:hover': { bgcolor: '#f1f5f9' }, textTransform: 'none' }}
              >
                Cancel
              </Button>
              <Button
                onClick={executeCreateTicket}
                variant="contained"
                disabled={ticketDialogMode === 'loading'}
                startIcon={ticketDialogMode === 'loading' ? <CircularProgress size={14} color="inherit" /> : null}
                sx={{
                  bgcolor: '#4f46e5',
                  textTransform: 'none',
                  boxShadow: 'none',
                  '&:hover': { bgcolor: '#4338ca', boxShadow: 'none' }
                }}
              >
                {ticketDialogMode === 'loading' ? 'Creating...' : 'Confirm'}
              </Button>
            </DialogActions>
          </>
        )}

        {/* -- MODE: SUCCESS -- */}
        {ticketDialogMode === 'success' && (
          <>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#dcfce7', color: '#166534', fontSize: '1rem', py: 1.5 }}>
              <CheckCircle2 size={20} />
              Ticket Created Successfully
            </DialogTitle>
            <DialogContent sx={{ mt: 2 }}>
              <Typography variant="body1" sx={{ color: '#334155', mb: 2 }}>
                Your ticket has been generated and forwarded to the ticketing system.
              </Typography>

              <Box sx={{ p: 1.5, mb: 1, bgcolor: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: 1 }}>
                {ticketData?.newTicketId && (
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b', mb: 0.5 }}>
                    Ticket ID: <span style={{ fontWeight: 400, color: '#0ea5e9' }}>{ticketData.newTicketId}</span>
                  </Typography>
                )}
              </Box>

              {/* Show Context Data */}
              <TicketDetailsCard />

              <Button
                fullWidth
                variant="outlined"
                startIcon={<Copy size={16} />}
                onClick={() => handleCopy(
                  `Adapter: ${ticketData?.adapterName} | Trap ID: ${ticketData?.trapId} | Alarm: ${ticketData?.alarmName || 'N/A'} | Severity: ${ticketData?.severity || 'N/A'}${ticketData?.newTicketId ? ` | Ticket ID: ${ticketData.newTicketId}` : ''}`,
                  'Ticket details copied!'
                )}
                sx={{ mt: 2, textTransform: 'none', color: '#475569', borderColor: '#cbd5e1' }}
              >
                Copy Ticket Details
              </Button>
            </DialogContent>
            <DialogActions sx={{ p: 2, pt: 0 }}>
              <Button
                onClick={handleCloseTicketDialog}
                variant="contained"
                sx={{ bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' }, textTransform: 'none', boxShadow: 'none' }}
              >
                Done
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default ActiveFaultsTableForSidebar;