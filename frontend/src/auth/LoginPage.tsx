import { GoogleLogin } from "@react-oauth/google";
import { Box, Paper, Typography } from "@mui/material";
import { useAuth } from "./AuthContext";

export default function LoginPage() {
  const { login } = useAuth();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 6,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 3,
          maxWidth: 380,
          width: "100%",
        }}
      >
        <Typography variant="h4" color="primary" sx={{ fontWeight: 700 }}>
          Weight Tracker
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center" }}>
          Sign in with Google to start tracking your weight.
        </Typography>
        <GoogleLogin
          onSuccess={(credential) => {
            if (credential.credential) {
              login(credential.credential);
            }
          }}
          onError={() => console.error("Google login failed")}
          useOneTap
        />
      </Paper>
    </Box>
  );
}
