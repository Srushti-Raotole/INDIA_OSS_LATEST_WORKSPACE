import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Alert,
  Box,
} from "@mui/material";
import axiosClient from "@/api/axiosClient";
import { DELETE_TICKETING_ALARM } from "@/api/apis";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  alarmRow: {
    alarm: string;
    adapter: string;
    family?: string;
  } | null;
}

const TicketingDelDialog: React.FC<Props> = ({
  open,
  onClose,
  onSuccess,
  alarmRow,
}) => {
  if (!alarmRow) return null;

  const handleDelete = async () => {
    await axiosClient.delete(DELETE_TICKETING_ALARM, {
      params: {
        alarm: alarmRow.alarm,
        adapter: alarmRow.adapter,
      },
    });

    onSuccess();
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        Delete Alarm
      </DialogTitle>

      <DialogContent dividers>
        <Alert severity="warning" sx={{ mb: 2 }}>
          This action is irreversible.
        </Alert>

        <Box sx={{ fontSize: "0.9rem" }}>
          <Typography>
            Are you sure you want to delete this alarm rule?
          </Typography>

          <Typography sx={{ mt: 1 }}>
            <strong>Alarm Name:</strong> {alarmRow.alarm}
          </Typography>

          <Typography>
            <strong>Adapter:</strong> {alarmRow.adapter}
          </Typography>

          {alarmRow.family && (
            <Typography>
              <strong>Family:</strong> {alarmRow.family}
            </Typography>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          color="error"
          variant="contained"
          onClick={handleDelete}
        >
          Delete Alarm
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TicketingDelDialog;
