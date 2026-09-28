// VersionDialog.tsx
import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Divider,
  Link
} from "@mui/material";

// Adjust path as needed for your project structure
import logoVega from "../../assets/logo_vega.png"; 

interface VersionDialogProps {
  open: boolean;
  onClose: () => void;
}

const VersionDialog: React.FC<VersionDialogProps> = ({ open, onClose }) => {
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }
      }}
    >
      <DialogTitle sx={{ fontWeight: 700, color: "#1e293b", pb: 1, fontSize: "1.1rem" }}>
        System Information
      </DialogTitle>
      <Divider />
      
      <DialogContent sx={{ py: 3 }}>
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <Box component="img" src={logoVega} sx={{ height: 26, opacity: 0.9, mb: 1 }} alt="Vegayan Logo" />
          
          <Box sx={{ textAlign: "center", width: "100%" }}>
            <Typography variant="h5" sx={{ fontWeight: 800, color: "#334155" }}>
              Version 3.0.0
            </Typography>

            {/* Support Contact Box */}
            <Box 
              sx={{ 
                mt: 3, 
                p: 1.5, 
                bgcolor: "#f8fafc", 
                borderRadius: 2, 
                border: "1px solid #e2e8f0" 
              }}
            >
              <Typography variant="caption" sx={{ color: "#475569", fontWeight: 600, display: "block", textTransform: "uppercase", letterSpacing: "0.05em", mb: 0.5 }}>
                Contact for support
              </Typography>
              <Link 
                href="mailto:siddhesh_patil@vegayan.com" 
                underline="hover"
                sx={{ color: "#0f766e", fontWeight: 700, fontSize: "0.85rem", wordBreak: "break-all" }}
              >
                siddhesh_patil@vegayan.com
              </Link>
            </Box>

            <Typography variant="caption" sx={{ color: "#94a3b8", display: "block", mt: 3, fontWeight: 500 }}>
              MANAGED BY VEGAYAN © 2026
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      <Divider />
      <DialogActions sx={{ px: 3, py: 1.5 }}>
        <Button 
          onClick={onClose} 
          variant="contained" 
          disableElevation
          sx={{ bgcolor: "#0f766e", "&:hover": { bgcolor: "#115e59" }, textTransform: "none", fontWeight: 600 }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default VersionDialog;