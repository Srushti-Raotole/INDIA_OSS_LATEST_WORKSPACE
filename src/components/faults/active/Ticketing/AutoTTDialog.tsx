import React from "react";
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import AutoTTTable from "../faults/Dialog/AutoTT";

/* ---------- CSV DOWNLOAD ---------- */
const downloadCSV = (data: Record<string, any>[]) => {
  if (!data?.length) return;

  const headers = Object.keys(data[0]);

  const rows = data.map((row) =>
    headers
      .map((h) => `"${String(row[h] ?? "").replace(/"/g, '""')}"`)
      .join(",")
  );

  const csv = [headers.join(","), ...rows].join("\n");

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "AUTO_TT.csv";
  link.click();

  URL.revokeObjectURL(url);
};

interface Props {
  open: boolean;
  onClose: () => void;
  data: Record<string, any>[]; //  SAME DATA SOURCE
}

const AutoTTDialog: React.FC<Props> = ({ open, onClose, data }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
      <DialogActions
        sx={{
          px: 2,
          py: 1,
          justifyContent: "flex-end",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <Button
          size="small"
          variant="contained"
          onClick={() => downloadCSV(data)} //  SAME DATA
        >
          Download CSV
        </Button>

        <Button size="small" onClick={onClose}>
          Close
        </Button>
      </DialogActions>

      <DialogContent
        sx={{
          height: "75vh",
          p: 1,
          overflow: "hidden",
        }}
      >
        <AutoTTTable
          tableId="auto_tt_readonly"
          pageSize={25}
          data={data} //  SAME DATA
        />
      </DialogContent>
    </Dialog>
  );
};

export default AutoTTDialog;