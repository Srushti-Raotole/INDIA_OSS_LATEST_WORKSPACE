import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  MenuItem,
} from "@mui/material";
import axiosClient from "@/api/axiosClient";

/* ================= TYPES ================= */

interface AlarmRow {
  adapter: string;
  family: string;
  alarm: string;
  treated: string;
  persistence: number;
  shortPeriod: number;
  shortRepetition: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  alarmRow: AlarmRow | null;
}

interface FormState {
  persistenceTime: number;
  shortPeriod: number;
  shortRepetition: number;
  treated: "Y" | "N";
}

/* ================= HELPERS ================= */

const normalizeTreated = (val: string): "Y" | "N" => {
  const v = val.trim().toUpperCase();
  if (v === "YES") return "Y";
  if (v === "NO") return "N";
  return v === "Y" ? "Y" : "N";
};

const sanitizeInt = (val: any): number => {
  const n = Number(val);
  if (!Number.isInteger(n) || n < 0) return 0;
  return n;
};

/* ================= COMPONENT ================= */

const EditAlarmDialog: React.FC<Props> = ({
  open,
  onClose,
  onSuccess,
  alarmRow,
}) => {
  const [form, setForm] = useState<FormState>({
    persistenceTime: 0,
    shortPeriod: 0,
    shortRepetition: 0,
    treated: "N",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  /* ================= INIT FORM ================= */

  useEffect(() => {
    if (alarmRow) {
      setForm({
        persistenceTime: sanitizeInt(alarmRow.persistence),
        shortPeriod: sanitizeInt(alarmRow.shortPeriod),
        shortRepetition: sanitizeInt(alarmRow.shortRepetition),
        treated: normalizeTreated(alarmRow.treated),
      });
      setErrors({});
    }
  }, [alarmRow]);

  if (!alarmRow) return null;

  /* ================= HANDLERS ================= */

  const handleNumberChange = (
    key: keyof FormState,
    value: any
  ) => {
    setForm((prev) => ({
      ...prev,
      [key]: sanitizeInt(value),
    }));
  };

  const handleChange = (
    key: keyof FormState,
    value: any
  ) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  /* ================= VALIDATION ================= */

  const validate = () => {
    const e: Record<string, string> = {};

    if (form.persistenceTime < 0)
      e.persistenceTime = "Must be 0 or positive";

    if (form.shortPeriod < 0)
      e.shortPeriod = "Must be 0 or positive";

    if (form.shortRepetition < 0)
      e.shortRepetition = "Must be 0 or positive";

    if (!["Y", "N"].includes(form.treated))
      e.treated = "Invalid value";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ================= SUBMIT ================= */

  const handleSubmit = async () => {
    if (!validate()) return;

    const payload = {
      adapter: alarmRow.adapter,
      family: alarmRow.family,
      alarm: alarmRow.alarm,
      persistenceTime: form.persistenceTime,
      treated: form.treated,
      shortPeriod: form.shortPeriod,
      shortRepetition: form.shortRepetition,
    };

    await axiosClient.put(
      "/v1/admin/customticketing/edit",
      payload
    );

    onSuccess();
    onClose();
  };

  /* ================= UI ================= */

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        Edit Alarm
      </DialogTitle>

      <DialogContent dividers>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 2,
          }}
        >
          {/* READ ONLY */}
          <TextField
            label="Adapter"
            value={alarmRow.adapter}
            disabled
          />

          <TextField
            label="Family"
            value={alarmRow.family}
            disabled
          />

          <TextField
            label="Alarm Name"
            value={alarmRow.alarm}
            disabled
            sx={{ gridColumn: "span 2" }}
          />

          {/* EDITABLE */}
          <TextField
            type="number"
            label="Persistence Time (sec)"
            value={form.persistenceTime}
            inputProps={{ min: 0, step: 1 }}
            error={!!errors.persistenceTime}
            helperText={errors.persistenceTime}
            onChange={(e) =>
              handleNumberChange(
                "persistenceTime",
                e.target.value
              )
            }
          />

          <TextField
            select
            label="Treated"
            value={form.treated}
            error={!!errors.treated}
            helperText={errors.treated}
            onChange={(e) =>
              handleChange("treated", e.target.value)
            }
          >
            <MenuItem value="Y">YES</MenuItem>
            <MenuItem value="N">NO</MenuItem>
          </TextField>

          <TextField
            type="number"
            label="Short Period"
            value={form.shortPeriod}
            inputProps={{ min: 0, step: 1 }}
            error={!!errors.shortPeriod}
            helperText={errors.shortPeriod}
            onChange={(e) =>
              handleNumberChange(
                "shortPeriod",
                e.target.value
              )
            }
          />

          <TextField
            type="number"
            label="Short Repetition"
            value={form.shortRepetition}
            inputProps={{ min: 0, step: 1 }}
            error={!!errors.shortRepetition}
            helperText={errors.shortRepetition}
            onChange={(e) =>
              handleNumberChange(
                "shortRepetition",
                e.target.value
              )
            }
          />
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
        >
          Update Alarm
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditAlarmDialog;
