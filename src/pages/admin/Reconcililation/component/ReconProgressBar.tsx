
import React from "react";
import {
  Backdrop,
  Paper,
  Typography,
  Box,
  Button,
} from "@mui/material";
import LinearProgress from "@mui/material/LinearProgress";

interface Props {
  open: boolean;
  adapter: string;
  running: boolean;
  progress: number;
  elapsedSeconds: number;
  duration: number | null;
  onClose: () => void;
}

const formatTime = (seconds: number) => {
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  return `${mm}:${ss}`;
};

const ReconProgressBar: React.FC<Props> = ({
  open,
  adapter,
  running,
  progress,
  elapsedSeconds,
  duration,
  onClose,
}) => {
  return (
    <Backdrop
      open={open}
      sx={{ zIndex: (theme) => theme.zIndex.modal + 1, backdropFilter: "blur(2px)" }}
    >
      <Paper sx={{ width: 400, p: 2.5, borderRadius: 3, border: "1px solid #e2e8f0", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
        <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: "#1e293b", textTransform: "uppercase", letterSpacing: "0.04em", mb: 0.5 }}>
          Reconciliation Status
        </Typography>

       

        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{ height: 6, borderRadius: 3, backgroundColor: "#f1f5f9", "& .MuiLinearProgress-bar": { backgroundColor: "#1e293b" } }}
        />

        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1.2 }}>
          <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: "#475569" }}>
            {progress}% completed
          </Typography>

          <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: "#475569", fontFamily: "monospace" }}>
            FAILED: {formatTime(elapsedSeconds)}
          </Typography>
        </Box>

        {duration !== null && (
          <Typography
            sx={{
              fontSize: "0.68rem",
              fontWeight: 700,
              color: "#16a34a",
              mt: 1.5,
              display: "flex",
              alignItems: "center",
              gap: 0.5
            }}
          >
            ✔ Total sequence execution time: <b style={{ fontFamily: "monospace" }}>{formatTime(duration)}</b>
          </Typography>
        )}

        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2.5 }}>
          <Button
            variant="contained"
            onClick={onClose}
            disabled={running}
            sx={{
              height: 28,
              fontSize: "0.68rem",
              fontWeight: 700,
              textTransform: "none",
              backgroundColor: "#1e293b",
              boxShadow: "none",
              "&:hover": { backgroundColor: "#0f172a", boxShadow: "none" }
            }}
          >
            Close
          </Button>
        </Box>
      </Paper>
    </Backdrop>
  );
};

export default ReconProgressBar;