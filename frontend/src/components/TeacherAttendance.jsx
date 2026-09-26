import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Table, TableBody,
  TableCell, TableHead, TableRow, Button, Avatar, Chip,
  Stack, Alert, CircularProgress, TextField, MenuItem,
  alpha, GlobalStyles,
} from '@mui/material';
import { ArrowBack, CheckCircle, Cancel, Groups, MenuBook, Hub, Psychology, SmartToy, AutoAwesome } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

axios.defaults.withCredentials = true;

/* ---------------------------------------------------------------------- *
 * DESIGN SYSTEM — "The Ledger" (shared across EduAI). Ivory paper,
 * ink navy, brass gold, teal + crimson accents.
 * ---------------------------------------------------------------------- */
const INK = '#141B33';
const PARCHMENT = '#FBF8F1';
const PARCHMENT_DEEP = '#F3EEE0';
const GOLD = '#B8892B';
const GOLD_LIGHT = '#E2B857';
const TEAL = '#1F6F73';
const CRIMSON = '#8C2F39';
const PLUM = '#5B4B8A';
const border = alpha(INK, 0.1);
const surface = '#FFFFFF';
const slate600 = alpha(INK, 0.62);
const slate400 = alpha(INK, 0.4);

const fontHead = "'Fraunces', Georgia, 'Times New Roman', serif";
const fontBody = "'Inter', -apple-system, sans-serif";
const fontMono = "'JetBrains Mono', 'Roboto Mono', 'Courier New', monospace";

const GRADIENT_LEDGER = `linear-gradient(120deg, ${INK} 0%, #1B234A 55%, ${PLUM} 140%)`;

function useLedgerFonts() {
  useEffect(() => {
    const id = 'ledger-fonts';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href =
      "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700;9..144,800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;600;700&display=swap";
    document.head.appendChild(link);
  }, []);
}

const keyframesStyles = {
  '@keyframes sealPulse': {
    '0%, 100%': { boxShadow: `0 0 0 0 ${alpha(GOLD_LIGHT, 0.5)}` },
    '50%': { boxShadow: `0 0 0 10px ${alpha(GOLD_LIGHT, 0)}` },
  },
  '@keyframes networkDrift': {
    '0%': { backgroundPosition: '0 0' },
    '100%': { backgroundPosition: '168px 168px' },
  },
  '@keyframes orbPulse': {
    '0%': { transform: 'translate(0,0) scale(1)', opacity: 0.5 },
    '50%': { transform: 'translate(16px,-12px) scale(1.15)', opacity: 0.82 },
    '100%': { transform: 'translate(0,0) scale(1)', opacity: 0.5 },
  },
  '@keyframes glyphFloat': {
    '0%, 100%': { transform: 'translateY(0) rotate(var(--rot, 0deg))' },
    '50%': { transform: 'translateY(-20px) rotate(calc(var(--rot, 0deg) + 4deg))' },
  },
  '@keyframes scanSweep': {
    '0%': { top: '-4%', opacity: 0 },
    '6%': { opacity: 0.6 },
    '50%': { opacity: 0.6 },
    '94%': { opacity: 0 },
    '100%': { top: '104%', opacity: 0 },
  },
  '@media (prefers-reduced-motion: reduce)': {
    '[data-motion]': { animation: 'none !important' },
  },
};

// Animated AI-in-education backdrop for the dark hero band.
function LedgerBackdrop() {
  const glyphs = [
    { Icon: MenuBook, top: '10%', left: '78%', size: 120, rot: -10, dur: 9 },
    { Icon: Psychology, top: '55%', left: '4%', size: 100, rot: 6, dur: 8 },
    { Icon: SmartToy, top: '18%', left: '46%', size: 90, rot: -6, dur: 7.5 },
    { Icon: Hub, top: '60%', left: '60%', size: 80, rot: 14, dur: 10 },
  ];
  const orbs = [
    { color: TEAL, top: '-30%', left: '-4%', size: 300, dur: 9 },
    { color: GOLD, top: '-25%', left: '75%', size: 280, dur: 11 },
  ];

  return (
    <Box sx={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      {orbs.map((o, i) => (
        <Box
          key={`orb-${i}`}
          data-motion
          sx={{
            position: 'absolute', top: o.top, left: o.left, width: o.size, height: o.size,
            borderRadius: '50%', filter: 'blur(10px)',
            background: `radial-gradient(circle, ${alpha(o.color, 0.3)}, transparent 70%)`,
            animation: `orbPulse ${o.dur}s ease-in-out infinite`,
          }}
        />
      ))}

      <Box
        data-motion
        sx={{
          position: 'absolute', inset: -168,
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140' viewBox='0 0 140 140'%3E%3Cg fill='none' stroke='%23E2B857' stroke-width='1' opacity='0.16'%3E%3Cline x1='20' y1='30' x2='70' y2='15'/%3E%3Cline x1='20' y1='30' x2='70' y2='70'/%3E%3Cline x1='20' y1='30' x2='70' y2='125'/%3E%3Cline x1='20' y1='90' x2='70' y2='15'/%3E%3Cline x1='20' y1='90' x2='70' y2='70'/%3E%3Cline x1='20' y1='90' x2='70' y2='125'/%3E%3Cline x1='70' y1='15' x2='120' y2='55'/%3E%3Cline x1='70' y1='70' x2='120' y2='55'/%3E%3Cline x1='70' y1='125' x2='120' y2='55'/%3E%3C/g%3E%3Cg fill='%23E2B857' opacity='0.26'%3E%3Ccircle cx='20' cy='30' r='2.6'/%3E%3Ccircle cx='20' cy='90' r='2.6'/%3E%3Ccircle cx='70' cy='15' r='2.4'/%3E%3Ccircle cx='70' cy='70' r='2.4'/%3E%3Ccircle cx='70' cy='125' r='2.4'/%3E%3Ccircle cx='120' cy='55' r='3.2'/%3E%3C/g%3E%3C/svg%3E\")",
          backgroundRepeat: 'repeat',
          animation: 'networkDrift 32s linear infinite',
        }}
      />

      <Box
        data-motion
        sx={{
          position: 'absolute', left: 0, right: 0, height: 2,
          background: `linear-gradient(90deg, transparent, ${alpha(GOLD_LIGHT, 0.65)}, transparent)`,
          animation: 'scanSweep 11s linear infinite',
        }}
      />

      {glyphs.map(({ Icon, top, left, size, rot, dur }, i) => (
        <Icon
          key={`glyph-${i}`}
          data-motion
          sx={{
            position: 'absolute', top, left, fontSize: size, color: '#fff', opacity: 0.06,
            '--rot': `${rot}deg`,
            animation: `glyphFloat ${dur}s ease-in-out infinite`,
            animationDelay: `${i * 0.6}s`,
          }}
        />
      ))}
    </Box>
  );
}

const inputSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '10px', fontFamily: fontBody, fontSize: 14, bgcolor: PARCHMENT_DEEP,
    '& fieldset': { borderColor: border },
    '&:hover fieldset': { borderColor: INK },
    '&.Mui-focused fieldset': { borderColor: INK },
  },
  '& .MuiInputLabel-root': { fontFamily: fontBody, fontSize: 13, color: slate600 },
};

function TeacherAttendance() {
  const navigate = useNavigate();
  useLedgerFonts();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSession, setSelectedSession] = useState('MORNING');
  const [selectedSubject, setSelectedSubject] = useState('General Class');

  useEffect(() => {
    const fetchRosterAndAttendance = async () => {
      setLoading(true);
      try {
        // Fetches ONLY the specific students assigned to this teacher's department/year/class
        const studentRes = await axios.get('http://localhost:8080/api/auth/class-roster');
        const studentList = studentRes.data;
        setStudents(studentList);

        const attRes = await axios.get(`http://localhost:8080/api/attendance/filter?date=${selectedDate}&session=${selectedSession}`);
        const savedRecords = attRes.data;

        const initialStatus = {};
        studentList.forEach((student) => {
          const existingRecord = savedRecords.find((record) => record.studentId === student.id);
          initialStatus[student.id] = existingRecord
            ? (existingRecord.status === 'PRESENT' ? 'Present' : 'Absent')
            : 'Present';
        });
        setAttendance(initialStatus);
      } catch (err) {
        console.error('Failed to load roster or attendance records', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRosterAndAttendance();
  }, [selectedDate, selectedSession]);

  const handleStatusChange = (id, status) => {
    setAttendance((prev) => ({ ...prev, [id]: status }));
  };

  const handleSubmitAttendance = async () => {
    try {
      setSubmitting(true);

      const promises = students.map((student) => {
        const currentStatus = attendance[student.id] || 'Present';
        const statusValue = currentStatus === 'Present' ? 'PRESENT' : 'ABSENT';

        const payload = {
          studentId: student.id,
          status: statusValue,
          session: selectedSession,
          date: selectedDate,
          subject: selectedSubject,
        };

        return axios.post('http://localhost:8080/api/attendance/mark', payload);
      });

      await Promise.all(promises);

      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
    } catch (err) {
      console.error('Failed to save attendance:', err);
      alert('Failed to save attendance and send emails.');
    } finally {
      setSubmitting(false);
    }
  };

  const presentCount = students.filter((s) => (attendance[s.id] || 'Present') === 'Present').length;
  const absentCount = students.length - presentCount;

  return (
    <Box sx={{ bgcolor: PARCHMENT, minHeight: '100vh', pb: 8 }}>
      <GlobalStyles styles={keyframesStyles} />

      {/* Header — dark ledger letterhead with the animated AI/education backdrop */}
      <Box sx={{ position: 'relative', overflow: 'hidden', background: GRADIENT_LEDGER, borderBottom: `4px solid ${GOLD}` }}>
        <LedgerBackdrop />
        <Box sx={{ position: 'relative', zIndex: 1, px: { xs: 3, md: 6 }, py: 4 }}>
          <Button
            startIcon={<ArrowBack sx={{ fontSize: 17 }} />}
            onClick={() => navigate('/teacher')}
            sx={{
              color: alpha('#fff', 0.75), fontFamily: fontBody, fontWeight: 600, fontSize: 13, textTransform: 'none',
              mb: 2, p: 0, '&:hover': { bgcolor: 'transparent', color: GOLD_LIGHT },
            }}
          >
            Back to Dashboard
          </Button>
          <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" rowGap={2}>
            <Box>
              <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: 1.5 }}>
                <Box
                  data-motion
                  sx={{
                    width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: `radial-gradient(circle at 35% 30%, ${GOLD_LIGHT}, ${GOLD} 70%)`,
                    animation: 'sealPulse 2.6s ease-in-out infinite',
                  }}
                >
                  <AutoAwesome sx={{ fontSize: 12, color: INK }} />
                </Box>
                <Chip
                  label="Attendance Monitor"
                  size="small"
                  sx={{ bgcolor: alpha('#fff', 0.12), color: GOLD_LIGHT, fontFamily: fontBody, fontWeight: 600, fontSize: 11, borderRadius: '6px', border: `1px solid ${alpha(GOLD_LIGHT, 0.35)}` }}
                />
              </Stack>
              <Typography sx={{ fontFamily: fontHead, fontWeight: 700, fontSize: { xs: 24, md: 30 }, color: '#fff', lineHeight: 1.15 }}>
                Live Class Attendance
              </Typography>
            </Box>

            {!loading && students.length > 0 && (
              <Stack direction="row" spacing={2}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ bgcolor: alpha(TEAL, 0.18), px: 2, py: 1, borderRadius: '10px', border: `1px solid ${alpha(TEAL, 0.4)}` }}>
                  <CheckCircle sx={{ fontSize: 16, color: '#5FD9B8' }} />
                  <Typography sx={{ fontFamily: fontHead, fontWeight: 700, fontSize: 13, color: '#5FD9B8' }}>{presentCount} Present</Typography>
                </Stack>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ bgcolor: alpha(CRIMSON, 0.18), px: 2, py: 1, borderRadius: '10px', border: `1px solid ${alpha(CRIMSON, 0.4)}` }}>
                  <Cancel sx={{ fontSize: 16, color: '#F0918F' }} />
                  <Typography sx={{ fontFamily: fontHead, fontWeight: 700, fontSize: 13, color: '#F0918F' }}>{absentCount} Absent</Typography>
                </Stack>
              </Stack>
            )}
          </Stack>
        </Box>
      </Box>

      <Box sx={{ px: { xs: 3, md: 6 }, mt: 4 }}>
        {/* Filter bar */}
        <Box sx={{ bgcolor: surface, border: `1px solid ${border}`, borderRadius: '14px', p: 3, mb: 3, display: 'flex', gap: 2.5, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            label="Date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ ...inputSx, minWidth: 190 }}
          />
          <TextField
            label="Session"
            select
            value={selectedSession}
            onChange={(e) => setSelectedSession(e.target.value)}
            sx={{ ...inputSx, minWidth: 190 }}
          >
            <MenuItem value="MORNING">Morning Session</MenuItem>
            <MenuItem value="AFTERNOON">Afternoon Session</MenuItem>
          </TextField>
          <TextField
            label="Subject"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            sx={{ ...inputSx, minWidth: 240 }}
          />
        </Box>

        {submitted && (
          <Alert
            severity="success"
            sx={{
              mb: 3, borderRadius: '12px', fontFamily: fontBody, fontSize: 13.5,
              bgcolor: alpha(TEAL, 0.1), color: '#0F5132', border: `1px solid ${alpha(TEAL, 0.3)}`,
              '& .MuiAlert-icon': { color: TEAL },
            }}
          >
            Attendance successfully recorded for {selectedDate} ({selectedSession}), synced with the database, and absence alert emails dispatched.
          </Alert>
        )}

        {/* Roster table */}
        <Box sx={{ bgcolor: surface, border: `1px solid ${border}`, borderRadius: '14px', overflow: 'hidden' }}>
          <Stack
            direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" rowGap={1}
            sx={{ px: 3, py: 2.5, borderBottom: `1px solid ${border}` }}
          >
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Avatar sx={{ bgcolor: alpha(INK, 0.08), color: INK, width: 34, height: 34 }}>
                <Groups sx={{ fontSize: 18 }} />
              </Avatar>
              <Box>
                <Typography sx={{ fontFamily: fontHead, fontWeight: 700, fontSize: 16, color: INK }}>
                  Roster — {selectedDate}, {selectedSession === 'MORNING' ? 'Morning' : 'Afternoon'}
                </Typography>
                <Typography sx={{ fontFamily: fontBody, fontSize: 12.5, color: slate400 }}>
                  {students.length} student{students.length === 1 ? '' : 's'} found
                </Typography>
              </Box>
            </Stack>
            <Chip
              label="Database Synced"
              size="small"
              sx={{ bgcolor: alpha(TEAL, 0.1), color: TEAL, fontFamily: fontBody, fontWeight: 600, fontSize: 11.5, borderRadius: '6px' }}
            />
          </Stack>

          {loading ? (
            <Box py={8} display="flex" flexDirection="column" alignItems="center" gap={1.5}>
              <CircularProgress sx={{ color: INK }} size={28} thickness={4} />
              <Typography sx={{ fontFamily: fontBody, fontSize: 13, color: slate600 }}>Loading custom roster…</Typography>
            </Box>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={theadCell}>ID</TableCell>
                  <TableCell sx={theadCell}>Student</TableCell>
                  <TableCell sx={theadCell}>Class Routing</TableCell>
                  <TableCell sx={theadCell}>Status</TableCell>
                  <TableCell align="right" sx={theadCell}>Mark Attendance</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {students.length > 0 ? (
                  students.map((student) => {
                    const currentStatus = attendance[student.id] || 'Present';
                    const isPresent = currentStatus === 'Present';
                    return (
                      <TableRow key={student.id} sx={{ '&:hover': { bgcolor: PARCHMENT_DEEP }, '&:last-of-type td': { borderBottom: 'none' } }}>
                        <TableCell sx={tbodyCell}>
                          <Typography sx={{ fontFamily: fontMono, fontWeight: 600, fontSize: 13, color: slate400 }}>#{student.id}</Typography>
                        </TableCell>
                        <TableCell sx={tbodyCell}>
                          <Stack direction="row" alignItems="center" spacing={1.5}>
                            <Avatar sx={{ bgcolor: INK, width: 32, height: 32, fontFamily: fontHead, fontWeight: 700, fontSize: 13 }}>
                              {student.username.charAt(0).toUpperCase()}
                            </Avatar>
                            <Typography sx={{ fontFamily: fontBody, fontWeight: 600, fontSize: 14, color: INK }}>{student.username}</Typography>
                          </Stack>
                        </TableCell>
                        <TableCell sx={tbodyCell}>
                          <Chip
                            label={`${student.department || 'N/A'} • Sec ${student.classSection || 'N/A'}`}
                            size="small"
                            variant="outlined"
                            sx={{ fontFamily: fontBody, fontSize: 11.5, borderColor: border, color: slate600, borderRadius: '6px' }}
                          />
                        </TableCell>
                        <TableCell sx={tbodyCell}>
                          <Chip
                            label={currentStatus}
                            size="small"
                            sx={{
                              fontFamily: fontBody, fontWeight: 700, fontSize: 12, borderRadius: '6px',
                              bgcolor: isPresent ? alpha(TEAL, 0.1) : alpha(CRIMSON, 0.1), color: isPresent ? TEAL : CRIMSON,
                            }}
                          />
                        </TableCell>
                        <TableCell align="right" sx={tbodyCell}>
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Button
                              size="small"
                              onClick={() => handleStatusChange(student.id, 'Present')}
                              startIcon={<CheckCircle sx={{ fontSize: 16 }} />}
                              sx={
                                isPresent
                                  ? { bgcolor: TEAL, color: '#fff', fontFamily: fontBody, fontWeight: 600, fontSize: 12.5, textTransform: 'none', borderRadius: '8px', px: 1.6, '&:hover': { bgcolor: '#175255' } }
                                  : { color: TEAL, borderColor: alpha(TEAL, 0.35), border: '1px solid', fontFamily: fontBody, fontWeight: 600, fontSize: 12.5, textTransform: 'none', borderRadius: '8px', px: 1.6, '&:hover': { borderColor: TEAL, bgcolor: alpha(TEAL, 0.08) } }
                              }
                            >
                              Present
                            </Button>
                            <Button
                              size="small"
                              onClick={() => handleStatusChange(student.id, 'Absent')}
                              startIcon={<Cancel sx={{ fontSize: 16 }} />}
                              sx={
                                !isPresent
                                  ? { bgcolor: CRIMSON, color: '#fff', fontFamily: fontBody, fontWeight: 600, fontSize: 12.5, textTransform: 'none', borderRadius: '8px', px: 1.6, '&:hover': { bgcolor: '#6E2029' } }
                                  : { color: CRIMSON, borderColor: alpha(CRIMSON, 0.35), border: '1px solid', fontFamily: fontBody, fontWeight: 600, fontSize: 12.5, textTransform: 'none', borderRadius: '8px', px: 1.6, '&:hover': { borderColor: CRIMSON, bgcolor: alpha(CRIMSON, 0.08) } }
                              }
                            >
                              Absent
                            </Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 6, border: 'none' }}>
                      <Typography sx={{ fontFamily: fontBody, fontSize: 13.5, color: slate600 }}>
                        No students found matching your assigned Department and Year.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </Box>

        {/* Save action */}
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            disableElevation
            size="large"
            onClick={handleSubmitAttendance}
            disabled={submitting || loading || students.length === 0}
            sx={{
              bgcolor: INK, px: 4, py: 1.4, borderRadius: '10px', fontFamily: fontHead,
              fontWeight: 700, fontSize: 14, textTransform: 'none',
              '&:hover': { bgcolor: '#232C4D' }, '&.Mui-disabled': { bgcolor: alpha(INK, 0.3), color: '#fff' },
            }}
          >
            {submitting ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : 'Save & Submit Attendance'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

const theadCell = {
  fontFamily: fontBody, fontWeight: 600, fontSize: 12, color: slate400,
  textTransform: 'uppercase', letterSpacing: 0.4, borderBottom: `1px solid ${border}`, bgcolor: PARCHMENT_DEEP,
};
const tbodyCell = { borderBottom: `1px solid ${border}`, py: 1.4 };

export default TeacherAttendance;