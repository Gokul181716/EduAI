import React, { useState, useEffect, useRef } from "react";
import {
  Typography, Card, CardContent, Grid, Button, TextField,
  Alert, Tabs, Tab, Box, Table, TableBody, TableCell,
  TableHead, TableRow, Dialog, DialogActions, DialogContent, DialogTitle, Stack,
  Paper, IconButton, Tooltip, Avatar, Chip, MenuItem, Select,
  FormControl, InputLabel, ToggleButton, ToggleButtonGroup, CircularProgress, Divider, List, ListItem, ListItemAvatar, ListItemText, Checkbox,
  Fade, Grow, Slide, alpha, LinearProgress, Snackbar
} from '@mui/material';
import {
  UploadFile, Download, Dashboard as DashboardIcon,
  School, People, GroupAdd, Edit as EditIcon,
  Delete as DeleteIcon, PersonAdd, TrendingUp, Assessment, Quiz,
  AutoAwesome, EditNote, AddCircle, Delete, Visibility,
  Class as ClassIcon, Search, FilterList, Close, WorkspacePremium, MenuBook, Hub,
  EventNote, ImportExport, PersonAddAlt1
} from '@mui/icons-material';
import {
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LabelList
} from 'recharts';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';
import { useShell } from '../components/Layout';
import NotificationsIcon from '@mui/icons-material/Notifications';
import InsightsIcon from '@mui/icons-material/Insights';
import questionPools from '../data/questionPools';
import { generateCodingQuestions, CODING_CATEGORIES } from '../data/codingProblemGenerator';

const MCQ_CATEGORIES = ['All Topics (Mixed)',
  ...Object.keys(questionPools).map((k) => k
    .split(/\s+/)
    .map((w) => ({ sql: 'SQL', oop: 'OOP' }[w] || w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' '))
];

axios.defaults.withCredentials = true;

// ---------------------------------------------------------------
// DESIGN SYSTEM — "The Ledger"
// ---------------------------------------------------------------
const INK = '#141B33';
const INK_SOFT = '#232C4D';
const PARCHMENT = '#FBF8F1';
const PARCHMENT_DEEP = '#F3EEE0';
const GOLD = '#B8892B';
const GOLD_LIGHT = '#E2B857';
const TEAL = '#1F6F73';
const TEAL_LIGHT = '#3FA79E';
const CRIMSON = '#8C2F39';
const AMBER = '#C9772E';
const PLUM = '#5C4D8A';
const AMBER_LIGHT = '#E4A24B';

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
      @keyframes shimmerSweep {
        0% { transform: translateX(-120%) rotate(8deg); }
        100% { transform: translateX(220%) rotate(8deg); }
      }
      @keyframes railFadeUp {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
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
    { color: AMBER, top: '70%', left: '38%', size: 480, dur: 13 }
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
            background: `radial-gradient(circle, ${alpha(o.color, 0.16)}, transparent 70%)`,
            animation: `orbPulse ${o.dur}s ease-in-out infinite`
          }}
        />
      ))}
      <Box
        data-motion
        sx={{
          position: 'absolute', inset: -168,
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='84' height='84' viewBox='0 0 84 84'%3E%3Cg fill='none' stroke='%23141B33' stroke-width='1' opacity='0.07'%3E%3Ccircle cx='14' cy='14' r='2.2'/%3E%3Ccircle cx='70' cy='70' r='2.2'/%3E%3Ccircle cx='70' cy='14' r='1.4'/%3E%3Cline x1='14' y1='14' x2='70' y2='70'/%3E%3Cline x1='14' y1='14' x2='70' y2='14'/%3E%3C/g%3E%3C/svg%3E\")",
          backgroundRepeat: 'repeat',
          animation: 'networkDrift 34s linear infinite'
        }}
      />
      {glyphs.map(({ Icon, top, left, size, rot, dur }, i) => (
        <Icon
          key={`glyph-${i}`}
          data-motion
          sx={{
            position: 'absolute', top, left, fontSize: size, color: INK, opacity: 0.045,
            '--rot': `${rot}deg`,
            animation: `glyphFloat ${dur}s ease-in-out infinite`,
            animationDelay: `${i * 0.6}s`
          }}
        />
      ))}
    </Box>
  );
}

const COLLEGE_DEPARTMENTS = [
  "Computer Science & Engineering",
  "Mechanical Engineering",
  "Electrical & Electronics Engineering",
  "Civil Engineering",
  "Information Technology",
  "Artificial Intelligence & Data Science",
  "Business Administration",
  "Bachelor of Commerce (B.Com)",
  "Bachelor of Arts (English)"
];

const COLLEGE_SECTIONS = ["A", "B", "C", "D"];

const getYearsForDept = (dept) => {
  if (!dept) return [];
  const isEngineering = dept.includes("Engineering") || dept.includes("Technology") || dept.includes("Science");
  return isEngineering ? ["1st Year", "2nd Year", "3rd Year", "4th Year"] : ["1st Year", "2nd Year", "3rd Year"];
};

// --- SUB-COMPONENT 1: Bulk User Upload ---
function BulkUserUpload({ onSuccess }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [lastLog, setLastLog] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = (event) => setSelectedFile(event.target.files[0]);
  const handleDrag = (e, active) => { e.preventDefault(); e.stopPropagation(); setDragActive(active); };
  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) setSelectedFile(e.dataTransfer.files[0]);
  };

  const handleDownloadSample = () => {
    const sampleData = [
      { Role: "Teacher", Username: "faculty01@skct.edu.in", Department: "Computer Science & Engineering", Year: "All", ClassSection: "All" },
      { Role: "Student", Username: "student01@skct.edu.in", Department: "Computer Science & Engineering", Year: "2nd Year", ClassSection: "A" }
    ];
    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "EduAI_Bulk_Upload_Template.xlsx");
  };

  const handleUpload = async () => {
    if (!selectedFile) return alert("Please select an Excel file.");
    const formData = new FormData();
    formData.append("file", selectedFile);
    try {
      const response = await axios.post("http://localhost:8080/api/auth/bulk-upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      const logData = response.data.data;
      setLastLog(logData);
      const successCount = logData.filter(log => log.status === 'Success').length;
      const failCount = logData.filter(log => log.status.includes('Failed')).length;
      if (logData && logData.length > 0) {
        const ws = XLSX.utils.json_to_sheet(logData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Credentials Log");
        XLSX.writeFile(wb, "EduAI_Generated_Credentials.xlsx");
      }
      alert(`Bulk Upload Complete!\n\nSuccessfully Saved to Database: ${successCount}\nFailed to Save: ${failCount}\n\nThe credentials file has been auto-downloaded.`);
      setSelectedFile(null);
      onSuccess?.();
    } catch (err) {
      alert(err.response?.data?.error || "Error uploading file. Check console.");
    }
  };

  const handleDownloadLog = () => {
    if (!lastLog) return;
    const ws = XLSX.utils.json_to_sheet(lastLog);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Credentials Log");
    XLSX.writeFile(wb, "EduAI_Generated_Credentials.xlsx");
  };

  return (
    <Grow in timeout={500}>
      <Card elevation={0} sx={{ mb: 4, borderRadius: 2, overflow: 'hidden', border: `1px solid ${alpha(INK, 0.12)}`, boxShadow: `0 24px 48px -30px ${alpha(INK, 0.5)}` }}>
        <Box sx={{ background: GRADIENT_LEDGER, color: PARCHMENT, p: 4, textAlign: 'center', position: 'relative', borderBottom: `3px solid ${GOLD}` }}>
          <WorkspacePremium sx={{ fontSize: 30, mb: 1, color: GOLD_LIGHT }} />
          <Typography variant="h5" sx={{ fontFamily: FONT_DISPLAY, fontWeight: 600, letterSpacing: '0.02em' }}>
            Intelligent Department Bulk Import
          </Typography>
        </Box>
        <CardContent sx={{ p: 5, bgcolor: PARCHMENT }}>
          <Typography color="text.secondary" textAlign="center" sx={{ mb: 4, fontSize: '1.02rem' }}>
            Upload your Excel registry. The system will auto-route students to their respective Departments, Academic Years, and Class Sections.
          </Typography>
          <Stack spacing={3}>
            <Box
              component="label"
              onDragEnter={(e) => handleDrag(e, true)}
              onDragOver={(e) => handleDrag(e, true)}
              onDragLeave={(e) => handleDrag(e, false)}
              onDrop={handleDrop}
              sx={{
                border: '2px dashed', borderColor: dragActive ? GOLD : alpha(INK, 0.25),
                borderRadius: 2, p: 6, textAlign: 'center',
                bgcolor: dragActive ? alpha(GOLD, 0.08) : alpha(INK, 0.02),
                cursor: 'pointer', transition: 'all 0.25s ease',
                '&:hover': { borderColor: GOLD, bgcolor: alpha(GOLD, 0.06) }
              }}
            >
              <UploadFile sx={{ fontSize: 56, color: INK, mb: 2 }} />
              <Typography variant="h6" sx={{ fontFamily: FONT_DISPLAY, fontWeight: 600, color: INK }}>
                {selectedFile ? selectedFile.name : "Drag & Drop or Click to Browse .xlsx"}
              </Typography>
              <Typography variant="caption" color="text.secondary">Accepted formats: .xlsx, .xls</Typography>
              <input hidden type="file" accept=".xlsx,.xls" onChange={handleFileChange} />
            </Box>
            <Button
              variant="contained" size="large" onClick={handleUpload} disabled={!selectedFile}
              sx={{
                borderRadius: 1.5, py: 1.8, fontSize: '1rem', fontWeight: 700, textTransform: 'none',
                bgcolor: INK, color: PARCHMENT, boxShadow: `0 10px 24px -8px ${alpha(INK, 0.6)}`,
                '&:hover': { bgcolor: INK_SOFT }, '&.Mui-disabled': { bgcolor: alpha(INK, 0.2) }
              }}
            >
              Initialize Department Routing & Upload
            </Button>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button variant="outlined" startIcon={<Download />} fullWidth onClick={handleDownloadSample}
                sx={{ borderRadius: 1.5, py: 1.3, fontWeight: 700, textTransform: 'none', borderWidth: 1.5, borderColor: INK, color: INK, '&:hover': { borderWidth: 1.5, bgcolor: alpha(INK, 0.04) } }}>
                Get Excel Template
              </Button>
              <Button variant="contained" startIcon={<Download />} fullWidth onClick={handleDownloadLog} disabled={!lastLog}
                sx={{ borderRadius: 1.5, py: 1.3, fontWeight: 700, textTransform: 'none', bgcolor: TEAL, '&:hover': { bgcolor: '#195A5D' }, '&.Mui-disabled': { bgcolor: alpha(INK, 0.15) } }}>
                Re-Download Last Log
              </Button>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Grow>
  );
}

// --- SUB-COMPONENT 2: Manages Database Tables ---
function UserDatabaseManager({ role }) {
  const [users, setUsers] = useState([]);
  const [newAcc, setNewAcc] = useState({ username: '', password: '', role: role, department: '', year: '', classSection: '' });
  const [msg, setMsg] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editUser, setEditUser] = useState({ id: '', username: '', password: '', department: '', year: '', classSection: '' });

  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);

  const roleAccent = role === 'Teacher' ? CRIMSON : TEAL;

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`http://localhost:8080/api/auth/users/${role}`);
      setUsers(res.data);
    } catch (err) { console.error("Failed to fetch users", err); }
  };

  useEffect(() => {
    fetchUsers();
    setSelectedUsers([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:8080/api/auth/create-user', newAcc);
      setMsg({ type: 'success', text: response.data.message });
      setNewAcc({ username: '', password: '', role: role, department: '', year: '', classSection: '' });
      fetchUsers();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.error || "Error creating account" });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(`Permanently delete this ${role}?`)) {
      try {
        await axios.delete(`http://localhost:8080/api/auth/users/${id}`);
        fetchUsers();
        setSelectedUsers(selectedUsers.filter(uId => uId !== id));
      } catch (err) { alert("Failed to delete user."); }
    }
  };

  const openEditModal = (user) => {
    setEditUser({ id: user.id, username: user.username, password: user.password || '', department: user.department || '', year: user.year || '', classSection: user.classSection || '' });
    setEditOpen(true);
  };

  const handleEditSave = async () => {
    try {
      await axios.put(`http://localhost:8080/api/auth/users/${editUser.id}`, editUser);
      setEditOpen(false);
      fetchUsers();
    } catch (err) { alert("Failed to update user."); }
  };

  const availableFilterYears = filterDept ? getYearsForDept(filterDept) : [];
  const availableFilterClasses = [...new Set([
    ...COLLEGE_SECTIONS,
    ...users.filter(u =>
      (filterDept ? u.department === filterDept : true) &&
      (filterYear ? u.year === filterYear : true)
    ).map(u => u.classSection).filter(Boolean)
  ])].sort();

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = filterDept ? user.department === filterDept : true;
    const matchesYear = filterYear ? user.year === filterYear : true;
    const matchesClass = filterClass ? user.classSection === filterClass : true;
    return matchesSearch && matchesDept && matchesYear && matchesClass;
  });

  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedUsers(filteredUsers.map(user => user.id));
    else setSelectedUsers([]);
  };

  const handleSelectOne = (e, id) => {
    if (e.target.checked) setSelectedUsers([...selectedUsers, id]);
    else setSelectedUsers(selectedUsers.filter(userId => userId !== id));
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Are you sure you want to permanently delete the ${selectedUsers.length} selected ${role}(s)?`)) {
      try {
        await Promise.all(selectedUsers.map(id => axios.delete(`http://localhost:8080/api/auth/users/${id}`)));
        setSelectedUsers([]);
        fetchUsers();
        alert(`Successfully deleted ${selectedUsers.length} users.`);
      } catch (err) {
        alert("Error deleting some users. They may have already been removed.");
        fetchUsers();
      }
    }
  };

  return (
    <Box>
      {role === 'Student' && <BulkUserUpload onSuccess={fetchUsers} />}
      <Grow in timeout={450}>
        <Card elevation={0} sx={{ mb: 4, borderRadius: 2, border: `1px solid ${alpha(INK, 0.12)}`, boxShadow: `0 20px 40px -30px ${alpha(INK, 0.5)}` }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" gutterBottom sx={{ fontFamily: FONT_DISPLAY, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1.5, mb: 3, color: INK }}>
              <PersonAdd sx={{ color: roleAccent }} /> Register New {role}
            </Typography>
            <Fade in={Boolean(msg)} unmountOnExit>
              <Box sx={{ mb: msg ? 2 : 0 }}>{msg && <Alert severity={msg.type} sx={{ borderRadius: 1.5 }}>{msg.text}</Alert>}</Box>
            </Fade>
            <form onSubmit={handleCreate}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={2}>
                  <TextField fullWidth label={`${role} Username`} variant="outlined" required size="small"
                    value={newAcc.username} onChange={(e) => setNewAcc({ ...newAcc, username: e.target.value })} />
                </Grid>
                <Grid item xs={12} md={2}>
                  <TextField fullWidth label="Password" type="password" variant="outlined" required size="small"
                    value={newAcc.password} onChange={(e) => setNewAcc({ ...newAcc, password: e.target.value })} />
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth required size="small">
                    <InputLabel>Department</InputLabel>
                    <Select value={newAcc.department} label="Department" onChange={(e) => setNewAcc({ ...newAcc, department: e.target.value, year: '' })}>
                      {COLLEGE_DEPARTMENTS.map(dept => <MenuItem key={dept} value={dept}>{dept}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth required size="small" disabled={!newAcc.department}>
                    <InputLabel>Year</InputLabel>
                    <Select value={newAcc.year} label="Year" onChange={(e) => setNewAcc({ ...newAcc, year: e.target.value })}>
                      {getYearsForDept(newAcc.department).map(yr => <MenuItem key={yr} value={yr}>{yr}</MenuItem>)}
                      {role === 'Teacher' && <MenuItem value="All Years">All Years</MenuItem>}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField fullWidth label={role === 'Teacher' ? "Classes Managed" : "Section"} variant="outlined" size="small" placeholder="e.g., Section A" required
                    value={newAcc.classSection} onChange={(e) => setNewAcc({ ...newAcc, classSection: e.target.value })} />
                </Grid>
                <Grid item xs={12}>
                  <Button fullWidth type="submit" variant="contained" size="large"
                    sx={{ py: 1.5, mt: 1, borderRadius: 1.5, fontWeight: 700, textTransform: 'none', bgcolor: roleAccent, boxShadow: `0 10px 24px -8px ${alpha(roleAccent, 0.5)}`, '&:hover': { bgcolor: alpha(roleAccent, 0.85) } }}>
                    Create Account & Assign Routing
                  </Button>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>
      </Grow>

      <Fade in timeout={550}>
        <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 2, bgcolor: PARCHMENT_DEEP, border: `1px solid ${alpha(INK, 0.1)}` }}>
          <Typography variant="subtitle1" sx={{ fontFamily: FONT_DISPLAY, fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1, color: INK }}>
            <FilterList sx={{ color: GOLD }} /> Directory Search & Filters
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField fullWidth size="small" label="Search by Username..."
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{ startAdornment: <Search color="action" sx={{ mr: 1 }} /> }}
                sx={{ bgcolor: '#fff', borderRadius: 1 }} />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small" sx={{ bgcolor: '#fff', borderRadius: 1 }}>
                <InputLabel>Filter by Department</InputLabel>
                <Select value={filterDept} label="Filter by Department" onChange={(e) => { setFilterDept(e.target.value); setFilterYear(''); setFilterClass(''); }}>
                  <MenuItem value=""><em>All Departments</em></MenuItem>
                  {COLLEGE_DEPARTMENTS.map(dept => <MenuItem key={dept} value={dept}>{dept}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small" disabled={!filterDept} sx={{ bgcolor: filterDept ? '#fff' : 'transparent', borderRadius: 1 }}>
                <InputLabel>Filter by Year</InputLabel>
                <Select value={filterYear} label="Filter by Year" onChange={(e) => { setFilterYear(e.target.value); setFilterClass(''); }}>
                  <MenuItem value=""><em>All Years</em></MenuItem>
                  {availableFilterYears.map(yr => <MenuItem key={yr} value={yr}>{yr}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small" disabled={!filterYear} sx={{ bgcolor: filterYear ? '#fff' : 'transparent', borderRadius: 1 }}>
                <InputLabel>Filter by Section</InputLabel>
                <Select value={filterClass} label="Filter by Section" onChange={(e) => setFilterClass(e.target.value)}>
                  <MenuItem value=""><em>All Sections</em></MenuItem>
                  {availableFilterClasses.map(cls => <MenuItem key={cls} value={cls}>{cls}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button fullWidth variant="outlined"
                onClick={() => { setSearchQuery(''); setFilterDept(''); setFilterYear(''); setFilterClass(''); }}
                sx={{ py: 1, fontWeight: 700, textTransform: 'none', borderWidth: 1.5, color: INK, borderColor: INK, '&:hover': { borderWidth: 1.5 } }}>
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Fade>

      <Grow in timeout={650}>
        <Paper elevation={0} sx={{ borderRadius: 2, overflow: 'hidden', border: `1px solid ${alpha(INK, 0.12)}`, boxShadow: `0 20px 40px -30px ${alpha(INK, 0.5)}` }}>
          <Box sx={{ bgcolor: alpha(roleAccent, 0.08), p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: roleAccent }}>
              {filteredUsers.length} {role}(s) Found
            </Typography>
            <Fade in={selectedUsers.length > 0} unmountOnExit>
              <Button variant="contained" startIcon={<Delete />} onClick={handleBulkDelete}
                sx={{ fontWeight: 700, textTransform: 'none', borderRadius: 1.5, bgcolor: CRIMSON, '&:hover': { bgcolor: '#6E2029' } }}>
                Delete Selected ({selectedUsers.length})
              </Button>
            </Fade>
          </Box>

          <Table>
            <TableHead sx={{ background: GRADIENT_LEDGER }}>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox sx={{ color: alpha('#fff', 0.6), '&.Mui-checked': { color: GOLD_LIGHT } }}
                    onChange={handleSelectAll}
                    checked={filteredUsers.length > 0 && selectedUsers.length === filteredUsers.length}
                    indeterminate={selectedUsers.length > 0 && selectedUsers.length < filteredUsers.length} />
                </TableCell>
                <TableCell sx={{ color: PARCHMENT, fontWeight: 700 }}>User</TableCell>
                <TableCell sx={{ color: PARCHMENT, fontWeight: 700 }}>Password</TableCell>
                <TableCell sx={{ color: PARCHMENT, fontWeight: 700 }}>Department</TableCell>
                <TableCell sx={{ color: PARCHMENT, fontWeight: 700 }}>Year & Section</TableCell>
                <TableCell align="right" sx={{ color: PARCHMENT, fontWeight: 700 }}>Manage</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.length > 0 ? filteredUsers.map((user, idx) => (
                <TableRow key={user.id} hover sx={{ animation: `railFadeUp 0.35s ease ${idx * 0.03}s both`, transition: '0.2s', '&:hover': { bgcolor: alpha(roleAccent, 0.05) } }}>
                  <TableCell padding="checkbox">
                    <Checkbox checked={selectedUsers.includes(user.id)} onChange={(e) => handleSelectOne(e, user.id)} />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: roleAccent, fontWeight: 700, fontFamily: FONT_DISPLAY }}>
                        {user.username.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography fontWeight={700}>{user.username}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: FONT_MONO }}>ID: #{user.id}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontFamily: FONT_MONO, color: CRIMSON, fontWeight: 700 }}>{user.password}</TableCell>
                  <TableCell><Chip label={user.department || 'Unassigned'} size="small" variant="outlined" sx={{ borderColor: alpha(INK, 0.3) }} /></TableCell>
                  <TableCell>
                    <Typography fontWeight={700} color="text.secondary">
                      {user.year ? `${user.year} - ` : ''}{user.classSection || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit Profile & Routing">
                      <IconButton onClick={() => openEditModal(user)} sx={{ mr: 1, color: INK, '&:hover': { bgcolor: alpha(INK, 0.08) } }}><EditIcon /></IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Account">
                      <IconButton onClick={() => handleDelete(user.id)} sx={{ color: CRIMSON, '&:hover': { bgcolor: alpha(CRIMSON, 0.08) } }}><DeleteIcon /></IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <Typography variant="subtitle1" color="text.secondary">No matching {role}s found for these filters.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>
      </Grow>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} TransitionComponent={SlideUpTransition} PaperProps={{ sx: { borderRadius: 2, minWidth: { xs: 300, sm: '480px' }, overflow: 'hidden' } }}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: PARCHMENT, fontFamily: FONT_DISPLAY, fontWeight: 600, background: GRADIENT_LEDGER, borderBottom: `3px solid ${GOLD}` }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><EditIcon /> Edit Routing Credentials</Box>
          <IconButton size="small" onClick={() => setEditOpen(false)} sx={{ color: PARCHMENT }}><Close fontSize="small" /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ px: 3, mt: 3, bgcolor: PARCHMENT }}>
          <Stack spacing={3}>
            <TextField fullWidth label="Username" variant="outlined" value={editUser.username} onChange={(e) => setEditUser({ ...editUser, username: e.target.value })} />
            <TextField fullWidth label="Password" type="text" variant="outlined" value={editUser.password} onChange={(e) => setEditUser({ ...editUser, password: e.target.value })} />
            <FormControl fullWidth>
              <InputLabel>Department</InputLabel>
              <Select value={editUser.department} label="Department" onChange={(e) => setEditUser({ ...editUser, department: e.target.value, year: '' })}>
                {COLLEGE_DEPARTMENTS.map(dept => <MenuItem key={dept} value={dept}>{dept}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth disabled={!editUser.department}>
              <InputLabel>Academic Year</InputLabel>
              <Select value={editUser.year} label="Academic Year" onChange={(e) => setEditUser({ ...editUser, year: e.target.value })}>
                {getYearsForDept(editUser.department).map(yr => <MenuItem key={yr} value={yr}>{yr}</MenuItem>)}
                {role === 'Teacher' && <MenuItem value="All Years">All Years</MenuItem>}
              </Select>
            </FormControl>
            <TextField fullWidth label="Class / Section" variant="outlined" value={editUser.classSection} onChange={(e) => setEditUser({ ...editUser, classSection: e.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ pb: 3, px: 3, mt: 1, bgcolor: PARCHMENT }}>
          <Button onClick={() => setEditOpen(false)} sx={{ fontWeight: 700, textTransform: 'none', color: '#6B7280' }}>Cancel</Button>
          <Button variant="contained" onClick={handleEditSave}
            sx={{ borderRadius: 1.5, px: 4, fontWeight: 700, textTransform: 'none', bgcolor: roleAccent, '&:hover': { bgcolor: alpha(roleAccent, 0.85) } }}>
            Save Routing Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// --- SUB-COMPONENT 3: Class Roster & Teacher Assignment Manager ---
function ClassRosterManager() {
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [classAssignments, setClassAssignments] = useState({});

  useEffect(() => {
    Promise.all([
      axios.get('http://localhost:8080/api/auth/users/Student'),
      axios.get('http://localhost:8080/api/auth/users/Teacher')
    ]).then(([studentRes, teacherRes]) => {
      setStudents(studentRes.data);
      setTeachers(teacherRes.data);
    }).catch(err => console.error(err));
  }, []);

  const availableYears = selectedDept ? getYearsForDept(selectedDept) : [];
  const availableClasses = [...new Set([
    ...COLLEGE_SECTIONS,
    ...students.filter(s => s.department === selectedDept && s.year === selectedYear)
      .map(s => s.classSection).filter(Boolean)
  ])].sort();
  const classRoster = students.filter(s => s.department === selectedDept && s.year === selectedYear && s.classSection === selectedClass);
  const currentAssignedTeacherId = classAssignments[`${selectedDept}-${selectedYear}-${selectedClass}`] || '';

  const handleAssignTeacher = async (teacherId) => {
    if (!teacherId || !selectedDept) return;
    try {
      const payload = {
        department: selectedDept,
        year: selectedYear || 'All Years',
        classSection: selectedClass || 'All',
      };
      await axios.put(`http://localhost:8080/api/auth/users/${teacherId}`, payload);
      setClassAssignments(prev => ({ ...prev, [`${selectedDept}-${selectedYear}-${selectedClass}`]: teacherId }));
      alert(`Teacher assigned to ${selectedDept} • ${selectedYear || 'All Years'} • ${selectedClass || 'All'}`);
    } catch (err) {
      console.error('Failed to assign teacher', err);
      alert('Failed to assign teacher. Please try again.');
    }
  };

  return (
    <Grow in timeout={500}>
      <Card elevation={0} sx={{ borderRadius: 2, p: 4, minHeight: '600px', border: `1px solid ${alpha(INK, 0.12)}`, boxShadow: `0 20px 40px -30px ${alpha(INK, 0.5)}` }}>
        <Typography variant="h5" gutterBottom sx={{ fontFamily: FONT_DISPLAY, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1.5, mb: 1, color: INK }}>
          <ClassIcon sx={{ color: TEAL }} /> Roster & Attendance Setup
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Select a department, academic year, and section to view the student roster. Assign a teacher to this specific class so it appears in their portal for daily attendance marking.
        </Typography>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>1. Select Department</InputLabel>
              <Select value={selectedDept} label="1. Select Department" onChange={(e) => { setSelectedDept(e.target.value); setSelectedYear(''); setSelectedClass(''); }}>
                {COLLEGE_DEPARTMENTS.map(dept => <MenuItem key={dept} value={dept}>{dept}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth disabled={!selectedDept || availableYears.length === 0}>
              <InputLabel>2. Select Year</InputLabel>
              <Select value={selectedYear} label="2. Select Year" onChange={(e) => { setSelectedYear(e.target.value); setSelectedClass(''); }}>
                {availableYears.map(yr => <MenuItem key={yr} value={yr}>{yr}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth disabled={!selectedYear || availableClasses.length === 0}>
              <InputLabel>3. Select Section</InputLabel>
              <Select value={selectedClass} label="3. Select Section" onChange={(e) => setSelectedClass(e.target.value)}>
                {availableClasses.map(cls => <MenuItem key={cls} value={cls}>{cls}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Fade in={Boolean(selectedDept && selectedYear && selectedClass)} unmountOnExit timeout={400}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: 2, border: `1px solid ${alpha(INK, 0.1)}`, bgcolor: PARCHMENT_DEEP }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, pb: 2, borderBottom: `2px solid ${alpha(INK, 0.08)}`, flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography variant="h6" sx={{ fontFamily: FONT_DISPLAY, fontWeight: 600 }}>Class Roster: {selectedClass}</Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  <Chip label={selectedDept} size="small" sx={{ bgcolor: INK, color: PARCHMENT, fontWeight: 600 }} />
                  <Chip label={selectedYear} size="small" sx={{ bgcolor: TEAL, color: '#fff', fontWeight: 600 }} />
                </Box>
              </Box>
              <Box sx={{ minWidth: 300 }}>
                <Typography variant="caption" fontWeight={700} color="text.secondary" gutterBottom display="block">Assign Teacher for Attendance:</Typography>
                <FormControl fullWidth size="small">
                  <Select value={currentAssignedTeacherId} displayEmpty onChange={(e) => handleAssignTeacher(e.target.value)}
                    sx={{ bgcolor: '#fff', fontWeight: 700, borderRadius: 1 }}>
                    <MenuItem value="" disabled><em>Select a Teacher...</em></MenuItem>
                    {teachers.filter(t => t.department === selectedDept || !t.department).map(t => (
                      <MenuItem key={t.id} value={t.id}>Prof. {t.username}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>

            <Typography variant="subtitle1" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <People sx={{ color: TEAL }} /> Students Enrolled ({classRoster.length})
            </Typography>

            <List sx={{ width: '100%', bgcolor: '#fff', borderRadius: 2, border: `1px solid ${alpha(INK, 0.08)}`, maxHeight: 400, overflow: 'auto' }}>
              {classRoster.length > 0 ? classRoster.map((student, idx) => (
                <React.Fragment key={student.id}>
                  <ListItem sx={{ animation: `railFadeUp 0.3s ease ${idx * 0.025}s both`, transition: '0.2s', '&:hover': { bgcolor: alpha(TEAL, 0.05) } }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: INK, fontFamily: FONT_DISPLAY }}>{student.username.charAt(0).toUpperCase()}</Avatar>
                    </ListItemAvatar>
                    <ListItemText primary={<Typography fontWeight={700}>{student.username}</Typography>} secondary={`Student ID: #${student.id}`} />
                    <Chip label="Enrolled" size="small" sx={{ bgcolor: alpha(TEAL, 0.12), color: TEAL, fontWeight: 700 }} />
                  </ListItem>
                  <Divider component="li" />
                </React.Fragment>
              )) : (
                <ListItem><ListItemText primary="No students found in this class." /></ListItem>
              )}
            </List>
          </Paper>
        </Fade>
      </Card>
    </Grow>
  );
}

// --- SUB-COMPONENT 4: Admin Assessment & Quiz Creator ---
function AdminAssessmentManager() {
  const [viewMode, setViewMode] = useState('list');
  const [creationMode, setCreationMode] = useState('manual');
  const [title, setTitle] = useState('');
  const [type, setType] = useState('APTITUDE');
  const [durationMinutes, setDurationMinutes] = useState(20);
  const [questions, setQuestions] = useState([
    { text: '', category: 'Quantitative Aptitude', type: 'MCQ', options: ['', '', '', ''], answer: '', testCaseInput: '', expectedOutput: '', starterCode: { java: '', cpp: '', python: '' }, hiddenTestCases: [] }
  ]);
  const [autoConfig, setAutoConfig] = useState({ category: 'Quantitative Aptitude', difficulty: 'Medium', count: 5 });
  const [loadingAuto, setLoadingAuto] = useState(false);
  const [success, setSuccess] = useState(false);
  const [msgText, setMsgText] = useState('Assessment successfully published!');
  const [publishedTests, setPublishedTests] = useState([]);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState(null);

  useEffect(() => { if (viewMode === 'list') fetchPublishedTests(); }, [viewMode]);

  const fetchPublishedTests = async () => {
    try {
      const res = await axios.get('http://localhost:8080/api/assessments');
      setPublishedTests(res.data);
    } catch (err) { console.error("Failed to fetch assessments", err); }
  };

  const deleteAssessment = async (id) => {
    if (window.confirm("Delete this assessment?")) {
      await axios.delete(`http://localhost:8080/api/assessments/${id}`);
      fetchPublishedTests();
    }
  };

  const handleOpenView = (test) => { setSelectedAssessment(test); setViewDialogOpen(true); };
  const handleCloseView = () => { setViewDialogOpen(false); setSelectedAssessment(null); };

  const handleTypeChange = (e) => {
    setType(e.target.value);
    setAutoConfig(prev => ({ ...prev, category: e.target.value === 'CODING' ? 'All Topics (Mixed)' : 'Quantitative Aptitude' }));
  };

  const handleQuestionChange = (index, field, value) => {
    const updated = [...questions];
    updated[index][field] = value;
    setQuestions(updated);
  };

  const handleOptionChange = (qIndex, oIndex, value) => {
    const updated = [...questions];
    updated[qIndex].options[oIndex] = value;
    setQuestions(updated);
  };

  const addHiddenCase = (qIndex) => {
    const updated = [...questions];
    const q = { ...updated[qIndex] };
    q.hiddenTestCases = [...(q.hiddenTestCases || []), { input: '', output: '' }];
    updated[qIndex] = q;
    setQuestions(updated);
  };

  const removeHiddenCase = (qIndex, caseIndex) => {
    const updated = [...questions];
    const q = { ...updated[qIndex] };
    q.hiddenTestCases = (q.hiddenTestCases || []).filter((_, i) => i !== caseIndex);
    updated[qIndex] = q;
    setQuestions(updated);
  };

  const handleHiddenCaseChange = (qIndex, caseIndex, field, value) => {
    const updated = [...questions];
    const q = { ...updated[qIndex] };
    const cases = [...(q.hiddenTestCases || [])];
    cases[caseIndex] = { ...cases[caseIndex], [field]: value };
    q.hiddenTestCases = cases;
    updated[qIndex] = q;
    setQuestions(updated);
  };

  const addQuestionField = () => {
    setQuestions([...questions, { text: '', category: type === 'APTITUDE' ? 'Quantitative Aptitude' : 'Arrays & Strings', type: type === 'APTITUDE' ? 'MCQ' : 'CODING', options: ['', '', '', ''], answer: '', testCaseInput: '', expectedOutput: '', starterCode: { java: '', cpp: '', python: '' }, hiddenTestCases: [] }]);
  };

  const removeQuestionField = (index) => { setQuestions(questions.filter((_, i) => i !== index)); };

  const finalizeSave = () => {
    setSuccess(true);
    setTitle('');
    setQuestions([{ text: '', category: type === 'APTITUDE' ? 'Quantitative Aptitude' : 'Arrays & Strings', type: type === 'APTITUDE' ? 'MCQ' : 'CODING', options: ['', '', '', ''], answer: '', testCaseInput: '', expectedOutput: '', starterCode: { java: '', cpp: '', python: '' }, hiddenTestCases: [] }]);
    setTimeout(() => { setSuccess(false); setViewMode('list'); }, 2000);
  };

  const handleSaveAssessment = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:8080/api/assessments/create', { title, type, durationMinutes, questions });
      setMsgText('Manual Assessment successfully published!');
      finalizeSave();
    } catch (err) { alert("Error saving assessment."); }
  };

  const handleAutoGenerate = async () => {
    if (!title) return alert("Please enter an Assessment Title first.");
    setLoadingAuto(true);
    try {
      let generatedQuestions = [];
      let summaryNote = '';

      if (type === 'CODING') {
        generatedQuestions = generateCodingQuestions(autoConfig.count, autoConfig.category);
        const catCounts = {};
        generatedQuestions.forEach((g) => { catCounts[g.category] = (catCounts[g.category] || 0) + 1; });
        summaryNote = `Coding problems (${Object.entries(catCounts).map(([c, n]) => `${n} ${c}`).join(', ')}) with auto-generated hidden test cases`;
      } else {
        const pools = questionPools;

        const shuffle = (arr) => {
          const a = [...arr];
          for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
          }
          return a;
        };

        const count = Math.max(1, Math.min(autoConfig.count, 25));
        let poolKey = autoConfig.category.toLowerCase();
        let selectedPool;

        if (poolKey === 'all topics (mixed)' || !pools[poolKey]) {
          selectedPool = shuffle(Object.values(pools).flat());
        } else {
          selectedPool = shuffle(pools[poolKey]);
        }

        const usedTexts = new Set();
        const bucket = [];
        for (let i = 0; i < selectedPool.length && bucket.length < count; i++) {
          const item = selectedPool[i];
          if (usedTexts.has(item.q)) continue;
          usedTexts.add(item.q);
          bucket.push({
            text: item.q,
            category: item.cat,
            type: 'MCQ',
            options: [...item.opts],
            answer: item.ans,
            testCaseInput: '',
            expectedOutput: '',
            starterCode: { java: '', cpp: '', python: '' },
            hiddenTestCases: [],
          });
        }
        generatedQuestions = bucket;

        const catCounts = {};
        generatedQuestions.forEach((g) => { catCounts[g.category] = (catCounts[g.category] || 0) + 1; });
        summaryNote = `${generatedQuestions.length} ${autoConfig.category} questions`;
      }

      await axios.post('http://localhost:8080/api/assessments/create', {
        title, type, durationMinutes: Number(durationMinutes) || 20, questions: generatedQuestions
      });
      setMsgText(`Successfully auto-generated: ${summaryNote}`);
      finalizeSave();
    } catch (err) { alert("Failed to auto-generate."); } finally { setLoadingAuto(false); }
  };

  return (
    <Grow in timeout={500}>
      <Card elevation={0} sx={{ borderRadius: 2, p: 4, maxWidth: 950, mx: 'auto', border: `1px solid ${alpha(INK, 0.12)}`, boxShadow: `0 20px 40px -30px ${alpha(INK, 0.5)}` }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, borderBottom: `2px solid ${alpha(INK, 0.08)}`, pb: 2, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h5" sx={{ fontFamily: FONT_DISPLAY, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1.5, color: INK }}>
            <Quiz sx={{ color: GOLD }} /> Assessment Studio
          </Typography>
          <ToggleButtonGroup value={viewMode} exclusive onChange={(e, newMode) => newMode && setViewMode(newMode)} size="medium"
            sx={{ '& .MuiToggleButton-root': { fontWeight: 700, px: 3, textTransform: 'none', borderRadius: 1.5 }, '& .Mui-selected': { bgcolor: `${INK} !important`, color: `${PARCHMENT} !important` } }}>
            <ToggleButton value="build">Build New Test</ToggleButton>
            <ToggleButton value="list">View Published Tests</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Fade in={success} unmountOnExit><Alert severity="success" sx={{ mb: 3, borderRadius: 1.5 }}>{msgText}</Alert></Fade>

        {viewMode === 'list' && (
          <Box>
            <Typography variant="h6" sx={{ fontFamily: FONT_DISPLAY, fontWeight: 600 }} gutterBottom>Live Assessments in Database</Typography>
            {publishedTests.length === 0 ? <Alert severity="info" sx={{ borderRadius: 1.5 }}>No assessments published yet.</Alert> : (
              <Table>
                <TableHead sx={{ bgcolor: PARCHMENT_DEEP }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>ID</TableCell><TableCell sx={{ fontWeight: 700 }}>Title</TableCell><TableCell sx={{ fontWeight: 700 }}>Type</TableCell><TableCell sx={{ fontWeight: 700 }}>Questions</TableCell><TableCell align="right" sx={{ fontWeight: 700 }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {publishedTests.map((test) => (
                    <TableRow key={test.id} hover sx={{ '&:hover': { bgcolor: alpha(INK, 0.03) } }}>
                      <TableCell sx={{ fontFamily: FONT_MONO }}>#{test.id}</TableCell><TableCell sx={{ fontWeight: 700 }}>{test.title}</TableCell>
                      <TableCell><Chip label={test.type} size="small" sx={{ bgcolor: test.type === 'CODING' ? CRIMSON : TEAL, color: '#fff', fontWeight: 600 }} /></TableCell>
                      <TableCell>{test.questions?.length || 0} Qs</TableCell>
                      <TableCell align="right">
                        <Tooltip title="View Details"><IconButton onClick={() => handleOpenView(test)} sx={{ color: INK }}><Visibility /></IconButton></Tooltip>
                        <Tooltip title="Delete"><IconButton onClick={() => deleteAssessment(test.id)} sx={{ color: CRIMSON }}><Delete /></IconButton></Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            <Dialog open={viewDialogOpen} onClose={handleCloseView} maxWidth="md" fullWidth TransitionComponent={SlideUpTransition} PaperProps={{ sx: { borderRadius: 2, overflow: 'hidden' } }}>
              <DialogTitle sx={{ background: GRADIENT_LEDGER, color: PARCHMENT, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `3px solid ${GOLD}`, fontFamily: FONT_DISPLAY }}>
                <Typography variant="h6" sx={{ fontFamily: FONT_DISPLAY, fontWeight: 600 }}>{selectedAssessment?.title}</Typography>
                <Chip label={selectedAssessment?.type} sx={{ bgcolor: alpha('#fff', 0.15), color: PARCHMENT, fontWeight: 700 }} />
              </DialogTitle>
              <DialogContent sx={{ mt: 3, bgcolor: PARCHMENT }}>
                {selectedAssessment?.questions?.map((q, idx) => (
                  <Paper key={idx} elevation={0} sx={{ p: 3, mb: 3, bgcolor: '#fff', borderRadius: 2, border: `1px solid ${alpha(INK, 0.1)}` }}>
                    <Typography variant="subtitle2" fontWeight={700} sx={{ color: INK }} gutterBottom>Question #{idx + 1} &nbsp;<Chip label={q.category} size="small" variant="outlined" /></Typography>
                    <Typography variant="body1" sx={{ mb: 2, whiteSpace: 'pre-wrap', fontWeight: 500 }}>{q.text}</Typography>
                    {q.type === 'MCQ' ? (
                      <Typography variant="subtitle2" fontWeight={700} sx={{ color: TEAL }}>Correct Answer: {q.answer}</Typography>
                    ) : (
                      <Box>
                        <Typography variant="body2" fontWeight={700} sx={{ color: CRIMSON }}>Test Case Input: {q.testCaseInput}</Typography>
                        <Typography variant="body2" fontWeight={700} sx={{ color: TEAL, mb: 1 }}>Expected Output: {q.expectedOutput}</Typography>
                        <Paper sx={{ p: 2, bgcolor: INK, color: GOLD_LIGHT, fontFamily: FONT_MONO, fontSize: '0.9rem', overflowX: 'auto', borderRadius: 1.5 }}>
                          {q.starterCode?.java || "No starter code provided."}
                        </Paper>
                      </Box>
                    )}
                  </Paper>
                ))}
              </DialogContent>
              <DialogActions sx={{ p: 3, bgcolor: PARCHMENT_DEEP }}>
                <Button onClick={handleCloseView} variant="contained" sx={{ bgcolor: INK, borderRadius: 1.5, fontWeight: 700, textTransform: 'none', '&:hover': { bgcolor: INK_SOFT } }}>Close Viewer</Button>
              </DialogActions>
            </Dialog>
          </Box>
        )}

        {viewMode === 'build' && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
              <ToggleButtonGroup value={creationMode} exclusive onChange={(e, newMode) => newMode && setCreationMode(newMode)} size="small"
                sx={{ '& .MuiToggleButton-root': { fontWeight: 700, textTransform: 'none', borderRadius: 1.5 }, '& .Mui-selected': { bgcolor: `${CRIMSON} !important`, color: '#fff !important' } }}>
                <ToggleButton value="manual"><EditNote sx={{ mr: 1 }} /> Manual Add</ToggleButton>
                <ToggleButton value="auto"><AutoAwesome sx={{ mr: 1 }} /> Auto / AI Generate</ToggleButton>
              </ToggleButtonGroup>
            </Box>
            <Stack spacing={3} sx={{ mb: 4 }}>
              <TextField label="Assessment Title" fullWidth required value={title} onChange={(e) => setTitle(e.target.value)} />
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel id="domain-label">Assessment Domain</InputLabel>
                    <Select labelId="domain-label" value={type} label="Assessment Domain" onChange={handleTypeChange}>
                      <MenuItem value="APTITUDE">Aptitude, Logical & Verbal Reasoning</MenuItem>
                      <MenuItem value="CODING">Data Structures & Algorithms (Coding)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}><TextField label="Duration (Minutes)" type="number" fullWidth required value={durationMinutes} onChange={(e) => setDurationMinutes(Number(e.target.value))} /></Grid>
              </Grid>
            </Stack>

            {creationMode === 'auto' ? (
              <Paper elevation={0} sx={{ p: 4, borderRadius: 2, bgcolor: PARCHMENT_DEEP, border: '1.5px dashed', borderColor: alpha(GOLD, 0.6) }}>
                <Typography variant="h6" sx={{ fontFamily: FONT_DISPLAY, fontWeight: 600, color: INK }} gutterBottom><AutoAwesome sx={{ color: GOLD, mr: 1 }} />Automated Question Bank Generator</Typography>
                {type === 'CODING' ? (
                  <Alert severity="info" sx={{ mb: 3, borderRadius: 1.5 }}>
                    Generates real <strong>coding problems</strong> from a DSA library (Arrays, Sorting, Strings, Math, Recursion &amp; DP). Each problem includes C++/Java/Python starter code and <strong>auto-generated hidden test cases</strong> (edge cases: single element, negatives, duplicates, large inputs) that students are graded against. Max 8 questions.
                  </Alert>
                ) : (
                  <Alert severity="info" sx={{ mb: 3, borderRadius: 1.5 }}>
                    Generates multiple-choice aptitude / reasoning questions from the selected topic pool. Max 25 questions.
                  </Alert>
                )}
                <Grid container spacing={3} sx={{ mb: 4, mt: 1 }}>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                      <InputLabel id="auto-cat-label">Category / Topic</InputLabel>
                      <Select labelId="auto-cat-label" value={autoConfig.category} label="Category / Topic" onChange={(e) => setAutoConfig({ ...autoConfig, category: e.target.value })}>
                        {type === 'CODING'
                          ? CODING_CATEGORIES.map(cat => <MenuItem key={cat} value={cat}>{cat}</MenuItem>)
                          : MCQ_CATEGORIES.map(cat => <MenuItem key={cat} value={cat}>{cat}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                      <InputLabel>Difficulty Level</InputLabel>
                      <Select value={autoConfig.difficulty} label="Difficulty Level" onChange={(e) => setAutoConfig({ ...autoConfig, difficulty: e.target.value })}>
                        <MenuItem value="Easy">Easy (Service-based)</MenuItem><MenuItem value="Medium">Medium (Product-based)</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={4}><TextField label="Number of Questions" type="number" fullWidth inputProps={{ min: 1, max: type === 'CODING' ? 8 : 25 }} value={autoConfig.count} onChange={(e) => setAutoConfig({ ...autoConfig, count: Number(e.target.value) })} /></Grid>
                </Grid>
                <Button variant="contained" size="large" fullWidth onClick={handleAutoGenerate} disabled={loadingAuto}
                  sx={{ py: 1.8, fontWeight: 700, fontSize: '1.05rem', borderRadius: 1.5, textTransform: 'none', bgcolor: INK, '&:hover': { bgcolor: INK_SOFT } }} startIcon={<AutoAwesome />}>
                  {loadingAuto ? <CircularProgress size={24} sx={{ color: GOLD_LIGHT }} /> : `Auto-Generate & Publish ${autoConfig.count} Questions`}
                </Button>
                {loadingAuto && <LinearProgress sx={{ mt: 2, borderRadius: 2, height: 6, bgcolor: alpha(INK, 0.1), '& .MuiLinearProgress-bar': { bgcolor: GOLD } }} />}
              </Paper>
            ) : (
              <form onSubmit={handleSaveAssessment}>
                <Stack spacing={3}>
                  <Typography variant="h6" sx={{ fontFamily: FONT_DISPLAY, fontWeight: 600 }}>Manual Question Builder</Typography>
                  {questions.map((q, qIndex) => (
                    <Paper key={qIndex} elevation={0} sx={{ p: 3, borderRadius: 2, bgcolor: alpha(INK, 0.015), border: `1px solid ${alpha(INK, 0.08)}`, animation: `railFadeUp 0.3s ease ${qIndex * 0.05}s both` }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="subtitle2" fontWeight={700} sx={{ color: INK }}>Question #{qIndex + 1}</Typography>
                        {questions.length > 1 && (<Button color="error" size="small" onClick={() => removeQuestionField(qIndex)} sx={{ textTransform: 'none', fontWeight: 700 }}>Remove</Button>)}
                      </Box>
                      <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={12} md={6}>
                          <FormControl fullWidth size="small">
                            <InputLabel>Sub-Category</InputLabel>
                            <Select value={q.category} label="Sub-Category" onChange={(e) => handleQuestionChange(qIndex, 'category', e.target.value)}>
                              <MenuItem value="Python">Python</MenuItem>
                              <MenuItem value="SQL">SQL</MenuItem>
                              <MenuItem value="Data Structures">Data Structures</MenuItem>
                              <MenuItem value="Algorithms">Algorithms</MenuItem>
                              <MenuItem value="OOP">OOP</MenuItem>
                              <MenuItem value="Database">Database</MenuItem>
                              <MenuItem value="Programming">Programming</MenuItem>
                              <MenuItem value="Machine Learning">Machine Learning</MenuItem>
                              <MenuItem value="Deep Learning">Deep Learning</MenuItem>
                              <MenuItem value="Statistics">Statistics</MenuItem>
                              <MenuItem value="Web Development">Web Development</MenuItem>
                              <MenuItem value="Computer Networks">Computer Networks</MenuItem>
                              <MenuItem value="Operating Systems">Operating Systems</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                      </Grid>
                      <TextField label="Problem Description" fullWidth required multiline rows={2} value={q.text} onChange={(e) => handleQuestionChange(qIndex, 'text', e.target.value)} sx={{ mb: 2 }} />
                      {type === 'APTITUDE' ? (
                        <Box>
                          <Grid container spacing={2} sx={{ mb: 2 }}>
                            {q.options.map((opt, oIndex) => (<Grid item xs={12} sm={6} key={oIndex}><TextField label={`Option ${String.fromCharCode(65 + oIndex)}`} fullWidth size="small" value={opt} onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)} /></Grid>))}
                          </Grid>
                          <TextField label="Correct Answer Letter (e.g., A)" fullWidth size="small" value={q.answer} onChange={(e) => handleQuestionChange(qIndex, 'answer', e.target.value)} />
                        </Box>
                      ) : (
                        <Box>
                          <Grid container spacing={2} sx={{ mb: 2 }}>
                            <Grid item xs={12} md={6}><TextField label="Test Case Input (e.g., [1,2,3])" fullWidth size="small" required value={q.testCaseInput} onChange={(e) => handleQuestionChange(qIndex, 'testCaseInput', e.target.value)} /></Grid>
                            <Grid item xs={12} md={6}><TextField label="Expected Output (e.g., 6)" fullWidth size="small" required value={q.expectedOutput} onChange={(e) => handleQuestionChange(qIndex, 'expectedOutput', e.target.value)} /></Grid>
                          </Grid>
                          <Alert severity="info" sx={{ mb: 2 }}>
                            Students are graded by executing their code against the visible test case <strong>plus every hidden test case below</strong>. Hidden cases are never shown to students.
                          </Alert>
                          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Hidden Test Cases ({q.hiddenTestCases?.length || 0})</Typography>
                            <Button size="small" startIcon={<AddCircle />} onClick={() => addHiddenCase(qIndex)} sx={{ textTransform: 'none' }}>Add Hidden Case</Button>
                          </Stack>
                          {(q.hiddenTestCases || []).map((tc, ci) => (
                            <Grid container spacing={1} key={ci} alignItems="center" sx={{ mb: 1 }}>
                              <Grid item xs={5}><TextField label={`Hidden Input #${ci + 1}`} fullWidth size="small" value={tc.input} onChange={(e) => handleHiddenCaseChange(qIndex, ci, 'input', e.target.value)} /></Grid>
                              <Grid item xs={4}><TextField label="Expected Output" fullWidth size="small" value={tc.output} onChange={(e) => handleHiddenCaseChange(qIndex, ci, 'output', e.target.value)} /></Grid>
                              <Grid item xs={3}><Button size="small" color="error" onClick={() => removeHiddenCase(qIndex, ci)} sx={{ textTransform: 'none' }}>Remove</Button></Grid>
                            </Grid>
                          ))}
                          <Grid container spacing={2}>
                            <Grid item xs={12} md={4}><TextField label="C++" fullWidth multiline rows={3} value={q.starterCode?.cpp || ''} onChange={(e) => handleQuestionChange(qIndex, 'starterCode', { ...q.starterCode, cpp: e.target.value })} /></Grid>
                            <Grid item xs={12} md={4}><TextField label="Java" fullWidth multiline rows={3} value={q.starterCode?.java || ''} onChange={(e) => handleQuestionChange(qIndex, 'starterCode', { ...q.starterCode, java: e.target.value })} /></Grid>
                            <Grid item xs={12} md={4}><TextField label="Python" fullWidth multiline rows={3} value={q.starterCode?.python || ''} onChange={(e) => handleQuestionChange(qIndex, 'starterCode', { ...q.starterCode, python: e.target.value })} /></Grid>
                          </Grid>
                        </Box>
                      )}
                    </Paper>
                  ))}
                  <Button variant="outlined" startIcon={<AddCircle />} onClick={addQuestionField}
                    sx={{ py: 1.5, fontWeight: 700, textTransform: 'none', borderWidth: 1.5, color: INK, borderColor: INK, '&:hover': { borderWidth: 1.5 } }}>
                    Add Another Question
                  </Button>
                  <Button type="submit" variant="contained" size="large"
                    sx={{ py: 1.8, borderRadius: 1.5, fontWeight: 700, textTransform: 'none', bgcolor: INK, '&:hover': { bgcolor: INK_SOFT } }}>
                    Publish Manual Assessment
                  </Button>
                </Stack>
              </form>
            )}
          </Box>
        )}
      </Card>
    </Grow>
  );
}

// ---------------------------------------------------------------------------------
// OVERVIEW DASHBOARD — every figure is served by GET /api/dashboard/admin and is
// computed live from the database. No hardcoded statistics.
// ---------------------------------------------------------------------------------

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

function DashboardOverview({ stats, setSection }) {
  const totalStudents = stats?.totalStudents ?? 0;
  const totalTeachers = stats?.totalTeachers ?? 0;
  const activeCourses = stats?.activeCourses ?? 0;
  const activeAlerts = stats?.activeAlerts ?? 0;
  const avgAttendance = stats?.avgAttendance; // null => no records in window

  // Real chart datasets (empty arrays render honest empty states)
  const performanceData = stats?.assessmentAverages ?? [];
  const readinessData = (stats?.readinessDistribution ?? []).map((d, i) => ({
    ...d,
    color: [TEAL, GOLD_LIGHT][i] || INK,
  }));
  const attendanceBars = (stats?.attendanceByDept ?? []).map((b) => ({
    name: b.name,
    pct: Math.round(b.value),
  }));

  const placedCount = readinessData.find((d) => d.name === 'Placement Ready')?.value ?? 0;
  const analyzedTotal = readinessData.reduce((s, d) => s + d.value, 0);
  const readyPct = analyzedTotal > 0 ? Math.round((placedCount / analyzedTotal) * 100) : null;

  const recentActivity = stats?.recentActivity ?? [];

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
      {/* TOP ROW: Metric Cards */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, mb: 3, width: '100%' }}>
        <MetricCard title="Total Students" value={totalStudents} icon={<People fontSize="medium" />} iconBg={alpha(INK, 0.05)} iconColor={INK} />
        <MetricCard title="Total Teachers" value={totalTeachers} icon={<PersonAddAlt1 fontSize="medium" />} iconBg={alpha(INK, 0.05)} iconColor={INK} />
        <MetricCard title="Published Assessments" value={activeCourses} icon={<MenuBook fontSize="medium" />} iconBg={alpha(INK, 0.05)} iconColor={INK} />
        <MetricCard title={`Avg. Attendance (${stats?.attendanceWindowDays ?? 30}d)`} value={avgAttendance != null ? `${avgAttendance}%` : 'No data'} icon={<EventNote fontSize="medium" />} iconBg={TEAL} iconColor="#fff" />
        <MetricCard title="Placement Rate" value={stats?.overallPlacementRate != null ? `${stats.overallPlacementRate}%` : 'No data'} icon={<TrendingUp fontSize="medium" />} iconBg={GOLD_LIGHT} iconColor="#fff" />
      </Box>

      {/* MIDDLE ROW: Charts */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3, mb: 3, width: '100%' }}>
        {/* Bar Chart */}
        <Card elevation={0} sx={{ flex: 6, borderRadius: 2, border: `1px solid ${alpha(INK, 0.1)}`, height: 400 }}>
          <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" sx={{ fontFamily: FONT_DISPLAY, fontWeight: 700, mb: 3 }}>Average Score by Assessment</Typography>
            <Box sx={{ flexGrow: 1, minHeight: 0 }}>
              {performanceData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={performanceData} margin={{ top: 20, right: 10, left: -20, bottom: 5 }} barSize={28}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={alpha(INK, 0.1)} />
                    <XAxis dataKey="name" tick={{ fill: INK, fontWeight: 600, fontSize: 11 }} axisLine={false} tickLine={false} interval={0} />
                    <YAxis tick={{ fill: alpha(INK, 0.6) }} axisLine={false} tickLine={false} domain={[0, 100]} />
                    <RechartsTooltip cursor={{ fill: alpha(INK, 0.04) }} />
                    <Bar dataKey="score" name="Avg Score %" fill={TEAL}>
                      <LabelList dataKey="score" position="top" style={{ fill: INK, fontSize: 11, fontWeight: 700 }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChartState message="No submitted test attempts yet. Averages appear once students complete proctored assessments." />
              )}
            </Box>
          </CardContent>
        </Card>

        {/* Donut Chart */}
        <Card elevation={0} sx={{ flex: 4, borderRadius: 2, border: `1px solid ${alpha(INK, 0.1)}`, height: 400 }}>
          <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" sx={{ fontFamily: FONT_DISPLAY, fontWeight: 700, mb: 1 }}>Placement Readiness</Typography>
            <Box sx={{ flexGrow: 1, position: 'relative', minHeight: 0 }}>
              {analyzedTotal > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 20, right: 30, left: 30, bottom: 20 }}>
                      <Pie data={readinessData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value" stroke="none">
                        {readinessData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" payload={readinessData.map(d => ({ value: d.name, type: 'circle', id: d.name }))} />
                    </PieChart>
                  </ResponsiveContainer>
                  <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: INK, fontFamily: FONT_MONO, lineHeight: 1 }}>
                      {readyPct != null ? `${readyPct}%` : '—'}
                    </Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: INK }}>Ready</Typography>
                  </Box>
                </>
              ) : (
                <EmptyChartState message="No placement analyses have been run yet. Students generate this data from their dashboards." />
              )}
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* BOTTOM ROW 1: Attendance Analytics */}
      <Card elevation={0} sx={{ borderRadius: 2, border: `1px solid ${alpha(INK, 0.1)}`, mb: 3, width: '100%' }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontFamily: FONT_DISPLAY, fontWeight: 700, mb: 3 }}>
            Attendance by Department ({stats?.attendanceWindowDays ?? 30}-day window)
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4, width: '100%', alignItems: 'center' }}>

            {/* Left: Horizontal Bars */}
            <Box sx={{ flex: 6, width: '100%' }}>
              {attendanceBars.length > 0 ? (
                <Stack spacing={1.5}>
                  {attendanceBars.map((bar) => (
                    <Box key={bar.name} sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography sx={{ width: 90, fontWeight: 700, fontSize: 13, color: INK, noWrap: true }}>{bar.name}</Typography>
                      <Box sx={{ flexGrow: 1, mx: 2, bgcolor: alpha(TEAL, 0.1), height: 16, borderRadius: 1 }}>
                        <Box sx={{ width: `${bar.pct}%`, bgcolor: bar.pct >= 75 ? TEAL : CRIMSON, height: '100%', borderRadius: 1 }} />
                      </Box>
                      <Typography sx={{ width: 44, fontWeight: 700, fontSize: 13, color: INK, textAlign: 'right' }}>{bar.pct}%</Typography>
                    </Box>
                  ))}
                </Stack>
              ) : (
                <EmptyChartState message="No attendance records exist for this window yet." />
              )}
            </Box>

            {/* Right: Summary Status Boxes */}
            <Box sx={{ flex: 4, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, width: '100%' }}>
              <Box sx={{ flex: 1, p: 2, bgcolor: alpha(GOLD_LIGHT, 0.15), borderRadius: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '2px', bgcolor: GOLD_LIGHT }} />
                  <Typography variant="subtitle2" fontWeight={700} color={INK}>Departments Reporting</Typography>
                </Box>
                <Typography variant="h6" fontWeight={800} color={INK}>{attendanceBars.length}</Typography>
              </Box>

              <Box sx={{ flex: 1, p: 2, bgcolor: alpha(CRIMSON, 0.12), borderRadius: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '2px', bgcolor: CRIMSON }} />
                  <Typography variant="subtitle2" fontWeight={700} color={INK}>Students Below 75%</Typography>
                </Box>
                <Typography variant="h6" fontWeight={800} color={INK}>{activeAlerts}</Typography>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* BOTTOM ROW 2: Activity Log & Actions */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3, width: '100%' }}>
        <Card elevation={0} sx={{ flex: 3, borderRadius: 2, border: `1px solid ${alpha(INK, 0.1)}`, minHeight: 180 }}>
          <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ width: 14, height: 14, borderRadius: '3px', bgcolor: TEAL }} />
              <Typography fontWeight={700} color={INK}>Test Submitted</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ width: 14, height: 14, borderRadius: '3px', bgcolor: GOLD_LIGHT }} />
              <Typography fontWeight={700} color={INK}>Test In Progress</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ width: 14, height: 14, borderRadius: '3px', bgcolor: CRIMSON }} />
              <Typography fontWeight={700} color={INK}>Terminated / Expired</Typography>
            </Box>
          </CardContent>
        </Card>

        <Card elevation={0} sx={{ flex: 6, borderRadius: 2, border: `1px solid ${alpha(INK, 0.1)}`, minHeight: 180 }}>
          <CardContent sx={{ height: '100%' }}>
            <Typography variant="h6" sx={{ fontFamily: FONT_DISPLAY, fontWeight: 700, mb: 2 }}>Recent System Activity</Typography>
            {recentActivity.length > 0 ? (
              <Stack spacing={1.5}>
                {recentActivity.map((log) => (
                  <Box key={log.attemptId} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                    <Typography variant="body2" fontWeight={600} color={INK}>
                      {log.studentName || `#${log.studentId}`}
                      <Typography component="span" color="text.secondary"> — {log.assessmentTitle}</Typography>
                      {log.violations > 0 && (
                        <Chip size="small" label={`${log.violations} violation${log.violations > 1 ? 's' : ''}`}
                          sx={{ ml: 1, fontFamily: FONT_MONO, fontSize: 10, bgcolor: alpha(CRIMSON, 0.08), color: CRIMSON }} />
                      )}
                    </Typography>
                    <Chip
                      label={log.status}
                      size="small"
                      sx={{
                        fontFamily: FONT_MONO,
                        fontSize: 10,
                        bgcolor: log.status === 'SUBMITTED' ? alpha(TEAL, 0.1) : alpha(log.status === 'ACTIVE' ? GOLD_LIGHT : CRIMSON, 0.1),
                        color: log.status === 'SUBMITTED' ? TEAL : log.status === 'ACTIVE' ? '#8a6516' : CRIMSON,
                        fontWeight: 700,
                      }}
                    />
                  </Box>
                ))}
              </Stack>
            ) : (
              <EmptyChartState message="No test activity recorded yet." />
            )}
          </CardContent>
        </Card>

        <Card elevation={0} sx={{ flex: 3, borderRadius: 2, border: `1px solid ${alpha(INK, 0.1)}`, minHeight: 180 }}>
          <CardContent sx={{ height: '100%' }}>
            <Typography variant="h6" sx={{ fontFamily: FONT_DISPLAY, fontWeight: 700, mb: 2 }}>Quick Actions</Typography>
            <Grid container spacing={1.5}>
              <Grid item xs={6}>
                <Button fullWidth variant="outlined" onClick={() => setSection("students")} sx={{ color: INK, borderColor: alpha(INK, 0.2), fontWeight: 700, textTransform: 'none', py: 1, borderRadius: 1.5, '&:hover': { borderColor: INK, bgcolor: alpha(INK, 0.04) } }}>
                  + Add Student
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button fullWidth variant="outlined" onClick={() => setSection("teachers")} sx={{ color: INK, borderColor: alpha(INK, 0.2), fontWeight: 700, textTransform: 'none', py: 1, borderRadius: 1.5, '&:hover': { borderColor: INK, bgcolor: alpha(INK, 0.04) } }}>
                  + Add Teacher
                </Button>
              </Grid>
              <Grid item xs={12}>
                <Button fullWidth variant="outlined" onClick={() => setSection("placement")} sx={{ color: INK, borderColor: alpha(INK, 0.2), fontWeight: 700, textTransform: 'none', py: 1, borderRadius: 1.5, '&:hover': { borderColor: INK, bgcolor: alpha(INK, 0.04) } }}>
                  Create Assessment
                </Button>
              </Grid>
              <Grid item xs={12}>
                <Button fullWidth variant="outlined" onClick={() => setSection("notifications")} sx={{ color: INK, borderColor: alpha(INK, 0.2), fontWeight: 700, textTransform: 'none', py: 1, borderRadius: 1.5, '&:hover': { borderColor: INK, bgcolor: alpha(INK, 0.04) } }}>
                  Send Notification
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}

function AdminAnalytics({ section }) {
  const [stats, setStats] = useState({});
  useEffect(() => {
    axios.get('http://localhost:8080/api/dashboard/admin').then(res => setStats(res.data)).catch(() => {});
  }, []);

  const performanceData = stats?.assessmentAverages ?? [];
  const readinessData = (stats?.readinessDistribution ?? []).map((d, i) => ({ ...d, color: [TEAL, GOLD_LIGHT][i] || INK }));
  const attendanceBars = (stats?.attendanceByDept ?? []).map((b) => ({ name: b.name, pct: Math.round(b.value) }));

  const isAssessment = section === "analytics-assessment";

  return (
    <Fade in timeout={450}>
      <Box>
        <Typography variant="h5" sx={{ fontFamily: FONT_DISPLAY, fontWeight: 700, mb: 3 }}>
          {isAssessment ? "Assessment Analytics" : "Placement Analytics"}
        </Typography>

        <Grid container spacing={3}>
          {isAssessment && (
            <Grid item xs={12} md={8}>
              <Card elevation={0} sx={{ borderRadius: 2, border: `1px solid ${alpha(INK, 0.1)}` }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontFamily: FONT_DISPLAY, fontWeight: 700, mb: 2 }}>Assessment Averages by Category</Typography>
                  {performanceData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={performanceData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={alpha(INK, 0.08)} />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                        <RechartsTooltip />
                        <Bar dataKey="score" fill={PLUM} radius={[4, 4, 0, 0]}>
                          <LabelList dataKey="score" position="top" style={{ fontSize: 11, fontWeight: 700 }} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <EmptyChartState message="No assessment data available yet." />}
                </CardContent>
              </Card>
            </Grid>
          )}

          {!isAssessment && (
            <>
              <Grid item xs={12} md={6}>
                <Card elevation={0} sx={{ borderRadius: 2, border: `1px solid ${alpha(INK, 0.1)}` }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontFamily: FONT_DISPLAY, fontWeight: 700, mb: 2 }}>Placement Readiness</Typography>
                    {readinessData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie data={readinessData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85} label>
                            {readinessData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                          </Pie>
                          <RechartsTooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : <EmptyChartState message="No placement readiness data yet." />}
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card elevation={0} sx={{ borderRadius: 2, border: `1px solid ${alpha(INK, 0.1)}` }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontFamily: FONT_DISPLAY, fontWeight: 700, mb: 2 }}>Attendance by Department</Typography>
                    {attendanceBars.length > 0 ? (
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={attendanceBars} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={alpha(INK, 0.08)} />
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                          <RechartsTooltip />
                          <Bar dataKey="pct" fill={TEAL} radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : <EmptyChartState message="No attendance records yet." />}
                  </CardContent>
                </Card>
              </Grid>
            </>
          )}
        </Grid>
      </Box>
    </Fade>
  );
}

function AdminNotifications() {
  const [dept, setDept] = useState('');
  const [year, setYear] = useState('');
  const [section, setSectionLocal] = useState('');
  const [msgText, setMsgText] = useState('');
  const [sending, setSending] = useState(false);
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'info' });

  const handleSend = async () => {
    if (!msgText.trim()) return;
    setSending(true);
    try {
      const params = {};
      if (dept) params.department = dept;
      if (year) params.year = year;
      if (section) params.section = section;
      params.message = msgText;
      await axios.post('http://localhost:8080/api/notifications/send', params);
      setSnack({ open: true, msg: 'Notification sent.', severity: 'success' });
      setMsgText('');
    } catch (e) {
      setSnack({ open: true, msg: 'Failed to send notification.', severity: 'error' });
    }
    setSending(false);
  };

  const DEPARTMENTS = ['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Electrical', 'Business Administration', 'Biotechnology'];

  return (
    <Fade in timeout={450}>
      <Box sx={{ maxWidth: 640 }}>
        <Typography variant="h5" sx={{ fontFamily: FONT_DISPLAY, fontWeight: 700, mb: 3 }}>Send Notifications</Typography>
        <Card elevation={0} sx={{ borderRadius: 2, border: `1px solid ${alpha(INK, 0.1)}` }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Send alerts to students. Leave filters empty to broadcast to all students.
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Department (optional)</InputLabel>
                  <Select value={dept} label="Department (optional)" onChange={(e) => setDept(e.target.value)}>
                    <MenuItem value="">All</MenuItem>
                    {DEPARTMENTS.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Year (optional)</InputLabel>
                  <Select value={year} label="Year (optional)" onChange={(e) => setYear(e.target.value)}>
                    <MenuItem value="">All</MenuItem>
                    {['1','2','3','4'].map((y) => <MenuItem key={y} value={y}>Year {y}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6} sm={4}>
                <TextField fullWidth size="small" label="Section (optional)" value={section} onChange={(e) => setSectionLocal(e.target.value)} />
              </Grid>
            </Grid>
            <TextField
              fullWidth multiline minRows={3} label="Notification message"
              value={msgText} onChange={(e) => setMsgText(e.target.value)}
              sx={{ mb: 3 }}
            />
            <Button
              variant="contained" disabled={sending || !msgText.trim()}
              onClick={handleSend}
              sx={{ bgcolor: INK, fontWeight: 700, textTransform: 'none', borderRadius: 2, px: 4, "&:hover": { bgcolor: INK_SOFT } }}
            >
              {sending ? <CircularProgress size={20} color="inherit" /> : 'Send Notification'}
            </Button>
          </CardContent>
        </Card>
        <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack(s => ({ ...s, open: false }))}>
          <Alert severity={snack.severity}>{snack.msg}</Alert>
        </Snackbar>
      </Box>
    </Fade>
  );
}

// --- MAIN COMPONENT: Admin Dashboard ---
function AdminDashboard() {
  useLedgerFonts();
  const navigate = useNavigate();
  const { section, setSection } = useShell();
  const [stats, setStats] = useState({ totalStudents: 0, overallPlacementRate: '0%' });

  useEffect(() => {
    axios.get('http://localhost:8080/api/dashboard/admin').then(res => setStats(res.data)).catch(err => console.error(err));
  }, []);

  useEffect(() => {
    if (section === "profile") { navigate("/profile"); setSection("dashboard"); }
  }, [section, navigate, setSection]);

  const renderSection = () => {
    switch (section) {
      case "dashboard": return <DashboardOverview stats={stats} setSection={setSection} />;
      case "teachers": return <UserDatabaseManager role="Teacher" />;
      case "students": return <UserDatabaseManager role="Student" />;
      case "classes": return <ClassRosterManager />;
      case "placement": return <AdminAssessmentManager />;
      case "analytics-assessment":
      case "analytics-placement":
        return <AdminAnalytics section={section} />;
      case "notifications": return <AdminNotifications />;
      default: return null;
    }
  };

  return (
    <Box sx={{
      position: 'relative', minHeight: '100vh', pt: 4, pb: 10, overflow: 'hidden',
      bgcolor: PARCHMENT,
      backgroundImage: [
        `radial-gradient(900px 460px at 8% -8%, ${alpha(TEAL, 0.05)}, transparent)`,
        `radial-gradient(800px 420px at 100% 4%, ${alpha(GOLD, 0.06)}, transparent)`
      ].join(', ')
    }}>
      <LedgerKeyframes />
      <LedgerBackdrop />
      <Box sx={{ width: '100%', px: { xs: 2, sm: 3, md: 4 }, boxSizing: 'border-box', position: 'relative', zIndex: 1 }}>
        {renderSection()}
      </Box>
    </Box>
  );
}

export default AdminDashboard;