import React from "react";
import { Box, Button, Typography, Stack, IconButton } from "@mui/material";
import { Menu as MenuIcon, MenuOpen as MenuOpenIcon } from "@mui/icons-material"; //  SYNCED ICON TRACKS
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ExcelDownloadButton from "../../../../components/common/ExcelDownloadButton";

interface Props {
  onAdd: () => void;
  onEdit: () => void;
  onDelete: () => void;
  hasSelection: boolean;          
  excelData: any[];
  excelColumns: string[];
  tableId: string;
  /*  NEW PARAMS GAUGE */
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

const NotificationSettingActionBar: React.FC<Props> = ({
  onAdd,
  onEdit,
  onDelete,
  hasSelection,
  excelData,
  excelColumns,
  tableId,
  onToggleSidebar,
  isSidebarOpen,
}) => {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        p: 1.5,
        bgcolor: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "10px",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.02)",
      }}
    >
      {/* ---------- LEFT PANEL TITLE BLOCK (WITH SIDEBAR TRIGGER ENFORCED) ---------- */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
        {/*  NEW: SINGLE ICON RECOVERY ANCHOR TO HANDLE SIDE NAVIGATION OPEN LOGIC */}
        {onToggleSidebar && (
          <IconButton 
            onClick={onToggleSidebar} 
            size="small" 
            sx={{ 
              color: "#354a6b", 
              backgroundColor: "#f8fafc",
              border: "1px solid #e2e8f0",
              p: "5px",
              "&:hover": { backgroundColor: "#e2e8f0" } 
            }}
          >
            {isSidebarOpen ? <MenuOpenIcon sx={{ fontSize: 16 }} /> : <MenuIcon sx={{ fontSize: 16 }} />}
          </IconButton>
        )}

        <Box
          sx={{
            width: 3.5,
            height: 32,
            borderRadius: "2px",
            bgcolor: "#354a6b",
          }}
        />
        <Box sx={{ minWidth: 0 }}>
          <Typography 
            sx={{ 
              fontSize: "0.85rem", 
              fontWeight: 700, 
              color: "#1e293b", 
              textTransform: "uppercase", 
              letterSpacing: "0.05em",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis"
            }}
          >
            Notification Settings
          </Typography>
     
        </Box>
      </Box>

      {/* ---------- RIGHT ACTION PIPELINES TRACK ---------- */}
      <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
        <Button 
          startIcon={<AddIcon sx={{ "& .MuiSvgIcon-root": { fontSize: "0.9rem" } }} />} 
          variant="contained" 
          onClick={onAdd}
          sx={{
            backgroundColor: "#354a6b",
            color: "#ffffff",
            height: 32,
            px: 2,
            fontSize: "0.72rem",
            fontWeight: 700,
            textTransform: "none",
            borderRadius: "6px",
            boxShadow: "none",
            "&:hover": { backgroundColor: "#273752", boxShadow: "none" }
          }}
        >
          Add
        </Button>

        {hasSelection && (
          <>
            <Button
              startIcon={<EditIcon />}
              variant="outlined"
              onClick={onEdit}
              sx={{
                height: 32,
                px: 2,
                fontSize: "0.72rem",
                fontWeight: 600,
                borderColor: "#cbd5e1",
                color: "#475569",
                textTransform: "none",
                borderRadius: "6px",
                "&:hover": { backgroundColor: "#f8fafc", borderColor: "#94a3b8" }
              }}
            >
              Edit
            </Button>

            <Button
              startIcon={<DeleteIcon />}
              variant="outlined"
              color="error"
              onClick={onDelete}
              sx={{
                height: 32,
                px: 2,
                fontSize: "0.72rem",
                fontWeight: 600,
                textTransform: "none",
                borderRadius: "6px",
                "&:hover": { backgroundColor: "#fef2f2" }
              }}
            >
              Delete
            </Button>
          </>
        )}

        <ExcelDownloadButton
          data={excelData}
          columnOrder={excelColumns}
          tableId={tableId}
          fileName="Notification_Users"
          disabled={!excelData || excelData.length === 0}
        />
      </Stack>
    </Box>
  );
};

export default NotificationSettingActionBar;