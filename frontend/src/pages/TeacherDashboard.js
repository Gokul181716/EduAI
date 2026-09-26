import React, { useState, useEffect } from "react";
import {
  Typography, Card, CardContent, Grid, Button, TextField,
  Tabs, Tab, Box, Table, TableBody, TableCell,
  TableHead, TableRow, Dialog, DialogContent, DialogTitle, Stack,
  Paper, IconButton, Avatar, Chip, CircularProgress, Divider, List, ListItem, ListItemText,
  Fade, Slide, alpha, Grow, Alert // 💡 RESTORED GROW HERE
} from '@mui/material';
import {
  Dashboard as DashboardIcon, School, People, Assessment, Quiz,
  MenuBook, Hub, WarningAmberRounded, CheckCircle, Visibility, Close, Mail, Phone,
  Search, Class as ClassIcon, AutoAwesome, ArrowForward, Videocam
} from '@mui/icons-material';
import {
  PieChart, Pie, Cell, Tooltip as RechartsTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LabelList, Legend
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import TeacherTestResults from '../components/TeacherTestResults';
import InternalAssessmentManager from '../components/InternalAssessmentManager';
import TeacherAttendance from '../components/TeacherAttendance';
import { useShell } from '../components/Layout';

axios.defaults.withCredentials = true;

// ---------------------------------------------------------------
// DESIGN SYSTEM — "The Ledger"
// ---------------------------------------------------------------
const INK = '#141B33';
const PARCHMENT = '#FBF8F1';
const GOLD = '#B8892B';
const GOLD_LIGHT = '#E2B857';
const TEAL = '#1F6F73';
const CRIMSON = '#8C2F39';
const PLUM = '#5B4B8A';

const FONT_DISPLAY = "'Fraunces', Georgia, 'Times New Roman', serif";
const FONT_MONO = "'JetBrains Mono', 'Roboto Mono', 'Courier New', monospace";

const GRADIENT_LEDGER = `linear-gradient(135deg, ${INK} 0%, #0D1226 100%)`;

function useLedgerFonts() {
  useEffect(() => {
    if (document.getElementById('ledger-fonts')) return;
    const link = document.createElement('link');
    link.id = 'ledger-fonts';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=JetBrains+Mono:wght@400;600;700&display=swap';
    document.head.appendChild(link);
  }, []);
}

const SlideUpTransition = React.forwardRef(function SlideUpTransition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

function LedgerKeyframes() {
  return (
    <style>{`
      @keyframes sealPulse {
        0%, 100% { box-shadow: 0 0 0 0 ${alpha(GOLD_LIGHT, 0.5)}; }
        50% { box-shadow: 0 0 0 10px ${alpha(GOLD_LIGHT, 0)}; }
      }
      @keyframes networkDrift {
        0% { background-position: 0 0; }
        100% { background-position: 168px 168px; }
      }
      @keyframes orbPulse {
        0%, 100% { transform: scale(1); opacity: 0.55; }
        50% { transform: scale(1.18); opacity: 0.9; }
      }
      @keyframes glyphFloat {
        0%, 100% { transform: translateY(0) rotate(var(--rot, 0deg)); }
        50% { transform: translateY(-22px) rotate(calc(var(--rot, 0deg) + 4deg)); }
      }
      @media (prefers-reduced-motion: reduce) {
        [data-motion] { animation: none !important; }
      }
    `}</style>
  );
}

function LedgerBackdrop() {
  const glyphs = [
    { Icon: MenuBook, top: '6%', left: '80%', size: 220, rot: -10, dur: 9 },
    { Icon: School, top: '54%', left: '-2%', size: 260, rot: 8, dur: 11 },
    { Icon: Hub, top: '1%', left: '5%', size: 150, rot: 6, dur: 8 },
    { Icon: AutoAwesome, top: '78%', left: '90%', size: 170, rot: -6, dur: 7.5 },
    { Icon: MenuBook, top: '88%', left: '16%', size: 140, rot: 14, dur: 10 },
    { Icon: School, top: '22%', left: '48%', size: 130, rot: -4, dur: 9.5 }
  ];
  const orbs = [
    { color: TEAL, top: '-6%', left: '6%', size: 460, dur: 9 },
    { color: GOLD, top: '2%', left: '82%', size: 420, dur: 11 },
    { color: PLUM, top: '70%', left: '38%', size: 480, dur: 13 }
  ];

  return (
    <Box sx={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      {orbs.map((o, i) => (
        <Box key={`orb-${i}`} data-motion sx={{ position: 'absolute', top: o.top, left: o.left, width: o.size, height: o.size, borderRadius: '50%', filter: 'blur(10px)', background: `radial-gradient(circle, ${alpha(o.color, 0.16)}, transparent 70%)`, animation: `orbPulse ${o.dur}s ease-in-out infinite` }} />
      ))}
      <Box data-motion sx={{ position: 'absolute', inset: -168, backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='84' height='84' viewBox='0 0 84 84'%3E%3Cg fill='none' stroke='%23141B33' stroke-width='1' opacity='0.07'%3E%3Ccircle cx='14' cy='14' r='2.2'/%3E%3Ccircle cx='70' cy='70' r='2.2'/%3E%3Ccircle cx='70' cy='14' r='1.4'/%3E%3Cline x1='14' y1='14' x2='70' y2='70'/%3E%3Cline x1='14' y1='14' x2='70' y2='14'/%3E%3C/g%3E%3C/svg%3E\")", backgroundRepeat: 'repeat', animation: 'networkDrift 34s linear infinite' }} />
      {glyphs.map(({ Icon, top, left, size, rot, dur }, i) => (
        <Icon key={`glyph-${i}`} data-motion sx={{ position: 'absolute', top, left, fontSize: size, color: INK, opacity: 0.045, '--rot': `${rot}deg`, animation: `glyphFloat ${dur}s ease-in-out infinite`, animationDelay: `${i * 0.6}s` }} />
      ))}
    </Box>
  );
}

function LedgerTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0];
  return (
    <Box sx={{ bgcolor: INK, color: PARCHMENT, px: 2, py: 1.2, borderRadius: 1.5, border: `1px solid ${alpha(GOLD_LIGHT, 0.5)}`, boxShadow: `0 12px 24px -8px ${alpha(INK, 0.6)}` }}>
      <Typography variant="caption" sx={{ opacity: 0.7, display: 'block' }}>{p.name || p.payload?.name}</Typography>
      <Typography sx={{ fontFamily: FONT_MONO, fontWeight: 700, fontSize: '1.1rem' }}>{p.value}</Typography>
    </Box>
  );
}

/** Honest empty state for charts with no real data yet. */
function EmptyChartState({ message }) {
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', px: 3 }}>
      <Assessment sx={{ fontSize: 40, color: alpha(INK, 0.25), mb: 1 }} />
      <Typography variant="body2" sx={{ color: alpha(INK, 0.55), maxWidth: 260 }}>
        {message}
      </Typography>
    </Box>
  );
}

// ---------------------------------------------------------------------------------
// SUB-COMPONENT 1: Teacher's System Overview Dashboard
// ---------------------------------------------------------------------------------
function TeacherDashboardOverview({ stats, assignedClasses, navigate, assessmentsCount, dash }) {
  const myStudents = stats.totalStudents || 0;
  const atRisk = dash?.atRiskCount ?? 0;
  const avgAttendance = dash?.avgAttendance; // null when no records exist yet

  // Real data served by /api/dashboard/teacher (computed from live DB records)
  const classPerformanceData = dash?.assessmentAverages ?? [];
  const attendanceDistribution = dash?.attendanceDistribution ?? [];
  const recentAttempts = (dash?.recentAttempts ?? []).slice(0, 6);

  const pieData = attendanceDistribution.map((b, i) => ({
    ...b,
    color: [CRIMSON, GOLD_LIGHT, TEAL, '#1F6F73AA'][i] || TEAL,
  }));
  const hasAttendanceData = pieData.some((d) => d.value > 0);
  const totalPie = pieData.reduce((s, d) => s + d.value, 0);

  const MetricCard = ({ title, value, icon, iconBg, iconColor }) => (
    <Card elevation={0} sx={{ flex: 1, minWidth: { xs: '100%', sm: '180px' }, borderRadius: 2, border: `1px solid ${alpha(INK, 0.1)}`, boxShadow: `0 4px 12px ${alpha(INK, 0.05)}` }}>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: '20px !important' }}>
        <Box sx={{ width: 48, height: 48, borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: iconBg, color: iconColor }}>
          {icon}
        </Box>
        <Box>
          <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 0.5 }}>{title}</Typography>
          <Typography variant="h5" sx={{ fontWeight: 800, color: INK, fontFamily: FONT_MONO }}>{value}</Typography>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, mb: 3, width: '100%' }}>
        <MetricCard title="My Students" value={myStudents} icon={<People fontSize="medium" />} iconBg={alpha(INK, 0.05)} iconColor={INK} />
        <MetricCard title="Avg Attendance (30d)" value={avgAttendance != null ? `${avgAttendance}%` : 'No data'} icon={<CheckCircle fontSize="medium" />} iconBg={alpha(TEAL, 0.1)} iconColor={TEAL} />
        <MetricCard title="Live Assessments" value={assessmentsCount} icon={<Quiz fontSize="medium" />} iconBg={alpha(INK, 0.05)} iconColor={INK} />
        <MetricCard title="At-Risk (<75%)" value={atRisk} icon={<WarningAmberRounded fontSize="medium" />} iconBg={atRisk > 0 ? CRIMSON : TEAL} iconColor="#fff" />
      </Box>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3, mb: 3, width: '100%' }}>

        <Card elevation={0} sx={{ flex: 5, borderRadius: 2, border: `1px solid ${alpha(INK, 0.1)}`, height: 400 }}>
          <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" sx={{ fontFamily: FONT_DISPLAY, fontWeight: 700, mb: 3 }}>Average Score by Assessment</Typography>
            <Box sx={{ flexGrow: 1, minHeight: 0 }}>
              {classPerformanceData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={classPerformanceData} margin={{ top: 20, right: 10, left: -20, bottom: 5 }} barSize={32}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={alpha(INK, 0.1)} />
                    <XAxis dataKey="name" tick={{ fill: INK, fontWeight: 600, fontSize: 11 }} axisLine={false} tickLine={false} interval={0} />
                    <YAxis tick={{ fill: alpha(INK, 0.6) }} axisLine={false} tickLine={false} domain={[0, 100]} />
                    <RechartsTooltip cursor={{ fill: alpha(INK, 0.04) }} content={<LedgerTooltip />} />
                    <Bar dataKey="score" fill={PLUM} radius={[4, 4, 0, 0]}>
                      <LabelList dataKey="score" position="top" style={{ fill: INK, fontSize: 12, fontWeight: 700 }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChartState message="No completed test attempts yet — averages appear once students submit proctored tests." />
              )}
            </Box>
          </CardContent>
        </Card>

        <Card elevation={0} sx={{ flex: 4, borderRadius: 2, border: `1px solid ${alpha(INK, 0.1)}`, height: 400 }}>
          <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" sx={{ fontFamily: FONT_DISPLAY, fontWeight: 700, mb: 1 }}>Student Attendance Distribution</Typography>
            <Box sx={{ flexGrow: 1, position: 'relative', minHeight: 0 }}>
              {hasAttendanceData ? (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 20, right: 30, left: 30, bottom: 20 }}>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value" stroke="none">
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip content={<LedgerTooltip />} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" formatter={(value) => `${value}`} payload={pieData.map(p => ({ value: p.name, type: 'circle', id: p.name }))} />
                    </PieChart>
                  </ResponsiveContainer>
                  <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: INK, fontFamily: FONT_MONO, lineHeight: 1 }}>{totalPie}</Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: INK }}>Students</Typography>
                  </Box>
                </>
              ) : (
                <EmptyChartState message="No attendance has been recorded in the last 30 days." />
              )}
            </Box>
          </CardContent>
        </Card>

        <Card elevation={0} sx={{ flex: 3, borderRadius: 2, border: `1px solid ${alpha(INK, 0.1)}`, height: 400, overflowY: 'auto' }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontFamily: FONT_DISPLAY, fontWeight: 700, mb: 2 }}>Recent Test Activity</Typography>
            {recentAttempts.length > 0 ? (
              <List disablePadding>
                {recentAttempts.map((a, idx) => (
                  <React.Fragment key={a.attemptId}>
                    <ListItem disableGutters sx={{ py: 1.25 }}>
                      <ListItemText
                        primary={
                          <Typography fontWeight={700} color={INK} fontSize={13.5}>
                            {a.studentName || `#${a.studentId}`}
                            <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                              {a.assessmentTitle}
                            </Typography>
                          </Typography>
                        }
                        secondary={
                          <Chip
                            label={`${a.status}${a.score != null && a.totalQuestions > 0 ? ` • ${a.score}/${a.totalQuestions}` : ''}`}
                            size="small"
                            sx={{
                              mt: 0.5,
                              bgcolor: a.status === 'SUBMITTED' ? alpha(TEAL, 0.1) : alpha(CRIMSON, 0.08),
                              color: a.status === 'SUBMITTED' ? TEAL : CRIMSON,
                              fontWeight: 600,
                              fontSize: 11,
                              borderRadius: '4px',
                              fontFamily: FONT_MONO,
                            }}
                          />
                        }
                      />
                    </ListItem>
                    {idx < recentAttempts.length - 1 && <Divider component="li" />}
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <CheckCircle sx={{ color: TEAL, fontSize: 40, mb: 1 }} />
                <Typography sx={{ fontWeight: 600, color: INK }}>No attempts yet</Typography>
                <Typography variant="caption" color="text.secondary">Activity will show here as students take tests.</Typography>
              </Box>
            )}
          </CardContent>
        </Card>

      </Box>

      {/* BOTTOM ROW: Assigned Classes & CTA */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3, width: '100%' }}>
        <Card elevation={0} sx={{ flex: 1, borderRadius: 2, border: `1px solid ${alpha(INK, 0.1)}` }}>
          <CardContent>
             <Typography variant="h6" sx={{ fontFamily: FONT_DISPLAY, fontWeight: 700, mb: 2 }}>My Assigned Classes</Typography>
             {assignedClasses.length > 0 ? (
                <List disablePadding>
                  {assignedClasses.map((a, idx) => (
                    <ListItem key={a.id} disableGutters sx={{ px: 2, py: 1.5, borderBottom: idx === assignedClasses.length - 1 ? 'none' : `1px solid ${alpha(INK, 0.08)}` }}>
                      <ListItemText
                        primary={
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Typography sx={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 16, color: INK }}>{a.department}</Typography>
                            <Chip label="Primary" size="small" sx={{ bgcolor: alpha(GOLD, 0.14), color: GOLD, fontWeight: 700, fontSize: 10, height: 20, borderRadius: 1 }} />
                          </Stack>
                        }
                        secondary={
                          <Typography sx={{ fontWeight: 600, fontSize: 13, color: alpha(INK, 0.6), mt: 0.5 }}>
                            {[a.year, `Section ${a.section}`].filter(Boolean).join(' • ')}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
             ) : (
                <Typography color="text.secondary">No classes assigned yet.</Typography>
             )}
          </CardContent>
        </Card>

        <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden', background: GRADIENT_LEDGER, borderRadius: 2, p: 4, display: 'flex', flexDirection: 'column', justifyContent: 'center', border: `1px solid ${alpha(GOLD, 0.3)}` }}>
          <Typography sx={{ position: 'relative', zIndex: 1, fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 24, color: '#fff', mb: 1 }}>
            Ready for today's roll call?
          </Typography>
          <Typography sx={{ position: 'relative', zIndex: 1, color: alpha('#fff', 0.7), mb: 3 }}>
            Mark your assigned class attendance quickly and securely.
          </Typography>
          <Button
            onClick={() => navigate('/teacher/attendance')}
            sx={{
              position: 'relative', zIndex: 1, alignSelf: 'flex-start',
              bgcolor: GOLD, color: INK, fontFamily: FONT_DISPLAY, fontWeight: 700, textTransform: 'none',
              borderRadius: 1.5, px: 4, py: 1.2, fontSize: 16, '&:hover': { bgcolor: GOLD_LIGHT },
            }}
          >
            Open Attendance Monitor
          </Button>
        </Box>
      </Box>

    </Box>
  );
}


// ---------------------------------------------------------------------------------
// SUB-COMPONENT 2: The New "My Students Directory" specifically for Teachers
// ---------------------------------------------------------------------------------
function TeacherStudentDirectory({ students, selectedClassInfo }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const filteredStudents = students.filter(user => 
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenView = (student) => {
    setSelectedStudent(student);
    setViewDialogOpen(true);
  };

  const handleCloseView = () => {
    setViewDialogOpen(false);
    setSelectedStudent(null);
  };

  return (
    <Grow in timeout={500}>
      <Box>
        <Card elevation={0} sx={{ mb: 4, borderRadius: 2, border: `1px solid ${alpha(INK, 0.12)}`, boxShadow: `0 20px 40px -30px ${alpha(INK, 0.5)}` }}>
          <CardContent sx={{ p: 4, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
            <Box>
              <Typography variant="h5" sx={{ fontFamily: FONT_DISPLAY, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1.5, color: INK }}>
                <People sx={{ color: TEAL }} /> My Class Directory
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                Showing students enrolled in <Typography component="span" fontWeight={700} color={INK}>{selectedClassInfo}</Typography>
              </Typography>
            </Box>
            
            <TextField 
              size="small" 
              placeholder="Search student name..."
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{ startAdornment: <Search color="action" sx={{ mr: 1 }} /> }}
              sx={{ bgcolor: '#fff', borderRadius: 1, minWidth: 250 }} 
            />
          </CardContent>
        </Card>

        <Paper elevation={0} sx={{ borderRadius: 2, overflow: 'hidden', border: `1px solid ${alpha(INK, 0.12)}`, boxShadow: `0 20px 40px -30px ${alpha(INK, 0.5)}` }}>
          <Box sx={{ bgcolor: alpha(TEAL, 0.08), p: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: TEAL }}>
              {filteredStudents.length} Student(s) Enrolled
            </Typography>
          </Box>
          <Table>
            <TableHead sx={{ background: GRADIENT_LEDGER }}>
              <TableRow>
                <TableCell sx={{ color: PARCHMENT, fontWeight: 700 }}>Student Profile</TableCell>
                <TableCell sx={{ color: PARCHMENT, fontWeight: 700 }}>Register / Email</TableCell>
                <TableCell sx={{ color: PARCHMENT, fontWeight: 700 }}>Year & Section</TableCell>
                <TableCell sx={{ color: PARCHMENT, fontWeight: 700 }}>CGPA Status</TableCell>
                <TableCell align="right" sx={{ color: PARCHMENT, fontWeight: 700 }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredStudents.length > 0 ? filteredStudents.map((student, idx) => (
                <TableRow key={student.id} hover sx={{ animation: `railFadeUp 0.35s ease ${idx * 0.03}s both`, transition: '0.2s', '&:hover': { bgcolor: alpha(TEAL, 0.05) } }}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar src={student.profile?.profilePhoto ? `http://localhost:8080/uploads/profile/students/${student.profile.profilePhoto}` : ""} sx={{ bgcolor: TEAL, fontWeight: 700, fontFamily: FONT_DISPLAY }}>
                        {student.profile?.firstName?.charAt(0).toUpperCase() || student.username.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography fontWeight={700}>{student.profile?.firstName ? `${student.profile.firstName} ${student.profile.lastName || ''}` : student.username}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: FONT_MONO }}>ID: #{student.id}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                     <Typography fontWeight={700} color={INK}>{student.profile?.registerNumber || "N/A"}</Typography>
                     <Typography variant="caption" color="text.secondary">{student.username}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography fontWeight={700} color="text.secondary">
                      {student.year ? `${student.year} - ` : ''}{student.classSection || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                      {student.profile?.cgpa ? (
                         <Chip label={`CGPA: ${student.profile.cgpa}`} size="small" sx={{ bgcolor: alpha(GOLD_LIGHT, 0.15), color: GOLD, fontWeight: 700, fontFamily: FONT_MONO, borderRadius: 1 }} />
                      ) : (
                         <Chip label="Not updated" size="small" variant="outlined" sx={{ borderColor: alpha(INK, 0.2), color: alpha(INK, 0.5), fontWeight: 600, borderRadius: 1 }} />
                      )}
                  </TableCell>
                  <TableCell align="right">
                    <Button variant="outlined" size="small" onClick={() => handleOpenView(student)} startIcon={<Visibility />} sx={{ color: INK, borderColor: alpha(INK, 0.3), textTransform: 'none', fontWeight: 700, borderRadius: 1.5, '&:hover': { bgcolor: alpha(INK, 0.05), borderColor: INK } }}>
                        View Profile
                    </Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    <Typography variant="subtitle1" color="text.secondary">No students match this search.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>

        {/* The View Student Academic Profile Modal */}
        <Dialog open={viewDialogOpen} onClose={handleCloseView} maxWidth="md" fullWidth TransitionComponent={SlideUpTransition} PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden', bgcolor: PARCHMENT } }}>
          <DialogTitle sx={{ background: GRADIENT_LEDGER, color: PARCHMENT, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `3px solid ${GOLD}`, fontFamily: FONT_DISPLAY, py: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <School /> <Typography variant="h6" sx={{ fontFamily: FONT_DISPLAY, fontWeight: 700 }}>Student Academic Record</Typography>
            </Box>
            <IconButton size="small" onClick={handleCloseView} sx={{ color: PARCHMENT }}><Close fontSize="small" /></IconButton>
          </DialogTitle>
          <DialogContent sx={{ mt: 3, px: { xs: 2, sm: 4 }, pb: 4 }}>
             {selectedStudent && (
                 <Grid container spacing={4}>
                    <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
                        <Avatar 
                          src={selectedStudent.profile?.profilePhoto ? `http://localhost:8080/uploads/profile/students/${selectedStudent.profile.profilePhoto}` : ""} 
                          sx={{ width: 140, height: 140, mx: 'auto', mb: 2, border: `3px solid ${alpha(GOLD, 0.5)}`, bgcolor: TEAL, fontSize: 50, fontFamily: FONT_DISPLAY }}
                        >
                            {selectedStudent.profile?.firstName?.charAt(0).toUpperCase() || selectedStudent.username.charAt(0).toUpperCase()}
                        </Avatar>
                        <Typography variant="h5" fontWeight={800} color={INK} sx={{ fontFamily: FONT_DISPLAY }}>
                            {selectedStudent.profile?.firstName ? `${selectedStudent.profile.firstName} ${selectedStudent.profile.lastName || ''}` : "Name Not Set"}
                        </Typography>
                        <Chip label={selectedStudent.profile?.registerNumber || "Reg No. Pending"} sx={{ mt: 1, bgcolor: INK, color: '#fff', fontWeight: 600, fontFamily: FONT_MONO, borderRadius: 1 }} />
                    </Grid>
                    <Grid item xs={12} md={8}>
                        <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: `1px solid ${alpha(INK, 0.1)}`, mb: 3 }}>
                            <Typography variant="overline" color="text.secondary" fontWeight={700}>Academic Standing</Typography>
                            <Grid container spacing={2} sx={{ mt: 0.5 }}>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="text.secondary" display="block">Department</Typography>
                                    <Typography fontWeight={700} color={INK}>{selectedStudent.department || "N/A"}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="text.secondary" display="block">Year & Section</Typography>
                                    <Typography fontWeight={700} color={INK}>{selectedStudent.year} - {selectedStudent.classSection}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="text.secondary" display="block">Current CGPA</Typography>
                                    <Typography fontWeight={800} color={GOLD} sx={{ fontFamily: FONT_MONO, fontSize: 18 }}>{selectedStudent.profile?.cgpa || "Not Updated"}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="text.secondary" display="block">Placement Status</Typography>
                                    <Chip size="small" label={selectedStudent.profile?.placementStatus || "Pending"} sx={{ bgcolor: alpha(TEAL, 0.1), color: TEAL, fontWeight: 700, borderRadius: 1 }} />
                                </Grid>
                            </Grid>
                        </Paper>

                        <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: `1px solid ${alpha(INK, 0.1)}` }}>
                            <Typography variant="overline" color="text.secondary" fontWeight={700}>Contact & Skills</Typography>
                            <Stack spacing={1.5} sx={{ mt: 1.5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <Mail fontSize="small" sx={{ color: alpha(INK, 0.5) }}/>
                                    <Typography fontWeight={600} color={INK}>{selectedStudent.username}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <Phone fontSize="small" sx={{ color: alpha(INK, 0.5) }}/>
                                    <Typography fontWeight={600} color={INK}>{selectedStudent.profile?.phone || "No phone listed"}</Typography>
                                </Box>
                            </Stack>
                            <Box sx={{ mt: 3 }}>
                                <Typography variant="caption" color="text.secondary" display="block" mb={1}>Reported Skills</Typography>
                                <Stack direction="row" flexWrap="wrap" gap={1}>
                                    {selectedStudent.profile?.skills ? selectedStudent.profile.skills.split(',').map((s, i) => (
                                        <Chip key={i} label={s.trim()} size="small" sx={{ bgcolor: alpha(PLUM, 0.1), color: PLUM, fontWeight: 700, borderRadius: 1 }} />
                                    )) : <Typography variant="body2" color="text.secondary">No skills reported.</Typography>}
                                </Stack>
                            </Box>
                        </Paper>
                    </Grid>
                 </Grid>
             )}
          </DialogContent>
        </Dialog>
      </Box>
    </Grow>
  );
}


// --- MAIN COMPONENT: Teacher Dashboard ---
function TeacherDashboard() {
  useLedgerFonts();

  const navigate = useNavigate();
  const { section, setSection } = useShell();

  // "My Profile" is a routed page — hand off to it once.
  React.useEffect(() => {
    if (section === 'profile') {
      navigate('/profile');
      setSection('dashboard');
    }
  }, [section]);

  const [loading, setLoading] = useState(true);

  const [teacherName, setTeacherName] = useState('Professor');
  const [teacherUser, setTeacherUser] = useState(null);
  const [assignedClasses, setAssignedClasses] = useState([]);
  const [assessments, setAssessments] = useState([]);

  // New States for Student Directory
  const [myStudents, setMyStudents] = useState([]);
  const [stats, setStats] = useState({ totalStudents: 0 });
  const [dash, setDash] = useState(null); // real overview stats from /api/dashboard/teacher

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      try {
        // 1. Get Teacher Info
        const meRes = await axios.get('http://localhost:8080/api/auth/me');
        const tDept = meRes.data.department;
        const tYear = meRes.data.year;
        const tSec = meRes.data.classSection;

        setTeacherName(meRes.data.username || 'Professor');
        setTeacherUser(meRes.data);

        if (tDept || tYear || tSec) {
          setAssignedClasses([{
            id: 'primary-class',
            department: tDept || 'All Departments',
            year: tYear || 'All Years',
            section: tSec || 'All Sections'
          }]);
        } else {
          setAssignedClasses([]);
        }

        // 2. Fetch real dashboard statistics & assessments
        const [dashRes, assessmentsRes] = await Promise.all([
          axios.get('http://localhost:8080/api/dashboard/teacher').catch(() => ({ data: null })),
          axios.get('http://localhost:8080/api/assessments?category=INTERNAL').catch(() => ({ data: [] })),
        ]);

        setDash(dashRes.data);
        setAssessments(assessmentsRes.data || []);

        // 3. Fetch Students & Filter by Teacher's Assigned Class
        const [studentsRes, profilesRes] = await Promise.all([
          axios.get('http://localhost:8080/api/auth/users/Student').catch(()=>({data:[]})),
          axios.get('http://localhost:8080/api/student/profile/all').catch(()=>({data:[]}))
        ]);

        let filteredStudents = studentsRes.data;
        if (tDept && tDept !== 'All Departments') filteredStudents = filteredStudents.filter(s => s.department === tDept);
        if (tYear && tYear !== 'All Years') filteredStudents = filteredStudents.filter(s => s.year === tYear);
        if (tSec && tSec !== 'All Sections') filteredStudents = filteredStudents.filter(s => s.classSection === tSec);

        // Merge Profiles so we have CGPA and photos in the directory
        const enrichedStudents = filteredStudents.map(stu => {
            const prof = profilesRes.data.find(p => p.user?.id === stu.id) || null;
            return { ...stu, profile: prof };
        });

        setMyStudents(enrichedStudents);
        setStats({ totalStudents: enrichedStudents.length });

      } catch (err) {
        console.error('Failed to load teacher dashboard', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <Box sx={{ height: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
        <CircularProgress sx={{ color: INK }} size={30} thickness={4} />
        <Typography sx={{ fontFamily: FONT_DISPLAY, fontWeight: 700, color: alpha(INK, 0.6) }}>Loading your workspace…</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {section === 'dashboard' && (
        <>
          {/* HERO — letterhead band */}
          <Fade in timeout={450}>
            <Box sx={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              mb: 4, p: { xs: 3, md: 3.5 }, borderRadius: 2,
              background: GRADIENT_LEDGER, color: PARCHMENT,
              borderBottom: `4px solid ${GOLD}`,
              boxShadow: `0 26px 50px -20px ${alpha(INK, 0.55)}`,
              flexWrap: 'wrap', gap: 2
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                <Box sx={{
                  width: 56, height: 56, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: `radial-gradient(circle at 35% 30%, ${GOLD_LIGHT}, ${GOLD} 70%)`,
                  animation: 'sealPulse 2.6s ease-in-out infinite',
                  border: `2px solid ${alpha('#fff', 0.4)}`
                }}>
                  <DashboardIcon sx={{ fontSize: 28, color: INK }} />
                </Box>
                <Box>
                  <Typography variant="h5" sx={{ fontFamily: FONT_DISPLAY, fontWeight: 700 }}>
                    Welcome back, {teacherName}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.75 }}>
                    Here is your academic overview and classroom standing.
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Fade>

          <TeacherDashboardOverview stats={stats} assignedClasses={assignedClasses} dash={dash} assessmentsCount={assessments.length} navigate={navigate} />
        </>
      )}

      {section === 'my-students' && (
        <TeacherStudentDirectory
          students={myStudents}
          selectedClassInfo={assignedClasses.length > 0 ? `${assignedClasses[0].department} (${assignedClasses[0].year} - ${assignedClasses[0].section})` : "Unassigned"}
        />
      )}

      {section === 'internal' && <InternalAssessmentManager user={teacherUser} />}

      {section === 'results' && <TeacherTestResults />}

      {section === 'attendance' && <TeacherAttendance />}

      {section === 'alerts' && <AtRiskPanel />}

      {section === 'performance' && <PerformancePanel dash={dash} />}

      {section === 'video-review' && <VideoReview />}
    </Box>
  );
}

/** Monitoring > Attendance Alerts — named students under the 75% threshold (real records). */
function AtRiskPanel() {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get('http://localhost:8080/api/dashboard/teacher/at-risk?threshold=75')
      .then((res) => setRows(Array.isArray(res.data) ? res.data : []))
      .catch((e) => setError(e.response?.data?.error || 'Could not load alerts.'));
  }, []);

  return (
    <Card elevation={0} sx={{ borderRadius: 2, border: `1px solid ${alpha(INK, 0.1)}` }}>
      <CardContent>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
          <WarningAmberRounded sx={{ color: CRIMSON }} />
          <Typography variant="h6" sx={{ fontFamily: FONT_DISPLAY, fontWeight: 700 }}>Attendance Alerts</Typography>
          <Chip size="small" label={`${rows?.length ?? 0} below 75%`} sx={{ bgcolor: alpha(CRIMSON, 0.08), color: CRIMSON, fontWeight: 700 }} />
        </Stack>

        {error && <Alert severity="error">{error}</Alert>}

        {!rows && !error && (
          <Box sx={{ textAlign: 'center', py: 5 }}><CircularProgress size={26} /></Box>
        )}

        {rows && rows.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <CheckCircle sx={{ fontSize: 42, color: TEAL, mb: 1 }} />
            <Typography fontWeight={700}>No attendance alerts</Typography>
            <Typography variant="body2" color="text.secondary">
              Every student with attendance records is above the 75% threshold for the last 30 days.
            </Typography>
          </Box>
        )}

        {rows && rows.length > 0 && (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Student</TableCell>
                <TableCell>Class</TableCell>
                <TableCell align="right">Attendance (30d)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.studentId}>
                  <TableCell sx={{ fontWeight: 700 }}>{r.username || `#${r.studentId}`}</TableCell>
                  <TableCell>{[r.department, r.year, r.classSection].filter(Boolean).join(' • ') || '—'}</TableCell>
                  <TableCell align="right">
                    <Chip size="small" label={`${r.percentage}%`} sx={{ bgcolor: alpha(CRIMSON, 0.08), color: CRIMSON, fontWeight: 800, fontFamily: FONT_MONO }} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

/** Monitoring > Student Performance — real averages + recent attempts feed. */
function PerformancePanel({ dash }) {
  const data = dash?.assessmentAverages ?? [];
  return (
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3 }}>
      <Card elevation={0} sx={{ flex: 3, border: `1px solid ${alpha(INK, 0.1)}`, height: 420 }}>
        <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h6" sx={{ fontFamily: FONT_DISPLAY, fontWeight: 700, mb: 2 }}>Average Score by Assessment</Typography>
          <Box sx={{ flexGrow: 1 }}>
            {data.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 20, right: 10, left: -20, bottom: 5 }} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={alpha(INK, 0.1)} />
                  <XAxis dataKey="name" tick={{ fill: INK, fontWeight: 600, fontSize: 11 }} axisLine={false} tickLine={false} interval={0} />
                  <YAxis tick={{ fill: alpha(INK, 0.6) }} axisLine={false} tickLine={false} domain={[0, 100]} />
                  <RechartsTooltip cursor={{ fill: alpha(INK, 0.04) }} content={<LedgerTooltip />} />
                  <Bar dataKey="score" fill={PLUM} radius={[4, 4, 0, 0]}>
                    <LabelList dataKey="score" position="top" style={{ fill: INK, fontSize: 12, fontWeight: 700 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChartState message="No completed attempts yet — performance appears after students submit assessments." />
            )}
          </Box>
        </CardContent>
      </Card>

      <Card elevation={0} sx={{ flex: 2, border: `1px solid ${alpha(INK, 0.1)}`, height: 420, overflowY: 'auto' }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontFamily: FONT_DISPLAY, fontWeight: 700, mb: 2 }}>Recent Test Activity</Typography>
          {(dash?.recentAttempts ?? []).length > 0 ? (
            <List disablePadding>
              {(dash.recentAttempts ?? []).map((a, idx) => (
                <React.Fragment key={a.attemptId}>
                  <ListItem disableGutters sx={{ py: 1.25 }}>
                    <ListItemText
                      primary={
                        <Typography fontWeight={700} fontSize={13.5}>
                          {a.studentName || `#${a.studentId}`}
                          <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                            {a.assessmentTitle}
                          </Typography>
                        </Typography>
                      }
                      secondary={
                        <Chip label={`${a.status}${a.score != null && a.totalQuestions > 0 ? ` • ${a.score}/${a.totalQuestions}` : ''}`}
                          size="small"
                          sx={{
                            mt: 0.5,
                            bgcolor: a.status === 'SUBMITTED' ? alpha(TEAL, 0.1) : alpha(CRIMSON, 0.08),
                            fontWeight: 600, fontSize: 11,
                          }} />
                      }
                    />
                  </ListItem>
                  {idx < dash.recentAttempts.length - 1 && <Divider component="li" />}
                </React.Fragment>
              ))}
            </List>
          ) : (
            <EmptyChartState message="No attempts yet." />
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

// ---------------------------------------------------------------------------------
// SUB-COMPONENT: Video Proctoring Review — watch screen + webcam recordings
// ---------------------------------------------------------------------------------
function VideoReview() {
  const [attempts, setAttempts] = useState(null);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [violations, setViolations] = useState([]);
  const [videoTab, setVideoTab] = useState(0); // 0 = screen, 1 = webcam

  useEffect(() => {
    axios.get('http://localhost:8080/api/attempts/recorded')
      .then((res) => setAttempts(Array.isArray(res.data) ? res.data : []))
      .catch((e) => setError(e.response?.data?.error || 'Could not load recorded attempts.'));
  }, []);

  const handleSelect = async (attempt) => {
    setSelected(attempt);
    setVideoTab(0);
    setViolations([]);
    try {
      const res = await axios.get(`http://localhost:8080/api/attempts/${attempt.id}/violations`);
      setViolations(Array.isArray(res.data) ? res.data : []);
    } catch (_) { /* ignore */ }
  };

  const screenUrl = selected ? `http://localhost:8080/api/attempts/${selected.id}/recording` : '';
  const webcamUrl = selected ? `http://localhost:8080/api/attempts/${selected.id}/webcam` : '';

  return (
    <Box sx={{ width: '100%' }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {!selected ? (
        <Card elevation={0} sx={{ borderRadius: 2, border: `1px solid ${alpha(INK, 0.1)}` }}>
          <CardContent>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
              <Videocam sx={{ color: TEAL }} />
              <Typography variant="h6" sx={{ fontFamily: FONT_DISPLAY, fontWeight: 700 }}>Video Proctoring Review</Typography>
              <Chip size="small" label={`${attempts?.length ?? 0} recordings`} sx={{ bgcolor: alpha(TEAL, 0.1), color: TEAL, fontWeight: 700 }} />
            </Stack>

            {!attempts && !error && (
              <Box sx={{ textAlign: 'center', py: 5 }}><CircularProgress size={26} /></Box>
            )}

            {attempts && attempts.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <Videocam sx={{ fontSize: 42, color: alpha(INK, 0.25), mb: 1 }} />
                <Typography fontWeight={700}>No recordings yet</Typography>
                <Typography variant="body2" color="text.secondary">
                  Recordings appear here once students complete proctored tests.
                </Typography>
              </Box>
            )}

            {attempts && attempts.length > 0 && (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Student</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Assessment</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Score</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Violations</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Recordings</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {attempts.map((a) => (
                    <TableRow key={a.id} hover sx={{ '&:hover': { bgcolor: alpha(TEAL, 0.04) } }}>
                      <TableCell>
                        <Typography fontWeight={700}>{a.studentName || `#${a.studentId}`}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: FONT_MONO }}>{a.registerNumber || ''}</Typography>
                      </TableCell>
                      <TableCell>{a.assessmentTitle}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={a.status}
                          sx={{
                            bgcolor: a.status === 'SUBMITTED' ? alpha(TEAL, 0.1) : alpha(CRIMSON, 0.08),
                            color: a.status === 'SUBMITTED' ? TEAL : CRIMSON,
                            fontWeight: 600, fontSize: 11, fontFamily: FONT_MONO,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography fontWeight={700} sx={{ fontFamily: FONT_MONO }}>
                          {a.score != null && a.totalQuestions > 0 ? `${a.score}/${a.totalQuestions}` : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {a.violationCount > 0 ? (
                          <Chip size="small" label={a.violationCount} sx={{ bgcolor: alpha(CRIMSON, 0.1), color: CRIMSON, fontWeight: 700, fontFamily: FONT_MONO }} />
                        ) : (
                          <Typography variant="body2" color="text.secondary">0</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5}>
                          {a.hasRecording && <Chip size="small" label="Screen" sx={{ bgcolor: alpha(INK, 0.08), fontWeight: 600, fontSize: 10 }} />}
                          {a.hasWebcam && <Chip size="small" label="Webcam" sx={{ bgcolor: alpha(TEAL, 0.1), color: TEAL, fontWeight: 600, fontSize: 10 }} />}
                        </Stack>
                      </TableCell>
                      <TableCell align="right">
                        <Button variant="outlined" size="small" onClick={() => handleSelect(a)} startIcon={<Visibility />}
                          sx={{ color: INK, borderColor: alpha(INK, 0.3), textTransform: 'none', fontWeight: 700, borderRadius: 1.5, '&:hover': { bgcolor: alpha(INK, 0.05), borderColor: INK } }}>
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ) : (
        <Box>
          <Button onClick={() => setSelected(null)} startIcon={<ArrowForward sx={{ transform: 'rotate(180deg)' }} />} sx={{ mb: 2, fontWeight: 700, color: INK, textTransform: 'none' }}>
            Back to all recordings
          </Button>

          <Card elevation={0} sx={{ borderRadius: 2, border: `1px solid ${alpha(INK, 0.1)}`, mb: 3 }}>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="h6" sx={{ fontFamily: FONT_DISPLAY, fontWeight: 700 }}>
                  {selected.studentName || `Student #${selected.studentId}`}
                </Typography>
                <Chip label={selected.assessmentTitle} size="small" sx={{ bgcolor: alpha(GOLD, 0.14), color: GOLD, fontWeight: 700 }} />
                <Chip label={selected.status} size="small" sx={{ bgcolor: alpha(TEAL, 0.1), color: TEAL, fontWeight: 700, fontFamily: FONT_MONO }} />
                {selected.score != null && selected.totalQuestions > 0 && (
                  <Chip label={`Score: ${selected.score}/${selected.totalQuestions}`} size="small" sx={{ bgcolor: alpha(INK, 0.08), fontWeight: 700, fontFamily: FONT_MONO }} />
                )}
                {selected.violationCount > 0 && (
                  <Chip label={`${selected.violationCount} violation(s)`} size="small" sx={{ bgcolor: alpha(CRIMSON, 0.1), color: CRIMSON, fontWeight: 700 }} />
                )}
              </Stack>
            </CardContent>
          </Card>

          <Tabs value={videoTab} onChange={(_, v) => setVideoTab(v)} sx={{ mb: 2 }}>
            <Tab label="Screen Recording" />
            <Tab label="Webcam Recording" disabled={!selected.hasWebcam} />
            <Tab label={`Violations (${violations.length})`} />
          </Tabs>

          {videoTab === 0 && selected.hasRecording && (
            <Card elevation={0} sx={{ borderRadius: 2, overflow: 'hidden', border: `1px solid ${alpha(INK, 0.1)}` }}>
              <Box component="video" controls src={screenUrl} sx={{ width: '100%', maxHeight: 540, bgcolor: '#000', display: 'block' }} />
            </Card>
          )}
          {videoTab === 0 && !selected.hasRecording && (
            <Alert severity="info">No screen recording available for this attempt.</Alert>
          )}

          {videoTab === 1 && selected.hasWebcam && (
            <Card elevation={0} sx={{ borderRadius: 2, overflow: 'hidden', border: `1px solid ${alpha(INK, 0.1)}` }}>
              <Box component="video" controls src={webcamUrl} sx={{ width: '100%', maxHeight: 540, bgcolor: '#000', display: 'block' }} />
            </Card>
          )}
          {videoTab === 1 && !selected.hasWebcam && (
            <Alert severity="info">No webcam recording available for this attempt.</Alert>
          )}

          {videoTab === 2 && (
            <Card elevation={0} sx={{ borderRadius: 2, border: `1px solid ${alpha(INK, 0.1)}` }}>
              <CardContent>
                {violations.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <CheckCircle sx={{ fontSize: 36, color: TEAL, mb: 1 }} />
                    <Typography fontWeight={700}>No violations recorded</Typography>
                  </Box>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Time</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Severity</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {violations.map((v) => (
                        <TableRow key={v.id}>
                          <TableCell sx={{ fontFamily: FONT_MONO, fontSize: 12 }}>
                            {new Date(v.timestamp).toLocaleTimeString()}
                          </TableCell>
                          <TableCell>
                            <Chip size="small" label={v.type} sx={{ fontWeight: 600, fontFamily: FONT_MONO, fontSize: 11 }} />
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={v.severity}
                              sx={{
                                bgcolor: v.severity === 'CRITICAL' ? alpha(CRIMSON, 0.1) : alpha(GOLD, 0.14),
                                color: v.severity === 'CRITICAL' ? CRIMSON : GOLD,
                                fontWeight: 700, fontFamily: FONT_MONO, fontSize: 11,
                              }}
                            />
                          </TableCell>
                          <TableCell>{v.description || '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}
        </Box>
      )}
    </Box>
  );
}

export default TeacherDashboard;