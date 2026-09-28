import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Typography,
} from '@mui/material';
import type { SpanLossRow } from '../types';
import type { SpanLossVendor } from '../services/spanLossApi';

interface AddRowDialogProps {
  open: boolean;
  vendor: SpanLossVendor;
  existingKeys: Set<string>;
  onClose: () => void;
  onAdd: (row: SpanLossRow) => void;
}

const empty = {
  spanId: '',
  deviceNameA: '',
  portA: '',
  deviceNameB: '',
  portB: '',
  designLoss: '',
  spanMargin: '',
  designEol: '',
  fiberDistance: '',
  client: '',
};

export function AddRowDialog({ open, vendor, existingKeys, onClose, onAdd }: AddRowDialogProps) {
  const [form, setForm] = useState({ ...empty });
  const [error, setError] = useState<string | null>(null);

  const update = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
  };

  const handleAdd = () => {
    const id = form.spanId.trim();
    const devA = form.deviceNameA.trim();
    const devB = form.deviceNameB.trim();
    const pA = form.portA.trim();
    const pB = form.portB.trim();

    // Span ID is no longer mandatory — uniqueness is the 5-field combo.
    // At least one identifying field must be present so the row is meaningful.
    if (!id && !devA && !devB && !pA && !pB) {
      return setError('Provide at least one of: Span ID, Device A, Device B, Port A, Port B.');
    }

    const key = [id, devA, pA, devB, pB].map((v) => v.toLowerCase()).join('||');
    if (existingKeys.has(key)) {
      return setError('A row with this exact combination (Span ID + Device A + Port A + Device B + Port B) already exists.');
    }

    const num = (v: string): number | null => {
      const t = v.trim();
      if (t === '') return null;
      const n = Number(t);
      return Number.isFinite(n) ? n : null;
    };

    const numericFields: Array<[keyof typeof empty, string]> = [
      ['designLoss', 'Design Loss'],
      ['spanMargin', 'Span Margin'],
      ['designEol', 'Design EOL'],
      ['fiberDistance', 'Fiber Distance'],
    ];
    for (const [k, label] of numericFields) {
      const v = num(form[k] as string);
      if (v !== null && v < 0) {
        return setError(`${label} cannot be negative.`);
      }
    }

    onAdd({
      spanId: id,
      deviceNameA: devA,
      portA: pA,
      deviceNameB: devB,
      portB: pB,
      designLoss: num(form.designLoss),
      spanMargin: num(form.spanMargin),
      designEol: num(form.designEol),
      fiberDistance: num(form.fiberDistance),
      vendor,
      client: form.client.trim(),
    });
    setForm({ ...empty });
    setError(null);
    onClose();
  };

  const handleClose = () => {
    setForm({ ...empty });
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add new span — {vendor}</DialogTitle>
      <DialogContent dividers>
        <Stack gap={1.5} sx={{ pt: 1 }}>
          <Stack direction="row" gap={1.5}>
            <TextField label="Device A" size="small" value={form.deviceNameA} onChange={update('deviceNameA')} fullWidth />
            <TextField label="Port A" size="small" value={form.portA} onChange={update('portA')} sx={{ width: 140 }} />
          </Stack>
          <Stack direction="row" gap={1.5}>
            <TextField label="Device B" size="small" value={form.deviceNameB} onChange={update('deviceNameB')} fullWidth />
            <TextField label="Port B" size="small" value={form.portB} onChange={update('portB')} sx={{ width: 140 }} />
          </Stack>
          <Stack direction="row" gap={1.5}>
            <TextField label="Design Loss (dB)" size="small" type="number" inputProps={{ min: 0, step: 'any' }} value={form.designLoss} onChange={update('designLoss')} fullWidth />
            <TextField label="Span Margin (dB)" size="small" type="number" inputProps={{ min: 0, step: 'any' }} value={form.spanMargin} onChange={update('spanMargin')} fullWidth />
          </Stack>
          <Stack direction="row" gap={1.5}>
            <TextField label="Design EOL (dB)" size="small" type="number" inputProps={{ min: 0, step: 'any' }} value={form.designEol} onChange={update('designEol')} fullWidth />
            <TextField label="Fiber Distance (km)" size="small" type="number" inputProps={{ min: 0, step: 'any' }} value={form.fiberDistance} onChange={update('fiberDistance')} fullWidth />
          </Stack>
          <TextField label="Client" size="small" value={form.client} onChange={update('client')} fullWidth />
          <Typography variant="caption" color="text.secondary">
            Note: Design Loss, Span Margin, Design EOL and Fiber Distance must be ≥ 0.
          </Typography>
          {error && (
            <Typography variant="caption" color="error">
              {error}
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button variant="contained" onClick={handleAdd}>
          Add row
        </Button>
      </DialogActions>
    </Dialog>
  );
}
