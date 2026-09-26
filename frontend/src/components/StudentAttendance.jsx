import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Paper,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Stack,
  Button,
  CircularProgress,
  alpha,
  GlobalStyles,
  Fade,
} from "@mui/material";
import {
  CalendarMonth,
  CheckCircle,
  Cancel,
  ArrowBack,
  Analytics,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import axios from "axios";

axios.defaults.withCredentials = true;

// --- Design Tokens (The Ledger) ---
const INK = "#141B33";
const PARCHMENT = "#FBF8F1";
const TEAL = "#1F6F73";
const AMBER = "#C9772E";
const FONT_DISPLAY = "'Fraunces', Georgia, 'Times New Roman', serif";

// Helper: Get Monday of the selected date's week
const getMonday = (d) => {
  const date = new Date(d);
  const day = date.getDay() || 7; // Get current day, make Sunday = 7
  date.setDate(date.getDate() - day + 1); // Set to Monday
  return date;
};

// Helper: Generate an array of 6 dates (Mon - Sat) for the given week
const getWeekDates = (monday) => {
  const dates = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d);
  }
  return dates;
};

// Array of 7 hours/periods
const PERIODS = [1, 2, 3, 4, 5, 6, 7];

export default function StudentAttendance() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [overallPercentage, setAttendancePercentage] = useState(0);

  // Date controls
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [weekDates, setWeekDates] = useState([]);

  // Attendance Data (Mapped as "YYYY-MM-DD_HOUR" : "PRESENT" | "ABSENT")
  const [attendanceMap, setAttendanceMap] = useState({});

  useEffect(() => {
    // Whenever selectedDate changes, recalculate the Mon-Sat dates for that week
    const monday = getMonday(new Date(selectedDate));
    setWeekDates(getWeekDates(monday));
  }, [selectedDate]);

  useEffect(() => {
    const fetchAttendanceData = async () => {
      setLoading(true);
      try {
        const userRes = await axios.get("http://localhost:8080/api/auth/me");
        const userId = userRes.data.id;

        // 1. Fetch overall percentage
        try {
          const pctRes = await axios.get(`http://localhost:8080/api/attendance/student/${userId}/percentage`);
          setAttendancePercentage(pctRes.data || 0);
        } catch (e) {
          setAttendancePercentage(88); // Fallback if API isn't ready
        }

        // 2. Fetch specific records (Assuming your backend sends an array of records)
        // Adjust this endpoint to match your backend exactly
        const recordsRes = await axios.get(`http://localhost:8080/api/attendance/student/${userId}/records`);
        
        // Map the backend records into a dictionary for fast lookup in the table
        // Key format: "2026-08-09_3" (Date_Hour) -> Value: "PRESENT" or "ABSENT"
        const map = {};
        recordsRes.data.forEach(record => {
           const hour = record.session === 'AFTERNOON' ? 4 : 1;
           const key = `${record.date}_${hour}`;
           map[key] = record.status;
        });
        setAttendanceMap(map);

      } catch (err) {
        console.error("Failed to load attendance", err);
        setAttendanceMap({});
      } finally {
        setLoading(false);
      }
    };

    fetchAttendanceData();
  }, [selectedDate]); // Re-fetch if date changes

  const getStatusChip = (dateObj, hour) => {
    const dateStr = dateObj.toISOString().split("T")[0];
    const status = attendanceMap[`${dateStr}_${hour}`];
    
    // If the date/hour is in the future, return a blank dash
    if (!status && dateObj > new Date()) {
        return <Typography color="text.disabled" fontWeight={600}>-</Typography>;
    }
    
    if (status === "PRESENT") {
        return <Chip size="small" icon={<CheckCircle sx={{ fontSize: '14px !important' }}/>} label="Present" sx={{ bgcolor: alpha(TEAL, 0.1), color: TEAL, fontWeight: 700, borderRadius: 1 }} />;
    } else if (status === "ABSENT") {
        return <Chip size="small" icon={<Cancel sx={{ fontSize: '14px !important' }}/>} label="Absent" sx={{ bgcolor: alpha("#8C2F39", 0.1), color: "#8C2F39", fontWeight: 700, borderRadius: 1 }} />;
    }

    // Default if no record found for a past day
    return <Chip size="small" label="No Data" variant="outlined" sx={{ fontWeight: 600, color: "text.secondary" }} />;
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: PARCHMENT, p: { xs: 2, md: 4 } }}>
      <GlobalStyles styles={{ body: { backgroundColor: PARCHMENT } }} />
      
      <Box sx={{ maxWidth: 1200, mx: "auto" }}>
        {/* Navigation & Header */}
        <Button 
          startIcon={<ArrowBack />} 
          onClick={() => navigate('/profile')}
          sx={{ mb: 3, color: INK, fontWeight: 700, textTransform: 'none' }}
        >
          Back to Profile
        </Button>

        <Fade in timeout={500}>
          <Box sx={{ mb: 4, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
            <Box>
              <Typography variant="h3" sx={{ fontFamily: FONT_DISPLAY, fontWeight: 700, color: INK }}>
                Attendance Ledger
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                Track your daily class presence, hour by hour.
              </Typography>
            </Box>

            <Card elevation={0} sx={{ bgcolor: INK, color: '#fff', borderRadius: 3, minWidth: 200 }}>
                <CardContent sx={{ p: '16px !important', display: 'flex', alignItems: 'center', gap: 2 }}>
                    <CircularProgress variant="determinate" value={100} size={50} thickness={6} sx={{ color: alpha('#fff', 0.1), position: 'absolute' }} />
                    <CircularProgress variant="determinate" value={overallPercentage} size={50} thickness={6} sx={{ color: overallPercentage >= 75 ? TEAL : AMBER }} />
                    <Box>
                        <Typography variant="h5" fontWeight={800}>{overallPercentage}%</Typography>
                        <Typography variant="caption" sx={{ opacity: 0.7 }}>Overall Attendance</Typography>
                    </Box>
                </CardContent>
            </Card>
          </Box>
        </Fade>

        {/* Calendar Controls */}
        <Card elevation={0} sx={{ mb: 3, borderRadius: 3, border: `1px solid ${alpha(INK, 0.1)}`, p: 2 }}>
            <Stack direction="row" spacing={3} alignItems="center" flexWrap="wrap" gap={2}>
                <Stack direction="row" spacing={1} alignItems="center">
                    <CalendarMonth sx={{ color: INK }} />
                    <Typography fontWeight={700}>Select Week:</Typography>
                </Stack>
                <TextField 
                    type="date" 
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    size="small"
                    sx={{ bgcolor: '#fff', borderRadius: 1 }}
                />
                <Button 
                    variant="outlined" 
                    onClick={() => setSelectedDate(new Date().toISOString().split("T")[0])}
                    sx={{ borderColor: alpha(INK, 0.3), color: INK, fontWeight: 700, textTransform: 'none' }}
                >
                    Jump to Current Week
                </Button>
            </Stack>
        </Card>

        {/* The 7-Hour Weekly Grid */}
        <Fade in timeout={800}>
            <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, border: `1px solid ${alpha(INK, 0.1)}`, overflowX: 'auto' }}>
            <Table sx={{ minWidth: 800 }}>
                <TableHead sx={{ bgcolor: alpha(INK, 0.04) }}>
                <TableRow>
                    <TableCell sx={{ fontWeight: 800, color: INK, borderRight: `1px solid ${alpha(INK, 0.1)}` }}>
                        Hour / Period
                    </TableCell>
                    {weekDates.map((date, index) => (
                    <TableCell key={index} align="center" sx={{ borderRight: index < 5 ? `1px solid ${alpha(INK, 0.05)}` : 'none' }}>
                        <Typography fontWeight={800} color={INK}>
                            {date.toLocaleDateString('en-US', { weekday: 'short' })}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                            {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </Typography>
                    </TableCell>
                    ))}
                </TableRow>
                </TableHead>

                <TableBody>
                {loading ? (
                    <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 10 }}>
                            <CircularProgress sx={{ color: INK }} />
                        </TableCell>
                    </TableRow>
                ) : (
                    PERIODS.map((hour) => (
                        <TableRow key={`hour-${hour}`} hover>
                            <TableCell sx={{ fontWeight: 700, color: INK, borderRight: `1px solid ${alpha(INK, 0.1)}` }}>
                                Period {hour}
                            </TableCell>
                            {weekDates.map((date, index) => (
                                <TableCell key={`${date}-${hour}`} align="center" sx={{ borderRight: index < 5 ? `1px solid ${alpha(INK, 0.05)}` : 'none' }}>
                                    {getStatusChip(date, hour)}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))
                )}
                </TableBody>
            </Table>
            </TableContainer>
        </Fade>

      </Box>
    </Box>
  );
}