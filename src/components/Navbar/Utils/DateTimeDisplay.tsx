
import { useEffect, useState } from "react";
import { Typography, Box } from "@mui/material";

const formatDateTime = (date: Date) => {
  const pad = (n: number) => String(n).padStart(2, "0");

  return `${pad(date.getDate())} ${
    date.toLocaleString("en-US", { month: "short" })
  } ${date.getFullYear()} | ${pad(date.getHours())}:${pad(
    date.getMinutes()
  )}:${pad(date.getSeconds())}`;
};

const DateTimeDisplay = () => {
  const [time, setTime] = useState(() => formatDateTime(new Date()));

  useEffect(() => {
    const intervalId = setInterval(() => {
      setTime(formatDateTime(new Date()));
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
      }}
    >
      <Typography
        sx={{
          fontSize: { xs: "0.7rem", md: "0.8rem" },
          fontWeight: 500,
          color: "#94a3b8",
          whiteSpace: "nowrap",
          letterSpacing: "0.03em",
        }}
      >
        {time}
      </Typography>
    </Box>
  );
};

export default DateTimeDisplay;
