import React, { useMemo, useState, useEffect } from 'react';
import { Box } from '@mui/material';
import { MaterialReactTable, MRT_ColumnDef } from 'material-react-table';

interface CommonTableProps {
  columnOrder: string[];
  dataObjects: Record<string, any>[];
  pageSize?: number;
  onRowClick?: (row: Record<string, any>) => void;
  /** REQUIRED: shared id with ExcelDownloadButton */
  tableId: string;
}

const LOCALSTORAGE_PREFIX = 'visible_columns_map_';

const CommonTable: React.FC<CommonTableProps> = ({
  columnOrder,
  dataObjects,
  pageSize = 10,
  onRowClick,
  tableId,
}) => {
  if (!dataObjects || dataObjects.length === 0) return null;

  const columns: MRT_ColumnDef<any>[] = useMemo(
    () =>
      columnOrder.map((col) => ({
        accessorFn: (row) => row[col],
        id: col,
        header: col,
      })),
    [columnOrder],
  );

  const buildAllVisible = (keys: string[]) =>
    keys.reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {} as Record<string, boolean>);

  /** Load map: { [colId]: boolean } */
  const loadVisibilityMap = (): Record<string, boolean> => {
    try {
      const raw = localStorage.getItem(`${LOCALSTORAGE_PREFIX}${tableId}`);
      if (!raw) return buildAllVisible(columnOrder);
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return buildAllVisible(columnOrder);
      }
      const map: Record<string, boolean> = { ...parsed };
      columnOrder.forEach((k) => {
        if (typeof map[k] !== 'boolean') map[k] = true;
      });
      Object.keys(map).forEach((k) => {
        if (!columnOrder.includes(k)) delete map[k];
      });
      return map;
    } catch {
      return buildAllVisible(columnOrder);
    }
  };

  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(
    () => loadVisibilityMap()
  );

  useEffect(() => {
    localStorage.setItem(
      `${LOCALSTORAGE_PREFIX}${tableId}`,
      JSON.stringify(columnVisibility),
    );
  }, [columnVisibility, tableId]);

  useEffect(() => {
    setColumnVisibility((prev) => {
      const next = { ...prev };
      columnOrder.forEach((k) => {
        if (typeof next[k] !== 'boolean') next[k] = true;
      });
      Object.keys(next).forEach((k) => {
        if (!columnOrder.includes(k)) delete next[k];
      });
      return next;
    });
  }, [columnOrder]);

  const orderedData = useMemo(
    () =>
      dataObjects.map((obj) =>
        columnOrder.reduce((acc, key) => {
          acc[key] = obj[key] ?? '';
          return acc;
        }, {} as Record<string, any>),
      ),
    [dataObjects, columnOrder],
  );

  return (
    <Box
      sx={{
        p: 0,
        m: 0,
        width: '100%',
        maxWidth: '100%',
        overflow: 'hidden',
      }}
    >
      <MaterialReactTable
        layoutMode="grid"
        columns={columns}
        data={orderedData}
        enableHiding
        state={{ columnVisibility }}
        onColumnVisibilityChange={setColumnVisibility}
        muiTablePaperProps={{
          sx: {
            boxShadow: 'none',
            border: '1px solid #e0e0e0',
            m: 0,
            width: '100%',
            maxWidth: '100%',
          },
        }}
        muiTableHeadCellProps={{
          sx: {
            py: 0.2,
            px: 1,
            width: 'auto',
            fontSize: '0.75rem',
            fontWeight: 'bold',
            color: 'white',
            // backgroundColor: '#c51d1dff',
            backgroundColor: '#334155',

            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: 180,
            position: 'sticky',
            top: 0,
            zIndex: 2,
            borderRight: '1px solid grey',
            '& .MuiSvgIcon-root': { color: 'white !important' },
            '& .Mui-TableSortLabel-icon': { color: 'white !important' },
          },
        }}
        muiTableBodyCellProps={{
          sx: {
            py: 0.4,
            px: 1,
            pl: 0.5,
            fontSize: '0.7rem',
            whiteSpace: 'nowrap',
            borderRight: '1px solid grey',
          },
        }}
        muiTableBodyRowProps={({ row }) => ({
          onClick: onRowClick ? () => onRowClick(row.original) : undefined,
          sx: {
            cursor: onRowClick ? 'pointer' : 'default',
            backgroundColor: row.index % 2 === 0 ? '#ffffff' : '#f8fafc',
            '&:hover': { backgroundColor: onRowClick ? '#f5f5f5' : 'inherit' },
          },
        })}
        muiTopToolbarProps={{
          sx: {
            p: 0,
            mb: 1,
            minHeight: '30px',
            '& .MuiButton-root': { minWidth: 'auto', padding: '2px 6px', fontSize: '0.7rem' },
            '& .MuiIconButton-root': { padding: '2px', fontSize: '1rem' },
            '& .MuiInputBase-root': { fontSize: '0.75rem', height: '28px' },
            '& .MuiToolbar-root': { minHeight: '30px' },
          },
        }}
        muiBottomToolbarProps={{
          sx: {
            p: 0,
            m: 0,
            minHeight: '35px',
            '& .MuiButton-root': { minWidth: 'auto', padding: '2px 6px', fontSize: '0.7rem' },
            '& .MuiIconButton-root': { padding: '2px', fontSize: '1rem' },
            '& .MuiInputBase-root': { fontSize: '0.75rem', height: '28px' },
            '& .MuiToolbar-root': { minHeight: '36px' },
          },
        }}
        enableColumnOrdering
        muiTableContainerProps={{
          sx: {
            width: '100%',
            maxWidth: '100%',
            maxHeight: '68vh',
            overflowY: 'auto',
            overflowX: 'auto',
            position: 'relative',
            scrollbarWidth: 'thin',
            scrollbarColor: '#888 #f1f1f1',
            '&::-webkit-scrollbar': { width: '12px', height: '12px' },
            '&::-webkit-scrollbar-track': { background: '#f1f1f1', borderRadius: '6px' },
            '&::-webkit-scrollbar-thumb': {
              background: '#888',
              borderRadius: '6px',
              '&:hover': { background: '#555' },
            },
            '&::-webkit-scrollbar-corner': { background: '#f1f1f1' },
          },
        }}
        enablePagination
        enableStickyHeader
        enableStickyFooter={true}
        enableGrouping
        initialState={{
          pagination: { pageIndex: 0, pageSize },
        }}
        muiPaginationProps={{ variant: 'outlined', shape: 'rounded', size: 'small' }}
        enableBottomToolbar
        enableTopToolbar
      />
    </Box>
  );
};

export default CommonTable;


