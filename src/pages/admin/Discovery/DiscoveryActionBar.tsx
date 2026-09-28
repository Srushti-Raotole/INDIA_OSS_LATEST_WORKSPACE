import {
  Box,
  Button,
  Stack,
  Typography,
} from "@mui/material";

/* ================= TYPES ================= */
export type ViewType = "CURRENT" | "RECORDS";

interface Props {
  view: ViewType;
  onViewChange: (v: ViewType) => void;
  onSetDiscovery: () => void;
}

const DiscoveryActionBar: React.FC<Props> = ({
  view,
  onViewChange,
  onSetDiscovery,
}) => {
  return (
    <Box
      sx={{
        p: 2,
        bgcolor: "#f4f6f8",
        borderRadius: 2,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 2,
      }}
    >
      {/* ================= LEFT ================= */}
      <Stack direction="row" spacing={2} alignItems="center">
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 4,
              height: 36,
              borderRadius: 2,
              bgcolor: "primary.main",
            }}
          />
          <Box>
            <Typography fontWeight={700}>
              Discovery Setting
            </Typography>
            <Typography
              fontSize="0.75rem"
              color="text.secondary"
            >
              Configure & track discovery executions
            </Typography>
          </Box>
        </Box>

        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            variant={view === "CURRENT" ? "contained" : "outlined"}
            onClick={() => onViewChange("CURRENT")}
          >
            Discovery Setting
          </Button>
          <Button
            size="small"
            variant={view === "RECORDS" ? "contained" : "outlined"}
            onClick={() => onViewChange("RECORDS")}
          >
            Discovery Logs
          </Button>
        </Stack>
      </Stack>

      {/* ================= RIGHT ================= */}
      <Button
        variant="contained"
        onClick={onSetDiscovery}
      >
        Set Discovery
      </Button>
    </Box>
  );
};

export default DiscoveryActionBar;
