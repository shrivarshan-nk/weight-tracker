import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#6C63FF",
      light: "#9B93FF",
      dark: "#4A43D4",
      contrastText: "#fff",
    },
    secondary: {
      main: "#00BFA6",
      light: "#4DD6C7",
      dark: "#008C79",
    },
    background: {
      default: "#F0F2FF",
      paper: "#FFFFFF",
    },
    success: { main: "#4CAF50" },
    error: { main: "#FF5252" },
    warning: { main: "#FF9800" },
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily: "'Inter', 'Roboto', sans-serif",
    h6: { fontWeight: 700 },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: "0 2px 12px rgba(108,99,255,0.10)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        containedPrimary: {
          background: "linear-gradient(135deg, #6C63FF 0%, #9B93FF 100%)",
          boxShadow: "0 4px 14px rgba(108,99,255,0.35)",
          "&:hover": {
            background: "linear-gradient(135deg, #4A43D4 0%, #6C63FF 100%)",
            boxShadow: "0 6px 20px rgba(108,99,255,0.45)",
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: "linear-gradient(135deg, #6C63FF 0%, #9B93FF 100%)",
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#6C63FF",
          },
        },
      },
    },
  },
});

export default theme;
