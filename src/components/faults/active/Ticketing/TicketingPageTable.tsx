import React, { useEffect, useState, useMemo } from 'react';
import { 
  Box, 
  Button, 
  IconButton, 
  Tooltip,
  Typography,
  InputAdornment
} from '@mui/material';
import { MaterialReactTable, MRT_ColumnDef } from 'material-react-table';
import ExcelDownloadButton from '../../../common/ExcelDownloadButton';
import FullPageLoader from '../../../common/FullPageLoader';
import { DynamicTableRow } from '../../../../store/types';
import { useNavigate } from 'react-router-dom';

// ---------- Lucide React Custom Controls Icons ----------
import { Activity, History, ChevronRight, Info } from 'lucide-react';

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

const norm = (v?: string | null) => (v ?? '').toString().trim();

function getTicketStateColors(raw: string) {
  const v = norm(raw);
  if (!v) return { bg: undefined, color: undefined, border: undefined };
  const lower = v.toLowerCase();

  if (lower === 'resolved') {
    return { bg: '#d4edda !important', color: '#155724', border: '1px solid #c3e6cb' };
  }
  if (lower === 'creation failed' || lower === 'resolution failed') {
    return { bg: '#f8d7da !important', color: '#721c24', border: '1px solid #f5c6cb' };
  }
  if (lower === 'open') {
    return { bg: '#fff3cd !important', color: '#856404', border: '1px solid #ffeeba' };
  }
  return { bg: undefined, color: undefined, border: undefined };
}

const LOCALSTORAGE_PREFIX = 'visible_columns_map_';

const TicketingPageTable: React.FC<CommonTableProps> = ({
  columnOrder,
  dataObjects,
  pageSize = 10,
  viewGraph,
  setViewGraph,
  onRowClick,
  defaultVisibleColumns,
  isLoading = false,
  hasFetchedOnce = false,
  isActiveTab = true,
  tableId = 'ticketing-table',
  drawerOpen = false,
  drawerWidthCss = '20vw',
  onDrawerToggle
}) => {
  const [rows, setRows] = useState<DynamicTableRow[]>([]);
  const navigate = useNavigate();

 useEffect(() => {
    setRows((dataObjects as DynamicTableRow[]) ?? []);
  }, [dataObjects]);

  const getInitialColumnVisibility = () => {
    const visibleSet = new Set(defaultVisibleColumns ?? columnOrder);
    const visibility: Record<string, boolean> = {};
    columnOrder.forEach((col) => (visibility[col] = visibleSet.has(col)));
    return visibility;
  };

  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem(`${LOCALSTORAGE_PREFIX}${tableId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          return parsed as Record<string, boolean>;
        }
      }
    } catch {}
    return getInitialColumnVisibility();
  });

  useEffect(() => {
    try {
      localStorage.setItem(`${LOCALSTORAGE_PREFIX}${tableId}`, JSON.stringify(columnVisibility));
    } catch (e) {
      console.error('Failed to persist ticketing column visibility', e);
    }
  }, [columnVisibility, tableId]);

  const initialColumnSizes: Record<string, number> = {
    Adapter: 110, Family: 140, 'VegayanOSS Ticket': 170, 'FS Ticket': 140,
    'Ticket State': 150, 'Alarm Received Time': 180, 'Alarm Cleared Time': 150,
    'OSS DBInsertion(Receive)': 240, 'OSS DBInsertion(Clear)': 240,
    'OSS Ticket Created Time': 240, 'OSS Ticket Resolution Time': 240,
    'FS Error': 140, 'Backend Error': 130, 'Root Alarm ID': 180, 'Node Name': 130,
    Severity: 90, 'IP Address': 160, 'Symptom Type': 180, 'Ticket Description': 220, 'Last Modify Date': 180,
  };

const AdapterBadge = (raw?: string) => {
    const val = (raw ?? '').trim().toUpperCase();
    const bg =
      val === 'MCP' ? '#009688' :
      val === 'NFMT' ? '#8283eb !important' :
      val === 'CONC' ? '#FF9800' :
      val === 'ADVA' ? '#9C27B0' :
      val === 'IFNR' ? '#3F51B5' :
      val === 'TLMR' ? '#E91E63' :
      val === 'EPNM' ? '#4CAF50' : '#607D8B';

    return (
      <Box sx={{
        px: 3, py: 0.1, lineHeight: 1.4, bgcolor: bg, color: '#fff',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: '10px', fontSize: '0.68rem', fontWeight: 700,
        minWidth: 64, textTransform: 'uppercase',
      }}>{val || 'NA'}
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

  const columns: MRT_ColumnDef<any>[] = useMemo(() => columnOrder.map((col) => {
    const base: MRT_ColumnDef<any> = {
      accessorFn: (row) => row[col],
      id: col, header: col,
      size: initialColumnSizes[col] ?? 140,
    };

    if (col === 'Adapter') {
      base.Cell = ({ cell }) => (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
          {AdapterBadge(cell.getValue<string>())}
        </Box>
      );
      base.enableSorting = false;
      base.muiTableBodyCellProps = { align: 'center' as const };
    }

    if (col === 'Severity') {
      base.Cell = ({ cell }) => (
        <Box sx={{ display: 'flex', justifyContent: 'flex-start', px: 1, fontSize: '0.72rem', fontWeight: 600, color: '#334155' }}>
          {norm(cell.getValue<string>()) || '-'}
        </Box>
      );
      base.enableSorting = false;
    }

    if (col === 'Ticket State') {
      base.Cell = ({ cell }) => {
        const value = norm(String(cell.getValue() ?? ''));
        const { bg, color, border } = getTicketStateColors(value);
        return (
          <Box sx={{
            bgcolor: bg, color, border, borderRadius: '4px', px: 1, py: 0.2,
            fontSize: '0.68rem', fontWeight: 700, textAlign: 'center',
            minWidth: '100px', display: 'inline-block', textTransform: 'uppercase'
          }}>
            {value || '-'}
          </Box>
        );
      };
      base.enableSorting = false;
      base.muiTableBodyCellProps = { align: 'center' as const };
    }

    return base;
  }), [columnOrder]);

  const orderedData = useMemo(() => rows.map((obj) =>
    columnOrder.reduce((acc, key) => {
      acc[key] = obj[key] ?? '';
      return acc;
    }, {} as Record<string, any>)
  ), [rows, columnOrder]);

  const showEmptyMessage = !isLoading && hasFetchedOnce && rows.length === 0;

  if (isLoading) {
    return (
      <Box sx={{ width: '100%', height: '100%', minHeight: '60vh', position: 'relative' }}>
        <FullPageLoader message="Loading Ticketing Data" />
      </Box>
    );
  }

  if (showEmptyMessage) {
    return (
      <Box sx={{ width: '100%', height: '100%', minHeight: '40vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>
        No ticket log found for the chosen timestamp range metrics.
      </Box>
    );
  }

  return (
    <Box sx={{ p: 0, m: 0, height: 'calc(100vh - 120px)', width: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <MaterialReactTable
        columns={columns}
        data={orderedData}
        enableHiding
        enableGlobalFilter
        positionGlobalFilter="right"
        state={{ columnVisibility }}
        onColumnVisibilityChange={setColumnVisibility}
        displayColumnDefOptions={{
          'mrt-row-select': { header: '', size: 30 },
        }}
        muiTablePaperProps={({ table }) => ({
          sx: { boxShadow: '0 1px 3px rgba(0,0,0,0.05)', borderRadius: 3, m: 0, height: '100%', display: 'flex', flexDirection: 'column', border: 'none', width: '100%' },
          style: table.getState().isFullScreen ? {
            left: drawerOpen ? drawerWidthCss : 0,
            width: drawerOpen ? `calc(100vw - ${drawerWidthCss})` : '100vw',
            right: 0, top: 0, bottom: 0, height: '100vh', maxWidth: '100vw', maxHeight: '100vh', position: 'fixed', zIndex: 9999,
          } : undefined,
        })}
        // Smart Search Setup
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
          sx: { 
            backgroundColor: '#354a6b', color: 'white', py: 0.75, fontSize: '0.72rem', fontWeight: 600, borderBottom: 'none', 
            '& .MuiSvgIcon-root': { color: '#ffffff !important' },
            '& .Mui-TableHeadCell-Content-Labels': { color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' },
            '& .Mui-TableHeadCell-Content-Wrapper': { color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
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
            '& td': { borderBottom: '1px solid #e2e8f0' }
          },
        })}
        muiTableBodyCellProps={() => ({
          sx: { py: 0.4, px: 1.2, fontSize: '0.68rem', whiteSpace: 'nowrap', borderRight: 'none', color: '#334155' },
        })}
        initialState={{
          pagination: { pageIndex: 0, pageSize },
          columnVisibility: getInitialColumnVisibility(),
          sorting: [{ id: 'Last Modify Date', desc: true }],
        }}
        enableColumnOrdering
        enableColumnResizing
        columnResizeMode="onChange"
        enablePagination
        enableColumnActions
        enableSorting={true}
        positionToolbarAlertBanner="none"
        enableStickyHeader
        enableStickyFooter
        columnFilterDisplayMode="subheader"
        enableGrouping
        muiPaginationProps={{ variant: 'text', shape: 'rounded', size: 'small', rowsPerPageOptions: [10, 20, 50, 100, 200] }}
        enableBottomToolbar
        enableTopToolbar
        enableSelectAll={false}
        enableMultiRowSelection={false}
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
        renderTopToolbarCustomActions={() =>
          isActiveTab ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'nowrap', minWidth: 0, px: 1 }}>
              <ExcelDownloadButton data={orderedData} columnOrder={columnOrder} tableId={tableId} fileName="Ticketing_Report" />
            </Box>
          ) : null
        }
      />
    </Box>
  );
};

export default TicketingPageTable;