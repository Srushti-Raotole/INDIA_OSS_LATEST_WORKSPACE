import { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  Alert,
  Box,
  Chip,
  RadioGroup,
  FormControlLabel,
  Radio,
  Divider,
} from '@mui/material';
import { Upload as UploadIcon, Download as DownloadIcon, FileText } from 'lucide-react';
import type { SpanLossRow } from '../types';
import type { SpanLossVendor } from '../services/spanLossApi';
import { buildSampleCsv, downloadCsv, parseSpanLossCsv, type CsvParseResult } from '../utils/csvUtils';
import { analyzeIncomingRows, type DuplicateAnalysis } from '../utils/rowMatching';

export type CsvImportMode = 'append' | 'override';

interface CsvImportDialogProps {
  open: boolean;
  vendor: SpanLossVendor;
  client: string;
  existingRows: SpanLossRow[];
  onClose: () => void;
  onImport: (rows: SpanLossRow[], mode: CsvImportMode, analysis: DuplicateAnalysis) => void;
}

export function CsvImportDialog({
  open,
  vendor,
  client,
  existingRows,
  onClose,
  onImport,
}: CsvImportDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<CsvImportMode>('append');
  const [fileName, setFileName] = useState<string>('');
  const [parsed, setParsed] = useState<CsvParseResult | null>(null);
  const [analysis, setAnalysis] = useState<DuplicateAnalysis | null>(null);

  const reset = () => {
    setFileName('');
    setParsed(null);
    setAnalysis(null);
    setMode('append');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  useEffect(() => {
    if (!open) reset();
  }, [open]);

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const text = await file.text();
    const result = parseSpanLossCsv(text, vendor);
    setParsed(result);
    setAnalysis(analyzeIncomingRows(result.rows, existingRows));
  };

  const handleDownloadSample = () => {
    downloadCsv(`spanloss-sample-${vendor}-${client || 'client'}.csv`, buildSampleCsv(vendor));
  };

  const handleConfirm = () => {
    if (!parsed || parsed.rows.length === 0 || !analysis) return;
    onImport(parsed.rows, mode, analysis);
    reset();
    onClose();
  };

  const errorCount = parsed?.errors.length ?? 0;
  const okCount = parsed?.rows.length ?? 0;
  const newCount = analysis?.newRows.length ?? 0;
  const dupCount = analysis?.exactDuplicates.length ?? 0;
  const conflictCount = analysis?.conflicts.length ?? 0;

  // Show first N existing-already entries for user awareness
  const dupPreview = (analysis?.exactDuplicates ?? []).slice(0, 4);
  const conflictPreview = (analysis?.conflicts ?? []).slice(0, 4);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Import CSV — {vendor} / {client || '—'}
      </DialogTitle>
      <DialogContent dividers>
        <Stack gap={2} sx={{ pt: 1 }}>
        

          <Box>
            <Button
              size="small"
              variant="outlined"
              startIcon={<DownloadIcon size={16} />}
              onClick={handleDownloadSample}
            >
              Download sample CSV
            </Button>
          </Box>

          <Box
            sx={{
              border: '1px dashed',
              borderColor: 'divider',
              borderRadius: 1,
              p: 2,
              textAlign: 'center',
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              hidden
              onChange={handleFileChange}
            />
            <Button
              variant="contained"
              startIcon={<UploadIcon size={16} />}
              onClick={() => fileInputRef.current?.click()}
            >
              Choose CSV file
            </Button>
            {fileName && (
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                {fileName}
              </Typography>
            )}
          </Box>

          {parsed && (
            <Stack gap={1}>
              <Stack direction="row" gap={1} flexWrap="wrap">
                <Chip size="small" color="success" label={`${okCount} parsed`} />
                {newCount > 0 && (
                  <Chip size="small" color="info" label={`${newCount} new`} />
                )}
                {dupCount > 0 && (
                  <Chip size="small" color="warning" label={`${dupCount} already exists`} />
                )}
                {conflictCount > 0 && (
                  <Chip size="small" color="error" label={`${conflictCount} conflict`} />
                )}
                {parsed.skipped > 0 && (
                  <Chip size="small" color="default" label={`${parsed.skipped} skipped`} />
                )}
              </Stack>

              {dupCount > 0 && (
                <Alert severity="warning" variant="outlined">
                  <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {dupCount} row(s) already exist with the same values
                  </Typography>
                  <Typography variant="caption" component="div">
                    Examples (showing first {dupPreview.length}):
                    <Box component="ul" sx={{ pl: 2, my: 0.5 }}>
                      {dupPreview.map((r, i) => (
                        <li key={i}>
                          <code>{r.spanId}</code>
                          {r.deviceNameA && (
                            <> — {r.deviceNameA}/{r.portA || '—'} ↔ {r.deviceNameB}/{r.portB || '—'}</>
                          )}
                        </li>
                      ))}
                    </Box>
                    To re-import these, you can <strong>Override</strong> the table or add a
                    different entry (change spanId or device/port).
                  </Typography>
                </Alert>
              )}

              {conflictCount > 0 && (
                <Alert severity="error" variant="outlined">
                  <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {conflictCount} row(s) match an existing span but with different values
                  </Typography>
                  <Typography variant="caption" component="div">
                    Examples (showing first {conflictPreview.length}):
                    <Box component="ul" sx={{ pl: 2, my: 0.5 }}>
                      {conflictPreview.map((r, i) => (
                        <li key={i}>
                          <code>{r.spanId}</code>
                          {r.deviceNameA && (
                            <> — {r.deviceNameA}/{r.portA || '—'} ↔ {r.deviceNameB}/{r.portB || '—'}</>
                          )}
                        </li>
                      ))}
                    </Box>
                    Use <strong>Merge</strong> to update them with CSV values, or{' '}
                    <strong>Override</strong> to replace the whole table.
                  </Typography>
                </Alert>
              )}

              {errorCount > 0 && (
                <Box
                  sx={{
                    maxHeight: 100,
                    overflow: 'auto',
                    bgcolor: 'action.hover',
                    p: 1,
                    borderRadius: 1,
                    fontSize: 12,
                    fontFamily: 'monospace',
                  }}
                >
                  {parsed.errors.slice(0, 50).map((e, i) => (
                    <div key={i}>• {e}</div>
                  ))}
                </Box>
              )}

              <Divider />

              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                What should we do?
              </Typography>
              <RadioGroup value={mode} onChange={(_, v) => setMode(v as CsvImportMode)}>
                <FormControlLabel
                  value="append"
                  control={<Radio size="small" />}
                  label={
                    <Typography variant="body2">
                      <strong>Append new only</strong> — skip {dupCount + conflictCount} existing,
                      add {newCount} new row(s)
                    </Typography>
                  }
                />
                <FormControlLabel
                  value="override"
                  control={<Radio size="small" />}
                  label={
                    <Typography variant="body2">
                      <strong>Override</strong> — replace entire table with the {okCount} CSV row(s)
                    </Typography>
                  }
                />
              </RadioGroup>

           
            </Stack>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={!parsed || parsed.rows.length === 0}
        >
          Apply
        </Button>
      </DialogActions>
    </Dialog>
  );
}
