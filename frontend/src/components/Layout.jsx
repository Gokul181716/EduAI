import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  Alert,
  alpha,
  AppBar,
  Avatar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  Fade,
  IconButton,
  InputAdornment,
  LinearProgress,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Slide,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  AutoAwesome,
  Assignment,
  BarChart,
  CalendarMonth,
  Close,
  Groups,
  Home,
  Logout,
  MenuBook,
  Menu as MenuIcon,
  NotificationsNone,
  Person,
  Psychology,
  School,
  SupervisorAccount,
  TrendingUp,
  Videocam,
  Visibility,
  VisibilityOff,
  VpnKey,
} from '@mui/icons-material';

// ---------------------------------------------------------------
// DESIGN SYSTEM — "The Ledger" (shared across EduAI). Ivory paper,
// ink navy, brass gold, teal + amber + crimson accents.
// ---------------------------------------------------------------
import { COLORS, FONTS, GRADIENT_LEDGER, eduaiTheme } from '../theme';

const { INK, GOLD, TEAL, AMBER, CRIMSON } = COLORS;

/** Context so dashboard pages can drive the sidebar's active item. */
const ShellContext = createContext({ section: null, setSection: () => {} });
export const useShell = () => useContext(ShellContext);

function useLedgerFonts() {
  React.useEffect(() => {
    if (document.getElementById('ledger-fonts')) return;
    const link = document.createElement('link');
    link.id = 'ledger-fonts';
    link.rel = 'stylesheet';
    link.href =
      "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700;9..144,800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600;700&display=swap";
    document.head.appendChild(link);
  }, []);
}

const SlideUpTransition = React.forwardRef(function SlideUpTransition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

// Quick client-side strength read-out — purely visual, real validation stays server-side
function getPasswordStrength(pw) {
  if (!pw) return { score: 0, label: '', color: '#E5E7EB' };
  let score = 0;
  if (pw.length >= 5) score += 1;
  if (pw.length >= 8) score += 1;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score += 1;
  if (/[0-9]/.test(pw)) score += 1;
  if (/[^A-Za-z0-9]/.test(pw)) score += 1;

  const levels = [
    { label: 'Too short', color: CRIMSON },
    { label: 'Weak', color: AMBER },
    { label: 'Fair', color: GOLD },
    { label: 'Good', color: TEAL },
    { label: 'Strong', color: '#0F5A50' }
  ];
  const idx = Math.min(score, levels.length - 1);
  return { score: (idx + 1) * 20, ...levels[idx] };
}

// ---------------------------------------------------------------
// Role-based navigation model (grouped, professional IA)
// ---------------------------------------------------------------
export function navForRole(role) {
  if (role === 'Admin') {
    return [
      { group: null, items: [{ key: 'dashboard', label: 'Dashboard', icon: 'dashboard' }] },
      { group: 'Management', items: [
        { key: 'students', label: 'Students', icon: 'students' },
        { key: 'teachers', label: 'Teachers', icon: 'teachers' },
        { key: 'classes', label: 'Class Assignments', icon: 'classes' },
      ]},
      { group: 'Assessments', items: [
        { key: 'placement', label: 'Placement Assessments', icon: 'assessment' },
      ]},
      { group: 'Analytics', items: [
        { key: 'analytics-assessment', label: 'Assessment Analytics', icon: 'chart' },
        { key: 'analytics-placement', label: 'Placement Analytics', icon: 'chart' },
      ]},
      { group: 'System', items: [
        { key: 'notifications', label: 'Notifications', icon: 'bell' },
        { key: 'profile', label: 'Profile', icon: 'person' },
      ]},
    ];
  }
  if (role === 'Teacher') {
    return [
      { group: null, items: [{ key: 'dashboard', label: 'Dashboard', icon: 'dashboard' }] },
      { group: 'Academic', items: [
        { key: 'my-students', label: 'My Students', icon: 'students' },
        { key: 'internal', label: 'Internal Assessments', icon: 'assessment' },
        { key: 'results', label: 'Assessment Results', icon: 'chart' },
        { key: 'attendance', label: 'Attendance', icon: 'calendar' },
      ]},
      { group: 'Monitoring', items: [
        { key: 'alerts', label: 'Attendance Alerts', icon: 'bell' },
        { key: 'performance', label: 'Student Performance', icon: 'trend' },
        { key: 'video-review', label: 'Video Proctoring', icon: 'video' },
      ]},
      { group: 'Profile', items: [
        { key: 'profile', label: 'My Profile', icon: 'person' },
      ]},
    ];
  }
  return [
    { group: null, items: [{ key: 'dashboard', label: 'Dashboard', icon: 'dashboard' }] },
    { group: 'Learning', items: [
      { key: 'internal', label: 'Internal Assessments', icon: 'book' },
      { key: 'placement', label: 'Placement Assessments', icon: 'assessment' },
      { key: 'results', label: 'My Results', icon: 'chart' },
      { key: 'attendance', label: 'Attendance', icon: 'calendar' },
    ]},
    { group: 'AI & Career', items: [
      { key: 'career', label: 'Career Recommendation', icon: 'sparkle' },
      { key: 'resume', label: 'Resume Analyzer', icon: 'skills' },
      { key: 'prediction', label: 'Placement Prediction', icon: 'trend' },
      { key: 'skills', label: 'Skill Analysis', icon: 'skills' },
    ]},
    { group: 'Account', items: [
      { key: 'profile', label: 'Profile', icon: 'person' },
      { key: 'notifications', label: 'Notifications', icon: 'bell' },
    ]},
  ];
}

const DRAWER_WIDTH = 252;

function NavIcon({ name }) {
  const map = {
    dashboard: <Home fontSize="small" />,
    students: <Groups fontSize="small" />,
    teachers: <SupervisorAccount fontSize="small" />,
    classes: <School fontSize="small" />,
    assessment: <Assignment fontSize="small" />,
    chart: <BarChart fontSize="small" />,
    bell: <NotificationsNone fontSize="small" />,
    person: <Person fontSize="small" />,
    calendar: <CalendarMonth fontSize="small" />,
    trend: <TrendingUp fontSize="small" />,
    book: <MenuBook fontSize="small" />,
    sparkle: <AutoAwesome fontSize="small" />,
    skills: <Psychology fontSize="small" />,
    video: <Videocam fontSize="small" />,
  };
  return map[name] || <Home fontSize="small" />;
}

function SidebarContent({ role, section, onNavigate, username }) {
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#FFFFFF', borderRight: `1px solid ${alpha(INK, 0.08)}` }}>
      <Box sx={{ px: 2.5, pt: 2.5, pb: 2, display: 'flex', alignItems: 'center', gap: 1.4 }}>
        <Box sx={{
          width: 38, height: 38, borderRadius: '10px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: `radial-gradient(circle at 35% 30%, ${COLORS.GOLD_LIGHT}, ${GOLD} 70%)`,
          boxShadow: `0 6px 16px -4px ${alpha(GOLD, 0.55)}`
        }}>
          <School sx={{ color: INK, fontSize: 22 }} />
        </Box>
        <Box>
          <Typography sx={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: '1.05rem', color: INK, lineHeight: 1.1 }}>
            EduAI
          </Typography>
          <Typography variant="caption" sx={{ color: alpha(INK, 0.55), fontWeight: 600, letterSpacing: '0.6px', textTransform: 'uppercase', fontSize: '0.62rem' }}>
            {role} Portal
          </Typography>
        </Box>
      </Box>

      <List component="nav" disablePadding sx={{ flex: 1, overflowY: 'auto', px: 1.5, pb: 2 }}>
        {navForRole(role).map((grp, gi) => (
          <React.Fragment key={gi}>
            {grp.group && (
              <Typography variant="caption" sx={{ display: 'block', px: 1.6, pt: 2.2, pb: 0.8, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', fontSize: '0.64rem', color: alpha(INK, 0.45) }}>
                {grp.group}
              </Typography>
            )}
            {grp.items.map((item) => {
              const active = section === item.key;
              return (
                <ListItemButton
                  key={item.key}
                  onClick={() => onNavigate(item.key)}
                  sx={{
                    borderRadius: 2,
                    mb: 0.5,
                    py: 1,
                    position: 'relative',
                    bgcolor: active ? alpha(GOLD, 0.12) : 'transparent',
                    '&:hover': { bgcolor: alpha(INK, 0.05) },
                    transition: 'background 0.15s ease',
                  }}
                >
                  {active && (
                    <Box sx={{ position: 'absolute', left: -6, top: 8, bottom: 8, width: 3.5, borderRadius: 3, bgcolor: GOLD }} />
                  )}
                  <ListItemIcon sx={{ minWidth: 34, color: active ? GOLD : alpha(INK, 0.65) }}>
                    <NavIcon name={item.icon} />
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{ fontSize: '0.88rem', fontWeight: active ? 800 : 600, color: active ? INK : alpha(INK, 0.75) }}
                  />
                </ListItemButton>
              );
            })}
          </React.Fragment>
        ))}
      </List>

      <Box sx={{ px: 2.5, py: 2, borderTop: `1px solid ${alpha(INK, 0.08)}` }}>
        <Typography variant="caption" sx={{ color: alpha(INK, 0.5), fontWeight: 600 }}>
          Signed in as {username || 'user'}
        </Typography>
      </Box>
    </Box>
  );
}

function Layout({ user, onLogout, children }) {
  useLedgerFonts();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const location = useLocation();
  const isTestRoute = /^\/student\/tests\/\d+\/take/.test(location.pathname);

  // Which sidebar section is active — owned here so the shell and pages stay in sync.
  const defaultSection = user?.role === 'Admin' ? 'dashboard'
    : user?.role === 'Teacher' ? 'dashboard' : 'dashboard';
  const [section, setSection] = useState(defaultSection);
  const shellValue = useMemo(() => ({ section, setSection }), [section]);

  const navigate = useNavigate();
  const open = Boolean(anchorEl);

  // When a (different) user logs in, reset the sidebar tab and land on their
  // role home page instead of the previously logged-in user's last page.
  const prevUserId = useRef(user?.id ?? null);
  useEffect(() => {
    if (!user) {
      prevUserId.current = null;
      return;
    }
    if (prevUserId.current === null || prevUserId.current !== user.id) {
      setSection('dashboard');
      navigate('/', { replace: true });
    }
    prevUserId.current = user.id;
  }, [user, navigate]);

  // Password Modal State
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleClick = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleGoHome = () => navigate('/');
  const handleProfileClick = () => {
    handleClose();
    navigate('/profile');
  };

  const handleOpenPasswordModal = () => {
    handleClose();
    setMessage(null);
    setNewPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirm(false);
    setPasswordOpen(true);
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match!' });
      return;
    }
    if (newPassword.length < 5) {
      setMessage({ type: 'error', text: 'Password must be at least 5 characters long.' });
      return;
    }

    setLoading(true);
    try {
      const response = await axios.put(
        'http://localhost:8080/api/auth/change-password',
        { newPassword: newPassword },
        { withCredentials: true }
      );

      setMessage({ type: 'success', text: response.data.message });

      setTimeout(() => {
        setPasswordOpen(false);
        setMessage(null);
      }, 2000);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to change password.' });
    }
    setLoading(false);
  };

  if (!user) return <>{children}</>;

  const strength = getPasswordStrength(newPassword);
  const initials = user?.username ? user.username.charAt(0).toUpperCase() : 'U';

  const activeLabel = (() => {
    for (const grp of navForRole(user.role)) {
      const hit = grp.items.find((i) => i.key === section);
      if (hit) return hit.label;
    }
    return 'Dashboard';
  })();

  const handleNavigate = (key) => {
    setSection(key);
    setMobileOpen(false);

    const onProfileRoute = window.location.pathname === '/profile';
    const onHomeRoute = window.location.pathname === '/';

    if (key === 'profile') {
      if (!onProfileRoute) navigate('/profile');
    } else {
      // All other sections (dashboard, internal, placement, etc.) render
      // inside the home-route component — make sure we are there.
      if (!onHomeRoute) navigate('/');
    }

    // Role-specific standalone routes
    if (user?.role === 'Teacher' && key === 'attendance') {
      navigate('/teacher/attendance');
    }
  };

  return (
    <ShellContext.Provider value={shellValue}>
      {isTestRoute ? (
        <>{children}</>
      ) : (
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: COLORS.PARCHMENT }}>
        {/* ---------- Sidebar ---------- */}
        {isMobile ? (
          <Drawer
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            ModalProps={{ keepMounted: true }}
            PaperProps={{ sx: { width: DRAWER_WIDTH } }}
          >
            <SidebarContent role={user.role} section={section} onNavigate={handleNavigate} username={user.username} />
          </Drawer>
        ) : (
          <Box component="nav" sx={{ width: DRAWER_WIDTH, flexShrink: 0, position: 'sticky', top: 0, height: '100vh' }}>
            <SidebarContent role={user.role} section={section} onNavigate={handleNavigate} username={user.username} />
          </Box>
        )}

        {/* ---------- Main column ---------- */}
        <Box sx={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <AppBar
            position="sticky"
            elevation={0}
            sx={{
              background: alpha('#ffffff', 0.82),
              color: INK,
              backdropFilter: 'blur(16px) saturate(180%)',
              borderBottom: `1px solid ${alpha(INK, 0.08)}`
            }}
          >
            <Toolbar sx={{ gap: 0.5 }}>
              {isMobile && (
                <IconButton onClick={() => setMobileOpen(true)} sx={{ mr: 0.5, color: INK }}>
                  <Home />
                </IconButton>
              )}
              {!isMobile && (
                <Tooltip title="Home">
                  <IconButton onClick={handleGoHome} sx={{ mr: 0.5, color: INK, transition: 'all 0.2s ease', '&:hover': { bgcolor: alpha(INK, 0.08) } }}>
                    <Home fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}

              <Typography variant="h6" noWrap sx={{ fontWeight: 800, fontFamily: FONTS.display, letterSpacing: '-0.2px', color: INK }}>
                {activeLabel}
              </Typography>

              <Box sx={{ flex: 1 }} />

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: alpha(INK, 0.72), display: { xs: 'none', sm: 'block' } }}>
                  {user?.username || 'User'}
                </Typography>
                <Avatar
                  onClick={handleClick}
                  sx={{
                    width: 36, height: 36,
                    bgcolor: INK,
                    fontFamily: FONTS.display,
                    cursor: 'pointer',
                    fontWeight: 700,
                    boxShadow: open ? `0 0 0 3px ${alpha(GOLD, 0.35)}` : `0 4px 10px ${alpha(INK, 0.3)}`,
                    transition: 'all 0.2s ease',
                    '&:hover': { transform: 'scale(1.06)' }
                  }}
                >
                  {initials}
                </Avatar>
              </Box>

              <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                TransitionComponent={Fade}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                PaperProps={{
                  elevation: 0,
                  sx: {
                    mt: 1.5,
                    minWidth: 220,
                    borderRadius: 2.5,
                    border: `1px solid ${alpha(INK, 0.08)}`,
                    boxShadow: `0 16px 40px -12px ${alpha(INK, 0.35)}`,
                    overflow: 'hidden',
                    '& .MuiMenuItem-root': { py: 1.2, px: 2, fontWeight: 600, fontSize: '0.9rem', gap: 1 }
                  }
                }}
              >
                <Box sx={{ px: 2, py: 1.5, background: alpha(GOLD, 0.06) }}>
                  <Typography variant="body2" fontWeight={700} noWrap>{user?.username || 'User'}</Typography>
                  <Typography variant="caption" color="text.secondary">{user?.role || ''} account</Typography>
                </Box>
                <Divider />
                <MenuItem onClick={handleProfileClick}><Person fontSize="small" /> My Profile</MenuItem>
                <MenuItem onClick={handleOpenPasswordModal}><VpnKey fontSize="small" /> Change Password</MenuItem>
                <Divider />
                <MenuItem onClick={() => { handleClose(); onLogout(); }} sx={{ color: CRIMSON, '&:hover': { bgcolor: alpha(CRIMSON, 0.08) } }}>
                  <Logout fontSize="small" /> Logout
                </MenuItem>
              </Menu>
            </Toolbar>
          </AppBar>

          <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 3.5 }, maxWidth: 1440, width: '100%', mx: 'auto' }}>
            {children}
          </Box>
        </Box>

        {/* PASSWORD CHANGE DIALOG */}
        <Dialog
          open={passwordOpen}
          onClose={() => setPasswordOpen(false)}
          TransitionComponent={SlideUpTransition}
          PaperProps={{ sx: { borderRadius: 3, minWidth: { xs: 300, sm: 400 }, overflow: 'hidden' } }}
        >
          <DialogTitle
            sx={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              fontFamily: FONTS.display, fontWeight: 700, color: '#fff',
              background: GRADIENT_LEDGER, borderBottom: `3px solid ${GOLD}`
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><VpnKey /> Change Password</Box>
            <IconButton size="small" onClick={() => setPasswordOpen(false)} sx={{ color: '#fff' }}>
              <Close fontSize="small" />
            </IconButton>
          </DialogTitle>

          <DialogContent sx={{ pt: 3, px: 3 }}>
            <Fade in={Boolean(message)} unmountOnExit>
              <Box sx={{ mb: message ? 2 : 0 }}>
                {message && (
                  <Alert severity={message.type} variant="filled" sx={{ borderRadius: 2 }}>{message.text}</Alert>
                )}
              </Box>
            </Fade>

            <TextField
              fullWidth
              label="New Password"
              type={showPassword ? 'text' : 'password'}
              sx={{ mt: 1, mb: 1 }}
              variant="outlined"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowPassword((s) => !s)} edge="end">
                      {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />

            {newPassword && (
              <Box sx={{ mb: 2, px: 0.2 }}>
                <LinearProgress
                  variant="determinate"
                  value={strength.score}
                  sx={{
                    height: 6, borderRadius: 4,
                    bgcolor: alpha(INK, 0.08),
                    '& .MuiLinearProgress-bar': { borderRadius: 4, bgcolor: strength.color }
                  }}
                />
                <Typography variant="caption" sx={{ color: strength.color, fontWeight: 700 }}>{strength.label}</Typography>
              </Box>
            )}

            <TextField
              fullWidth
              label="Confirm New Password"
              type={showConfirm ? 'text' : 'password'}
              sx={{ mb: 1 }}
              variant="outlined"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={confirmPassword.length > 0 && confirmPassword !== newPassword}
              helperText={confirmPassword.length > 0 && confirmPassword !== newPassword ? "Passwords don't match" : ' '}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowConfirm((s) => !s)} edge="end">
                      {showConfirm ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </DialogContent>

          <DialogActions sx={{ pb: 2.5, px: 3 }}>
            <Button onClick={() => setPasswordOpen(false)} sx={{ fontWeight: 700, color: alpha(INK, 0.6) }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleChangePassword}
              disabled={loading}
              sx={{ px: 3, bgcolor: INK, '&:hover': { bgcolor: '#232C4D' } }}
            >
              {loading ? 'Saving...' : 'Update Password'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
      )}
    </ShellContext.Provider>
  );
}

export default Layout;
