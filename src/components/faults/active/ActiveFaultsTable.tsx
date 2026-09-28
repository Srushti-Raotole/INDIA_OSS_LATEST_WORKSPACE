
// // ActiveFaultsTable.tsx
// import React, { useEffect, useMemo, useState } from 'react';
// import { Box, Button, Tooltip } from '@mui/material';
// import { MaterialReactTable, MRT_ColumnDef, type MRT_RowSelectionState } from 'material-react-table';
// import * as XLSX from 'xlsx';
// import StarBorderIcon from '@mui/icons-material/StarBorder';
// import { DynamicTableRow } from '../../../store/types';
// import ClearTrap from './faults/ClearTrap';
// import { useSnackbar } from '../../common/SnackbarProvider';
// import AcknowledgeTrap from './faults/AcknowledgeTrap';
// import AddToFavContent from './faults/AddToFav';
// import CommonDialog from '../../common/CommonDialog.';

// type ApplyPayload = {
//   groupIds: string[];
//   adapters: string[];
//   trapTypes: string[];
// };

// interface CommonTableProps {
//   isLoading?: boolean;
//   columnOrder: string[];
//   dataObjects: Record<string, any>[];
//   viewGraph: boolean;
//   setViewGraph: (viewGraph: boolean) => void;
//   pageSize?: number;
//   onRowClick?: (row: Record<string, any>) => void;
//   defaultVisibleColumns?: string[];
//   isActiveTab?: boolean;
// }

// const ActiveFaultsTable: React.FC<CommonTableProps> = ({
//   columnOrder,
//   dataObjects,
//   pageSize = 10,
//   viewGraph,
//   setViewGraph,
//   onRowClick,
//   defaultVisibleColumns,
//   isLoading,
//   isActiveTab,
// }) => {
//   const { showMessage } = useSnackbar();

//   // keep original and filtered rows
//   const [allRows, setAllRows] = useState<Record<string, any>[]>([]);
//   const [rows, setRows] = useState<Record<string, any>[]>([]);

//   useEffect(() => {
//     setAllRows(dataObjects ?? []);
//     setRows(dataObjects ?? []);
//   }, [dataObjects]);

//   const [selectedRows, setSelectedRows] = useState<DynamicTableRow[]>([]);
//   const [openModel, setOpenModel] = useState(false);
//   const [modelContent, setModelContent] = useState<'clear' | 'ack' | 'fav'>();
//   const [rowSelection, setRowSelection] = useState<MRT_RowSelectionState>({});

//   const getInitialColumnVisibility = () => {
//     const visibleSet = new Set(defaultVisibleColumns ?? columnOrder);
//     const visibility: Record<string, boolean> = {};
//     columnOrder.forEach((col) => (visibility[col] = visibleSet.has(col)));
//     return visibility;
//   };

//   useEffect(() => {
//     const selectedIndexes = Object.keys(rowSelection).map((k) => Number(k));
//     const selected = selectedIndexes.map((idx) => rows[idx]).filter(Boolean);
//     setSelectedRows(selected as DynamicTableRow[]);
//   }, [rowSelection, rows]);

//   const handleClearOpen = () => {
//     if (!selectedRows.length) return showMessage('Please select at least one row to clear.', 'warning');
//     setOpenModel(true);
//     setModelContent('clear');
//   };

//   const handleAckOpen = () => {
//     if (!selectedRows.length) return showMessage('Please select at least one row to acknowledge.', 'warning');
//     setOpenModel(true);
//     setModelContent('ack');
//   };

//   const handleAddToFavOpen = () => {
//     setOpenModel(true);
//     setModelContent('fav');
//   };

//   const onAckDone = () => {
//     setOpenModel(false);
//     showMessage('Selected traps acknowledged successfully.', 'success');
//     setSelectedRows([]);
//     setRowSelection({});
//   };

//   const onClearDone = () => {
//     setOpenModel(false);
//     showMessage('Selected traps cleared successfully.', 'success');
//     setSelectedRows([]);
//     setRowSelection({});
//   };

//   const handleExcelExport = () => {
//     if (!rows?.length) {
//       alert('No data to export');
//       return;
//     }
//     const wb = XLSX.utils.book_new();
//     const ws = XLSX.utils.json_to_sheet(
//       rows.map((obj) =>
//         columnOrder.reduce((acc, key) => ({ ...acc, [key]: obj[key] ?? '' }), {}),
//       ),
//       { header: columnOrder },
//     );
//     ws['!cols'] = columnOrder.map(() => ({ width: 18 }));
//     XLSX.utils.book_append_sheet(wb, ws, 'Active Faults');
//     const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
//     XLSX.writeFile(wb, `Active_Faults_${timestamp}.xlsx`);
//   };

//   if (!dataObjects || dataObjects.length === 0) {
//     return (
//       <Box
//         sx={{
//           p: 4,
//           textAlign: 'center',
//           height: '80vh',
//           display: 'flex',
//           alignItems: 'center',
//           justifyContent: 'center',
//           backgroundColor: '#f9f9f9',
//           border: '1px solid #281e1eff',
//         }}
//       >
//         <div><h3>{isLoading ? 'Loading ....' : 'No Data found'}</h3></div>
//       </Box>
//     );
//   }

//   const initialColumnSizes: Record<string, number> = {
//     Adapter: 110,
//     Severity: 90,
//     Alarm: 160,
//     Client: 140,
//     Technology: 140,
//     'Device Name': 180,
//     Source: 150,
//     'Port Name': 150,
//     Circle: 100,
//     City: 140,
//     'ERP Site ID': 200,
//     'No.Services_Affected': 200,
//     Description: 360,
//     'Ack Time': 180,
//     'Ack Msg': 220,
//     'Ack User': 130,
//     'Clear Msg': 220,
//     'Clear User': 130,
//     'NMS Received Time': 210,
//     'OSS Insertion Time': 210,
//     'Internal TicketId': 180,
//     'Clear Time': 180,
//   };

//   const AdapterBadge = (raw?: string) => {
//     const val = (raw ?? '').trim().toUpperCase();
//     // const bg = val === 'MCP' ? '#009688' : val === 'NFMT' ? '#8283eb !important' : '#607D8B';
//     const bg =
//       val === 'MCP' ? '#009688' :
//         val === 'NFMT' ? '#8283eb !important' :
//           val === 'EPNM' ? '#4CAF50' :
//             val === 'CONC' ? '#FF9800' :
//               val === 'ADVA' ? '#9C27B0' :
//                 val === 'IFNR' ? '#3F51B5' :
//                   val === 'TLMR' ? '#E91E63' :
//                     '#607D8B';

//     return (
//       <Box sx={{
//         px: 1.2, py: 0.2, lineHeight: 1.6, bgcolor: bg, color: '#fff',
//         display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
//         borderRadius: '10px', fontSize: '0.72rem', fontWeight: 700, minWidth: 64, textTransform: 'uppercase',
//       }}>
//         {val || 'NA'}
//       </Box>
//     );
//   };

//   const sevBadge = (raw?: string) => {
//     const s = (raw ?? '').trim().toUpperCase();
//     const map = {
//       CRITICAL: { bg: '#E53935', fg: '#FFFFFF', letter: 'c' },
//       MAJOR: { bg: '#FB8C00', fg: '#FFFFFF', letter: 'M' },
//       MINOR: { bg: '#FDD835', fg: '#FFFFFF', letter: 'm' },
//       MINORWARN: { bg: '#FDD835', fg: '#FFFFFF', letter: 'm' },
//       WARNING: { bg: '#FFD54F', fg: '#333333', letter: 'w' },
//       WARN: { bg: '#FFD54F', fg: '#333333', letter: 'w' },
//     } as const;
//     const conf = (map as any)[s] ?? { bg: '#BDBDBD', fg: '#FFFFFF', letter: '•' };
//     return (
//       <Box component="span" sx={{
//         display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
//         width: 19, height: 19, bgcolor: conf.bg, color: conf.fg, borderRadius: '50%',
//         fontSize: '0.65rem', fontWeight: 700,
//       }} aria-label={s}>
//         {conf.letter}
//       </Box>
//     );
//   };

//   const columns: MRT_ColumnDef<any>[] = columnOrder.map((col) => {
//     const base: MRT_ColumnDef<any> = {
//       accessorFn: (row) => row[col],
//       id: col,
//       header: col,
//       size: initialColumnSizes[col] ?? 140,
//     };
//     if (col === 'Adapter') {
//       base.Cell = ({ cell }) => (
//         <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
//           {AdapterBadge(cell.getValue<string>())}
//         </Box>
//       );
//       base.enableSorting = false;
//       base.muiTableBodyCellProps = { align: 'center' as const };
//     }
//     if (col === 'Severity') {
//       base.Cell = ({ cell }) => (
//         <Box sx={{ display: 'flex', justifyContent: 'center' }}>
//           <Tooltip title={(cell.getValue<string>() ?? '').toString()}>
//             <span>{sevBadge(cell.getValue<string>())}</span>
//           </Tooltip>
//         </Box>
//       );
//       base.enableSorting = false;
//       base.muiTableBodyCellProps = { align: 'center' as const };
//     }
//     return base;
//   });

//   // filter helpers
//   const normalize = (s: any) => String(s ?? '').trim().toUpperCase();

//   const applyGroupFilter = (payload: ApplyPayload) => {
//     const adapterSet = new Set(payload.adapters.map((a) => a.toUpperCase()));
//     const trapSet = new Set(payload.trapTypes.map((t) => t.toUpperCase()));

//     const filtered = allRows.filter((r) => {
//       const a = normalize(r['Adapter']);
//       const t = normalize(r['Alarm']);
//       // if either list is empty, keep row (defensive) — but normally both are provided
//       const adapterOk = adapterSet.size === 0 || adapterSet.has(a);
//       const trapOk = trapSet.size === 0 || trapSet.has(t);
//       return adapterOk && trapOk;
//     });

//     setRows(filtered);
//     setRowSelection({});
//     setSelectedRows([]);
//   };

//   const clearGroupFilter = () => {
//     setRows(allRows);
//     setRowSelection({});
//     setSelectedRows([]);
//   };

//   const orderedData = rows.map((obj) =>
//     columnOrder.reduce((acc, key) => {
//       acc[key] = obj[key] ?? '';
//       return acc;
//     }, {} as Record<string, any>),
//   );

//   return (
//     <Box sx={{ p: 0, m: 0, borderRadius: 2, border: 1, height: viewGraph ? '45vh' : '83vh' }}>
//       <MaterialReactTable
//         columns={columns}
//         data={orderedData}
//         onRowSelectionChange={setRowSelection}
//         muiTablePaperProps={{
//           sx: {
//             boxShadow: 'none',
//             border: '1px solid #e0e0e0',
//             borderRadius: 3,
//             m: 0,
//             height: '100%',
//             display: 'flex',
//             flexDirection: 'column',
//           },
//         }}
//         muiTableHeadCellProps={{
//           sx: { backgroundColor: '#334155', color: 'white', py: 0.2, fontSize: '0.75rem' },
//         }}
//         muiTableContainerProps={{
//           sx: {
//             flexGrow: 0,
//             maxWidth: '100%',
//             overflow: 'auto',
//             scrollbarWidth: 'thin',
//             scrollbarColor: '#888 #f1f1f1',
//             '&::-webkit-scrollbar': { width: '12px', height: '12px' },
//             '&::-webkit-scrollbar-track': { background: '#f1f1f1', borderRadius: '6px' },
//             '&::-webkit-scrollbar-thumb': {
//               background: '#888',
//               borderRadius: '6px',
//               '&:hover': { background: '#555' },
//             },
//             '&::-webkit-scrollbar-corner': { background: '#f1f1f1' },
//           },
//         }}
//         defaultColumn={{
//           filterFn: "equals",
//         }}
//         muiTableBodyRowProps={({ row }) => ({
//           onClick: onRowClick ? () => onRowClick(row.original) : undefined,
//           sx: {
//             cursor: onRowClick ? 'pointer' : 'default',
//             backgroundColor: row.index % 2 === 0 ? '#ffffff' : '#f8fafc',
//             '&:hover': { backgroundColor: onRowClick ? '#e3f2fd !important' : 'inherit' },
//           },
//         })}
//         muiTableBodyCellProps={({ cell }) => ({
//           sx: {
//             py: 0,
//             pl: 0.5,
//             fontSize: '0.7rem',
//             whiteSpace: 'nowrap',
//             borderRight: '1px solid grey',
//           },
//         })}
//         initialState={{
//           pagination: { pageIndex: 0, pageSize },
//           columnVisibility: getInitialColumnVisibility(),
//           columnPinning: { left: ['mrt-row-select', 'Adapter', 'Severity', 'Alarm'] },
//         }}
//         enableColumnOrdering
//         enableColumnResizing
//         enableHiding
//         enableRowSelection={!!isActiveTab}
//         displayColumnDefOptions={{
//           'mrt-row-select': {
//             header: '',
//             size: 25,
//             muiTableHeadCellProps: {
//               sx: {
//                 p: 0.4,
//                 '& .MuiCheckbox-root': {
//                   p: '2px',
//                   '& .MuiSvgIcon-root': { fontSize: '16px' },
//                   color: '#7e7d7dff',
//                   '&.Mui-checked': { color: '#7e7d7dff' },
//                 },
//               },
//             },
//           },
//         }}
//         muiSelectCheckboxProps={{
//           sx: {
//             padding: '2px',
//             '& .MuiSvgIcon-root': { fontSize: '16px' },
//             color: '#7e7d7dff',
//             '&.Mui-checked': { color: '#7e7d7dff' },
//           },
//         }}
//         state={{ rowSelection, columnPinning: { left: ['mrt-row-select'] } }}

//         renderTopToolbarCustomActions={() =>
//           isActiveTab ? (
//             <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, px: 1 }}>
//               {/* Left cluster */}
//               <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                 <Button variant="contained" sx={{ bgcolor: '#7e7d7dff' }} size="small" onClick={handleExcelExport}>
//                   Excel
//                 </Button>
//                 <Button variant="contained" sx={{ bgcolor: '#7e7d7dff' }} size="small" onClick={() => setViewGraph(!viewGraph)}>
//                   {viewGraph ? 'HGraphs' : 'Graphs'}
//                 </Button>
//               </Box>

//               {/* Right cluster */}
//               <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                 <Button
//                   onClick={handleClearOpen}
//                   sx={{
//                     width: '5vw', backgroundColor: '#990033', borderRadius: '1vh',
//                     ':hover': { backgroundColor: '#770026' }, fontSize: '0.5vh', color: '#FFFFFF', height: '3vh',
//                   }}
//                 >
//                   Clear
//                 </Button>

//                 <Button
//                   onClick={handleAckOpen}
//                   sx={{
//                     width: '5vw', borderRadius: '1vh', backgroundColor: 'yellow',
//                     ':hover': { backgroundColor: '#cccc00' }, fontSize: '0.5vh', color: '#000', height: '3vh',
//                   }}
//                 >
//                   Ack
//                 </Button>

//                 <Button
//                   onClick={handleAddToFavOpen}
//                   sx={{
//                     width: '5vw', borderRadius: '1vh', backgroundColor: '#00FFFF',
//                     ':hover': { backgroundColor: '#00cccc' }, fontSize: '0.5vh', height: '3vh',
//                     display: 'flex', alignItems: 'center', justifyContent: 'center', p: 0,
//                   }}
//                 >
//                   <StarBorderIcon sx={{ fontSize: '2.5vh' }} />
//                 </Button>
//               </Box>
//             </Box>
//           ) : null
//         }

//         enablePagination
//         enableColumnActions
//         enableSorting={false}
//         positionToolbarAlertBanner="bottom"
//         enableStickyHeader
//         enableColumnDragging={false}
//         enableStickyFooter
//         enableColumnPinning
//         columnFilterDisplayMode="subheader"
//         columnResizeMode="onEnd"
//         enableGrouping
//         muiPaginationProps={{
//           variant: 'outlined',
//           shape: 'rounded',
//           size: 'small',
//           rowsPerPageOptions: [10, 20, 50, 100, 200],
//         }}
//         enableBottomToolbar
//         enableTopToolbar
//         enableSelectAll={false}
//         enableMultiRowSelection
//         muiTopToolbarProps={{
//           sx: {
//             p: 0, mb: 1, minHeight: '30px',
//             '& .MuiButton-root': { minWidth: 'auto', padding: '2px 6px', fontSize: '0.7rem' },
//             '& .MuiIconButton-root': { padding: '2px', fontSize: '1rem' },
//             '& .MuiInputBase-root': { fontSize: '0.75rem', height: '28px' },
//             '& .MuiToolbar-root': { minHeight: '30px' },
//           },
//         }}
//         muiBottomToolbarProps={{
//           sx: {
//             p: 0, m: 0, minHeight: '35px',
//             '& .MuiButton-root': { minWidth: 'auto', padding: '2px 6px', fontSize: '0.7rem' },
//             '& .MuiIconButton-root': { padding: '2px', fontSize: '1rem' },
//             '& .MuiInputBase-root': { fontSize: '0.75rem', height: '28px' },
//             '& .MuiToolbar-root': { minHeight: '36px' },
//           },
//         }}
//       />

//       <CommonDialog open={openModel} onClose={() => setOpenModel(false)} title="Trap Details" maxWidth={modelContent === 'fav' ? 'md' : 'sm'}>
//         <hr />
//         {modelContent === 'clear' ? (
//           <ClearTrap selectedrows={selectedRows} onDone={onClearDone} />
//         ) : modelContent === 'ack' ? (
//           <AcknowledgeTrap selectedrows={selectedRows} onDone={onAckDone} />
//         ) : modelContent === 'fav' ? (
//           <AddToFavContent
//             onApplied={(payload) => {
//               applyGroupFilter(payload);
//               // optionally close dialog:
//               // setOpenModel(false);
//             }}
//             onCleared={() => {
//               clearGroupFilter();
//               // optionally close dialog:
//               // setOpenModel(false);
//             }}
//           />
//         ) : null}
//       </CommonDialog>
//     </Box>
//   );
// };

// export default ActiveFaultsTable;
