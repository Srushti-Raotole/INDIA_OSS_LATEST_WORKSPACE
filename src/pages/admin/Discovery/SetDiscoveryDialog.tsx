import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  TextField,
  MenuItem,
} from "@mui/material";
import {
  LocalizationProvider,
  DateTimePicker,
} from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { Dayjs } from "dayjs";

import axiosClient from "@/api/axiosClient";
import {
  SET_DISCOVERY_AUTO,
  SET_DISCOVERY_ONDEAMND,
} from "@/api/apis";
import { logActivity } from "../../../utils/activityLogger";

/* ================= TYPES ================= */
export type DiscoveryType = "AUTOMATIC" | "ON_DEMAND";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

/* ================= CONSTANTS ================= */
const ADAPTERS = ["CONC", "IFNR", "EPNM"];
const DISCOVERY_TYPES: DiscoveryType[] = [
  "AUTOMATIC",
  // "ON_DEMAND",
];

/* ================= DATE FORMATTER (MYSQL SAFE) ================= */
const toMysqlDateTime = (d: Dayjs) =>
  d.format("YYYY-MM-DD HH:mm:ss");

/* ================= COMPONENT ================= */
const SetDiscoveryDialog: React.FC<Props> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const [adapter, setAdapter] = React.useState("");
  const [discoveryType, setDiscoveryType] =
    React.useState<DiscoveryType | "">("");
  const [dateTime, setDateTime] =
    React.useState<Dayjs | null>(null);
  const [remark, setRemark] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async () => {
    if (!adapter || !discoveryType || !dateTime) {
      alert("Adapter, Discovery Type and Time are mandatory");
      return;
    }

    try {
      setLoading(true);

      /* ================= COMMON PARAMS ================= */
      const commonParams = {
        flag:
          discoveryType === "AUTOMATIC"
            ? "Automatic"
            : "OnDemand",
        time: toMysqlDateTime(dateTime), //  FIXED
        remark,
        adapter,
      };

      /* ================= AUTO ================= */
      if (discoveryType === "AUTOMATIC") {
        await axiosClient.post(
          SET_DISCOVERY_AUTO,
          null,
          { params: commonParams }
        );
        logActivity({
          activity: `Automatic discovery scheduled | Adapter=${adapter} | Time=${commonParams.time}`,
          actionName: "SET_DISCOVERY_AUTO",
          module: "DISCOVERY",
        });
        onSuccess(
          `AUTO discovery set successfully | Adapter: ${adapter}`
        );
      }

      /* ================= ON-DEMAND ================= */
      if (discoveryType === "ON_DEMAND") {
        await axiosClient.post(
          SET_DISCOVERY_ONDEAMND,
          null,
          {
            params: {
              ...commonParams,
              subtype: "FULL",
            },
          }
        );
        logActivity({
          activity: `On-demand discovery scheduled | Adapter=${adapter} | Subtype=FULL | Time=${commonParams.time}`,
          actionName: "SET_DISCOVERY_ON_DEMAND",
          module: "DISCOVERY",
        });
        onSuccess(
          `ON-DEMAND discovery set successfully | Adapter: ${adapter}`
        );
      }

      onClose();
    } catch (err) {
      alert("Failed to set discovery");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Set Discovery</DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2} mt={1}>
          <TextField
            select
            label="Adapter"
            value={adapter}
            onChange={(e) => setAdapter(e.target.value)}
            fullWidth
          >
            {ADAPTERS.map((a) => (
              <MenuItem key={a} value={a}>
                {a}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Discovery Type"
            value={discoveryType}
            onChange={(e) =>
              setDiscoveryType(
                e.target.value as DiscoveryType
              )
            }
            fullWidth
          >
            {DISCOVERY_TYPES.map((t) => (
              <MenuItem key={t} value={t}>
                {t}
              </MenuItem>
            ))}
          </TextField>
          {/* 
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DateTimePicker
              label="Schedule Time"
              value={dateTime}
              onChange={setDateTime}
            />
          </LocalizationProvider> */}
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DateTimePicker
              label="Schedule Time"
              value={dateTime}
              onChange={setDateTime}
              ampm={false} // 24-hour clock
              format="YYYY-MM-DD HH:mm:ss" // show seconds
              views={["year", "month", "day", "hours", "minutes", "seconds"]} // enable seconds picker
              slotProps={{
                textField: { size: "small", fullWidth: true },
              }}
            />
          </LocalizationProvider>

          <TextField
            label="Remark"
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            fullWidth
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
        >
          Set Discovery
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SetDiscoveryDialog;
