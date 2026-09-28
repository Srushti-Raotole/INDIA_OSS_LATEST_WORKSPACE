import React, { useEffect, useState, useMemo } from 'react';
import { 
  Box, 
  Button, 
  Tooltip, 
  Typography, 
  InputAdornment, 
  IconButton 
} from '@mui/material';
import { MaterialReactTable, MRT_ColumnDef, MRT_RowSelectionState } from 'material-react-table';
import { DynamicTableRow } from '../../../../store/types';
import ClearTrap from '../faults/AckFavClear/ClearTrap';
import { useSnackbar } from '../../../common/SnackbarProvider';
import AcknowledgeTrap from '../faults/AckFavClear/AcknowledgeTrap';
import AddToFavContent from '../faults/AckFavClear/AddToFav';
import ExcelDownloadButton from '../../../common/ExcelDownloadButton';
import CommonDialog from '../../../common/CommonDialog.';
import FullPageLoader from '../../../common/FullPageLoader';
import { useNavigate } from "react-router-dom";

// ---------- Lucide React Custom System Icons ----------
import { Star, Activity, Ticket, Info } from 'lucide-react';

type ApplyPayload = {
  groupIds: string[];
  adapters: string[];
  trapTypes: string[];
};

interface CommonTableProps {
  isLoading?: boolean;
  hasFetchedOnce?: boolean; 
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
const norm = (v?: string | null) => (v ?? '').toString().trim();

const HistoricFaultTableForSidebar: React.FC<CommonTableProps> = ({
  columnOrder,
  dataObjects,
  pageSize = 10,
  viewGraph,
  setViewGraph,
  onRowClick,
  defaultVisibleColumns,
  isLoading = false,
  hasFetchedOnce = false,
  isActiveTab = false,
  highlightPredicate,
  tableId = 'historic-faults-table',
  drawerOpen = false,
  drawerWidthCss = '20vw',
}) => {
  const { showMessage } = useSnackbar();
  const navigate = useNavigate();
  const normalize = (s: any) => String(s ?? '').trim().toUpperCase();

  const [allRows, setAllRows] = useState<DynamicTableRow[]>([]);
  const [rows, setRows] = useState<DynamicTableRow[]>([]);
  const [adaptersForFilter, setAdaptersForFilter] = useState<Set<string>>(new Set());
  const [alarmsForFilter, setAlarmsForFilter] = useState<Set<string>>(new Set());

  useEffect(() => {
    const filtered = dataObjects.filter((r) => {
      const a = normalize(r['Adapter']);
      const t = normalize(r['Alarm']);
      const adapterOk = adaptersForFilter.size === 0 || adaptersForFilter.has(a);
      const trapOk = alarmsForFilter.size === 0 || alarmsForFilter.has(t);
      return adapterOk && trapOk;
    });
    setAllRows((filtered ?? []) as DynamicTableRow[]);
    setRows((filtered ?? []) as DynamicTableRow[]);
  }, [dataObjects, adaptersForFilter, alarmsForFilter]);

  const [rowSelection, setRowSelection] = useState<MRT_RowSelectionState>({});
  const [selectedRows, setSelectedRows] = useState<DynamicTableRow[]>([]);
  const [openModel, setOpenModel] = useState(false);
  const [modelContent, setModelContent] = useState<'clear' | 'ack' | 'fav'>();
  const [tableResetKey, setTableResetKey] = useState(0);

  useEffect(() => {
    try {
      const key = `${LOCALSTORAGE_PREFIX}${tableId}`;
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
      }
    } catch (e) {
      console.error('Failed to clear old column visibility from localStorage', e);
    }
  }, [tableId]);

  const buildVisibilityFromDefaults = (): Record<string, boolean> => {
    const visibleSet = new Set(defaultVisibleColumns ?? columnOrder);
    const visibility: Record<string, boolean> = {};
    columnOrder.forEach((col) => {
      visibility[col] = visibleSet.has(col);
    });
    return visibility;
  };

  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(
    () => buildVisibilityFromDefaults(),
  );

  useEffect(() => {
    try {
      const key = `${LOCALSTORAGE_PREFIX}${tableId}`;
      localStorage.setItem(key, JSON.stringify(columnVisibility));
    } catch (e) {
      console.error('Failed to persist column visibility', e);
    }
  }, [columnVisibility, tableId]);

  useEffect(() => {
    setColumnVisibility((prev) => {
      const visibleSet = new Set(defaultVisibleColumns ?? columnOrder);
      const next: Record<string, boolean> = {};

      columnOrder.forEach((col) => {
        if (typeof prev[col] === 'boolean') {
          next[col] = prev[col];
        } else {
          next[col] = visibleSet.has(col);
        }
      });

      return next;
    });
  }, [columnOrder, defaultVisibleColumns]);

  const initialColumnSizes: Record<string, number> = {
    Adapter: 110, Severity: 100, Alarm: 160, Client: 140, Technology: 140, 'Device Name': 180,
    Circle: 100, City: 160, 'ERP Site ID': 220, Source: 150, 'Port Name': 150,
    'No.Services_Affected': 200, Description: 360, 'Ack Time': 180, 'Ack Msg': 220,
    'Ack User': 130, 'Clear Msg': 220, 'Clear User': 130, 'NMS Received Time': 210,
    'OSS Insertion Time': 210, 'Internal TicketId': 180, 'Clear Time': 180,
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
      <Box
        sx={{
          px: 3, py: 0.1, lineHeight: 1.4, bgcolor: bg, color: '#fff',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: '10px', fontSize: '0.68rem', fontWeight: 700,
          minWidth: 64, textTransform: 'uppercase',
        }}
      >
        {val || 'NA'}
      </Box>
    );
  };

  const sevBadge = (raw?: string) => {
    const s = (raw ?? '').trim().toUpperCase();
    const map = {
      CRITICAL: { bg: '#E53935', fg: '#FFFFFF', letter: 'c' },
      MAJOR: { bg: '#FB8C00', fg: '#FFFFFF', letter: 'M' },
      MINOR: { bg: '#FDD835', fg: '#FFFFFF', letter: 'm' },
      MINORWARN: { bg: '#FDD835', fg: '#FFFFFF', letter: 'm' },
      WARNING: { bg: '#FFD54F', fg: '#333333', letter: 'w' },
      WARN: { bg: '#FFD54F', fg: '#333333', letter: 'w' },
    } as const;
    const conf = (map as any)[s] ?? { bg: '#BDBDBD', fg: '#FFFFFF', letter: '•' };
    return (
      <Box
        component="span"
        sx={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 17, height: 17, bgcolor: conf.bg, color: conf.fg,
          borderRadius: '50%', fontSize: '0.62rem', fontWeight: 700,
        }}
        aria-label={s}
      >
        {conf.letter}
      </Box>
    );
  };

  // ----- SMART SEARCH FILTER LOGIC -----
  const checkMatch = (text: string, term: string) => {
    if (term.startsWith('"') && term.endsWith('"')) {
      const actualTerm = term.slice(1, -1).trim();
      if (!actualTerm) return false;
      const escaped = actualTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'i');
      return regex.test(text);
    }
    return text.includes(term);
  };

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
  // -------------------------------------

  const columns: MRT_ColumnDef<any>[] = useMemo(
    () =>
      columnOrder.map((col) => {
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
          base.Cell = ({ cell, row }) => {
            const isHighlighted = getIsHighlighted(row.original);
            return (
              <Box
                sx={{
                  width: '100%', height: '100%', display: 'flex', alignItems: 'center', px: 0.5,
                  ...(isHighlighted && { backgroundColor: '#e3f2fd', borderRadius: '2px' }),
                }}
              >
                {cell.getValue<string>()}
              </Box>
            );
          };
        }

        if (col === 'Adapter') {
          base.Cell = ({ cell, row }) => {
            const isHighlighted = getIsHighlighted(row.original);
            return (
              <Box
                sx={{
                  display: 'flex', alignItems: 'center', gap: 0.6,
                  ...(isHighlighted && { backgroundColor: '#e3f2fd', borderRadius: '2px' }),
                }}
              >
                {AdapterBadge(cell.getValue<string>())}
              </Box>
            );
          };
          base.enableSorting = false;
          base.muiTableBodyCellProps = { align: 'center' as const };
        }

        if (col === 'Severity') {
          base.Cell = ({ cell, row }) => {
            const isHighlighted = getIsHighlighted(row.original);
            return (
              <Box
                sx={{
                  display: 'flex', justifyContent: 'center',
                  ...(isHighlighted && { backgroundColor: '#e3f2fd', borderRadius: '2px' }),
                }}
              >
                <Tooltip title={(cell.getValue<string>() ?? '').toString()}>
                  <span>{sevBadge(cell.getValue<string>())}</span>
                </Tooltip>
              </Box>
            );
          };
          base.enableSorting = false;
          base.muiTableBodyCellProps = { align: 'center' as const };
        }

        return base;
      }),
    [columnOrder, highlightPredicate],
  );

  const applyGroupFilter = (payload: ApplyPayload) => {
    const adapterSet = new Set(payload.adapters.map((a) => a.toUpperCase()));
    const trapSet = new Set(payload.trapTypes.map((t) => t.toUpperCase()));

    setAdaptersForFilter(new Set(adapterSet));
    setAlarmsForFilter(new Set(trapSet));

    const filtered = dataObjects.filter((r) => {
      const a = normalize(r['Adapter']);
      const t = normalize(r['Alarm']);
      const adapterOk = adapterSet.size === 0 || adapterSet.has(a);
      const trapOk = trapSet.size === 0 || trapSet.has(t);
      return adapterOk && trapOk;
    });

    setRows(filtered as DynamicTableRow[]);
    setRowSelection({});
    setSelectedRows([]);
  };

  const clearGroupFilter = () => {
    setAdaptersForFilter(new Set());
    setAlarmsForFilter(new Set());
    setRows(dataObjects as DynamicTableRow[]);
    setSelectedRows([]);
    setTableResetKey((k) => k + 1);
  };

  const orderedData = useMemo(
    () =>
      rows.map((obj) =>
        columnOrder.reduce((acc, key) => {
          acc[key] = obj[key] ?? '';
          return acc;
        }, {} as Record<string, any>),
      ),
    [rows, columnOrder],
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

  const leftPinnedColumns = ['Adapter', 'Severity', 'Alarm'];
  const showEmptyMessage = !isLoading && hasFetchedOnce && rows.length === 0;

  if (isLoading) {
    return (
      <Box sx={{ width: '100%', height: '100%', minHeight: '60vh', position: 'relative' }}>
        <FullPageLoader message="Loading Historic Fault Data" />
      </Box>
    );
  }

  if (showEmptyMessage) {
    return (
      <Box sx={{ width: '100%', height: '100%', minHeight: '40vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(180deg,#fafafa,#f3f4f6)' }}>
        <Box sx={{ px: 3, py: 2, borderRadius: '12px', backgroundColor: '#ffffff', border: '1px solid rgba(0,0,0,0.12)', boxShadow: '0 4px 10px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5, maxWidth: '90%', textAlign: 'center' }}>
          <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b7280' }}>No Data</Typography>
          <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: '#111827' }}>No data found for the selected time range</Typography>
          <Typography sx={{ fontSize: '0.8rem', color: '#6b7280' }}>Please select a different time range and try again</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 0, m: 0, height: '100%', width: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <MaterialReactTable
        columns={columns}
        data={orderedData}
        enableHiding
        enableGlobalFilter
        positionGlobalFilter="right"
        state={{ columnVisibility, rowSelection }}
        onColumnVisibilityChange={setColumnVisibility}
        onRowSelectionChange={setRowSelection}
        displayColumnDefOptions={{
          'mrt-row-select': {
            header: '',
            size: 30,
          },
        }}
        muiTablePaperProps={({ table }) => ({
          sx: { boxShadow: '0 1px 3px rgba(0,0,0,0.05)', borderRadius: 3, m: 0, height: '100%', display: 'flex', flexDirection: 'column', border: 'none', width: '100%' },
          style: table.getState().isFullScreen ? {
            left: 0,
            width: '100vw',
            right: 0, top: 0, bottom: 0, height: '100vh', maxWidth: '100vw', maxHeight: '100vh', position: 'fixed', zIndex: 9999,
          } : undefined,
        })}
        // ----- SMART SEARCH INTEGRATION -----
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
                        Smart Search Guide
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Typography variant="caption" sx={{ color: '#e2e8f0', display: 'block' }}>
                          <b style={{ color: '#6ee7b7' }}>Include Multiple:</b><br/>
                          Type <code>MCP, ADVA</code> to show rows having <i>either</i> MCP or ADVA.
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#e2e8f0', display: 'block' }}>
                          <b style={{ color: '#fca5a5' }}>Exclude:</b><br/>
                          Type <code>-MCP</code> or <code>!MCP</code> to hide all rows containing MCP.
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#e2e8f0', display: 'block' }}>
                          <b style={{ color: '#93c5fd' }}>Exact Word Match:</b><br/>
                          Type <code>"ADVA"</code> in quotes to find the exact word.
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
        // ------------------------------------
        muiTableHeadCellProps={{
          sx: {
            backgroundColor: '#354a6b', color: 'white', py: 0.75, fontSize: '0.72rem', fontWeight: 600, borderBottom: 'none',
            '& .MuiSvgIcon-root': { color: '#ffffff !important' },
            '& .Mui-TableHeadCell-Content-Labels': {
              color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px'
            },
            '& .Mui-TableHeadCell-Content-Wrapper': {
              color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
            },
            '&[data-pinned="true"]': {
              backgroundColor: '#354a6b', boxShadow: 'none',
            },
          },
        }}
        muiTableContainerProps={{
          sx: {
            width: '100%', maxWidth: '100%', overflowY: 'auto', overflowX: 'auto', position: 'relative',
            scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 transparent',
            '&::-webkit-scrollbar': { width: '8px', height: '8px' },
            '&::-webkit-scrollbar-track': { background: 'transparent' },
            '&::-webkit-scrollbar-thumb': { background: '#cbd5e1', borderRadius: '4px' },
          },
        }}
        muiTableBodyRowProps={({ row }) => ({
          onClick: onRowClick ? () => onRowClick(row.original as DynamicTableRow) : undefined,
          sx: {
            cursor: onRowClick ? 'pointer' : 'default',
            backgroundColor: row.index % 2 === 0 ? '#ffffff' : '#f8fafc',
            '&:hover': { backgroundColor: '#f1f5f9 !important' },
            '& td': { borderBottom: '1px solid #e2e8f0' },
          },
        })}
        muiTableBodyCellProps={() => ({
          sx: { py: 0.4, px: 1.2, fontSize: '0.68rem', whiteSpace: 'nowrap', borderRight: 'none', color: '#334155' },
        })}
        initialState={{
          pagination: { pageIndex: 0, pageSize },
          columnPinning: { left: leftPinnedColumns },
          sorting: [{ id: 'NMS Received Time', desc: true }],
        }}
        enableColumnOrdering
        enableColumnDragging={true}
        enableColumnResizing
        columnResizeMode="onChange"
        enableRowSelection={!!isActiveTab}
        enablePagination
        enableColumnActions
        enableSorting
        positionToolbarAlertBanner="none"
        enableStickyHeader
        enableStickyFooter
        columnFilterDisplayMode="subheader"
        enableGrouping
        enableRowVirtualization
        enableColumnVirtualization
        muiPaginationProps={{ variant: 'text', shape: 'rounded', size: 'small', rowsPerPageOptions: [10, 20, 50, 100, 200] }}
        enableBottomToolbar
        enableTopToolbar
        enableSelectAll={false}
        enableMultiRowSelection
        muiTopToolbarProps={{
          sx: {
            color: '#1e293b !important', backgroundColor: '#ffffff', minHeight: '48px !important', py: 0, px: '8px', flexShrink: 0,
            '& .MuiToolbar-root': { minHeight: '48px !important', height: '48px', px: '4px', display: 'flex', flexDirection: 'row', alignItems: 'center', flexWrap: 'nowrap', overflow: 'hidden' },
            '& .MuiTextField-root': { margin: 0, width: '100%', '& .MuiInputBase-root': { fontSize: '0.75rem', height: '32px', padding: '0 10px', backgroundColor: '#f1f5f9', borderRadius: '6px', '& fieldset': { border: 'none' } } },
          },
        }}
        muiBottomToolbarProps={{
          sx: {
            p: 0, m: 0, minHeight: '36px', height: '36px', flexShrink: 0, backgroundColor: '#ffffff',
            '& .MuiToolbar-root': { minHeight: '36px !important', height: '36px' },
            '& .MuiTablePagination-root': { margin: 0, padding: 0, minHeight: '36px' },
            '& .MuiInputBase-root': { height: '28px', fontSize: '0.7rem' },
          },
        }}
        renderTopToolbarCustomActions={() => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'nowrap', minWidth: 0, px: 1 }}>
            <ExcelDownloadButton data={orderedData} columnOrder={columnOrder} tableId={tableId} fileName="Historic_Faults_Report" />
          </Box>
        )}
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
            onApplied={(payload) => {
              applyGroupFilter(payload);
            }}
            onCleared={() => {
              clearGroupFilter();
            }}
          />
        ) : null}
      </CommonDialog>
    </Box>
  );
};

export default HistoricFaultTableForSidebar;