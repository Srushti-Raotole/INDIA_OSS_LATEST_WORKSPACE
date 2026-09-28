import React, { useState } from "react";
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
import axiosClient from "../../../../../api/axiosClient";
import { ADD_NOTIFICATION_USER } from "../../../../../api/apis";
import { logActivity } from "../../../../../utils/activityLogger";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddNotificationUserDialog: React.FC<Props> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const [form, setForm] = useState({
    userName: "",
    email: "",
    organization: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};

    if (!form.userName.trim()) e.userName = "Username is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(form.email))
      e.email = "Invalid email format";

    if (!form.organization)
      e.organization = "Organization selection is required";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      await axiosClient.post(ADD_NOTIFICATION_USER, form);

      // System audit sequence pipelines logged downstream on true Axios resolution callbacks
      logActivity({
        activity: `Added notification user | Username=${form.userName} | Email=${form.email} | Org=${form.organization}`,
        actionName: "ADD_NOTIFICATION_USER",
        module: "NOTIFICATIONS",
      });

      // Clear state structures
      setForm({ userName: "", email: "", organization: "" });
      setErrors({});

      onSuccess();
      onClose();
    } catch (err) {
      console.error("Failed to add notification user", err);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs" //  Swapped to compact high-density layout boundaries
      fullWidth
      sx={{
        "& .MuiPaper-root": { borderRadius: "10px", p: 0.5 },
      }}
    >
      <DialogTitle
        sx={{ fontSize: "0.9rem", fontWeight: 700, color: "#1e293b", pb: 1.5 }}
      >
        Add Notification User
      </DialogTitle>

      <DialogContent dividers sx={{ borderColor: "#e2e8f0", py: 2 }}>
        <Box sx={{ display: "grid", gap: 2, pt: 0.5 }}>
          <TextField
            label="Username"
            value={form.userName}
            error={!!errors.userName}
            helperText={errors.userName}
            onChange={(e) =>
              setForm((f) => ({ ...f, userName: e.target.value }))
            }
            fullWidth
            size="small"
            slotProps={{
              inputLabel: { sx: { fontSize: "0.75rem", fontWeight: 600 } },
              htmlInput: { sx: { fontSize: "0.75rem", fontWeight: 500 } },
              formHelperText: { sx: { fontSize: "0.62rem", fontWeight: 600 } },
            }}
          />

          <TextField
            label="Email"
            value={form.email}
            error={!!errors.email}
            helperText={errors.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            fullWidth
            size="small"
            slotProps={{
              inputLabel: { sx: { fontSize: "0.75rem", fontWeight: 600 } },
              htmlInput: { sx: { fontSize: "0.75rem", fontWeight: 500 } },
              formHelperText: { sx: { fontSize: "0.62rem", fontWeight: 600 } },
            }}
          />

          <TextField
            select
            label="Organization"
            value={form.organization}
            error={!!errors.organization}
            helperText={errors.organization}
            onChange={(e) =>
              setForm((f) => ({ ...f, organization: e.target.value }))
            }
            fullWidth
            size="small"
            slotProps={{
              inputLabel: { sx: { fontSize: "0.75rem", fontWeight: 600 } },
              select: { sx: { fontSize: "0.75rem", fontWeight: 500 } },
              formHelperText: { sx: { fontSize: "0.62rem", fontWeight: 600 } },
            }}
          >
            <MenuItem
              value="VEGAYAN"
              sx={{ fontSize: "0.72rem", fontWeight: 600 }}
            >
              VEGAYAN
            </MenuItem>
            <MenuItem
              value="LIGHTSTORM"
              sx={{ fontSize: "0.72rem", fontWeight: 600 }}
            >
              LIGHTSTORM
            </MenuItem>
          </TextField>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 1.5 }}>
        <Button
          onClick={onClose}
          sx={{
            fontSize: "0.7rem",
            fontWeight: 700,
            color: "#64748b",
            textTransform: "none",
            "&:hover": { backgroundColor: "#f1f5f9" },
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          sx={{
            backgroundColor: "#354a6b",
            color: "#ffffff",
            fontSize: "0.7rem",
            fontWeight: 700,
            textTransform: "none",
            borderRadius: "6px",
            boxShadow: "none",
            "&:hover": { backgroundColor: "#273752", boxShadow: "none" },
          }}
        >
          Add User
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddNotificationUserDialog;
