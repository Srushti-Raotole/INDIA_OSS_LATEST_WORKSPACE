import React from "react";
import {
  Box,
  Button,
  Typography,
  Stack,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";

interface ReconActionBarProps {
  adapter: string;
  adapters: string[];
  running: boolean;
  onAdapterChange: (val: string) => void;
  onRun: () => void;
}

const ReconActionBar: React.FC<ReconActionBarProps> = ({
  adapter,
  adapters,
  running,
  onAdapterChange,
  onRun,
}) => {
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  const handleRunClick = () => {
    setConfirmOpen(true);
  };

  const handleConfirm = () => {
    setConfirmOpen(false);
    onRun();
  };

  const handleCancel = () => {
    setConfirmOpen(false);
  };

  return (
    <>
      <Box
        sx={{
          p: 2,
          borderRadius: 2,
          bgcolor: "#f4f6f8",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 4,
              height: 36,
              borderRadius: 2,
              bgcolor: "primary.main",
            }}
          />
          <Box>
            <Typography fontWeight={700}>
              Reconciliation Settings
            </Typography>
            <Typography fontSize="0.75rem" color="text.secondary">
              Run and monitor reconciliation process
            </Typography>
          </Box>
        </Box>

        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            select
            size="small"
            label="Adapter"
            value={adapter}
            onChange={(e) => onAdapterChange(e.target.value)}
            sx={{ width: 160 }}
            disabled={running}
          >
            {adapters.map((a) => (
              <MenuItem key={a} value={a}>
                {a}
              </MenuItem>
            ))}
          </TextField>

          <Button
            variant="contained"
            onClick={handleRunClick}
            disabled={running}
          >
            {running ? "Running..." : "Run Reconciliation"}
          </Button>
        </Stack>
      </Box>

      {/* Confirmation Dialog */}
      <Dialog open={confirmOpen} onClose={handleCancel}>
        <DialogTitle>Confirm Reconciliation</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to run reconciliation?
            <br />
            This process may take time and affect existing data.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            variant="contained"
            color="primary"
            autoFocus
          >
            Yes, Run
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ReconActionBar;
