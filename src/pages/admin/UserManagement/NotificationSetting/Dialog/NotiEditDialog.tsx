import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  MenuItem,
  Avatar,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import lightstormLogo from "../../../../assets/lightstormlogo.png";
import vegayanLogo from "../../../../assets/logo_vega.png";
import axiosClient from "@/api/axiosClient";
import { NOTIFICATION_USER_BY_ID } from "@/api/apis";
import { NotificationUserRow } from "../NotificationTable";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: NotificationUserRow | null;
}

const NotifEditDialog: React.FC<Props> = ({
  open,
  onClose,
  onSuccess,
  user,
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

  const orgLogo =
    form.organization === "VEGAYAN"
      ? vegayanLogo
      : form.organization === "LIGHTSTORM"
      ? lightstormLogo
      : undefined;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.email) e.email = "Required";
    if (!form.organization) e.organization = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    await axiosClient.put(NOTIFICATION_USER_BY_ID(user.id), form);
    onSuccess();
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        Edit Notification User
      </DialogTitle>

      <DialogContent dividers>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 2,
          }}
        >
          {/* ---------- READ ONLY ---------- */}
          <TextField
            label="Username"
            value={user.userName}
            disabled
          />

          <TextField
            label="Email"
            value={form.email}
            error={!!errors.email}
            helperText={errors.email}
            onChange={(e) =>
              setForm((f) => ({ ...f, email: e.target.value }))
            }
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
          >
            <MenuItem value="VEGAYAN">VEGAYAN</MenuItem>
            <MenuItem value="LIGHTSTORM">LIGHTSTORM</MenuItem>
          </TextField>

          {/* ---------- LOGO PREVIEW ---------- */}
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{ mt: 1 }}
          >
            {orgLogo && <Avatar src={orgLogo} />}
            <Typography fontSize="0.8rem" color="text.secondary">
              Organization Logo
            </Typography>
          </Stack>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit}>
          Update
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NotifEditDialog;
