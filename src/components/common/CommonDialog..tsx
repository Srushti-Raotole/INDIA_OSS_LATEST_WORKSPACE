import { Dialog, DialogTitle, DialogContent, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import React, { ReactNode } from "react";

interface CommonDialogProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: ReactNode;
  maxWidth?: "xs" | "sm" | "md" | "lg" | "xl";
  fullWidth?: boolean;
}

const CommonDialog: React.FC<CommonDialogProps> = ({
  open,
  onClose,
  title,
  children,
  maxWidth = "md",
  fullWidth = true,
}) => {
  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth={maxWidth} 
      fullWidth={fullWidth}
      sx={{
        "& .MuiDialog-paper": {
          borderRadius: 3,
          boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)"
        }
      }}
    >
      {title && (
        <DialogTitle 
          sx={{ 
            m: 0, 
            px: 2.5, 
            py: 1.75, 
            fontSize: "0.85rem", 
            fontWeight: 700, 
            color: "#1e293b", 
            textTransform: "uppercase", 
            letterSpacing: "0.03em",
            borderBottom: "1px solid #f1f5f9",
            position: "relative"
          }}
        >
          {title}
          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#94a3b8",
              width: 32,
              height: 32,
              "&:hover": { color: "#475569", backgroundColor: "#f1f5f9" }
            }}
          >
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </DialogTitle>
      )}
      <DialogContent sx={{ p: 1.5, overflowY: 'auto' }}>
        {children}
      </DialogContent>
    </Dialog>
  );
};

export default CommonDialog;