import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  Box,
  Divider,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import logo from "../../assets/lscircle.png";

interface Props {
  open: boolean;
  onClose: () => void;
}

const VersionDialog: React.FC<Props> = ({ open, onClose }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: "#ffffff",
          color: "#111827",
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontWeight: 700,
        }}
      >
        INDIA OSS Version
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
          {/* <Box component="img" src={logo} sx={{ height: 42 }} /> */}
          {/* <Typography variant="h6" fontWeight={700}>
            LightStorm NOC
          </Typography> */}
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Details */}
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
          <Box>
            <Typography fontWeight={600}>Version</Typography>
            <Typography>2.1.2</Typography>
          </Box>

          <Box>
            <Typography fontWeight={600}>Build Date</Typography>
            <Typography>21-5-2026</Typography>
          </Box>

          <Box>
            <Typography fontWeight={600}>Environment</Typography>
            <Typography>Production</Typography>
          </Box>

          <Box>
            <Typography fontWeight={600}>Support</Typography>
            <Typography color="primary">
              siddhesh_patil@vegayan.com
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Features */}
        {/* <Typography fontWeight={700} sx={{ mb: 1 }}>
          Features
        </Typography>
        <Box component="ul" sx={{ pl: 3, m: 0.2 }}>
          <li>Dashboard </li>
          <li>Alarm Count - NMS/OSS on NOC View</li>
          <li></li>
          <li>SI List addition in utility</li> 
        </Box> */}

        <Divider sx={{ my: 3 }} />

        {/* Footer */}
        <Typography
          variant="body2"
          color="text.secondary"
          align="center"
        >
          © 2026 Vegayan. All rights reserved.
        </Typography>
      </DialogContent>
    </Dialog>
  );
};

export default VersionDialog;
