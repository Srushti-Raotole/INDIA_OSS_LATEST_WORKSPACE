import React, { useState, useEffect } from 'react';
import { 
  Box, 
  IconButton, 
  FormControl, 
  Select, 
  MenuItem, 
  InputLabel, 
  Button,
  Typography 
} from '@mui/material'; 
import dayjs from 'dayjs';

// ---------- MUI Icons ----------
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

import { DynamicTableRow } from '../../store/types';
import DateTimeRangeCompact from '../../components/common/DateTimeRangeCompact';
import { getNow, getOneHourAgo } from '../../components/common/CurrentDateTimeOneDayDiff';
import axiosClient from "@/api/axiosClient";
import { FETCH_HISTORICAL_FAULTS_TABLE_DATA } from "@/api/apis";
import AlarmSummaryCardsInsideSidebar from '../../components/faults/active/faults/AlarmSummaryCardSidebar';
import HistoricFaultTableForSidebar from '../../components/faults/active/Historic/HistoricFaultTableForSidebar';
import { logActivity } from '../../utils/activityLogger';
import AlarmDetailsDialog from '../../components/faults/active/faults/Dialog/TrapDetailsDialog';

/* ===== utils & mapping ===== */
const norm = (v?: string | null) => (v ?? '').toString().trim();
const up = (v?: string | null) => norm(v).toUpperCase();

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

const dtoToRow = (dto: any): DynamicTableRow => ({
  Adapter: dto.adapterName ?? '',
  Severity: mapSeverity(dto.severity),
  Alarm: dto.trapType ?? '',
  Client: dto.clientType ?? '',
  Technology: dto.vendor ?? '',
  'Device Name': dto.nodeName ?? '',
  Tag: dto.tag ?? '',
  Source: dto.senderIp ?? '',
  'Trap Source': dto.trpSource ?? '',
  'Port Name': dto.ifDesc ?? '',
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
});

export default function HistoricalFaultsTest() {
  const [open, setOpen] = useState(false);
  const [openModel, setOpenModel] = useState(false);
  const [trapSelected, setTrapSelected] = useState<string[]>([]);
  const [tableData, setTableData] = useState<DynamicTableRow[]>([]);
  const [finalFilteredData, setFinalFilteredData] = useState<DynamicTableRow[]>([]);
  const [alarmSeveritySelected, setAlarmSeveritySelected] = useState<string>('ALL');
  const [alarmSourceSelected, setAlarmSourceSelected] = useState<string>('ALL');
  const [popUpDataRow, setPopUpDataRow] = useState<DynamicTableRow | null>(null);
  const [viewGraph, setViewGraph] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState(false);
  const [hasFetchedOnce, setHasFetchedOnce] = useState(false);

  const now = getNow();
  const oneHourAgo = getOneHourAgo();
  const [fromDate, setFromDate] = useState<Date | null>(oneHourAgo);
  const [toDate, setToDate] = useState<Date | null>(now);
  const PRESET_SOURCES = ['CONC', 'ADVA', 'IFNR', 'TLMR', 'EPNM', 'MCP', 'NFMT'] as const;
  const [adapterSelected, setAdapterSelected] = useState<string>('ALL');

  const fetchHistoricalGata = async () => {
    try {
      setIsLoading(true);
      const formattedFrom = dayjs(fromDate).second(0).millisecond(0).format('YYYY-MM-DD HH:mm:ss');
      const formattedTo = dayjs(toDate).second(59).millisecond(999).format('YYYY-MM-DD HH:mm:ss');

      const res = await axiosClient.get(FETCH_HISTORICAL_FAULTS_TABLE_DATA, {
        params: {
          startDate: formattedFrom,
          endDate: formattedTo,
          intraptype: adapterSelected !== "ALL" ? adapterSelected : undefined,
        },
      });

      if (res.status === 200) {
        const rowsDTO = (res.data ?? []) as any[];
        const rows = rowsDTO.map(dtoToRow);
        setTableData(rows);
        setFinalFilteredData(rows);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
      setHasFetchedOnce(true);
    }
  };

  useEffect(() => {
    logActivity({ activity: "Historical Fault page opened", actionName: "HISTORICAL_FAULT_PAGE", module: "FAULTS" });
    fetchHistoricalGata();
  }, []);

  const defaultVisibleColumns = [
    'Adapter', 'Severity', 'Alarm', 'Technology', 'Device Name', 'Tag', 'Circle', 'City', 'ERP Site ID',
    'Source', 'Port Name', 'No.Services_Affected','Ticket Status', 'Description', 'Ack Time', 'Ack Msg', 'Ack User',
    'Clear Msg', 'Clear User', 'NMS Received Time', 'Clear Time', 'OSS Insertion Time', 'Internal TicketId',
  ];

  const columnOrder = [
    'Adapter', 'Severity', 'Alarm', 'Client', 'Technology', 'Device Name', 'Source', 'Circle', 'City',
    'ERP Site ID', 'Device Type', 'Tag', 'Port Name', 'No.Services_Affected', 'Description', 'Ack Status',
    'Ack Time', 'Ack Msg', 'Ack User', 'Clear Msg', 'Clear User', 'Object Ref', 'Trap Source',
    'NMS Received Time', 'Update Time', 'Clear Time', 'OSS Insertion Time', 'Alarm Id', 'Internal TicketId','Ticket Status', 'External TicketId',
  ];

  useEffect(() => {
    let filtered = [...tableData];
    if (alarmSeveritySelected !== 'ALL') {
      filtered = filtered.filter((row) => mapSeverity(row['Severity'] as string) === alarmSeveritySelected);
    }
    if (alarmSourceSelected !== 'ALL') {
      filtered = filtered.filter((row) => up(row['Adapter'] as string) === alarmSourceSelected);
    }
    if (trapSelected.length > 0) {
      filtered = filtered.filter((row) => trapSelected.includes(norm(row['Alarm'] as string)));
    }
    setFinalFilteredData(filtered);
  }, [tableData, alarmSeveritySelected, alarmSourceSelected, trapSelected]);

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
      {/* ================= IN-PAGE SIDEBAR ================= */}
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
            Historic Alarms Count
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
      <Box 
        sx={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          overflow: 'hidden',
          p: 1.5,
          gap: 1.5,
          minWidth: 0
        }}
      >
        {/* ================= TOP TOOLBAR / FILTER ROW ================= */}
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            flexWrap: 'nowrap', 
            gap: 1.5, 
            backgroundColor: '#ffffff', 
            p: 1, 
            borderRadius: 2, 
            border: '1px solid #e2e8f0',
            flexShrink: 0
          }}
        >
          {!open && (
            <IconButton
              onClick={() => setOpen(true)}
              sx={{ bgcolor: '#f1f5f9', color: '#475569', width: 32, height: 32, borderRadius: 1.5, border: '1px solid #e2e8f0', '&:hover': { bgcolor: '#e2e8f0' } }}
            >
              <ChevronRightIcon sx={{ fontSize: 20 }} />
            </IconButton>
          )}
          
          <Typography sx={{ fontSize: '0.8rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em', ml: open ? 0 : 0.5 }}>
            HISTORIC BROWSER
          </Typography>

          <Box sx={{ flexGrow: 1 }} />

          {/* Adapter Filter */}
          <Box sx={{ width: '130px' }}>
            <FormControl fullWidth size="small" sx={{ '& .MuiInputBase-root': { height: '32px', fontSize: '0.75rem', backgroundColor: '#f1f5f9', borderRadius: '6px', '& fieldset': { border: 'none' } } }}>
              <InputLabel sx={{ fontSize: '0.7rem', top: '-2px', color: '#64748b' }}>Adapter</InputLabel>
              <Select value={adapterSelected} label="Adapter" onChange={(e) => setAdapterSelected(e.target.value)}>
                <MenuItem value="ALL" sx={{ fontSize: '0.75rem' }}>ALL</MenuItem>
                {PRESET_SOURCES.map((src) => <MenuItem key={src} value={src} sx={{ fontSize: '0.75rem' }}>{src}</MenuItem>)}
              </Select>
            </FormControl>
          </Box>

       {/* Date Picker */}
          <Box 
            sx={{ 
              width: { xs: '100%', lg: '480px' }, // Responsive: full width on mobile, 480px on desktop
              minWidth: { lg: '490px' }, 
              flexShrink: 0 
            }}
          >
            <DateTimeRangeCompact 
              fromDate={fromDate} 
              toDate={toDate} 
              onChange={({ from, to }) => { 
                setFromDate(from); 
                setToDate(to); 
              }} 
            />
          </Box>
          
          {/* Submit Button */}
          <Button 
            variant="contained" 
            onClick={fetchHistoricalGata} 
            sx={{ backgroundColor: '#0f766e', '&:hover': { backgroundColor: '#115e59' }, height: 32, fontSize: '0.72rem', fontWeight: 600, px: 2.5, textTransform: 'none', boxShadow: 'none' }}
          >
            View
          </Button>
        </Box>

        {/* ================= TABLE SECTION ================= */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <HistoricFaultTableForSidebar
            defaultVisibleColumns={defaultVisibleColumns}
            columnOrder={columnOrder}
            dataObjects={finalFilteredData}
            pageSize={100}
            viewGraph={viewGraph}
            setViewGraph={setViewGraph}
            isLoading={isLoading}
            hasFetchedOnce={hasFetchedOnce}
            onRowClick={(row) => {
              // TypeScript Fix: Cast row as DynamicTableRow
              setPopUpDataRow(row as DynamicTableRow);
              setOpenModel(true);
            }}
            drawerOpen={open}
            onDrawerToggle={() => setOpen(true)}
          />
        </Box>
      </Box>

      {/* Popups */}
      <AlarmDetailsDialog mode="historic" open={openModel} onClose={() => setOpenModel(false)} popUpDataRow={popUpDataRow} />
    </Box>
  );
}