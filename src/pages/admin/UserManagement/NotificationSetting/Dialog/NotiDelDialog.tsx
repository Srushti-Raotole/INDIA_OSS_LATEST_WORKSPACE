import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Alert,
  Box,
  Avatar,
  Stack,
} from "@mui/material";
import lightstormLogo from "../../../../assets/lightstormlogo.png";
import vegayanLogo from "../../../../assets/logo_vega.png";
import { NotificationUserRow } from "../NotificationTable";
import axiosClient from "@/api/axiosClient";
import { NOTIFICATION_USER_BY_ID } from "@/api/apis";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: NotificationUserRow | null;
}

const NotifDelDialog: React.FC<Props> = ({
  open,
  onClose,
  onSuccess,
  user,
}) => {
  if (!user) return null;

  const orgLogo =
    user.organization === "VEGAYAN"
      ? vegayanLogo
      : user.organization === "LIGHTSTORM"
      ? lightstormLogo
      : undefined;

  const handleDelete = async () => {
    await axiosClient.delete(NOTIFICATION_USER_BY_ID(user.id));
    onSuccess();
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        Delete Notification User
      </DialogTitle>

      <DialogContent dividers>
        <Alert severity="warning" sx={{ mb: 2 }}>
          This action is irreversible.
        </Alert>

        <Box sx={{ fontSize: "0.9rem" }}>
          <Typography>
            Are you sure you want to delete this notification recipient?
          </Typography>

          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 2 }}>
            {orgLogo && <Avatar src={orgLogo} sx={{ width: 28, height: 28 }} />}
            <Box>
              <Typography>
                <strong>Username:</strong> {user.userName}
              </Typography>
              <Typography>
                <strong>Email:</strong> {user.email}
              </Typography>
              <Typography>
                <strong>Organization:</strong> {user.organization}
              </Typography>
            </Box>
          </Stack>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button color="error" variant="contained" onClick={handleDelete}>
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NotifDelDialog;
