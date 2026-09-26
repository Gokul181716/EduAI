import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import axios from "axios";

import {
  Avatar,
  Alert,
  Backdrop,
  Badge,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Fade,
  GlobalStyles,
  IconButton,
  LinearProgress,
  Paper,
  Skeleton,
  Slide,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
  alpha
} from "@mui/material";

import Grid from "@mui/material/Grid";

import {
  Badge as BadgeIcon,
  CameraAlt,
  Close,
  Email,
  FamilyRestroom,
  Hub,
  MenuBook,
  PhotoCamera,
  Psychology,
  Save,
  School,
  SmartToy,
  SupervisorAccount,
  Verified,
  AutoAwesome,
  Code,
  TrendingUp,
  GitHub,
  LinkedIn,
  Language,
  // 💡 NEW IMPORTS FOR ATS RESUME SCANNER
  Assessment,
  CloudUpload,
  CheckCircle,
  Lightbulb,
  Add
} from "@mui/icons-material";

import { useNavigate } from "react-router-dom";

const API = "http://localhost:8080/api";
axios.defaults.withCredentials = true;

// ---------------------------------------------------------------
// DESIGN SYSTEM — "The Ledger"
// ---------------------------------------------------------------
const INK = "#141B33";
const INK_SOFT = "#232C4D";
const PARCHMENT = "#FBF8F1";
const PARCHMENT_DEEP = "#F3EEE0";
const GOLD = "#B8892B";
const GOLD_LIGHT = "#E2B857";
const TEAL = "#1F6F73";
const TEAL_LIGHT = "#3FA79E";
const AMBER = "#C9772E";
const CRIMSON = "#8C2F39";
const PLUM = "#5B4B8A";

const FONT_DISPLAY = "'Fraunces', Georgia, 'Times New Roman', serif";
const FONT_MONO = "'JetBrains Mono', 'Roboto Mono', 'Courier New', monospace";

const GRADIENT_LEDGER = `linear-gradient(135deg, ${INK} 0%, #0D1226 100%)`;

function useLedgerFonts() {
  useEffect(() => {
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
    "50%": { boxShadow: `0 0 0 10px ${alpha(GOLD_LIGHT, 0)}` },
  },
  "@keyframes networkDrift": {
    "0%": { backgroundPosition: "0 0" },
    "100%": { backgroundPosition: "168px 168px" },
  },
  "@keyframes orbPulse": {
    "0%": { transform: "translate(0,0) scale(1)", opacity: 0.5 },
    "50%": { transform: "translate(18px,-14px) scale(1.16)", opacity: 0.85 },
    "100%": { transform: "translate(0,0) scale(1)", opacity: 0.5 },
  },
  "@keyframes glyphFloat": {
    "0%, 100%": { transform: "translateY(0) rotate(var(--rot, 0deg))" },
    "50%": { transform: "translateY(-22px) rotate(calc(var(--rot, 0deg) + 4deg))" },
  },
  "@keyframes scanSweep": {
    "0%": { top: "-4%", opacity: 0 },
    "6%": { opacity: 0.55 },
    "50%": { opacity: 0.55 },
    "94%": { opacity: 0 },
    "100%": { top: "104%", opacity: 0 },
  },
  "@keyframes ticker": {
    "0%": { transform: "translateX(0)" },
    "100%": { transform: "translateX(-50%)" },
  },
  "@media (prefers-reduced-motion: reduce)": {
    "[data-motion]": { animation: "none !important" },
  },
};

function LedgerBackdrop() {
  const glyphs = [
    { Icon: MenuBook, top: "5%", left: "82%", size: 190, rot: -10, dur: 9 },
    { Icon: School, top: "58%", left: "-3%", size: 230, rot: 8, dur: 11 },
    { Icon: Psychology, top: "1%", left: "4%", size: 140, rot: 6, dur: 8 },
    { Icon: SmartToy, top: "82%", left: "90%", size: 150, rot: -6, dur: 7.5 },
    { Icon: Hub, top: "90%", left: "20%", size: 120, rot: 14, dur: 10 },
  ];
  const orbs = [
    { color: TEAL, top: "-6%", left: "6%", size: 420, dur: 9 },
    { color: GOLD, top: "2%", left: "84%", size: 380, dur: 11 },
    { color: PLUM, top: "72%", left: "40%", size: 440, dur: 13 },
  ];

  return (
    <Box sx={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
      {orbs.map((o, i) => (
        <Box
          key={`orb-${i}`}
          data-motion
          sx={{
            position: "absolute", top: o.top, left: o.left, width: o.size, height: o.size,
            borderRadius: "50%", filter: "blur(10px)",
            background: `radial-gradient(circle, ${alpha(o.color, 0.13)}, transparent 70%)`,
            animation: `orbPulse ${o.dur}s ease-in-out infinite`,
          }}
        />
      ))}

      <Box
        data-motion
        sx={{
          position: "absolute", inset: -168,
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140' viewBox='0 0 140 140'%3E%3Cg fill='none' stroke='%23141B33' stroke-width='1' opacity='0.055'%3E%3Cline x1='20' y1='30' x2='70' y2='15'/%3E%3Cline x1='20' y1='30' x2='70' y2='70'/%3E%3Cline x1='20' y1='30' x2='70' y2='125'/%3E%3Cline x1='20' y1='90' x2='70' y2='15'/%3E%3Cline x1='20' y1='90' x2='70' y2='70'/%3E%3Cline x1='20' y1='90' x2='70' y2='125'/%3E%3Cline x1='70' y1='15' x2='120' y2='55'/%3E%3Cline x1='70' y1='70' x2='120' y2='55'/%3E%3Cline x1='70' y1='125' x2='120' y2='55'/%3E%3C/g%3E%3Cg fill='%23141B33' opacity='0.08'%3E%3Ccircle cx='20' cy='30' r='2.6'/%3E%3Ccircle cx='20' cy='90' r='2.6'/%3E%3Ccircle cx='70' cy='15' r='2.4'/%3E%3Ccircle cx='70' cy='70' r='2.4'/%3E%3Ccircle cx='70' cy='125' r='2.4'/%3E%3Ccircle cx='120' cy='55' r='3.2'/%3E%3C/g%3E%3C/svg%3E\")",
          backgroundRepeat: "repeat",
          animation: "networkDrift 36s linear infinite",
        }}
      />

      <Box
        data-motion
        sx={{
          position: "absolute", left: 0, right: 0, height: 2,
          background: `linear-gradient(90deg, transparent, ${alpha(GOLD_LIGHT, 0.55)}, transparent)`,
          animation: "scanSweep 13s linear infinite",
        }}
      />

      {glyphs.map(({ Icon, top, left, size, rot, dur }, i) => (
        <Icon
          key={`glyph-${i}`}
          data-motion
          sx={{
            position: "absolute", top, left, fontSize: size, color: INK, opacity: 0.04,
            "--rot": `${rot}deg`,
            animation: `glyphFloat ${dur}s ease-in-out infinite`,
            animationDelay: `${i * 0.6}s`,
          }}
        />
      ))}
    </Box>
  );
}

const SlideUpTransition = React.forwardRef(function SlideUpTransition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

function SectionHeader({ icon, title, subtitle, accent }) {
  return (
    <Box sx={{ width: "100%", mb: 3 }}>
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: accent,
            color: "#fff",
            boxShadow: `0 6px 16px ${alpha(INK, 0.2)}`
          }}
        >
          {icon}
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontFamily: FONT_DISPLAY, fontWeight: 700 }} lineHeight={1.2}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
      </Stack>
      <Divider sx={{ mt: 2, borderColor: alpha(INK, 0.08) }} />
    </Box>
  );
}

const REQUIRED_FIELDS = [
  "firstName", "lastName", "email", "phone", "registerNumber", "department", "year", "semester"
];

// ==============================================================================
// 💡 NEW WIDGET: AI RESUME & ATS SCANNER
// ==============================================================================
function ResumeAtsAnalyzerCard({ resumeAnalysis, analyzing, onUploadFile, onAddSkillToProfile }) {
  const fileInputRef = useRef(null);

  const getScoreColor = (score) => {
    if (score >= 75) return TEAL;
    if (score >= 50) return AMBER;
    return CRIMSON;
  };

  return (
    <Card elevation={0} sx={{ borderRadius: 3, border: `1px solid ${alpha(INK, 0.08)}`, bgcolor: "#fff", boxShadow: `0 10px 30px -22px ${alpha(INK, 0.3)}` }}>
      <CardContent sx={{ p: { xs: 3, md: 4 } }}>
        <SectionHeader
          icon={<Assessment fontSize="small" />}
          title="AI Resume & ATS Optimization Engine"
          subtitle="Trained neural parser evaluation against automated HR screening filters"
          accent={INK}
        />

        {/* Upload Zone */}
        <Box
          onClick={() => fileInputRef.current?.click()}
          sx={{
            p: 3,
            border: `2px dashed ${alpha(INK, 0.2)}`,
            borderRadius: 2,
            bgcolor: alpha(PARCHMENT_DEEP, 0.5),
            textAlign: "center",
            cursor: "pointer",
            transition: "all 0.25s",
            "&:hover": { borderColor: INK, bgcolor: alpha(INK, 0.03) }
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            hidden
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                onUploadFile(e.target.files[0]);
              }
            }}
          />
          {analyzing ? (
            <Stack direction="row" spacing={2} justifyContent="center" alignItems="center">
              <CircularProgress size={24} sx={{ color: INK }} />
              <Typography fontWeight={700} color={INK}>
                Neural ATS engine analyzing keywords, metrics & structure...
              </Typography>
            </Stack>
          ) : (
            <Stack alignItems="center" spacing={1}>
              <CloudUpload sx={{ fontSize: 36, color: INK }} />
              <Typography fontWeight={700} color={INK}>
                Upload or Drop Your Resume (PDF) to Calculate Live ATS Score
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Evaluates keyword density, action verbs, quantifiable achievements, and parsability
              </Typography>
            </Stack>
          )}
        </Box>

        {/* Results Display */}
        {resumeAnalysis && (
          <Fade in timeout={500}>
            <Box sx={{ mt: 4 }}>
              {/* Score Header */}
              <Grid container spacing={3} alignItems="center" sx={{ mb: 3 }}>
                <Grid item xs={12} sm={4} textAlign="center">
                  <Box sx={{ position: "relative", display: "inline-flex" }}>
                    <CircularProgress
                      variant="determinate"
                      value={100}
                      size={110}
                      thickness={6}
                      sx={{ color: alpha(INK, 0.08) }}
                    />
                    <CircularProgress
                      variant="determinate"
                      value={resumeAnalysis.ats_score}
                      size={110}
                      thickness={6}
                      sx={{
                        color: getScoreColor(resumeAnalysis.ats_score),
                        position: "absolute",
                        left: 0,
                      }}
                    />
                    <Box sx={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                      <Typography sx={{ fontFamily: FONT_MONO, fontWeight: 800, fontSize: 24, color: INK }}>
                        {resumeAnalysis.ats_score}%
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary" }}>
                        ATS Score
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={8}>
                  <Chip
                    label={resumeAnalysis.grade}
                    sx={{
                      fontWeight: 800,
                      bgcolor: alpha(getScoreColor(resumeAnalysis.ats_score), 0.12),
                      color: getScoreColor(resumeAnalysis.ats_score),
                      mb: 1
                    }}
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    {resumeAnalysis.summary}
                  </Typography>
                </Grid>
              </Grid>

              {/* Sub-Score Progress Bars */}
              <Box sx={{ p: 2.5, bgcolor: alpha(INK, 0.02), borderRadius: 2, border: `1px solid ${alpha(INK, 0.06)}`, mb: 3 }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2, color: INK }}>
                  ATS Criterion Breakdown
                </Typography>
                <Grid container spacing={2}>
                  {Object.entries(resumeAnalysis.sub_scores).map(([category, val]) => (
                    <Grid item xs={12} sm={6} key={category}>
                      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                        <Typography variant="caption" fontWeight={700} sx={{ textTransform: "capitalize", color: INK }}>
                          {category === "verbs" ? "Action Verbs" : category}
                        </Typography>
                        <Typography variant="caption" fontWeight={700} sx={{ fontFamily: FONT_MONO, color: getScoreColor(val) }}>
                          {val}%
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={val}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          bgcolor: alpha(INK, 0.08),
                          "& .MuiLinearProgress-bar": { bgcolor: getScoreColor(val) }
                        }}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Box>

              {/* Suggestions to Increase Score */}
              <Box sx={{ mb: 3 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                  <Lightbulb sx={{ color: GOLD, fontSize: 20 }} />
                  <Typography variant="subtitle2" fontWeight={800} color={INK}>
                    Actionable Steps to Increase Your Score
                  </Typography>
                </Stack>
                <Stack spacing={1}>
                  {resumeAnalysis.suggestions.map((sug, i) => (
                    <Paper key={i} elevation={0} sx={{ p: 1.5, borderRadius: 1.5, bgcolor: alpha(GOLD_LIGHT, 0.1), border: `1px solid ${alpha(GOLD, 0.2)}`, display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                      <CheckCircle sx={{ color: GOLD, fontSize: 18, mt: 0.2 }} />
                      <Typography variant="body2" fontWeight={600} color={INK}>
                        {sug}
                      </Typography>
                    </Paper>
                  ))}
                </Stack>
              </Box>

              {/* Detected Skills & Missing Skills */}
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="caption" fontWeight={800} color="text.secondary" display="block" sx={{ mb: 1 }}>
                    PARSED HARD SKILLS ({resumeAnalysis.detected_skills.length})
                  </Typography>
                  <Stack direction="row" flexWrap="wrap" gap={0.8}>
                    {resumeAnalysis.detected_skills.map((skill, idx) => (
                      <Chip
                        key={idx}
                        label={skill}
                        size="small"
                        onDelete={() => onAddSkillToProfile(skill)}
                        deleteIcon={<Tooltip title="Add to profile skills"><Add sx={{ color: "#fff !important" }} /></Tooltip>}
                        sx={{ bgcolor: TEAL, color: "#fff", fontWeight: 700, borderRadius: 1 }}
                      />
                    ))}
                  </Stack>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="caption" fontWeight={800} color="text.secondary" display="block" sx={{ mb: 1 }}>
                    RECOMMENDED HIGH-IMPACT KEYWORDS
                  </Typography>
                  <Stack direction="row" flexWrap="wrap" gap={0.8}>
                    {resumeAnalysis.missing_skills.map((skill, idx) => (
                      <Chip
                        key={idx}
                        label={`+ ${skill}`}
                        size="small"
                        onClick={() => onAddSkillToProfile(skill)}
                        sx={{ bgcolor: alpha(CRIMSON, 0.08), color: CRIMSON, fontWeight: 700, borderRadius: 1, border: `1px dashed ${alpha(CRIMSON, 0.3)}`, cursor: 'pointer' }}
                      />
                    ))}
                  </Stack>
                </Grid>
              </Grid>
            </Box>
          </Fade>
        )}
      </CardContent>
    </Card>
  );
}

// ==============================================================================
// WIDGET: Animated MNC Insights & Live Placement Radar
// ==============================================================================
const MNC_TRENDS = [
  {
    company: "Google", color: "#4285F4", icon: "G",
    roles: ["AI/ML Engineers", "Cloud Architecture", "Data Science"],
    news: "Google expanding production GenAI teams in Bangalore & Hyderabad hubs."
  },
  {
    company: "Microsoft", color: "#00A4EF", icon: "M",
    roles: ["Azure DevOps", "Cybersecurity", "Full Stack (.NET)"],
    news: "Aggressive hiring for zero-trust security and cloud modernization."
  },
  {
    company: "Amazon", color: "#FF9900", icon: "A",
    roles: ["SRE", "Cloud Infrastructure", "Backend Engineering"],
    news: "AWS India scaling operations to support enterprise cloud migrations."
  },
  {
    company: "TCS", color: "#E31837", icon: "T",
    roles: ["Data Analytics", "Enterprise IT", "Automation"],
    news: "TCS announces massive fresher drive targeting AI-ready graduates."
  },
  {
    company: "Accenture", color: "#A100FF", icon: "Ac",
    roles: ["MERN Stack", "Platform Rebuilds", "Data Engineering"],
    news: "Focusing on rapid product velocity and unifying tech stacks."
  }
];

function MncInsightsWidget() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % MNC_TRENDS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  return (
    <Card elevation={0} sx={{ borderRadius: 3, border: `1px solid ${alpha(INK, 0.08)}`, bgcolor: '#fff', boxShadow: `0 10px 30px -22px ${alpha(INK, 0.3)}`, overflow: 'hidden' }}>
      <Box sx={{ p: 2, bgcolor: INK, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <TrendingUp sx={{ color: GOLD_LIGHT }} />
          <Typography variant="h6" sx={{ fontFamily: FONT_DISPLAY, fontWeight: 700, letterSpacing: 0.5 }}>
            Live Placement Radar
          </Typography>
        </Stack>
        <Chip size="small" label="2026 Trends" sx={{ bgcolor: alpha(TEAL, 0.2), color: TEAL_LIGHT, fontWeight: 700, animation: 'pulseText 2s infinite' }} />
      </Box>

      <Box sx={{ position: 'relative', height: 165, p: 3 }}>
        {MNC_TRENDS.map((mnc, idx) => (
          <Box
            key={mnc.company}
            sx={{
              position: 'absolute', top: 20, left: 24, right: 24,
              opacity: currentIndex === idx ? 1 : 0,
              transform: currentIndex === idx ? 'translateY(0)' : 'translateY(10px)',
              transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
              pointerEvents: currentIndex === idx ? 'auto' : 'none'
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center" mb={1.5}>
              <Avatar sx={{ bgcolor: alpha(mnc.color, 0.1), color: mnc.color, width: 44, height: 44, fontWeight: 800, fontSize: 20, border: `1px solid ${alpha(mnc.color, 0.2)}` }}>
                {mnc.icon}
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight={800} color={INK} lineHeight={1.1}>{mnc.company}</Typography>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>Top Target Roles</Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={1} flexWrap="wrap" mb={1.5} rowGap={1}>
              {mnc.roles.map(r => <Chip key={r} label={r} size="small" sx={{ bgcolor: alpha(mnc.color, 0.08), color: mnc.color, fontWeight: 700, borderRadius: 1 }} />)}
            </Stack>
            <Typography variant="body2" sx={{ fontWeight: 600, color: INK_SOFT, display: 'flex', alignItems: 'center', gap: 1 }}>
              <AutoAwesome sx={{ color: GOLD, fontSize: 16 }} /> {mnc.news}
            </Typography>
          </Box>
        ))}
      </Box>

      <Box sx={{ bgcolor: PARCHMENT_DEEP, p: 1.2, borderTop: `1px solid ${alpha(INK, 0.05)}`, overflow: 'hidden' }}>
        <Box sx={{ display: 'inline-flex', animation: 'ticker 25s linear infinite', whiteSpace: 'nowrap' }}>
          <Typography variant="caption" fontWeight={700} sx={{ color: INK, pr: 6, fontSize: 13 }}>
            🚀 Deloitte: India AI talent demand to exceed 1.25M by 2027. • 🔥 70% of 2026 tech roles require AI/ML foundations. • 💼 Remote hiring normalizes salaries across Tier 2 & 3 cities.
          </Typography>
          <Typography variant="caption" fontWeight={700} sx={{ color: INK, pr: 6, fontSize: 13 }}>
            🚀 Deloitte: India AI talent demand to exceed 1.25M by 2027. • 🔥 70% of 2026 tech roles require AI/ML foundations. • 💼 Remote hiring normalizes salaries across Tier 2 & 3 cities.
          </Typography>
        </Box>
      </Box>
    </Card>
  );
}

// ==============================================================================

function StudentProfile() {
  useLedgerFonts();
  const navigate = useNavigate();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [userId, setUserId] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [uploading, setUploading] = useState(false);

  // Resume analysis state
  const [analyzingResume, setAnalyzingResume] = useState(false);
  const [resumeAnalysis, setResumeAnalysis] = useState(null);

  const [attendancePercentage, setAttendancePercentage] = useState(0);

  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const notify = useCallback((msg, type) => { setSnackbar({ open: true, message: msg, severity: type }); }, []);

  const [cameraOpen, setCameraOpen] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const getProfile = useCallback(async (id) => {
    try {
      const res = await axios.get(`${API}/student/profile/user/${id}`);
      setProfile(res.data);
      if (res.data.profilePhoto) {
        setPreview(`http://localhost:8080/uploads/profile/students/${res.data.profilePhoto}`);
      }

      try {
        const attRes = await axios.get(`${API}/attendance/student/${id}/percentage`);
        setAttendancePercentage(attRes.data || 0);
      } catch (attErr) {
        setAttendancePercentage(88);
      }
    } catch (error) {
      setProfile({
        user: { id: id }, registerNumber: "", firstName: "", lastName: "", email: "", phone: "", gender: "", dateOfBirth: "", address: "", department: "", year: "", semester: "", section: "", cgpa: "", parentName: "", parentEmail: "", tutorName: "", tutorEmail: "", hodName: "", hodEmail: "", skills: "", github: "", linkedin: "", portfolio: "", resume: "", bio: "", placementStatus: "", tenthPercentage: "", twelfthPercentage: "", backlogs: "", projectsCompleted: "", internshipsCompleted: "", hackathonsParticipated: "", certificationsCount: "", codingSkillRating: "", communicationSkillRating: "", aptitudeSkillRating: ""
      });
      setAttendancePercentage(0);
      notify("Please fill out your details to create your profile.", "info");
    } finally {
      setLoading(false);
    }
  }, [notify]);

  const getUserSession = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/auth/me`);
      setUserId(res.data.id);
      getProfile(res.data.id);
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  }, [getProfile]);

  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
    }
    setCameraOpen(false);
  }, []);

  useEffect(() => {
    getUserSession();
    return () => stopCamera();
  }, [getUserSession, stopCamera]);

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleAnalyzeResume = async (pdfFile) => {
    setAnalyzingResume(true);
    const formData = new FormData();
    formData.append("file", pdfFile);

    try {
      // 1. Send the file to Python Flask AI (withCredentials: false is the magic fix!)
      const res = await axios.post("http://localhost:5000/api/resume/analyze", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: false // 💡 THIS PREVENTS THE CORS "NETWORK ERROR"
      });

      if (res.data?.status === "success") {
        setResumeAnalysis(res.data.data);
        notify(`Resume Analyzed! ATS Score: ${res.data.data.ats_score}%`, "success");

        // 2. ISOLATED BLOCK: Now try saving to Spring Boot database
        if (profile?.id) {
          try {
            const springFormData = new FormData();
            springFormData.append("file", pdfFile);
            await axios.post(`${API}/student/profile/upload-resume/${profile.id}`, springFormData, {
              headers: { "Content-Type": "multipart/form-data" }
            });
            console.log("Resume securely saved to database.");
          } catch (springErr) {
            console.error("Spring Boot Save Error:", springErr);
            notify("AI Analysis succeeded, but failed to save file to main database.", "warning");
          }
        }
      } else {
        throw new Error("AI Engine failed to parse the document.");
      }
    } catch (err) {
      console.error("Flask AI Error:", err);
      notify(err.message || "Failed to connect to Flask AI Server.", "error");
    } finally {
      setAnalyzingResume(false);
    }
  };

  const handleAddSkill = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const newSkill = e.target.value.trim();
      if (newSkill) {
        const currentSkills = profile.skills ? profile.skills.split(',').map(s => s.trim()).filter(Boolean) : [];
        if (!currentSkills.includes(newSkill)) {
          setProfile({ ...profile, skills: [...currentSkills, newSkill].join(', ') });
        }
        e.target.value = '';
      }
    }
  };

  const handleAddDirectSkill = (skillName) => {
    const currentSkills = profile.skills ? profile.skills.split(',').map(s => s.trim()).filter(Boolean) : [];
    if (!currentSkills.includes(skillName)) {
      setProfile({ ...profile, skills: [...currentSkills, skillName].join(', ') });
      notify(`Added ${skillName} to your profile skills!`, "success");
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    const currentSkills = profile.skills.split(',').map(s => s.trim()).filter(Boolean);
    const updatedSkills = currentSkills.filter(s => s !== skillToRemove);
    setProfile({ ...profile, skills: updatedSkills.join(', ') });
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const profileData = {
        user: { id: userId }, registerNumber: profile.registerNumber, firstName: profile.firstName, lastName: profile.lastName, email: profile.email, phone: profile.phone, gender: profile.gender, dateOfBirth: profile.dateOfBirth, address: profile.address, department: profile.department, year: profile.year ? Number(profile.year) : 1, semester: profile.semester ? Number(profile.semester) : 1, section: profile.section, cgpa: profile.cgpa ? Number(profile.cgpa) : 0.0, parentName: profile.parentName, parentEmail: profile.parentEmail, tutorName: profile.tutorName, tutorEmail: profile.tutorEmail, hodName: profile.hodName, hodEmail: profile.hodEmail, skills: profile.skills, github: profile.github, linkedin: profile.linkedin, portfolio: profile.portfolio, resume: profile.resume, bio: profile.bio, placementStatus: profile.placementStatus
      };
      const numericFields = ["tenthPercentage", "twelfthPercentage", "backlogs", "projectsCompleted", "internshipsCompleted", "hackathonsParticipated", "certificationsCount", "codingSkillRating", "communicationSkillRating", "aptitudeSkillRating"];
      numericFields.forEach((f) => {
        profileData[f] = profile[f] === "" || profile[f] == null ? null : Number(profile[f]);
      });

      if (profile.id) {
        await axios.put(`${API}/student/profile/${profile.id}`, profileData);
        notify("Profile updated successfully", "success");
      } else {
        const res = await axios.post(`${API}/student/profile`, profileData);
        setProfile(res.data);
        notify("Profile created successfully", "success");
      }
    } catch (error) {
      console.log(error?.response);
      notify(error?.response?.data?.message || "Failed to save profile", "error");
    } finally {
      setSaving(false);
    }
  };

  const selectImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const startCamera = async () => {
    setCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      notify("Could not access camera. Please check permissions.", "error");
      setCameraOpen(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);

      canvasRef.current.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
          setSelectedImage(file);
          setPreview(URL.createObjectURL(file));
          stopCamera();
        }
      }, "image/jpeg");
    }
  };

  const uploadPhoto = async () => {
    if (!profile.id) return notify("Save profile details first before uploading a photo.", "warning");
    if (!selectedImage) return notify("Choose or take an image first", "warning");

    setUploading(true);
    const data = new FormData();
    data.append("file", selectedImage);

    try {
      await axios.post(`${API}/student/profile/upload-photo/${profile.id}`, data);
      notify("Photo uploaded successfully", "success");
      getProfile(userId);
    } catch (error) {
      notify("Upload failed", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleCloseSnackbar = () => setSnackbar((prev) => ({ ...prev, open: false }));

  const completion = useMemo(() => {
    if (!profile) return 0;
    const filled = REQUIRED_FIELDS.filter((f) => String(profile[f] ?? "").trim().length > 0).length;
    return Math.round((filled / REQUIRED_FIELDS.length) * 100);
  }, [profile]);

  if (loading) {
    return (
      <Box sx={{ p: 4, maxWidth: 1200, mx: "auto", position: "relative" }}>
        <GlobalStyles styles={keyframesStyles} />
        <Skeleton variant="text" width={260} height={56} sx={{ mb: 3 }} />
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
          <Box sx={{ width: { xs: '100%', md: '340px' }, flexShrink: 0 }}>
            <Skeleton variant="rounded" height={380} sx={{ borderRadius: 3 }} />
          </Box>
          <Box sx={{ flexGrow: 1 }}>
            <Skeleton variant="rounded" height={380} sx={{ borderRadius: 3 }} />
          </Box>
        </Box>
      </Box>
    );
  }

  if (!profile) {
    return (
      <Box sx={{ p: 4, textAlign: "center", mt: 10 }}>
        <Typography variant="h5" sx={{ fontFamily: FONT_DISPLAY, fontWeight: 700, color: CRIMSON }}>
          Authentication Required
        </Typography>
        <Typography color="text.secondary">Please log in to view your profile.</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        position: "relative",
        p: { xs: 2, md: 4 },
        pb: 12,
        maxWidth: 1200,
        mx: "auto",
        minHeight: "100vh",
        bgcolor: PARCHMENT,
        backgroundImage: [
          `radial-gradient(900px 460px at 8% -8%, ${alpha(TEAL, 0.05)}, transparent)`,
          `radial-gradient(800px 420px at 100% 4%, ${alpha(GOLD, 0.06)}, transparent)`
        ].join(", ")
      }}
    >
      <GlobalStyles styles={keyframesStyles} />
      <LedgerBackdrop />

      <Box sx={{ position: "relative", zIndex: 1 }}>

        {/* HEADER */}
        <Fade in timeout={500}>
          <Box sx={{ mb: 4, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
            <Box>
              <Stack direction="row" spacing={1.2} alignItems="center">
                <Box
                  data-motion
                  sx={{
                    width: 30, height: 30, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                    background: `radial-gradient(circle at 35% 30%, ${GOLD_LIGHT}, ${GOLD} 70%)`,
                    animation: "sealPulse 2.6s ease-in-out infinite",
                  }}
                >
                  <AutoAwesome sx={{ fontSize: 15, color: INK }} />
                </Box>
                <Typography variant="h4" sx={{ fontFamily: FONT_DISPLAY, fontWeight: 700, letterSpacing: "-0.3px", color: INK }}>
                  Student Profile
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, ml: "42px" }}>
                Keep your academic and contact details up to date
              </Typography>
            </Box>

            <Chip
              icon={completion === 100 ? <Verified sx={{ color: "#fff !important" }} /> : undefined}
              label={`${completion}% complete`}
              sx={{ fontWeight: 700, color: "#fff", bgcolor: completion === 100 ? TEAL : AMBER, px: 1 }}
            />
          </Box>
        </Fade>

        {/* BULLETPROOF FLEXBOX LAYOUT */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4, alignItems: 'flex-start' }}>

          {/* LEFT COLUMN — Avatar, Photo Controls & SOCIAL LINKS */}
          <Box sx={{ width: { xs: '100%', md: '340px', lg: '380px' }, flexShrink: 0 }}>
            <Fade in={mounted} timeout={600}>
              <Paper
                elevation={0}
                sx={{
                  p: 4, textAlign: "center", borderRadius: 3, position: "sticky", top: 16,
                  bgcolor: alpha("#fff", 0.85), backdropFilter: "blur(12px)",
                  border: `1px solid ${alpha(INK, 0.08)}`,
                  boxShadow: `0 20px 40px -24px ${alpha(INK, 0.35)}`
                }}
              >
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                  badgeContent={
                    <Tooltip title="Take a live photo">
                      <IconButton onClick={startCamera} size="small" sx={{ bgcolor: INK, color: GOLD_LIGHT, boxShadow: `0 4px 12px ${alpha(INK, 0.4)}`, "&:hover": { bgcolor: INK_SOFT } }}>
                        <CameraAlt fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  }
                >
                  <Avatar
                    src={preview}
                    sx={{
                      width: 176, height: 176, mx: "auto", mb: 1, fontSize: 56, fontWeight: 700, fontFamily: FONT_DISPLAY,
                      bgcolor: alpha(GOLD, 0.3), border: `4px solid ${alpha(GOLD, 0.5)}`,
                      boxShadow: `0 12px 28px -8px ${alpha(INK, 0.45)}`, transition: "transform 0.35s ease",
                      "&:hover": { transform: "scale(1.03)" }
                    }}
                  >
                    {profile.firstName?.charAt(0) || "U"}
                  </Avatar>
                </Badge>

                <Stack spacing={1.2} sx={{ mt: 3 }}>
                  <Button
                    component="label" variant="contained" fullWidth startIcon={<PhotoCamera />}
                    sx={{
                      borderRadius: 2, py: 1.1, textTransform: "none", fontWeight: 700, bgcolor: INK,
                      boxShadow: `0 8px 20px -6px ${alpha(INK, 0.5)}`, transition: "all 0.25s ease",
                      "&:hover": { bgcolor: INK_SOFT, transform: "translateY(-2px)" }
                    }}
                  >
                    Choose file
                    <input hidden type="file" accept="image/*" onChange={selectImage} />
                  </Button>

                  <Button
                    fullWidth variant="outlined" onClick={uploadPhoto} disabled={uploading}
                    startIcon={uploading ? <CircularProgress size={16} /> : null}
                    sx={{
                      borderRadius: 2, py: 1.1, textTransform: "none", fontWeight: 700,
                      borderWidth: 1.5, color: INK, borderColor: INK,
                      "&:hover": { borderWidth: 1.5, bgcolor: alpha(INK, 0.04) }
                    }}
                  >
                    {uploading ? "Uploading..." : "Upload selected photo"}
                  </Button>
                </Stack>

                <Divider sx={{ my: 3 }} />

                <Typography variant="h5" sx={{ fontFamily: FONT_DISPLAY, fontWeight: 700 }}>
                  {profile.firstName || "New"} {profile.lastName || "Student"}
                </Typography>
                <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 1.5 }} flexWrap="wrap">
                  <Chip icon={<School sx={{ color: "#fff !important" }} />} label={profile.department || "No department"} sx={{ bgcolor: INK, color: "#fff", fontWeight: 600 }} />
                  {profile.registerNumber && (
                    <Chip icon={<BadgeIcon sx={{ color: "#fff !important" }} />} label={profile.registerNumber} sx={{ bgcolor: TEAL, color: "#fff", fontWeight: 600, fontFamily: FONT_MONO }} />
                  )}
                </Stack>

                <Box sx={{ mt: 3, textAlign: "left" }}>
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Profile strength</Typography>
                    <Typography variant="caption" fontWeight={700} sx={{ fontFamily: FONT_MONO, color: INK }}>{completion}%</Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate" value={completion}
                    sx={{
                      height: 8, borderRadius: 5, backgroundColor: alpha(INK, 0.08),
                      "& .MuiLinearProgress-bar": { borderRadius: 5, bgcolor: completion === 100 ? TEAL : AMBER }
                    }}
                  />
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* SOCIAL LINKS */}
                <Box sx={{ textAlign: "left" }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: 1, display: 'block', mb: 2 }}>
                    Connect & Socials
                  </Typography>
                  
                  <Stack spacing={1.5}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="LinkedIn URL"
                      name="linkedin"
                      value={profile.linkedin || ""}
                      onChange={handleChange}
                      InputProps={{
                        startAdornment: (
                          <Tooltip title={profile.linkedin ? "Open LinkedIn Profile" : "Add a link first"}>
                            <span>
                              <IconButton
                                component="a"
                                href={profile.linkedin?.startsWith('http') ? profile.linkedin : `https://${profile.linkedin}`}
                                target="_blank"
                                disabled={!profile.linkedin}
                                sx={{ p: 0.5, mr: 0.5, color: profile.linkedin ? '#0A66C2' : 'text.disabled' }}
                              >
                                <LinkedIn fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        ),
                      }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: alpha(INK, 0.02) } }}
                    />

                    <TextField
                      fullWidth
                      size="small"
                      placeholder="GitHub URL"
                      name="github"
                      value={profile.github || ""}
                      onChange={handleChange}
                      InputProps={{
                        startAdornment: (
                          <Tooltip title={profile.github ? "Open GitHub Profile" : "Add a link first"}>
                            <span>
                              <IconButton
                                component="a"
                                href={profile.github?.startsWith('http') ? profile.github : `https://${profile.github}`}
                                target="_blank"
                                disabled={!profile.github}
                                sx={{ p: 0.5, mr: 0.5, color: profile.github ? '#333' : 'text.disabled' }}
                              >
                                <GitHub fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        ),
                      }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: alpha(INK, 0.02) } }}
                    />

                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Portfolio / Website URL"
                      name="portfolio"
                      value={profile.portfolio || ""}
                      onChange={handleChange}
                      InputProps={{
                        startAdornment: (
                          <Tooltip title={profile.portfolio ? "Visit Portfolio" : "Add a link first"}>
                            <span>
                              <IconButton
                                component="a"
                                href={profile.portfolio?.startsWith('http') ? profile.portfolio : `https://${profile.portfolio}`}
                                target="_blank"
                                disabled={!profile.portfolio}
                                sx={{ p: 0.5, mr: 0.5, color: profile.portfolio ? TEAL : 'text.disabled' }}
                              >
                                <Language fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        ),
                      }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: alpha(INK, 0.02) } }}
                    />
                  </Stack>
                </Box>
              </Paper>
            </Fade>
          </Box>

          {/* RIGHT COLUMN — ATS Engine, Attendance, Form Details */}
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Fade in={mounted} timeout={800}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

                {/* 💡 THE ATS SCANNER & RESUME ANALYZER COMPONENT */}
                <ResumeAtsAnalyzerCard
                  resumeAnalysis={resumeAnalysis}
                  analyzing={analyzingResume}
                  onUploadFile={handleAnalyzeResume}
                  onAddSkillToProfile={handleAddDirectSkill}
                />

                <MncInsightsWidget />

                {/* QUICK STATS ROW (ATTENDANCE & CGPA) */}
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 3 }}>
                  <Card elevation={0} sx={{ borderRadius: 3, border: `1px solid ${alpha(INK, 0.08)}`, bgcolor: '#fff', height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 3, p: 3, flexGrow: 1 }}>
                      <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                        <CircularProgress variant="determinate" value={100} size={64} thickness={5} sx={{ color: alpha(INK, 0.08) }} />
                        <CircularProgress
                          variant="determinate"
                          value={attendancePercentage}
                          size={64}
                          thickness={5}
                          sx={{ color: attendancePercentage < 75 ? CRIMSON : TEAL, position: 'absolute', left: 0 }}
                        />
                        <Box sx={{ top: 0, left: 0, bottom: 0, right: 0, position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Typography variant="caption" fontWeight={800} fontSize={14} sx={{ fontFamily: FONT_MONO }}>{attendancePercentage}%</Typography>
                        </Box>
                      </Box>
                      <Box>
                        <Typography variant="h6" sx={{ fontFamily: FONT_DISPLAY, fontWeight: 700 }}>Attendance</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {attendancePercentage >= 75 ? "You have a good standing." : "Below the 75% requirement."}
                        </Typography>
                      </Box>
                    </CardContent>
                    <Box sx={{ p: 2, pt: 0 }}>
                      <Button 
                        fullWidth 
                        variant="outlined" 
                        onClick={() => navigate('/student/attendance')}
                        sx={{ 
                          borderRadius: 2, 
                          fontWeight: 700, 
                          textTransform: 'none',
                          color: INK,
                          borderColor: alpha(INK, 0.3),
                          '&:hover': { borderColor: INK, bgcolor: alpha(INK, 0.04) }
                        }}
                      >
                        View Full History
                      </Button>
                    </Box>
                  </Card>

                  <Card elevation={0} sx={{ borderRadius: 3, border: `1px solid ${alpha(INK, 0.08)}`, bgcolor: '#fff', height: '100%' }}>
                    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 3, p: 3 }}>
                      <Avatar sx={{ width: 64, height: 64, bgcolor: alpha(GOLD, 0.15), color: GOLD }}>
                        <Typography variant="h6" fontWeight={800} sx={{ fontFamily: FONT_MONO }}>{profile.cgpa || "N/A"}</Typography>
                      </Avatar>
                      <Box>
                        <Typography variant="h6" sx={{ fontFamily: FONT_DISPLAY, fontWeight: 700 }}>Current CGPA</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Your latest registered academic score.
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Box>

                {/* PERSONAL INFO */}
                <Card elevation={0} sx={{ borderRadius: 3, border: `1px solid ${alpha(INK, 0.08)}`, boxShadow: `0 10px 30px -22px ${alpha(INK, 0.3)}` }}>
                  <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                    <SectionHeader icon={<Email fontSize="small" />} title="Personal Information" subtitle="Your identity and contact details" accent={INK} />
                    <Grid container spacing={2.5}>
                      <Grid item xs={12} md={6}>
                        <TextField fullWidth label="Register Number *" name="registerNumber" value={profile.registerNumber || ""} onChange={handleChange} />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField fullWidth label="Email *" name="email" value={profile.email || ""} onChange={handleChange} />
                      </Grid>

                      {[["firstName", "First Name *"], ["lastName", "Last Name"], ["phone", "Phone"]].map((item) => (
                        <Grid item xs={12} md={4} key={item[0]}>
                          <TextField fullWidth label={item[1]} name={item[0]} value={profile[item[0]] || ""} onChange={handleChange} />
                        </Grid>
                      ))}

                      <Grid item xs={12}>
                        <TextField fullWidth multiline rows={2} label="Address" name="address" value={profile.address || ""} onChange={handleChange} />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* ACADEMIC INFO */}
                <Card elevation={0} sx={{ borderRadius: 3, border: `1px solid ${alpha(INK, 0.08)}`, boxShadow: `0 10px 30px -22px ${alpha(INK, 0.3)}` }}>
                  <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                    <SectionHeader icon={<School fontSize="small" />} title="Academic Information" subtitle="Department, year and performance" accent={TEAL} />
                    <Grid container spacing={2.5}>
                      <Grid item xs={12} md={6}>
                        <TextField fullWidth label="Department *" name="department" value={profile.department || ""} onChange={handleChange} />
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <TextField fullWidth label="Year *" name="year" type="number" value={profile.year || ""} onChange={handleChange} />
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <TextField fullWidth label="Semester *" name="semester" type="number" value={profile.semester || ""} onChange={handleChange} />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField fullWidth label="Section" name="section" value={profile.section || ""} onChange={handleChange} />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField fullWidth label="CGPA" name="cgpa" type="number" inputProps={{ step: "0.01" }} value={profile.cgpa || ""} onChange={handleChange} />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                <Card elevation={0} sx={{ borderRadius: 3, border: `1px solid ${alpha(INK, 0.08)}`, boxShadow: `0 10px 30px -22px ${alpha(INK, 0.3)}` }}>
                  <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                    <SectionHeader icon={<TrendingUp fontSize="small" />} title="Placement Readiness" subtitle="Academic history and experience metrics" accent={GOLD} />
                    <Grid container spacing={2.5}>
                      <Grid item xs={12} md={4}>
                        <TextField fullWidth label="10th Percentage" name="tenthPercentage" type="number" inputProps={{ step: "0.01", min: 0, max: 100 }} value={profile.tenthPercentage || ""} onChange={handleChange} />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField fullWidth label="12th Percentage" name="twelfthPercentage" type="number" inputProps={{ step: "0.01", min: 0, max: 100 }} value={profile.twelfthPercentage || ""} onChange={handleChange} />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField fullWidth label="Active Backlogs" name="backlogs" type="number" inputProps={{ min: 0 }} value={profile.backlogs || ""} onChange={handleChange} />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField fullWidth label="Projects Completed" name="projectsCompleted" type="number" inputProps={{ min: 0 }} value={profile.projectsCompleted || ""} onChange={handleChange} />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField fullWidth label="Internships Completed" name="internshipsCompleted" type="number" inputProps={{ min: 0 }} value={profile.internshipsCompleted || ""} onChange={handleChange} />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField fullWidth label="Hackathons Participated" name="hackathonsParticipated" type="number" inputProps={{ min: 0 }} value={profile.hackathonsParticipated || ""} onChange={handleChange} />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField fullWidth label="Certifications Count" name="certificationsCount" type="number" inputProps={{ min: 0 }} value={profile.certificationsCount || ""} onChange={handleChange} />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField fullWidth label="Coding Skill Rating (1-10)" name="codingSkillRating" type="number" inputProps={{ min: 1, max: 10 }} value={profile.codingSkillRating || ""} onChange={handleChange} />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField fullWidth label="Communication Skill Rating (1-10)" name="communicationSkillRating" type="number" inputProps={{ min: 1, max: 10 }} value={profile.communicationSkillRating || ""} onChange={handleChange} />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField fullWidth label="Aptitude Skill Rating (1-10)" name="aptitudeSkillRating" type="number" inputProps={{ min: 1, max: 10 }} value={profile.aptitudeSkillRating || ""} onChange={handleChange} />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* CARD 3: PARENT */}
                <Card elevation={0} sx={{ borderRadius: 3, border: `1px solid ${alpha(INK, 0.08)}`, boxShadow: `0 10px 30px -22px ${alpha(INK, 0.3)}` }}>
                  <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                    <SectionHeader icon={<FamilyRestroom fontSize="small" />} title="Parent / Guardian Information" subtitle="Used for attendance and absence alerts" accent={CRIMSON} />
                    <Grid container spacing={2.5}>
                      <Grid item xs={12} md={6}>
                        <TextField fullWidth label="Parent Name" name="parentName" value={profile.parentName || ""} onChange={handleChange} />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField fullWidth label="Parent Email" name="parentEmail" type="email" value={profile.parentEmail || ""} onChange={handleChange} />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* CARD 4: STAFF */}
                <Card elevation={0} sx={{ borderRadius: 3, border: `1px solid ${alpha(INK, 0.08)}`, boxShadow: `0 10px 30px -22px ${alpha(INK, 0.3)}` }}>
                  <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                    <SectionHeader icon={<SupervisorAccount fontSize="small" />} title="Staff / Mentor Information" subtitle="Your tutor and head of department" accent={PLUM} />
                    <Grid container spacing={2.5}>
                      <Grid item xs={12} md={6}>
                        <TextField fullWidth label="Tutor Name" name="tutorName" value={profile.tutorName || ""} onChange={handleChange} />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField fullWidth label="Tutor Email" name="tutorEmail" type="email" value={profile.tutorEmail || ""} onChange={handleChange} />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField fullWidth label="HOD Name" name="hodName" value={profile.hodName || ""} onChange={handleChange} />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField fullWidth label="HOD Email" name="hodEmail" type="email" value={profile.hodEmail || ""} onChange={handleChange} />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* CARD 5: SKILLS MANAGER */}
                <Card elevation={0} sx={{ borderRadius: 3, border: `1px solid ${alpha(INK, 0.08)}`, boxShadow: `0 10px 30px -22px ${alpha(INK, 0.3)}` }}>
                  <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                    <SectionHeader
                      icon={<Code fontSize="small" />}
                      title="Professional Skills"
                      subtitle="Type a skill and press Enter or import directly from the ATS scanner"
                      accent={INK}
                    />
                    <Box sx={{ p: 3, borderRadius: 2, border: `1px solid ${alpha(INK, 0.1)}`, bgcolor: alpha(INK, 0.02) }}>
                      <Stack direction="row" flexWrap="wrap" gap={1} mb={2}>
                        {profile.skills && profile.skills.split(',').map(s => s.trim()).filter(Boolean).map((skill, idx) => (
                          <Chip 
                            key={idx} 
                            label={skill} 
                            onDelete={() => handleRemoveSkill(skill)} 
                            sx={{ 
                              fontWeight: 600, borderRadius: '8px', bgcolor: INK, color: '#fff', 
                              '& .MuiChip-deleteIcon': { color: alpha('#fff', 0.7), '&:hover': { color: '#fff' } } 
                            }} 
                          />
                        ))}
                        {(!profile.skills || profile.skills.trim() === "") && (
                          <Typography variant="body2" color="text.secondary">No skills added yet.</Typography>
                        )}
                      </Stack>
                      <TextField 
                        fullWidth 
                        variant="outlined" 
                        placeholder="e.g. Java, React, SQL (Press Enter to add)" 
                        onKeyDown={handleAddSkill} 
                        sx={{ bgcolor: "#fff", borderRadius: 2 }} 
                      />
                    </Box>
                  </CardContent>
                </Card>

              </Box>
            </Fade>
          </Box>

        </Box>
      </Box>

      {/* STICKY SAVE BAR */}
      <Slide direction="up" in mountOnEnter unmountOnExit>
        <Paper
          elevation={0}
          sx={{
            position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 10, px: { xs: 2, md: 6 }, py: 2, display: "flex", justifyContent: { xs: "center", md: "flex-end" },
            bgcolor: alpha("#fff", 0.85), backdropFilter: "blur(14px)", borderTop: `1px solid ${alpha(INK, 0.08)}`
          }}
        >
          <Button
            variant="contained" size="large" startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <Save />} disabled={saving} onClick={saveProfile}
            sx={{
              px: 5, py: 1.3, borderRadius: 2.5, fontWeight: 700, textTransform: "none", bgcolor: INK,
              boxShadow: `0 10px 24px -6px ${alpha(INK, 0.55)}`, transition: "all 0.25s ease",
              "&:hover": { bgcolor: INK_SOFT, transform: "translateY(-2px)" }
            }}
          >
            {saving ? "Saving..." : profile.id ? "Update Profile" : "Create Profile"}
          </Button>
        </Paper>
      </Slide>

      {/* CAMERA DIALOG */}
      <Dialog open={cameraOpen} onClose={stopCamera} maxWidth="sm" fullWidth TransitionComponent={SlideUpTransition} PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: GRADIENT_LEDGER, color: "#fff", fontFamily: FONT_DISPLAY, fontWeight: 700, borderBottom: `3px solid ${GOLD}` }}>
          Take a Live Photo
          <IconButton onClick={stopCamera} sx={{ color: "#fff" }}><Close /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", alignItems: "center", p: 3, background: "#0B0B12" }}>
          <Box sx={{ width: "100%", borderRadius: 2, overflow: "hidden", border: `2px solid ${alpha("#fff", 0.1)}`, boxShadow: `0 0 0 4px ${alpha(GOLD, 0.18)}` }}>
            <video ref={videoRef} autoPlay playsInline style={{ width: "100%", display: "block", backgroundColor: "#000" }} />
          </Box>
          <canvas ref={canvasRef} style={{ display: "none" }} />
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", py: 3, background: "#0B0B12" }}>
          <Button variant="contained" onClick={capturePhoto} startIcon={<CameraAlt />} size="large" sx={{ px: 4, borderRadius: 2.5, fontWeight: 700, textTransform: "none", background: `linear-gradient(135deg, ${GOLD_LIGHT} 0%, ${GOLD} 100%)`, color: INK, boxShadow: `0 10px 24px -6px ${alpha(GOLD, 0.6)}` }}>Capture Photo</Button>
        </DialogActions>
      </Dialog>

      <Backdrop open={saving} sx={{ zIndex: 20, color: "#fff", backdropFilter: "blur(2px)" }}><CircularProgress color="inherit" /></Backdrop>
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: "bottom", horizontal: "center" }} TransitionComponent={SlideUpTransition}>
        <Alert severity={snackbar.severity} variant="filled" sx={{ borderRadius: 2.5, boxShadow: `0 10px 24px -6px ${alpha(INK, 0.4)}` }} onClose={handleCloseSnackbar}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}

export default StudentProfile;