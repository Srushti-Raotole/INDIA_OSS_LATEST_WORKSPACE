
import React, { useMemo, useState, useEffect } from 'react';
import {
  Box, Button, Divider, TextField, Typography, Snackbar, Alert, Chip, Tooltip, List, ListItem, ListItemText,
} from '@mui/material';
import Grid from '@mui/material/Grid'; // Fixed legacy core v5 reference path engine point
import { useAppSelector } from '../../../../../utils/customHooks/reactDataHooks';
import axiosClient from "@/api/axiosClient";
import { CLEAR_OR_ACK_ACTIVE_TRAP_API } from "@/api/apis";
import { logActivity } from '../../../../../utils/activityLogger';
import { getUsername } from '../../../../../utils/auth/getUsername';

export interface AcknowledgeTrapProps {
  selectedrows: Record<string, any>[];
  onDone?: () => void;
  useNetwork?: boolean;
}

const pick = (row: Record<string, any>, keys: string[]) => {
  for (const k of keys) {
    const v = row?.[k];
    if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim();
  }
  return undefined;
};

const getTrapId = (row: Record<string, any>) => pick(row, ['__trapid', 'Internal TicketId', 'Trap Id', 'ID']);
const getAdapter = (row: Record<string, any>) => pick(row, ['Adapter', 'adapterName']);
const getVendor = (row: Record<string, any>) => pick(row, ['Technology', 'vendor']);
const getRecvTime = (row: Record<string, any>) => pick(row, ['NMS Received Time', 'rec_time']);
const getDeviceName = (row: Record<string, any>) => pick(row, ['Device Name', 'Node Name']) ?? '—';

const nowStringIST = () => {
  const d = new Date();
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });
  const parts = fmt.formatToParts(d);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}:${get('second')}`;
};

const TS_REGEX = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
const validTS = (s: string) => TS_REGEX.test(s);

const toDateIST = (s?: string) => {
  if (!s || !validTS(s)) return undefined;
  const [datePart, timePart] = s.split(' ');
  const [y, m, d] = datePart.split('-').map(Number);
  const [hh, mm, ss] = timePart.split(':').map(Number);
  return new Date(Date.UTC(y, m - 1, d, hh - 5, mm - 30, ss));
};

const AcknowledgeTrap: React.FC<AcknowledgeTrapProps> = ({ selectedrows, onDone, useNetwork = true }) => {
  const total = useMemo(() => selectedrows?.length ?? 0, [selectedrows]);
  const [ackMsg, setAckMsg] = useState('Acknowledging trap');
  const [ackTime, setAckTime] = useState(nowStringIST());
  const [autoNow, setAutoNow] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<Array<{ id: string; ok: boolean; msg: string }>>([]);

  const [snack, setSnack] = useState({ open: false, text: '', type: 'info' as 'success'|'error'|'warning'|'info' });
  const notify = (text: string, type: 'success'|'error'|'warning'|'info' = 'info') => setSnack({ open: true, text, type });

  const reduxUser = useAppSelector((state) => state.user.user);
  const username = useMemo(() => getUsername(reduxUser)?.replace(/@Lightstorm/i, '') || 'Guest', [reduxUser]);

  useEffect(() => {
    if (!autoNow) return;
    const t = setInterval(() => setAckTime(nowStringIST()), 1000);
    return () => clearInterval(t);
  }, [autoNow]);

  const validateBeforeSubmit = (): boolean => {
    if (!total) return false;
    if (!ackMsg.trim()) { notify('Message is required.', 'warning'); return false; }
    if (!validTS(ackTime)) { notify('Invalid format. Use YYYY-MM-DD HH:MM:SS', 'error'); return false; }

    const at = toDateIST(ackTime);
    for (const row of selectedrows) {
      const r = getRecvTime(row);
      if (r && validTS(r)) {
        const rt = toDateIST(r);
        if (at && rt && at < rt) {
          notify(`Ack time cannot be earlier than NMS Received Time for ID: ${getTrapId(row)}`, 'error');
          return false;
        }
      }
    }
    return true;
  };

  const handleAcknowledge = async () => {
    if (!validateBeforeSubmit()) return;
    setSubmitting(true);
    setResults([]);

    let ok = 0; let fail = 0;
    for (const row of selectedrows) {
      const trapID = getTrapId(row);
      const adapaterName = getAdapter(row);
      if (!trapID || !adapaterName) {
        fail++; continue;
      }

      const payload = {
        trapID, ackFlag: 'ACK', ackUser: username, ackTime, ackMsg,
        adapaterName, dbinsertiontime: ackTime, vendor: getVendor(row)
      };

      try {
        if (useNetwork) {
          await axiosClient.post(CLEAR_OR_ACK_ACTIVE_TRAP_API, payload);
        }
        row['Ack Msg'] = ackMsg; row['Ack Time'] = ackTime; row['Ack User'] = username;
        ok++; setResults(prev => [...prev, { id: trapID, ok: true, msg: 'Acknowledged' }]);
      } catch (e: any) {
        fail++; setResults(prev => [...prev, { id: trapID, ok: false, msg: e?.message ?? 'Failed' }]);
      }
    }

    if (ok > 0 && useNetwork) {
      logActivity({ activity: `${ok} fault${ok !== 1 ? 's' : ''} acknowledged on Active Fault page`, actionName: 'ACKNOWLEDGE_FAULT', module: 'FAULTS' });
    }
    if (ok && !fail) { notify(`Acknowledged ${ok} traps successfully.`, 'success'); onDone?.(); }
    else if (ok && fail) notify(`Acknowledged ${ok}, failed ${fail}.`, 'warning');
    else notify('All requests failed.', 'error');
    setSubmitting(false);
  };

  return (
    <Box sx={{ p: 1 }}>
      <Grid container spacing={1.5}>
        <Grid item xs={12}>
          <TextField label="Acknowledgement Note" value={ackMsg} onChange={(e) => setAckMsg(e.target.value)} size="small" fullWidth />
        </Grid>
        <Grid item xs={8}>
          <TextField label="Timestamp (IST)" value={ackTime} onChange={(e) => { setAckTime(e.target.value); setAutoNow(false); }} size="small" fullWidth error={!validTS(ackTime)} />
        </Grid>
        <Grid item xs={4}>
          <Button variant="outlined" fullWidth style={{ height: 38, textTransform: 'none', fontSize: '0.72rem' }} onClick={() => { setAckTime(nowStringIST()); setAutoNow(true); }}>Live Time</Button>
        </Grid>
      </Grid>

      <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', mt: 2, mb: 0.5 }}>Traps Select Queue ({total})</Typography>
      <List dense sx={{ maxHeight: 120, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 2, p: 0, backgroundColor: '#f8fafc' }}>
        {selectedrows.map((r, i) => (
          <ListItem key={i} divider sx={{ py: 0.5 }}>
            <ListItemText
              primary={<Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}><Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#334155' }}>ID: {getTrapId(r)}</Typography><Chip size="small" label={getAdapter(r)} style={{ height: 16, fontSize: '0.6rem' }} /></Box>}
              secondary={<Typography sx={{ fontSize: '0.68rem', color: '#64748b' }}>Device: {getDeviceName(r)} | Received: {getRecvTime(r)}</Typography>}
            />
          </ListItem>
        ))}
      </List>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
        <Button variant="contained" disabled={submitting || !total} onClick={handleAcknowledge} sx={{ backgroundColor: '#0f766e', '&:hover': { backgroundColor: '#115e59' }, textTransform: 'none', height: 34, fontSize: '0.75rem', boxShadow: 'none' }}>
          {submitting ? 'Processing...' : 'Confirm'}
        </Button>
      </Box>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snack.type} variant="filled" sx={{ fontSize: '0.75rem' }}>{snack.text}</Alert>
      </Snackbar>
    </Box>
  );
};
export default AcknowledgeTrap;