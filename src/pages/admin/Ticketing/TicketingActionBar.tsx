import React from "react";
import { Box, Button, Typography, Stack } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import UploadIcon from "@mui/icons-material/Upload";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ExcelDownloadButton from "../../../components/common/ExcelDownloadButton";

/* ================= TECH LIST ================= */
const TECHS = ["ALL", "CONC", "ADVA", "NFMT", "IFNR", "TLMR", "EPNM", "MCP"] as const;
export type TechType = typeof TECHS[number];

const getAdapterColor = (val: TechType) =>
  val === "MCP"  ? "#009688" :
  val === "NFMT" ? "#8283eb" :
  val === "EPNM" ? "#4CAF50" :
  val === "CONC" ? "#FF9800" :
  val === "ADVA" ? "#9C27B0" :
  val === "IFNR" ? "#3F51B5" :
  val === "TLMR" ? "#E91E63" :
  "#354a6b"; 

interface Props {
  selectedTech: TechType;
  onTechChange: (t: TechType) => void;
  onAdd: () => void;
  onBulkAdd: () => void;
  selectedRow: any | null;
  onEdit: () => void;
  onDelete: () => void;
  excelData: any[];
  excelColumns: string[];
  tableId: string;
}

const TicketingActionBar: React.FC<Props> = ({
  selectedTech,
  onTechChange,
  onAdd,
  onBulkAdd,
  selectedRow,
  onEdit,
  onDelete,
  excelData,
  excelColumns,
  tableId,
}) => {
  
  const actionBtnStyle = {
    height: 32,
    fontSize: "0.7rem",
    fontWeight: 700,
    textTransform: "none",
    borderRadius: "6px",
    px: 2,
    boxShadow: "none",
  };

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
      {/* ================= LEFT SECTION ================= */}
      <Stack direction="row" spacing={2} alignItems="center">
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box sx={{ width: 3.5, height: 32, borderRadius: "2px", bgcolor: "#354a6b" }} />
          <Box>
            <Typography sx={{ fontSize: "0.85rem", fontWeight: 700, color: "#1e293b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Ticketing
            </Typography>
            <Typography sx={{ fontSize: "0.68rem", color: "#64748b", fontWeight: 500 }}>
              Alarm rules & integrations
            </Typography>
          </Box>
        </Box>

        <Stack direction="row" spacing={0.5} alignItems="center">
          {TECHS.map((tech) => {
            const isActive = selectedTech === tech;
            const activeColor = getAdapterColor(tech);
            return (
              <Button
                key={tech}
                size="small"
                onClick={() => onTechChange(tech)}
                variant={isActive ? "contained" : "outlined"}
                disableElevation
                sx={{
                  ...actionBtnStyle,
                  minWidth: 50,
                  px: 1,
                  ...(isActive ? { bgcolor: activeColor, borderColor: activeColor, "&:hover": { bgcolor: activeColor } } : { borderColor: "#cbd5e1", color: "#475569", "&:hover": { bgcolor: "#f8fafc" } }),
                }}
              >
                {tech}
              </Button>
            );
          })}
        </Stack>
      </Stack>

      {/* ================= RIGHT SECTION ================= */}
      <Stack direction="row" spacing={1} alignItems="center">
        <Button startIcon={<AddIcon />} variant="contained" onClick={onAdd} sx={{ ...actionBtnStyle, bgcolor: "#354a6b" }}>
          Add Alarm
        </Button>
        <Button startIcon={<UploadIcon />} variant="outlined" onClick={onBulkAdd} sx={{ ...actionBtnStyle, borderColor: "#cbd5e1", color: "#475569" }}>
          Bulk Add
        </Button>
        <Button startIcon={<EditIcon />} variant="outlined" disabled={!selectedRow} onClick={onEdit} sx={{ ...actionBtnStyle, borderColor: "#cbd5e1", color: "#475569" }}>
          Edit
        </Button>
        <Button startIcon={<DeleteIcon />} variant="outlined" color="error" disabled={!selectedRow} onClick={onDelete} sx={{ ...actionBtnStyle }}>
          Delete
        </Button>
        <ExcelDownloadButton
          data={excelData}
          columnOrder={excelColumns}
          tableId={tableId}
          fileName="Ticketing_Alarms"
          disabled={!excelData?.length}
        />
      </Stack>
    </Box>
  );
};

export default TicketingActionBar;