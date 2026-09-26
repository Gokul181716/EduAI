import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  InputAdornment,
  IconButton,
  Stack,
  alpha,
  GlobalStyles
} from '@mui/material';
import {
  LockOutlined,
  Person,
  Badge,
  Login as LoginIcon,
  Visibility,
  VisibilityOff,
  AdminPanelSettings,
  School,
  Face,
  MenuBook,
  Hub,
  Psychology,
  SmartToy,
  AutoAwesome
} from '@mui/icons-material';
import axios from 'axios';

axios.defaults.withCredentials = true;

// ---------------------------------------------------------------
// DESIGN SYSTEM — "The Ledger" (shared with the rest of EduAI).
// Ivory paper, ink navy, brass gold, teal + amber + plum accents.
// ---------------------------------------------------------------
const INK = "#141B33";
const INK_SOFT = "#232C4D";
const PARCHMENT = "#FBF8F1";
const GOLD = "#B8892B";
const GOLD_LIGHT = "#E2B857";
const TEAL = "#1F6F73";
const AMBER = "#C9772E";
const PLUM = "#5B4B8A";

const FONT_DISPLAY = "'Fraunces', Georgia, 'Times New Roman', serif";
const FONT_MONO = "'JetBrains Mono', 'Roboto Mono', 'Courier New', monospace";

const GRADIENT_LEDGER = `linear-gradient(150deg, ${INK} 0%, #1B234A 55%, ${PLUM} 140%)`;

function useLedgerFonts() {
  React.useEffect(() => {
    if (document.getElementById("ledger-fonts")) return;
    const link = document.createElement("link");
    link.id = "ledger-fonts";
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=JetBrains+Mono:wght@400;600;700&display=swap";
    document.head.appendChild(link);
  }, []);
}

const keyframesStyles = {
  "@keyframes sealPulse": {
    "0%, 100%": { boxShadow: `0 0 0 0 ${alpha(GOLD_LIGHT, 0.5)}` },
    "50%": { boxShadow: `0 0 0 14px ${alpha(GOLD_LIGHT, 0)}` },
  },
  "@keyframes networkDrift": {
    "0%": { backgroundPosition: "0 0" },
    "100%": { backgroundPosition: "168px 168px" },
  },
  "@keyframes orbPulse": {
    "0%": { transform: "translate(0,0) scale(1)", opacity: 0.45 },
    "50%": { transform: "translate(16px,-12px) scale(1.14)", opacity: 0.75 },
    "100%": { transform: "translate(0,0) scale(1)", opacity: 0.45 },
  },
  "@keyframes glyphFloat": {
    "0%, 100%": { transform: "translateY(0) rotate(var(--rot, 0deg))" },
    "50%": { transform: "translateY(-20px) rotate(calc(var(--rot, 0deg) + 4deg))" },
  },
  "@keyframes scanSweep": {
    "0%": { top: "-4%", opacity: 0 },
    "6%": { opacity: 0.6 },
    "50%": { opacity: 0.6 },
    "94%": { opacity: 0 },
    "100%": { top: "104%", opacity: 0 },
  },
  "@keyframes fadeUp": {
    from: { opacity: 0, transform: "translateY(14px)" },
    to: { opacity: 1, transform: "translateY(0)" },
  },
  "@media (prefers-reduced-motion: reduce)": {
    "[data-motion]": { animation: "none !important" },
  },
};

// Animated AI-in-education backdrop for the dark branding panel —
// neural-network drift, breathing orbs, a scan sweep, and floating
// academic + AI glyphs (book, cap, brain, robot, hub).
function LedgerBackdrop() {
  const glyphs = [
    { Icon: MenuBook, top: "8%", left: "68%", size: 130, rot: -10, dur: 9 },
    { Icon: School, top: "62%", left: "6%", size: 150, rot: 8, dur: 11 },
    { Icon: Psychology, top: "4%", left: "10%", size: 100, rot: 6, dur: 8 },
    { Icon: SmartToy, top: "78%", left: "62%", size: 110, rot: -6, dur: 7.5 },
    { Icon: Hub, top: "40%", left: "78%", size: 90, rot: 14, dur: 10 },
  ];
  const orbs = [
    { color: TEAL, top: "-8%", left: "-6%", size: 320, dur: 9 },
    { color: GOLD, top: "6%", left: "70%", size: 300, dur: 11 },
    { color: PLUM, top: "62%", left: "20%", size: 340, dur: 13 },
  ];

  return (
    <Box sx={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
      {orbs.map((o, i) => (
        <Box
          key={`orb-${i}`}
          data-motion
          sx={{
            position: "absolute", top: o.top, left: o.left, width: o.size, height: o.size,
            borderRadius: "50%", filter: "blur(10px)",
            background: `radial-gradient(circle, ${alpha(o.color, 0.32)}, transparent 70%)`,
            animation: `orbPulse ${o.dur}s ease-in-out infinite`,
          }}
        />
      ))}

      <Box
        data-motion
        sx={{
          position: "absolute", inset: -168,
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140' viewBox='0 0 140 140'%3E%3Cg fill='none' stroke='%23E2B857' stroke-width='1' opacity='0.18'%3E%3Cline x1='20' y1='30' x2='70' y2='15'/%3E%3Cline x1='20' y1='30' x2='70' y2='70'/%3E%3Cline x1='20' y1='30' x2='70' y2='125'/%3E%3Cline x1='20' y1='90' x2='70' y2='15'/%3E%3Cline x1='20' y1='90' x2='70' y2='70'/%3E%3Cline x1='20' y1='90' x2='70' y2='125'/%3E%3Cline x1='70' y1='15' x2='120' y2='55'/%3E%3Cline x1='70' y1='70' x2='120' y2='55'/%3E%3Cline x1='70' y1='125' x2='120' y2='55'/%3E%3C/g%3E%3Cg fill='%23E2B857' opacity='0.3'%3E%3Ccircle cx='20' cy='30' r='2.6'/%3E%3Ccircle cx='20' cy='90' r='2.6'/%3E%3Ccircle cx='70' cy='15' r='2.4'/%3E%3Ccircle cx='70' cy='70' r='2.4'/%3E%3Ccircle cx='70' cy='125' r='2.4'/%3E%3Ccircle cx='120' cy='55' r='3.2'/%3E%3C/g%3E%3C/svg%3E\")",
          backgroundRepeat: "repeat",
          animation: "networkDrift 30s linear infinite",
        }}
      />

      <Box
        data-motion
        sx={{
          position: "absolute", left: 0, right: 0, height: 2,
          background: `linear-gradient(90deg, transparent, ${alpha(GOLD_LIGHT, 0.7)}, transparent)`,
          animation: "scanSweep 9s linear infinite",
        }}
      />

      {glyphs.map(({ Icon, top, left, size, rot, dur }, i) => (
        <Icon
          key={`glyph-${i}`}
          data-motion
          sx={{
            position: "absolute", top, left, fontSize: size, color: "#fff", opacity: 0.06,
            "--rot": `${rot}deg`,
            animation: `glyphFloat ${dur}s ease-in-out infinite`,
            animationDelay: `${i * 0.6}s`,
          }}
        />
      ))}
    </Box>
  );
}

const ROLES = [
  { value: "Admin", label: "System Administrator", Icon: AdminPanelSettings, accent: PLUM },
  { value: "Teacher", label: "Faculty / Teacher", Icon: School, accent: AMBER },
  { value: "Student", label: "Student", Icon: Face, accent: TEAL }
];

function LoginPage({ onLoginSuccess }) {
  useLedgerFonts();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Admin');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const activeRole = ROLES.find(r => r.value === role) || ROLES[0];

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:8080/api/auth/login', {
        username, password, role
      });

      if (response.data.status === 'success') {
        onLoginSuccess(response.data);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Server offline. Cannot verify login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: PARCHMENT,
        backgroundImage: [
          `radial-gradient(900px 460px at 8% -8%, ${alpha(TEAL, 0.06)}, transparent)`,
          `radial-gradient(800px 420px at 100% 100%, ${alpha(GOLD, 0.07)}, transparent)`
        ].join(', '),
        p: { xs: 2, md: 4 }
      }}
    >
      <GlobalStyles styles={keyframesStyles} />

      <Paper
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 920,
          borderRadius: 3,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          border: `1px solid ${alpha(INK, 0.08)}`,
          boxShadow: `0 32px 64px -28px ${alpha(INK, 0.45)}`,
          animation: 'fadeUp 0.6s ease both'
        }}
      >
        {/* LEFT — branding panel with the animated AI/education backdrop */}
        <Box
          sx={{
            position: 'relative',
            flex: { xs: 'none', md: '0 0 44%' },
            minHeight: { xs: 220, md: 'auto' },
            background: GRADIENT_LEDGER,
            color: PARCHMENT,
            p: { xs: 4, md: 5 },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            overflow: 'hidden',
            borderBottom: { xs: `4px solid ${GOLD}`, md: 'none' },
            borderRight: { xs: 'none', md: `4px solid ${GOLD}` }
          }}
        >
          <LedgerBackdrop />

          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Box
              data-motion
              sx={{
                width: 56, height: 56, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: `radial-gradient(circle at 35% 30%, ${GOLD_LIGHT}, ${GOLD} 70%)`,
                animation: 'sealPulse 2.6s ease-in-out infinite',
                mb: 3
              }}
            >
              <LockOutlined sx={{ fontSize: 28, color: INK }} />
            </Box>

            <Typography variant="h4" sx={{ fontFamily: FONT_DISPLAY, fontWeight: 700, letterSpacing: '-0.3px' }}>
              EduAI Portal
            </Typography>
            <Typography sx={{ mt: 1, opacity: 0.75, maxWidth: 320 }}>
              A connected registrar system for departments, faculty, and students — built on live academic data.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} alignItems="center" sx={{ position: 'relative', zIndex: 1, opacity: 0.7 }}>
            <AutoAwesome sx={{ fontSize: 16, color: GOLD_LIGHT }} />
            <Typography variant="caption" sx={{ letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700 }}>
              Secure · AI-assisted · Always in session
            </Typography>
          </Stack>
        </Box>

        {/* RIGHT — credential form */}
        <Box sx={{ flex: 1, p: { xs: 4, md: 5 }, bgcolor: '#fff' }}>
          <Typography variant="h5" sx={{ fontFamily: FONT_DISPLAY, fontWeight: 700, color: INK }}>
            Sign in
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 3 }}>
            Choose your credential type to continue
          </Typography>

          {error && (
            <Alert severity="error" variant="filled" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          {/* Role selector — segmented cards instead of a dropdown */}
          <Stack direction="row" spacing={1.5} sx={{ mb: 3.5 }}>
            {ROLES.map(({ value, label, Icon, accent }) => {
              const selected = role === value;
              return (
                <Box
                  key={value}
                  onClick={() => setRole(value)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setRole(value); }}
                  sx={{
                    flex: 1,
                    cursor: 'pointer',
                    borderRadius: 2,
                    p: 1.5,
                    textAlign: 'center',
                    border: `1.5px solid ${selected ? accent : alpha(INK, 0.12)}`,
                    bgcolor: selected ? alpha(accent, 0.08) : 'transparent',
                    transition: 'all 0.2s ease',
                    '&:hover': { borderColor: accent, bgcolor: alpha(accent, 0.06) }
                  }}
                >
                  <Icon sx={{ color: selected ? accent : alpha(INK, 0.45), fontSize: 26, transition: 'color 0.2s ease' }} />
                  <Typography
                    variant="caption"
                    sx={{
                      display: 'block', mt: 0.5, fontWeight: 700,
                      color: selected ? accent : alpha(INK, 0.55),
                      fontSize: '0.7rem'
                    }}
                  >
                    {value}
                  </Typography>
                </Box>
              );
            })}
          </Stack>

          <form onSubmit={handleLogin}>
            <Stack spacing={2.5}>
              <TextField
                fullWidth
                label="Username or ID"
                variant="outlined"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Badge sx={{ color: alpha(INK, 0.4) }} />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                variant="outlined"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person sx={{ color: alpha(INK, 0.4) }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setShowPassword((s) => !s)} edge="end">
                        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                startIcon={<LoginIcon />}
                sx={{
                  py: 1.6,
                  fontSize: '1rem',
                  fontWeight: 700,
                  borderRadius: 2,
                  textTransform: 'none',
                  bgcolor: activeRole.accent,
                  boxShadow: `0 10px 24px -8px ${alpha(activeRole.accent, 0.55)}`,
                  transition: 'all 0.25s ease',
                  '&:hover': { bgcolor: alpha(activeRole.accent, 0.85), transform: 'translateY(-2px)' },
                  '&.Mui-disabled': { bgcolor: alpha(INK, 0.15) }
                }}
              >
                {loading ? 'Verifying...' : `Sign in as ${activeRole.value}`}
              </Button>
            </Stack>
          </form>

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 3, textAlign: 'center' }}>
            Access is logged and restricted to registered institution accounts.
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}

export default LoginPage;