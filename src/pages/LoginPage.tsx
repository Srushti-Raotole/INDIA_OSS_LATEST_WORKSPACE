import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Stack,
  Divider,
  useTheme,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

import bgImage from "../assets/loginBg.png";
import lightstormLogo from "../assets/LightStormFullNameLogo.png";
import axiosClient from "@/api/axiosClient";
import { LOGIN } from "@/api/apis";

const LoginPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showForceDialog, setShowForceDialog] = useState(false);
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});

  useEffect(() => {
    document.title = "INDIA OSS";
    // Security Issue Fix - Clear any stale token on login page load.
    sessionStorage.removeItem("LS_AUTH_TOKEN");
    // Security Issue Fix - Remove Remember Me credential storage (feature removed).
    // Cleans up LS_LOGIN_CRED that may exist in existing users' browsers from the old implementation.
    localStorage.removeItem("LS_LOGIN_CRED");
  }, []);

  const handleLogin = async (force = false) => {
    const newErrors: { username?: string; password?: string } = {};
    if (!username) newErrors.username = "Username required";
    if (!password) newErrors.password = "Password required";
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    try {
      const res = await axiosClient.post(LOGIN, { username, password, force });

      if (res.data.sessionActive) {
        setShowForceDialog(true);
        return;
      }

      // Security Issue Fix - Store auth token in sessionStorage (cleared on tab close).
      sessionStorage.setItem("LS_AUTH_TOKEN", res.data.token);
      navigate("/", { replace: true });
    } catch {
      setErrors({ password: "Invalid username or password" });
    }
  };

  return (
    <Box sx={{ width: "100vw", height: "100vh", display: "flex", overflow: "hidden" }}>
      {/* ================= LEFT BRAND PANEL ================= */}
      {!isMobile && (
        <Box
          sx={{
            width: "70%",
            height: "100%",
            backgroundImage: `url(${bgImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            position: "relative",
            display: "flex",
            alignItems: "center",
            pl: "6vw",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(90deg, rgba(0,0,0,0.55), rgba(0,0,0,0.15))",
            }}
          />
          <Box sx={{ position: "relative", zIndex: 1 }}>
            <Typography component="div" sx={{ color: "#fff", fontWeight: 700, lineHeight: 1.15 }}>
              <Box sx={{ fontSize: "2vw", display: "flex" }}>
                <Box component="span" sx={{ color: "#ff2f92", mr: 3 }}>"</Box>
                Simplifying
              </Box>
              <Box sx={{ fontSize: "4vw", pl: "1.8vw" }}>
                NextGen Networks
                <Box component="span" sx={{ color: "#ff2f92", ml: 1 }}>"</Box>
              </Box>
            </Typography>
          </Box>
        </Box>
      )}

      {/* ================= RIGHT LOGIN PANEL ================= */}
      <Box
        sx={{
          width: isMobile ? "100%" : "30%",
          height: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#f9f9f9",
        }}
      >
        <Paper elevation={6} sx={{ width: "100%", maxWidth: 420, mx: 2, p: 4, borderRadius: 3 }}>
          <Box sx={{ textAlign: "center", mb: 2 }}>
            <Box component="img" src={lightstormLogo} sx={{ height: 36 }} />
          </Box>

          {/* ===== SSO LOGIN ===== */}
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <Typography variant="h6" fontWeight={600}>Welcome Back!</Typography>
            <Button
              fullWidth
              sx={{ mt: 2, backgroundColor: "#ef7926", color: "#fff", "&:hover": { backgroundColor: "#ed931eff" } }}
              onClick={() => { window.location.href = "https://lightstormtelecom.awsapps.com/start/#/?tab=applications"; }}
            >
              🌐 LTC User Login (SSO)
            </Button>
          </Box>

          <Divider sx={{ my: 3 }}>OR</Divider>

          {/* ===== LOGIN FORM ===== */}
          <Box component="form" onSubmit={(e) => { e.preventDefault(); handleLogin(false); }}>
            <Stack spacing={2}>
              <TextField
                label="Username"
                fullWidth
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                error={!!errors.username}
                helperText={errors.username}
              />
              <TextField
                label="Password"
                type="password"
                fullWidth
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={!!errors.password}
                helperText={errors.password}
              />
              <Button
                type="submit"
                fullWidth
                size="large"
                variant="contained"
                sx={{ backgroundColor: "#b71d4c", "&:hover": { backgroundColor: "#b71d4c" } }}
              >
                🔐 LOGIN
              </Button>
            </Stack>
          </Box>
        </Paper>
      </Box>

      {/* ================= FORCE LOGIN DIALOG ================= */}
      <Dialog open={showForceDialog}>
        <DialogTitle>Session Already Active</DialogTitle>
        <DialogContent>
          <Typography>
            You are already logged in from another device.
            Do you want to continue and terminate the previous session?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowForceDialog(false)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => { setShowForceDialog(false); handleLogin(true); }}
          >
            Continue
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LoginPage;
