/**
 * The Ledger — shared design tokens for every EduAI page.
 * Single source of truth; pages import from here instead of redeclaring constants.
 */
import { createTheme, responsiveFontSizes } from "@mui/material/styles";

export const COLORS = {
  INK: "#141B33",        // primary text / dark surfaces
  INK_SOFT: "#232C4D",
  PARCHMENT: "#FBF8F1",  // app background
  PAPER: "#FFFFFF",
  GOLD: "#B8892B",       // accent / rules
  GOLD_LIGHT: "#E2B857",
  TEAL: "#1F6F73",       // student / success
  AMBER: "#C9772E",      // teacher / warning
  PLUM: "#5B4B8A",       // admin
  CRIMSON: "#8C2F39",    // danger
};

export const FONTS = {
  display: "'Fraunces', Georgia, serif",
  mono: "'JetBrains Mono', 'Consolas', monospace",
};

export const GRADIENT_LEDGER = "linear-gradient(135deg, #141B33 0%, #2A2140 55%, #5B4B8A 100%)";

/** Shared MUI theme so every page inherits identical spacing/type/components. */
const baseTheme = createTheme({
  palette: {
    mode: "light",
    primary: { main: COLORS.INK, contrastText: "#FFFFFF" },
    secondary: { main: COLORS.GOLD },
    success: { main: COLORS.TEAL },
    warning: { main: COLORS.AMBER },
    error: { main: COLORS.CRIMSON },
    info: { main: COLORS.PLUM },
    background: { default: COLORS.PARCHMENT, paper: COLORS.PAPER },
    text: { primary: COLORS.INK, secondary: "rgba(20,27,51,0.62)" },
    divider: "rgba(20,27,51,0.10)",
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
    h4: { fontFamily: FONTS.display, fontWeight: 700, letterSpacing: "-0.3px" },
    h5: { fontFamily: FONTS.display, fontWeight: 700, letterSpacing: "-0.2px" },
    h6: { fontFamily: FONTS.display, fontWeight: 700 },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 700, fontSize: "0.85rem" },
    button: { textTransform: "none", fontWeight: 700 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: COLORS.PARCHMENT },
        "*::selection": { background: "rgba(184,137,43,0.25)" },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 10, paddingLeft: 18, paddingRight: 18, paddingTop: 8, paddingBottom: 8 },
        sizeSmall: { paddingLeft: 12, paddingRight: 12 },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: "1px solid rgba(20,27,51,0.08)",
          boxShadow: "0 1px 2px rgba(20,27,51,0.04), 0 8px 24px -12px rgba(20,27,51,0.12)",
          backgroundImage: "none",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: { borderRadius: 16 },
        outlined: { border: "1px solid rgba(20,27,51,0.08)" },
      },
    },
    MuiTextField: { defaultProps: { size: "small" } },
    MuiTableCell: {
      styleOverrides: {
        head: {
          backgroundColor: "rgba(20,27,51,0.04)",
          color: COLORS.INK,
          fontWeight: 700,
          fontSize: "0.78rem",
          letterSpacing: "0.4px",
          textTransform: "uppercase",
          whiteSpace: "nowrap",
        },
        root: { borderBottom: "1px solid rgba(20,27,51,0.08)", paddingY: 12 },
      },
    },
    MuiTableRow: {
      styleOverrides: { root: { "&:last-child td, &:last-child th": { borderBottom: 0 } } },
    },
    MuiDialog: {
      styleOverrides: { paper: { borderRadius: 20 } },
    },
    MuiChip: {
      styleOverrides: { root: { fontWeight: 700, borderRadius: 8 } },
    },
    MuiAlert: {
      styleOverrides: { root: { borderRadius: 12 }, standard: { borderRadius: 12 } },
    },
    MuiLinearProgress: {
      styleOverrides: { root: { borderRadius: 6, height: 6 }, bar: { borderRadius: 6 } },
    },
    MuiTooltip: {
      styleOverrides: { tooltip: { borderRadius: 8, fontSize: "0.75rem", fontWeight: 600 } },
    },
  },
});

export const eduaiTheme = responsiveFontSizes(baseTheme);

/** Injects the Ledger font links once per app lifetime. */
let fontsInjected = false;
export function injectLedgerFonts() {
  if (fontsInjected) return;
  fontsInjected = true;
  const link = document.createElement("link");
  link.href =
    "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300..900&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@300..800&display=swap";
  link.rel = "stylesheet";
  document.head.appendChild(link);
}

/** Formats a date as e.g. "24 Aug 2026, 10:05 AM". */
export function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Formats seconds as mm:ss or hh:mm:ss. */
export function formatClock(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}
