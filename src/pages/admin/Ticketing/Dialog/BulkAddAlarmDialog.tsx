import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  List,
  ListItem,
} from "@mui/material";
import axiosClient from "@/api/axiosClient";

/* ================= CONSTANTS ================= */

const ADAPTERS = ["CONC", "ADVA", "NFMT", "IFNR", "TLMR", "EPNM", "MCP"];

const FAMILY_MAP: Record<string, string> = {
  CONC: "CISCO",
  TLMR: "CISCO",
  EPNM: "CISCO",
  IFNR: "IFNR",
  ADVA: "ADVA",
  "MCP": "CIENA",
  NFMT: "NOKIA",
};

const REQUIRED_FIELDS = [
  "adapter",
  "family",
  "alarm",
  "treatedAction",
  "persistenceTime",
  "shortPeriod",
  "shortRepetition",
];

const INTEGER_FIELDS = [
  "persistenceTime",
  "shortPeriod",
  "shortRepetition",
];

/* ================= TYPES ================= */

type BulkResult = {
  alarm: string;
  success: boolean;
  message: string;
};

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

/* ================= SAMPLE CSV ================= */

const SAMPLE_CSV = `adapter,family,alarm,treatedAction,persistenceTime,shortPeriod,shortRepetition
CONC,CISCO,LINK_DOWN,Y,0,0,0
EPNM,CISCO,POWER_FAIL,N,10,5,3
`;

/* ================= HELPERS ================= */

const normalizeTreated = (val: string) => {
  const v = val.trim().toUpperCase();
  if (v === "YES") return "Y";
  if (v === "NO") return "N";
  return v;
};

/* ================= COMPONENT ================= */

const BulkAddAlarmDialog: React.FC<Props> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const [rows, setRows] = useState<any[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [results, setResults] = useState<BulkResult[] | null>(null);
  const [loading, setLoading] = useState(false);

  /** 🔹 alarm cache: key = adapter|family → alarms[] */
  const alarmCache = React.useRef<Record<string, string[]>>({});

  /* ================= DOWNLOAD SAMPLE ================= */

  const downloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bulk_alarm_sample.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ================= FETCH ALARMS (CACHED) ================= */

  const fetchAlarmList = async (
    adapter: string,
    family: string
  ): Promise<string[]> => {
    const key = `${adapter}|${family}`;

    if (alarmCache.current[key]) {
      return alarmCache.current[key];
    }

    const res = await axiosClient.get<string[]>(
      "/v1/admin/customticketing/alarms",
      { params: { adapter, family } }
    );

    alarmCache.current[key] = res.data || [];
    return alarmCache.current[key];
  };

  /* ================= CSV PARSER ================= */

  const parseCSV = async (file: File) => {
    const reader = new FileReader();

    reader.onload = async () => {
      const text = reader.result as string;
      const lines = text.split(/\r?\n/).filter(Boolean);

      if (lines.length < 2) {
        setErrors(["CSV must contain header and at least one row"]);
        return;
      }

      const headers = lines[0].split(",").map((h) => h.trim());
      const data: any[] = [];
      const errs: string[] = [];

      for (let idx = 0; idx < lines.slice(1).length; idx++) {
        const line = lines[idx + 1];
        const values = line.split(",");
        const row: any = {};
        const rowNum = idx + 2;

        headers.forEach((h, i) => {
          row[h] = values[i]?.trim() ?? "";
        });

        /* ===== REQUIRED FIELDS ===== */
        REQUIRED_FIELDS.forEach((field) => {
          if (row[field] === "" || row[field] == null) {
            errs.push(`Row ${rowNum}: ${field} is required`);
          }
        });

        /* ===== ADAPTER ===== */
        if (!ADAPTERS.includes(row.adapter)) {
          errs.push(`Row ${rowNum}: invalid adapter '${row.adapter}'`);
          continue;
        }

        /* ===== FAMILY (AUTO) ===== */
        row.family = FAMILY_MAP[row.adapter];

        /* ===== FETCH + VALIDATE ALARM ===== */
        try {
          const alarms = await fetchAlarmList(
            row.adapter,
            row.family
          );

          if (!alarms.includes(row.alarm)) {
            errs.push(
              `Row ${rowNum}: alarm '${row.alarm}' is not valid for ${row.adapter}/${row.family}`
            );
          }
        } catch {
          errs.push(
            `Row ${rowNum}: failed to fetch alarm list`
          );
        }

        /* ===== TREATED ===== */
        row.treatedAction = normalizeTreated(row.treatedAction);
        if (!["Y", "N"].includes(row.treatedAction)) {
          errs.push(`Row ${rowNum}: treatedAction must be Y or N`);
        }

        /* ===== INTEGER FIELDS ===== */
        INTEGER_FIELDS.forEach((field) => {
          const val =
            row[field] === "" ? 0 : Number(row[field]);

          if (!Number.isInteger(val) || val < 0) {
            errs.push(
              `Row ${rowNum}: ${field} must be 0 or positive integer`
            );
          }
          row[field] = val;
        });

        data.push(row);
      }

      setRows(data);
      setErrors(errs);
      setResults(null);
    };

    reader.readAsText(file);
  };

  /* ================= SUBMIT ================= */

  const handleSubmit = async () => {
    if (!rows.length || errors.length) return;

    try {
      setLoading(true);
      const res = await axiosClient.put(
        "/v1/admin/customticketing/add/bulk",
        { alarms: rows }
      );

      setResults(res.data);
      onSuccess();
    } catch {
      setErrors(["Bulk upload failed"]);
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Bulk Add Alarms</DialogTitle>

      <DialogContent dividers>
        <Alert severity="info" sx={{ mb: 2 }}>
          Alarm names are validated against backend per
          adapter & family.
        </Alert>

        <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
          <Button variant="outlined" onClick={downloadSample}>
            Download Sample CSV
          </Button>

          <Button component="label" variant="contained">
            Upload CSV
            <input
              hidden
              type="file"
              accept=".csv"
              onChange={(e) =>
                e.target.files && parseCSV(e.target.files[0])
              }
            />
          </Button>
        </Box>

        {errors.length > 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <List dense>
              {errors.map((e, i) => (
                <ListItem key={i}>{e}</ListItem>
              ))}
            </List>
          </Alert>
        )}

        {results && (
          <Alert severity="success">
            <Typography fontWeight={600}>
              Upload Result
            </Typography>
            <List dense>
              {results.map((r, i) => (
                <ListItem key={i}>
                  {r.alarm} →{" "}
                  {r.success ? "Created" : r.message}
                </ListItem>
              ))}
            </List>
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button
          variant="contained"
          disabled={!rows.length || errors.length > 0 || loading}
          onClick={handleSubmit}
        >
          {loading ? "Processing..." : "Process"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BulkAddAlarmDialog;
