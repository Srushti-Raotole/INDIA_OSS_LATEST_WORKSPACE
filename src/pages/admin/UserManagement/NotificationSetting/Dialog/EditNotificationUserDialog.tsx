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
import { UPDATE_NOTIFICATION_USER } from "@/api/apis";
import { NotificationUserRow } from "../NotificationTable";

interface Props {
  open: boolean;
  user: NotificationUserRow | null;
  onClose: () => void;
  onSuccess: () => void;
}

const EditNotificationUserDialog: React.FC<Props> = ({
  open,
  user,
  onClose,
  onSuccess,
}) => {
  const [form, setForm] = useState({
    email: "",
    organization: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      setForm({
        email: user.email || "",
        organization: user.organization || "",
      });
      setErrors({});
    }
  }, [user]);

  if (!user) return null;

  const handleChange = (k: string, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    const e: Record<string, string> = {};

    if (!form.email) e.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(form.email))
      e.email = "Invalid email address";

    if (!form.organization) e.organization = "Organization is required";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      // Dynamic API URL resolution mapped with explicit string interpolation rules
      await axiosClient.put(
        `${UPDATE_NOTIFICATION_USER}/${user.id}`,
        {
          email: form.email,
          organization: form.organization,
        }
      );

      onSuccess();
      onClose();
    } catch (err) {
      console.error("Failed to update notification user:", err);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="xs" //  Compressed modal footprint width profile
      fullWidth
      sx={{
        "& .MuiPaper-root": { borderRadius: "10px", p: 0.5 }
      }}
    >
      <DialogTitle sx={{ fontSize: "0.9rem", fontWeight: 700, color: "#1e293b", pb: 1.5 }}>
        Edit Notification User
      </DialogTitle>

      <DialogContent dividers sx={{ borderColor: "#e2e8f0", py: 2 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr", gap: 2, pt: 0.5 }}>
          <TextField
            label="Username"
            value={user.userName}
            disabled
            fullWidth
            size="small"
            slotProps={{
              inputLabel: { sx: { fontSize: "0.75rem", fontWeight: 600 } },
              htmlInput: { sx: { fontSize: "0.75rem", fontWeight: 500, color: "#64748b" } }
            }}
          />

          <TextField
            label="Email"
            value={form.email}
            error={!!errors.email}
            helperText={errors.email}
            onChange={(e) => handleChange("email", e.target.value)}
            fullWidth
            size="small"
            slotProps={{
              inputLabel: { sx: { fontSize: "0.75rem", fontWeight: 600 } },
              htmlInput: { sx: { fontSize: "0.75rem", fontWeight: 500 } },
              formHelperText: { sx: { fontSize: "0.62rem", fontWeight: 600 } }
            }}
          />

          <TextField
            select
            label="Organization"
            value={form.organization}
            error={!!errors.organization}
            helperText={errors.organization}
            onChange={(e) => handleChange("organization", e.target.value)}
            fullWidth
            size="small"
            slotProps={{
              inputLabel: { sx: { fontSize: "0.75rem", fontWeight: 600 } },
              select: { sx: { fontSize: "0.75rem", fontWeight: 500 } },
              formHelperText: { sx: { fontSize: "0.62rem", fontWeight: 600 } }
            }}
          >
            <MenuItem value="VEGAYAN" sx={{ fontSize: "0.72rem", fontWeight: 600 }}>Vegayan</MenuItem>
            <MenuItem value="LIGHTSTORM" sx={{ fontSize: "0.72rem", fontWeight: 600 }}>Lightstorm</MenuItem>
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
            "&:hover": { backgroundColor: "#f1f5f9" }
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
            "&:hover": { backgroundColor: "#273752", boxShadow: "none" }
          }}
        >
          Update Settings
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditNotificationUserDialog;