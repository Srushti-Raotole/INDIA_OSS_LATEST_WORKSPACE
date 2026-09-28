import React, { useEffect, useState } from 'react';
import { Box, IconButton, Typography, Button } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import axiosClient from "@/api/axiosClient";
import { FETCH_TICKETING_TABLE_DATA } from "@/api/apis";
import { DynamicTableRow } from '../../store/types';
import DateTimeRangeCompact from '../../components/common/DateTimeRangeCompact';
import { getNow, getOneHourAgo } from '../../components/common/CurrentDateTimeOneDayDiff';
import dayjs from 'dayjs';

import TicketingPageTable from '../../components/faults/active/Ticketing/TicketingPageTable';
import AlarmSummaryCardsInsideSidebarTicketing from '../../components/faults/active/Ticketing/AlarmSummaryCardsInsideSidebarTicketing';
import TicketingDetailsDialog from '../../components/faults/active/Ticketing/TicketingDetailsDialog';
import { useNavigate } from 'react-router-dom';
import { logActivity } from '../../utils/activityLogger';

/* ====== utils ====== */
const up = (v?: string | null) => (v ?? '').toString().trim().toUpperCase();

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

const normalizeTicketState = (s?: string | null) => {
  const u = (s ?? '').toString().trim().toUpperCase();
  if (u === 'OPEN') return 'OPEN';
  if (u === 'RESOLVED') return 'RESOLVED';
  if (u === 'CREATION FAILED') return 'CREATION FAILED';
  if (u === 'RESOLUTION FAILED') return 'CREATION FAILED';
  return u;
};

const dtoToRow = (dto: any): DynamicTableRow => ({
  Adapter: dto.adapter ?? '',
  Severity: mapSeverity(dto.severity),
  Family: dto.family ?? '',
  'VegayanOSS Ticket': dto.internalTicketId ?? '',
  'FS Ticket': dto.externalTicketId ?? '',
  'Ticket State': dto.state ?? '',
  
  // New Columns
  'Closure Code': dto.closureCode ?? '',
  'Ticket Closure Time': dto.ticketClosureTime ?? '',
  'Ticket Status': dto.ticketStatus ?? '',

  'Alarm Received Time': dto.recTime ?? '',
  'NMS Received Time': dto.recTime ?? '', 

  'Alarm Cleared Time': dto.clearTime ?? '',
  'OSS Ticket Created Time': dto.ticketCreationDate ?? '',
  'OSS Ticket Resolution Time': dto.ticketResolutionDate ?? '',
  'FS Error': dto.fserr ?? '',
  'Backend Error': dto.bckenderr ?? '',
  'Root Alarm ID': dto.alarmId ?? '',
  'Node Name': dto.nodeName ?? '',
  'IP Address': dto.ipAddress ?? '',
  'Symptom Type': dto.symptomType ?? '',
  'Ticket Description': dto.description ?? '',
  'Last Modify Date': dto.lastModifiedDate ?? '',
  'OSS DBInsertion(Receive)': dto.dbinsert_rec ?? '',
  'OSS DBInsertion(Clear)': dto.dbinsert_clear ?? '',
  Alarm: dto.trapType ?? dto.alarmName ?? '',
  Client: dto.clientType ?? '',
  Technology: dto.vendor ?? '',
  'Device Name': dto.nodeName ?? '',
  Source: dto.senderIp ?? '',
  'Trap Source': dto.trpSource ?? '',
  'Port Name': dto.ifDesc ?? '',
  Tag: dto.tag ?? '',
  'Device Type': dto.nodeType ?? '',
  Description: dto.desc ?? dto.description ?? '',
  'No. of Service Affected': dto.numberOfServiceAffecting ?? '',
  'Update Time': dto.updateTime ?? '',
  'OSS Insertion Time': dto.insertionTime ?? '',
  'Clear Time': dto.clearTime ?? '',
  'Ack Status': dto.ackStat ?? '',
  'Ack Time': dto.ackTime ?? '',
  'Ack Msg': dto.ackMsg ?? '',
  'Ack User': dto.ackUser ?? '',
  'Object Ref': dto.ref ?? '',
  'Alarm Id': dto.alarmId ?? '',
  'Internal TicketId': dto.trapId ?? '',
  'External TicketId': dto.ticket ?? '',
  Circle: dto.circle ?? '',
  City: dto.city ?? '',
  'ERP Site ID': dto.erpSiteId ?? '',
} as DynamicTableRow);

export default function TicketingPageTest() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [openModel, setOpenModel] = useState(false);

  const [tableData, setTableData] = useState<DynamicTableRow[]>([]);
  const [finalFilteredData, setFinalFilteredData] = useState<DynamicTableRow[]>([]);

  const [alarmSeveritySelected, setAlarmSeveritySelected] = useState<string>('ALL');
  const [alarmSourceSelected, setAlarmSourceSelected] = useState<string>('ALL');
  const [popUpDataRow, setPopUpDataRow] = useState<DynamicTableRow | null>(null);
  const [viewGraph, setViewGraph] = useState<boolean>(false);

  const now = getNow();
  const oneHourAgo = getOneHourAgo();
  const [fromDate, setFromDate] = useState<Date | null>(oneHourAgo);
  const [toDate, setToDate] = useState<Date | null>(now);
  
  // State for API Adapter selection
  const [apiAdapter, setApiAdapter] = useState<string>('ALL');
  const availableAdapters = ['ALL', 'MCP', 'EPNM', 'CONC', 'ADVA', 'IFNR', 'TLMR', 'NFMT'];

  const [isLoading, setIsLoading] = useState(false);
  const [hasFetchedOnce, setHasFetchedOnce] = useState(false);

  const fetchTicketingData = async () => {
    try {
      setIsLoading(true);
      const formattedFrom = dayjs(fromDate).format('YYYY-MM-DD HH:mm:ss');
      const formattedTo = dayjs(toDate).format('YYYY-MM-DD HH:mm:ss');

      const res = await axiosClient.get(FETCH_TICKETING_TABLE_DATA, {
        params: { 
          adapter: apiAdapter, 
          startTime: formattedFrom, 
          endTime: formattedTo 
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
    logActivity({ activity: "Ticketing Browser page opened", actionName: "TICKETING_BROWSER_PAGE", module: "TICKETING" });
    fetchTicketingData();
  }, []);

  useEffect(() => {
    let filtered = [...tableData];

    if (alarmSeveritySelected !== 'ALL') {
      filtered = filtered.filter((row) => {
        const raw = (row['Ticket State'] as string) ?? '';
        return normalizeTicketState(raw) === normalizeTicketState(alarmSeveritySelected);
      });
    }

    if (alarmSourceSelected !== 'ALL') {
      filtered = filtered.filter((row) => up(row['Adapter'] as string) === alarmSourceSelected);
    }
    setFinalFilteredData(filtered);
  }, [tableData, alarmSeveritySelected, alarmSourceSelected]);

  // Removed 'Ticket State' and added the 3 new columns
  const defaultVisibleColumns = [
    'Adapter', 'Severity', 'FS Ticket', 'VegayanOSS Ticket', 'Family', 
    'Ticket Status', 'Closure Code', 'Ticket Closure Time',
    'Alarm Received Time', 'Alarm Cleared Time', 'OSS Ticket Created Time', 'OSS Ticket Resolution Time',
    'FS Error', 'Backend Error', 'Root Alarm ID', 'Node Name', 'IP Address', 'Symptom Type', 'Ticket Description', 'Last Modify Date',
  ];

  // Added the 3 new columns to the full available order list
  const columnOrder = [
    'Adapter', 'Family', 'VegayanOSS Ticket', 'FS Ticket', 'Ticket Description', 'Ticket State', 
    'Ticket Status', 'Closure Code', 'Ticket Closure Time',
    'Alarm Received Time', 'Alarm Cleared Time', 'OSS DBInsertion(Receive)', 'OSS DBInsertion(Clear)',
    'OSS Ticket Created Time', 'OSS Ticket Resolution Time', 'FS Error', 'Backend Error', 'Root Alarm ID',
    'Node Name', 'Severity', 'IP Address', 'Symptom Type', 'Last Modify Date',
  ];

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
            Ticket Status
          </Typography>
          <IconButton onClick={() => setOpen(false)} size="small" sx={{ bgcolor: '#f1f5f9', '&:hover': { bgcolor: '#e2e8f0' } }}>
            <ChevronLeftIcon sx={{ fontSize: 18, color: '#475569' }} />
          </IconButton>
        </Box>
        <Box sx={{ p: 1 }}>
          <AlarmSummaryCardsInsideSidebarTicketing
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

          <Typography sx={{ fontSize: '0.8rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em', ml: open ? 0 : 0.5, display: { xs: 'none', lg: 'block' } }}>
            TICKETING
          </Typography>

          <Box sx={{ flexGrow: 1 }} />

          {/* Adapter Switch Buttons */}
          <Box sx={{ display: 'flex', gap: 0.5, bgcolor: '#f1f5f9', p: 0.4, borderRadius: 1.5, border: '1px solid #e2e8f0' }}>
            {availableAdapters.map((adapter) => (
              <Button
                key={adapter}
                onClick={() => setApiAdapter(adapter)}
                variant={apiAdapter === adapter ? 'contained' : 'text'}
                sx={{
                  minWidth: 0, height: 26, px: 1, fontSize: '0.65rem', fontWeight: 700, textTransform: 'none',
                  bgcolor: apiAdapter === adapter ? '#354a6b' : 'transparent',
                  color: apiAdapter === adapter ? '#ffffff !important' : '#64748b !important',
                  boxShadow: 'none',
                  '&:hover': { bgcolor: apiAdapter === adapter ? '#354a6b' : '#e2e8f0', boxShadow: 'none' }
                }}
              >
                {adapter}
              </Button>
            ))}
          </Box>

          {/* Date Picker */}
          <Box sx={{ width: { xs: '100%', lg: '480px' }, minWidth: { lg: '490px' }, flexShrink: 0 }}>
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
            onClick={fetchTicketingData}
            sx={{ backgroundColor: '#0f766e', '&:hover': { backgroundColor: '#115e59' }, height: 32, fontSize: '0.72rem', fontWeight: 600, px: 2.5, textTransform: 'none', boxShadow: 'none' }}
          >
            View
          </Button>
        </Box>

        {/* ================= TABLE SECTION ================= */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <TicketingPageTable
            defaultVisibleColumns={defaultVisibleColumns}
            columnOrder={columnOrder}
            dataObjects={finalFilteredData}
            pageSize={100}
            viewGraph={viewGraph}
            setViewGraph={setViewGraph}
            isLoading={isLoading}
            hasFetchedOnce={hasFetchedOnce}
            onRowClick={(row) => {
              setPopUpDataRow(row as DynamicTableRow);
              setOpenModel(true);
            }}
            isActiveTab={true}
            tableId="ticketing-table"
            drawerOpen={open}
            onDrawerToggle={() => setOpen(true)}
          />
        </Box>
      </Box>

      {/* Popups */}
      <TicketingDetailsDialog open={openModel} onClose={() => setOpenModel(false)} popUpDataRow={popUpDataRow} />
    </Box>
  );
}