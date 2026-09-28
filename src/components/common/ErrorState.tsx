// components/common/ErrorState.tsx
import React from "react";
import { Box, Typography, Button } from "@mui/material";
import ReplayIcon from "@mui/icons-material/Replay";

type ErrorStateProps = {
  title?: string;
  message: string;
  severity?: "error" | "info";
  onRetry?: () => void;
};


const ErrorState: React.FC<ErrorStateProps> = ({
  title,
  message,
  severity = "info",
  onRetry,
}) => {
  const isError = severity === "error";

  return (
    <Box
      sx={{
        height: "100%",
        minHeight: "20vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(180deg,#fafafa,#f3f4f6)",
      }}
    >
      <Box
        sx={{
          px: 3,
          py: 2,
          borderRadius: "12px",
          backgroundColor: "#fff",
          border: "1px solid rgba(0,0,0,0.12)",
          boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
          textAlign: "center",
          minWidth: 280,
        }}
      >
        {title && (
          <Typography
            sx={{
              fontSize: "0.75rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: isError ? "#b71c1c" : "#6b7280",
              mb: 0.5,
            }}
          >
            {title}
          </Typography>
        )}

        <Typography
          sx={{
            fontSize: "0.95rem",
            fontWeight: 600,
            color: isError ? "#b71c1c" : "#111827",
          }}
        >
          {message}
        </Typography>

        {onRetry && (
          <Button
            size="small"
            startIcon={<ReplayIcon />}
            variant="outlined"
            sx={{ mt: 1.5 }}
            onClick={onRetry}
          >
            Retry
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default ErrorState;
