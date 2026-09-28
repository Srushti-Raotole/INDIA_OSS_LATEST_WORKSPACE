import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
  Alert,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

import bgImage from "../assets/loginBg.png";
import lightstormLogo from "../assets/LightStormFullNameLogo.png";

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSendLink = () => {
    setError("");
    setSuccess("");

    if (!email) {
      setError("Email address is required");
      return;
    }

    // API call will go here
    setSuccess(
      "If the email exists in our system, a reset link has been sent."
    );
  };

  return (
    <Box
      sx={{
        width: "100vw",
        height: "100vh",
        backgroundImage: `url(${bgImage})`,
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Paper
        elevation={10}
        sx={{
          width: 380,
          maxWidth: "90%",
          p: 4,
          borderRadius: 3,
          backgroundColor: "#ffffff",
        }}
      >
        {/* Logo */}
        <Box sx={{ textAlign: "center", mb: 2 }}>
          <Box
            component="img"
            src={lightstormLogo}
            alt="Lightstorm Logo"
            sx={{ height: 36 }}
          />
        </Box>

        {/* Title */}
        <Typography
          variant="h6"
          fontWeight={700}
          textAlign="center"
          gutterBottom
        >
          Forgot Password
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          textAlign="center"
          mb={3}
        >
          Enter your registered email address to receive a reset link
        </Typography>

        {/* Form */}
        <Stack spacing={2}>
          <TextField
            label="Email Address"
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Button
            fullWidth
            size="large"
            sx={{
              bgcolor: "#a0033b",
              color: "#fff",
              "&:hover": { bgcolor: "#7b002c" },
            }}
            onClick={handleSendLink}
          >
            Send Reset Link
          </Button>

          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}
        </Stack>

        {/* Back to Login */}
        <Box sx={{ textAlign: "center", mt: 3 }}>
          <Button size="small" onClick={() => navigate("/login")}>
            ← Back to Login
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default ForgotPasswordPage;
