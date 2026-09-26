import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Button,
  LinearProgress,
  Paper,
  Chip,
  IconButton,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
  Stack,
  Grow,
  Zoom,
  GlobalStyles,
  alpha,
  Tooltip,
  Alert,
  Snackbar,
} from "@mui/material";

import {
  Analytics,
  TrendingUp,
  CheckCircle,
  Assignment,
  School,
  Notifications,
  Description,
  ArrowForward,
  Delete,
  SmartToy,
  WorkspacePremium,
  Bolt,
  CloudUpload,
  InsertDriveFile,
  AutoAwesome,
  MenuBook,
  Hub,
  Psychology,
  Visibility,
  Quiz as QuizIcon,
  WarningAmberRounded,
} from "@mui/icons-material";

import { useNavigate } from "react-router-dom";
import axios from "axios";
import { describeError } from "../services/api";
import { useShell } from "../components/Layout";
import StudentTests from "../components/StudentTests";
import StudentAttendance from "../components/StudentAttendance";
import CareerRecommendation from "../components/CareerRecommendation";

axios.defaults.withCredentials = true;

// ---------------------------------------------------------------
// DESIGN SYSTEM — "The Ledger" (shared with AdminDashboard).
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
const AMBER_LIGHT = "#E4A24B";
const PLUM = "#5B4B8A";
const PLUM_LIGHT = "#8672C2";

const FONT_DISPLAY = "'Fraunces', Georgia, 'Times New Roman', serif";
const FONT_MONO = "'JetBrains Mono', 'Roboto Mono', 'Courier New', monospace";

const GRADIENT_LEDGER = `linear-gradient(120deg, ${INK} 0%, #1B234A 45%, ${PLUM} 130%)`;

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
  "@keyframes gradientShift": {
    "0%": { backgroundPosition: "0% 50%" },
    "50%": { backgroundPosition: "100% 50%" },
    "100%": { backgroundPosition: "0% 50%" },
  },
  "@keyframes float": {
    "0%, 100%": { transform: "translate(0px, 0px)" },
    "50%": { transform: "translate(14px, -18px)" },
  },
  "@keyframes floatSlow": {
    "0%, 100%": { transform: "translate(0px, 0px) scale(1)" },
    "50%": { transform: "translate(-18px, 22px) scale(1.06)" },
  },
  "@keyframes dotPulse": {
    "0%, 100%": { transform: "scale(1)", opacity: 1 },
    "50%": { transform: "scale(1.7)", opacity: 0.45 },
  },
  "@keyframes pulseText": {
    "0%, 100%": { opacity: 0.5 },
    "50%": { opacity: 1 },
  },
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
  "@media (prefers-reduced-motion: reduce)": {
    "[data-motion]": { animation: "none !important" },
  },
};

const cardHoverSx = {
  borderRadius: 3,
  border: `1px solid ${alpha(INK, 0.1)}`,
  boxShadow: `0 16px 34px -24px ${alpha(INK, 0.5)}`,
  transition: "transform .35s cubic-bezier(.25,.8,.25,1), box-shadow .35s cubic-bezier(.25,.8,.25,1)",
  "&:hover": {
    transform: "translateY(-6px)",
    boxShadow: `0 22px 44px -18px ${alpha(INK, 0.35)}`,
  },
};

function LedgerBackdrop() {
  const glyphs = [
    { Icon: MenuBook, top: "6%", left: "80%", size: 200, rot: -10, dur: 9 },
    { Icon: School, top: "56%", left: "-2%", size: 240, rot: 8, dur: 11 },
    { Icon: Psychology, top: "2%", left: "6%", size: 150, rot: 6, dur: 8 },
    { Icon: SmartToy, top: "80%", left: "88%", size: 160, rot: -6, dur: 7.5 },
    { Icon: Hub, top: "88%", left: "18%", size: 130, rot: 14, dur: 10 },
    { Icon: AutoAwesome, top: "24%", left: "48%", size: 110, rot: -4, dur: 9.5 },
  ];
  const orbs = [
    { color: TEAL, top: "-6%", left: "6%", size: 440, dur: 9 },
    { color: GOLD, top: "2%", left: "82%", size: 400, dur: 11 },
    { color: PLUM, top: "68%", left: "38%", size: 460, dur: 13 },
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
            background: `radial-gradient(circle, ${alpha(o.color, 0.14)}, transparent 70%)`,
            animation: `orbPulse ${o.dur}s ease-in-out infinite`,
          }}
        />
      ))}

      <Box
        data-motion
        sx={{
          position: "absolute", inset: -168,
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140' viewBox='0 0 140 140'%3E%3Cg fill='none' stroke='%23141B33' stroke-width='1' opacity='0.06'%3E%3Cline x1='20' y1='30' x2='70' y2='15'/%3E%3Cline x1='20' y1='30' x2='70' y2='70'/%3E%3Cline x1='20' y1='30' x2='70' y2='125'/%3E%3Cline x1='20' y1='90' x2='70' y2='15'/%3E%3Cline x1='20' y1='90' x2='70' y2='70'/%3E%3Cline x1='20' y1='90' x2='70' y2='125'/%3E%3Cline x1='70' y1='15' x2='120' y2='55'/%3E%3Cline x1='70' y1='70' x2='120' y2='55'/%3E%3Cline x1='70' y1='125' x2='120' y2='55'/%3E%3C/g%3E%3Cg fill='%23141B33' opacity='0.09'%3E%3Ccircle cx='20' cy='30' r='2.6'/%3E%3Ccircle cx='20' cy='90' r='2.6'/%3E%3Ccircle cx='70' cy='15' r='2.4'/%3E%3Ccircle cx='70' cy='70' r='2.4'/%3E%3Ccircle cx='70' cy='125' r='2.4'/%3E%3Ccircle cx='120' cy='55' r='3.2'/%3E%3C/g%3E%3C/svg%3E\")",
          backgroundRepeat: "repeat",
          animation: "networkDrift 36s linear infinite",
        }}
      />

      <Box
        data-motion
        sx={{
          position: "absolute", left: 0, right: 0, height: 2,
          background: `linear-gradient(90deg, transparent, ${alpha(GOLD_LIGHT, 0.6)}, transparent)`,
          animation: "scanSweep 12s linear infinite",
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

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function useCountUp(target, { duration = 1200, trigger = true } = {}) {
  const [value, setValue] = useState(0);
  const rafRef = useRef();

  useEffect(() => {
    if (!trigger || target == null) {
      setValue(0);
      return undefined;
    }
    const startTime = performance.now();
    const animate = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(target * eased);
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration, trigger]);

  return value;
}

function CircularGauge({
  value = 0,
  size = 128,
  strokeWidth = 11,
  color = INK,
  trackColor = PARCHMENT_DEEP,
  trigger = true,
  subText,
  formatMain,
}) {
  const animated = useCountUp(value ?? 0, { duration: 1400, trigger: trigger && value != null });
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value ?? 0));
  const offset = circumference - ((trigger && value != null ? clamped : 0) / 100) * circumference;
  const mainText =
    value == null ? "—" : formatMain ? formatMain(animated) : `${Math.round(animated)}%`;

  return (
    <Box sx={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)", display: "block" }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={trackColor} strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(0.65,0,0.35,1)" }}
        />
      </svg>
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography sx={{ fontFamily: FONT_MONO, fontWeight: 700, color, lineHeight: 1, fontSize: "1.4rem" }}>
          {mainText}
        </Typography>
        {subText && (
          <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mt: 0.4 }}>
            {subText}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

function StudentDashboard() {
  useLedgerFonts();
  const navigate = useNavigate();
  const { section, setSection } = useShell();
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  const [resume, setResume] = useState(null);
  // Real persisted analysis (from placement_results via /api/dashboard/student/{regNo})
  const [storedResult, setStoredResult] = useState(null);
  const [liveResult, setLiveResult] = useState(null);

  const [mounted, setMounted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [resumeRemoving, setResumeRemoving] = useState(false);

  // Real data lists
  const [upcomingTests, setUpcomingTests] = useState([]);
  const [realNotifications, setRealNotifications] = useState([]);

  // Upload state for Resume
  const [resumeUploading, setResumeUploading] = useState(false);
  const [snack, setSnack] = useState({ open: false, msg: "", severity: "info" });

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 120);
    return () => clearTimeout(t);
  }, []);

  // "Profile" navigation is handled by the Layout sidebar — no extra redirect needed here.

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const userRes = await axios.get("http://localhost:8080/api/auth/me");
        setUser(userRes.data);

        const profileRes = await axios.get(`http://localhost:8080/api/student/profile/user/${userRes.data.id}`);
        setProfile(profileRes.data);

        // Load existing resume if saved in DB
        if (profileRes.data.resume) {
          setResume({ name: profileRes.data.resume, saved: true });
        }

        // Real notifications for this student (register number is the routing key)
        const regNo = profileRes.data?.registerNumber;
        if (regNo) {
          axios
            .get(`http://localhost:8080/api/notifications/student/${encodeURIComponent(regNo)}`)
            .then((nRes) => setRealNotifications(Array.isArray(nRes.data) ? nRes.data.slice(0, 5) : []))
            .catch(() => setRealNotifications([]));
        }

        // Previously persisted AI analysis (if any)
        if (regNo) {
          axios
            .get(`http://localhost:8080/api/dashboard/student/${encodeURIComponent(regNo)}`)
            .then((dRes) => {
              if (!dRes.data?.error) setStoredResult(dRes.data);
            })
            .catch(() => {});
        }
      } catch (err) {
        console.error("Failed to load profile", err);
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Upcoming assessments = published tests this student has not completed yet
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      axios.get("http://localhost:8080/api/assessments"),
      axios.get("http://localhost:8080/api/attempts/my").catch(() => ({ data: [] })),
    ])
      .then(([testsRes, attemptsRes]) => {
        if (cancelled) return;
        const doneIds = new Set(
          (attemptsRes.data || [])
            .filter((a) => ["SUBMITTED", "EXPIRED", "TERMINATED"].includes(a.status))
            .map((a) => a.assessmentId)
        );
        setUpcomingTests((testsRes.data || []).filter((t) => !doneIds.has(t.id)).slice(0, 4));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const displayName = profile?.firstName ? `${profile.firstName} ${profile.lastName || ""}` : (user?.username || "Student");
  const photoUrl = profile?.profilePhoto ? `http://localhost:8080/uploads/profile/students/${profile.profilePhoto}` : "";
  const displayCgpa = profile?.cgpa != null ? profile.cgpa : null;
  const greeting = getGreeting();

  const result = liveResult
    ? {
        prediction: liveResult.prediction,
        readinessScore: liveResult.readinessScore,
        factorsSupportingPlacement: liveResult.factorsSupportingPlacement || [],
        factorsAgainstPlacement: liveResult.factorsAgainstPlacement || [],
      }
    : storedResult
    ? {
        prediction: storedResult.prediction,
        readinessScore: storedResult.readinessScore != null ? Number(storedResult.readinessScore) : null,
        factorsSupportingPlacement: [],
        factorsAgainstPlacement: [],
        persisted: true,
      }
    : null;

  // Skills are shown honestly as chips — no fabricated proficiency percentages.
  const skillsList = (profile?.skills || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 8);

  const getProfileCompleteness = () => {
    if (!profile) return 0;
    const fields = [
      profile.firstName, profile.lastName, profile.skills, profile.cgpa,
      profile.profilePhoto, profile.registerNumber,
      profile.tenthPercentage, profile.twelfthPercentage, profile.backlogs,
      profile.projectsCompleted, profile.certificationsCount,
    ];
    const filled = fields.filter((f) => f !== null && f !== undefined && String(f).trim() !== "").length;
    return Math.round((filled / fields.length) * 100);
  };

  /** Missing Placement Profile fields required by the AI microservice. */
  const missingPlacementFields = () => {
    if (!profile) return [];
    const checks = [
      ["tenthPercentage", "10th %"],
      ["twelfthPercentage", "12th %"],
      ["backlogs", "Backlogs"],
      ["projectsCompleted", "Projects completed"],
      ["internshipsCompleted", "Internships"],
      ["hackathonsParticipated", "Hackathons"],
      ["certificationsCount", "Certifications"],
      ["codingSkillRating", "Coding rating"],
      ["communicationSkillRating", "Communication rating"],
      ["aptitudeSkillRating", "Aptitude rating"],
    ];
    return checks
      .filter(([key]) => profile[key] === null || profile[key] === undefined)
      .map(([, label]) => label);
  };

  const checkReadiness = async () => {
    const missing = missingPlacementFields();
    if (!profile?.registerNumber) {
      setSnack({ open: true, severity: "warning", msg: "Set your register number in your profile first." });
      return;
    }
    if (missing.length > 0) {
      setSnack({
        open: true,
        severity: "warning",
        msg: `Complete your Placement Profile first. Missing: ${missing.join(", ")}.`,
      });
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post("http://localhost:8080/api/placement/analyze", {
        studentId: profile.registerNumber,
        name: displayName.trim(),
        branch: profile.department,
        cgpa: Number(profile.cgpa ?? 0),
        tenth_percentage: Number(profile.tenthPercentage),
        twelfth_percentage: Number(profile.twelfthPercentage),
        backlogs: Number(profile.backlogs),
        attendance: null, // recomputed server-side from real records
        projects: Number(profile.projectsCompleted),
        internships: Number(profile.internshipsCompleted),
        hackathons: Number(profile.hackathonsParticipated),
        certifications: Number(profile.certificationsCount),
        coding_rating: Number(profile.codingSkillRating),
        communication_rating: Number(profile.communicationSkillRating),
        aptitude_rating: Number(profile.aptitudeSkillRating),
      });
      setLiveResult(response.data);
      setSnack({ open: true, severity: "success", msg: "Analysis complete and saved to your record." });
    } catch (e) {
      setSnack({ open: true, severity: "error", msg: describeError(e, "Analysis failed.") });
    }
    setLoading(false);
  };

  const handleResumeUpload = (e) => {
    if (e.target.files.length > 0) {
      setResume(e.target.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (file && file.type === "application/pdf") {
      setResume(file);
    }
  };

  const removeResume = () => {
    setResumeRemoving(true);
    setTimeout(() => {
      setResume(null);
      setResumeRemoving(false);
    }, 260);
  };

  const saveResumeToDatabase = async () => {
    if (!resume || resume.saved) return;
    if (!profile || !profile.id) {
      setSnack({ open: true, severity: "warning", msg: "Please set up your profile first." });
      return;
    }
    setResumeUploading(true);
    const data = new FormData();
    data.append("file", resume);

    try {
      await axios.post(`http://localhost:8080/api/student/profile/upload-resume/${profile.id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResume({ ...resume, saved: true });

      const refreshedProfile = await axios.get(`http://localhost:8080/api/student/profile/user/${user.id}`);
      setProfile(refreshedProfile.data);

      setSnack({ open: true, severity: "success", msg: "Resume saved successfully!" });
    } catch (err) {
      console.error(err);
      setSnack({ open: true, severity: "error", msg: describeError(err, "Failed to save resume") });
    } finally {
      setResumeUploading(false);
    }
  };

  // -----------------------------------------------------------------
  // Shell sections — sidebar destinations other than the dashboard
  // overview. Each renders a focused panel powered by the same real
  // data already loaded for this student.
  // -----------------------------------------------------------------
  const renderShellSection = () => {
    switch (section) {
      case "internal":
        return <StudentTests defaultCategory="INTERNAL" />;

      case "placement":
        return <StudentTests defaultCategory="PLACEMENT" />;

      case "results":
        return <StudentTests resultsOnly />;

      case "attendance":
        return <StudentAttendance />;

      case "career":
        return <CareerRecommendation />;

      case "prediction":
        return (
          <Box sx={{ maxWidth: 920, mx: "auto" }}>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "300px 1fr" }, gap: 3 }}>
              <Grow in={mounted} timeout={600}>
                <Card sx={{ ...cardHoverSx, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 5 }}>
                  <Typography color="text.secondary" fontWeight={700} sx={{ mb: 3 }}>Placement Readiness</Typography>
                  <CircularGauge
                    value={result?.readinessScore ?? null}
                    color={INK}
                    trackColor={PARCHMENT_DEEP}
                    trigger={mounted}
                    subText="Score"
                  />
                  {result?.readinessScore != null && (
                    <Typography sx={{ fontFamily: FONT_MONO, fontWeight: 700, fontSize: "1.6rem", color: INK, mt: 3 }}>
                      {result.readinessScore}% ready
                    </Typography>
                  )}
                </Card>
              </Grow>

              <Grow in={mounted} timeout={650} style={{ transitionDelay: mounted ? "90ms" : "0ms" }}>
                <Card sx={cardHoverSx}>
                  <CardContent sx={{ p: 4 }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar sx={{ bgcolor: INK, width: 52, height: 52, color: GOLD_LIGHT }}><SmartToy /></Avatar>
                      <Box>
                        <Typography variant="h6" sx={{ fontFamily: FONT_DISPLAY, fontWeight: 700 }}>AI Placement Analysis</Typography>
                        <Typography variant="caption" color="text.secondary">Uses your real academic profile + live attendance</Typography>
                      </Box>
                    </Stack>

                    {!result ? (
                      <>
                        <Typography sx={{ mt: 3, color: "text.secondary", lineHeight: 1.8, fontSize: 16 }}>
                          Analyze your profile to discover your placement readiness score.
                          Complete your{" "}
                          <Typography component="span" fontWeight={700} color={INK}>Placement Profile</Typography>
                          {" "}in the profile page first.
                        </Typography>
                        <Button
                          variant="contained"
                          onClick={checkReadiness}
                          disabled={loading || !profile}
                          sx={{
                            mt: 4, borderRadius: 2, px: 4, py: 1.3, fontWeight: 700, textTransform: "none", bgcolor: INK,
                            "&:hover": { bgcolor: "#0F1730", transform: "translateY(-2px)" },
                          }}
                        >
                          {loading ? <CircularProgress size={22} color="inherit" /> : "Analyze My Profile"}
                        </Button>
                      </>
                    ) : (
                      <Zoom in timeout={400}>
                        <Box mt={3}>
                          <Typography sx={{ fontFamily: FONT_MONO, fontWeight: 700, fontSize: "2.2rem", color: INK }}>
                            {result.readinessScore != null ? `${result.readinessScore}%` : "—"}
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={result.readinessScore ?? 0}
                            sx={{
                              mt: 2, height: 10, borderRadius: 5, bgcolor: PARCHMENT_DEEP,
                              "& .MuiLinearProgress-bar": { borderRadius: 5, background: `linear-gradient(90deg, ${GOLD_LIGHT}, ${GOLD})` },
                            }}
                          />

                          {(result.factorsSupportingPlacement?.length > 0 || result.factorsAgainstPlacement?.length > 0) && (
                            <Box sx={{ mt: 3 }}>
                              {result.factorsSupportingPlacement?.length > 0 && (
                                <>
                                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                                    <TrendingUp fontSize="small" sx={{ color: TEAL }} />
                                    <Typography variant="subtitle2" fontWeight={700} color={TEAL}>Working in your favour</Typography>
                                  </Stack>
                                  <Stack spacing={0.75} sx={{ mb: 2 }}>
                                    {result.factorsSupportingPlacement.map((f, i) => (
                                      <Typography key={i} variant="body2" color="text.secondary">• {f}</Typography>
                                    ))}
                                  </Stack>
                                </>
                              )}
                              {result.factorsAgainstPlacement?.length > 0 && (
                                <>
                                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                                    <WarningAmberRounded fontSize="small" sx={{ color: AMBER }} />
                                    <Typography variant="subtitle2" fontWeight={700} color={AMBER}>Focus areas</Typography>
                                  </Stack>
                                  <Stack spacing={0.75}>
                                    {result.factorsAgainstPlacement.map((f, i) => (
                                      <Typography key={i} variant="body2" color="text.secondary">• {f}</Typography>
                                    ))}
                                  </Stack>
                                </>
                              )}
                            </Box>
                          )}

                          <Button size="small" onClick={() => { setLiveResult(null); setStoredResult(null); }} sx={{ mt: 2, color: INK }}>
                            Re-run analysis
                          </Button>
                        </Box>
                      </Zoom>
                    )}
                  </CardContent>
                </Card>
              </Grow>
            </Box>
          </Box>
        );

      case "resume":
        return (
          <Box sx={{ maxWidth: 720, mx: "auto" }}>
            <Grow in={mounted} timeout={600}>
              <Card sx={cardHoverSx}>
                <CardContent sx={{ p: 4 }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar sx={{ bgcolor: alpha(PLUM, 0.12), color: PLUM, width: 56, height: 56 }}>
                      <Description />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontFamily: FONT_DISPLAY, fontWeight: 700 }}>My Resume</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Upload your PDF resume — then run the ATS analyzer from the sidebar for instant feedback.
                      </Typography>
                    </Box>
                  </Stack>

                  {!resume ? (
                    <Box
                      component="label"
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      sx={{
                        mt: 4, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                        border: `2px dashed ${isDragging ? PLUM : alpha(PLUM, 0.3)}`,
                        bgcolor: isDragging ? alpha(PLUM, 0.08) : alpha(PLUM, 0.02),
                        borderRadius: 2, py: 6, cursor: "pointer",
                        transition: "all .25s",
                        transform: isDragging ? "scale(1.015)" : "scale(1)",
                        "&:hover": { borderColor: PLUM, bgcolor: alpha(PLUM, 0.06) },
                      }}
                    >
                      <CloudUpload
                        sx={{
                          fontSize: 40, color: PLUM, mb: 1,
                          animation: isDragging ? "float 1s ease-in-out infinite" : "none",
                        }}
                      />
                      <Typography fontWeight={700} sx={{ color: PLUM }}>Drag & drop or click to upload</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>PDF only</Typography>
                      <input hidden accept=".pdf" type="file" onChange={handleResumeUpload} />
                    </Box>
                  ) : (
                    <Zoom in={!resumeRemoving} timeout={280}>
                      <Box>
                        <Paper
                          elevation={0}
                          sx={{
                            mt: 4, p: 2.5, bgcolor: alpha(PLUM, 0.04), display: "flex", justifyContent: "space-between",
                            alignItems: "center", borderRadius: 2, border: `1px solid ${alpha(PLUM, 0.15)}`,
                          }}
                        >
                          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
                            <InsertDriveFile sx={{ color: PLUM, flexShrink: 0 }} />
                            <Typography fontWeight={700} noWrap sx={{ maxWidth: 320 }}>{resume.name}</Typography>
                            {resume.saved && (
                              <Chip size="small" label="Saved" sx={{ bgcolor: alpha(TEAL, 0.12), color: TEAL, fontWeight: 700 }} />
                            )}
                          </Stack>

                          <Stack direction="row" spacing={1}>
                            {resume.saved && (
                              <Tooltip title="View Resume">
                                <IconButton
                                  onClick={() => window.open(`http://localhost:8080/uploads/profile/resumes/${resume.name}`, '_blank')}
                                  sx={{ color: TEAL, transition: "transform .3s", "&:hover": { transform: "scale(1.1)", bgcolor: alpha(TEAL, 0.08) } }}
                                >
                                  <Visibility />
                                </IconButton>
                              </Tooltip>
                            )}
                            <Tooltip title="Delete Resume">
                              <IconButton
                                onClick={removeResume}
                                sx={{ color: "#8C2F39", transition: "transform .3s", "&:hover": { transform: "rotate(90deg)", bgcolor: alpha("#8C2F39", 0.08) } }}
                              >
                                <Delete />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </Paper>

                        {!resume.saved && (
                          <Button
                            fullWidth
                            variant="contained"
                            onClick={saveResumeToDatabase}
                            disabled={resumeUploading}
                            sx={{ mt: 2, bgcolor: PLUM, borderRadius: 2, fontWeight: 700, textTransform: "none", "&:hover": { bgcolor: "#4A3D73" } }}
                          >
                            {resumeUploading ? <CircularProgress size={20} color="inherit" /> : "Save Resume"}
                          </Button>
                        )}
                      </Box>
                    </Zoom>
                  )}
                </CardContent>
              </Card>
            </Grow>
          </Box>
        );

      case "skills": {
        const ratingRows = [
          ["Aptitude rating", profile?.aptitudeSkillRating, PLUM],
          ["Coding rating", profile?.codingSkillRating, TEAL],
          ["Communication rating", profile?.communicationSkillRating, GOLD],
        ];
        return (
          <Box sx={{ maxWidth: 920, mx: "auto" }}>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3 }}>
              <Grow in={mounted} timeout={600}>
                <Card sx={{ ...cardHoverSx, height: "100%" }}>
                  <CardContent sx={{ p: 4 }}>
                    <Stack direction="row" spacing={2} alignItems="center" mb={3}>
                      <Avatar sx={{ bgcolor: alpha(TEAL, 0.12), color: TEAL }}><Hub /></Avatar>
                      <Box>
                        <Typography variant="h6" sx={{ fontFamily: FONT_DISPLAY, fontWeight: 700 }}>My Skills</Typography>
                        <Typography variant="caption" color="text.secondary">From your profile</Typography>
                      </Box>
                    </Stack>
                    {skillsList.length > 0 ? (
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {skillsList.map((skill) => (
                          <Chip
                            key={skill}
                            label={skill}
                            sx={{ fontWeight: 700, bgcolor: alpha(TEAL, 0.08), color: TEAL, border: `1px solid ${alpha(TEAL, 0.25)}` }}
                          />
                        ))}
                      </Stack>
                    ) : (
                      <Typography color="text.secondary" variant="body2">
                        Add skills in your profile so faculty and the AI engine can see them.
                      </Typography>
                    )}
                    <Button size="small" onClick={() => navigate("/profile")} sx={{ mt: 2.5, color: INK, textTransform: "none", fontWeight: 700 }}>
                      Manage skills →
                    </Button>
                  </CardContent>
                </Card>
              </Grow>

              <Grow in={mounted} timeout={650} style={{ transitionDelay: mounted ? "90ms" : "0ms" }}>
                <Card sx={{ ...cardHoverSx, height: "100%" }}>
                  <CardContent sx={{ p: 4 }}>
                    <Stack direction="row" spacing={2} alignItems="center" mb={3}>
                      <Avatar sx={{ bgcolor: alpha(INK, 0.08), color: INK }}><Psychology /></Avatar>
                      <Box>
                        <Typography variant="h6" sx={{ fontFamily: FONT_DISPLAY, fontWeight: 700 }}>Skill Ratings</Typography>
                        <Typography variant="caption" color="text.secondary">Self-rated in your placement profile (out of 10)</Typography>
                      </Box>
                    </Stack>
                    {ratingRows.some(([, v]) => v != null) ? (
                      <Stack spacing={2.5}>
                        {ratingRows.map(([label, value, color]) => (
                          <Box key={label}>
                            <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.75 }}>
                              <Typography variant="body2" fontWeight={700}>{label}</Typography>
                              <Typography variant="body2" fontWeight={700} color={value != null ? color : "text.secondary"}>
                                {value != null ? `${value}/10` : "Not set"}
                              </Typography>
                            </Stack>
                            <LinearProgress
                              variant="determinate"
                              value={value != null ? Number(value) * 10 : 0}
                              sx={{
                                height: 8, borderRadius: 4, bgcolor: PARCHMENT_DEEP,
                                "& .MuiLinearProgress-bar": { borderRadius: 4, bgcolor: value != null ? color : alpha(INK, 0.2) },
                              }}
                            />
                          </Box>
                        ))}
                      </Stack>
                    ) : (
                      <Typography color="text.secondary" variant="body2">
                        Rate yourself on aptitude, coding and communication in your Placement Profile to power the AI analysis.
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grow>
            </Box>
          </Box>
        );
      }

      case "notifications":
        return (
          <Box sx={{ maxWidth: 720, mx: "auto" }}>
            <Grow in={mounted} timeout={600}>
              <Card sx={cardHoverSx}>
                <CardContent sx={{ p: 4 }}>
                  <Stack direction="row" spacing={2} alignItems="center" mb={3}>
                    <Avatar sx={{ bgcolor: alpha(AMBER, 0.14), color: AMBER }}><Notifications /></Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontFamily: FONT_DISPLAY, fontWeight: 700 }}>Notifications</Typography>
                      <Typography variant="caption" color="text.secondary">Alerts from your tutors and placement updates</Typography>
                    </Box>
                  </Stack>
                  {realNotifications.length > 0 ? (
                    <List disablePadding>
                      {realNotifications.map((n, idx) => (
                        <React.Fragment key={n.id ?? idx}>
                          <ListItem disableGutters sx={{ borderRadius: 2, transition: "background .2s", "&:hover": { bgcolor: alpha(AMBER, 0.06) } }}>
                            <Stack direction="row" spacing={1.2} alignItems="flex-start" sx={{ width: "100%" }}>
                              <Box sx={{ width: 8, flexShrink: 0, mt: 0.9 }}>
                                {n.status === "UNREAD" && (
                                  <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: AMBER, animation: "dotPulse 1.8s infinite" }} />
                                )}
                              </Box>
                              <ListItemText
                                primary={n.message}
                                secondary={n.sentDate ? new Date(n.sentDate).toLocaleDateString() : ""}
                                primaryTypographyProps={{ fontWeight: 700, fontSize: 14.5 }}
                              />
                            </Stack>
                          </ListItem>
                          {idx < realNotifications.length - 1 && <Divider component="li" sx={{ listStyle: "none" }} />}
                        </React.Fragment>
                      ))}
                    </List>
                  ) : (
                    <Typography color="text.secondary" variant="body2">
                      No notifications yet. Alerts from your tutors and placement updates will appear here.
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grow>
          </Box>
        );

      default:
        return null;
    }
  };

  if (!loadingProfile && section && section !== "dashboard") {
    return (
      <Box
        sx={{
          p: { xs: 2.5, md: 4 },
          minHeight: "100vh",
          background: PARCHMENT,
          backgroundImage: [
            `radial-gradient(900px 460px at 8% -8%, ${alpha(TEAL, 0.05)}, transparent)`,
            `radial-gradient(800px 420px at 100% 4%, ${alpha(GOLD, 0.06)}, transparent)`,
          ].join(", "),
          boxSizing: "border-box",
          overflowX: "hidden",
        }}
      >
        <GlobalStyles styles={keyframesStyles} />
        {renderShellSection()}
        <Snackbar
          open={snack.open}
          autoHideDuration={5000}
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert severity={snack.severity} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
            {snack.msg}
          </Alert>
        </Snackbar>
      </Box>
    );
  }

  if (loadingProfile) {
    return (
      <Box
        height="100vh"
        display="flex"
        flexDirection="column"
        gap={2}
        justifyContent="center"
        alignItems="center"
        sx={{ background: PARCHMENT }}
      >
        <GlobalStyles styles={keyframesStyles} />
        <CircularProgress size={46} thickness={4} sx={{ color: INK }} />
        <Typography color="text.secondary" fontWeight={600} sx={{ fontFamily: FONT_DISPLAY, animation: "pulseText 1.6s ease-in-out infinite" }}>
          Loading your dashboard...
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        position: "relative",
        background: PARCHMENT,
        backgroundImage: [
          `radial-gradient(900px 460px at 8% -8%, ${alpha(TEAL, 0.05)}, transparent)`,
          `radial-gradient(800px 420px at 100% 4%, ${alpha(GOLD, 0.06)}, transparent)`,
        ].join(", "),
        minHeight: "100vh",
        p: 3,
        boxSizing: "border-box",
        overflowX: "hidden",
        overflowY: "auto",
      }}
    >
      <GlobalStyles styles={keyframesStyles} />
      <LedgerBackdrop />

      <Snackbar
        open={snack.open}
        autoHideDuration={5000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snack.severity} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
          {snack.msg}
        </Alert>
      </Snackbar>

      <Box sx={{ position: "relative", zIndex: 1 }}>

        {/* ---------------- HERO ---------------- */}
        <Grow in={mounted} timeout={650}>
          <Paper
            elevation={0}
            sx={{
              position: "relative",
              borderRadius: 3,
              overflow: "hidden",
              background: GRADIENT_LEDGER,
              backgroundSize: "220% 220%",
              animation: "gradientShift 14s ease infinite",
              color: PARCHMENT,
              p: { xs: 3, md: 4 },
              mb: 3,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 3,
              borderBottom: `4px solid ${GOLD}`,
              boxShadow: `0 26px 50px -20px ${alpha(INK, 0.55)}`,
            }}
          >
            <Box
              aria-hidden
              data-motion
              sx={{
                position: "absolute", width: 280, height: 280, borderRadius: "50%",
                bgcolor: alpha("#fff", 0.08), filter: "blur(4px)",
                top: -100, right: -70, animation: "floatSlow 11s ease-in-out infinite",
              }}
            />
            <Box
              aria-hidden
              data-motion
              sx={{
                position: "absolute", width: 190, height: 190, borderRadius: "50%",
                bgcolor: alpha("#fff", 0.06), top: "55%", left: "38%",
                animation: "float 8s ease-in-out infinite",
              }}
            />
            <Box
              aria-hidden
              data-motion
              sx={{
                position: "absolute", width: 130, height: 130, borderRadius: "50%",
                background: `radial-gradient(circle, ${alpha(GOLD_LIGHT, 0.22)}, transparent 70%)`,
                top: "10%", left: "6%", animation: "floatSlow 15s ease-in-out infinite reverse",
              }}
            />

            <Box sx={{ position: "relative", zIndex: 1, flex: 1, minWidth: 0 }}>
              <Stack direction="row" spacing={1} alignItems="center">
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
                <Typography sx={{ opacity: 0.8, fontWeight: 700, letterSpacing: 2, fontSize: 12, textTransform: "uppercase" }}>
                  {greeting}
                </Typography>
              </Stack>

              <Typography
                variant="h3"
                sx={{
                  mt: 0.5, fontFamily: FONT_DISPLAY, fontWeight: 700,
                  backgroundImage: `linear-gradient(90deg, #ffffff, ${alpha(GOLD_LIGHT, 0.9)})`,
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                {displayName}
              </Typography>

              <Typography sx={{ mt: 1, opacity: 0.85, fontSize: 17, maxWidth: 560 }}>
                Track your courses, monitor placement readiness, upload your
                resume and improve your skills using EduAI.
              </Typography>

              <Stack direction="row" spacing={2} sx={{ mt: 4, flexWrap: "wrap", rowGap: 2 }}>
                <Button
                  variant="contained"
                  endIcon={<ArrowForward />}
                  onClick={() => navigate("/profile")}
                  sx={{
                    bgcolor: PARCHMENT, color: INK, fontWeight: 700, px: 4, py: 1.5, borderRadius: 2, textTransform: "none",
                    transition: "all .25s cubic-bezier(.34,1.56,.64,1)",
                    "&:hover": { bgcolor: "#fff", transform: "translateY(-3px)", boxShadow: "0 14px 26px rgba(0,0,0,0.25)" },
                    "&:active": { transform: "translateY(0) scale(.97)" },
                  }}
                >
                  Update My Profile
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => setSection("internal")}
                  sx={{
                    color: PARCHMENT, borderColor: alpha("#fff", 0.5), px: 4, py: 1.5, borderRadius: 2, textTransform: "none", borderWidth: 1.5,
                    transition: "all .25s cubic-bezier(.34,1.56,.64,1)",
                    "&:hover": { borderColor: "#fff", borderWidth: 1.5, bgcolor: alpha("#fff", 0.1), transform: "translateY(-3px)" },
                    "&:active": { transform: "translateY(0) scale(.97)" },
                  }}
                >
                  View Assessments
                </Button>
              </Stack>

              <Stack direction="row" spacing={1.5} sx={{ mt: 3, flexWrap: "wrap", rowGap: 1.5 }}>
                <Chip
                  icon={<WorkspacePremium sx={{ color: `${GOLD_LIGHT} !important` }} />}
                  label={displayCgpa != null ? `CGPA ${displayCgpa}` : "CGPA not set"}
                  sx={{ bgcolor: alpha("#fff", 0.12), color: "#fff", fontWeight: 700, backdropFilter: "blur(6px)", border: `1px solid ${alpha("#fff", 0.22)}` }}
                />
                <Chip
                  icon={<Bolt sx={{ color: `${GOLD_LIGHT} !important` }} />}
                  label={`${getProfileCompleteness()}% profile complete`}
                  sx={{ bgcolor: alpha("#fff", 0.12), color: "#fff", fontWeight: 700, backdropFilter: "blur(6px)", border: `1px solid ${alpha("#fff", 0.22)}` }}
                />
                {result && result.readinessScore != null && (
                  <Zoom in timeout={400}>
                    <Chip
                      icon={<CheckCircle sx={{ color: `${TEAL_LIGHT} !important` }} />}
                      label={`${result.readinessScore}% placement ready`}
                      sx={{ bgcolor: alpha("#fff", 0.12), color: "#fff", fontWeight: 700, backdropFilter: "blur(6px)", border: `1px solid ${alpha("#fff", 0.22)}` }}
                    />
                  </Zoom>
                )}
              </Stack>
            </Box>

            <Avatar
              src={photoUrl}
              sx={{
                position: "relative", zIndex: 1,
                width: 96, height: 96, fontSize: 40,
                bgcolor: alpha(GOLD, 0.3),
                fontFamily: FONT_DISPLAY, fontWeight: 700,
                border: `3px solid ${alpha("#fff", 0.85)}`,
                flexShrink: 0,
                boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
                transition: "transform .3s cubic-bezier(.34,1.56,.64,1)",
                "&:hover": { transform: "scale(1.08) rotate(3deg)" },
              }}
            >
              {displayName.charAt(0).toUpperCase()}
            </Avatar>
          </Paper>
        </Grow>

        {/* ---------------- TOP CARDS ---------------- */}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3, mb: 3 }}>

          <Grow in={mounted} timeout={650}>
            <Card sx={cardHoverSx}>
              <CardContent sx={{ p: 3.5 }}>
                <Stack direction="row" spacing={3} alignItems="center" justifyContent="space-between">
                  <Box>
                    <Stack direction="row" spacing={1.5} alignItems="center" mb={1}>
                      <Avatar sx={{ bgcolor: alpha(INK, 0.08), color: INK, width: 44, height: 44 }}>
                        <Analytics />
                      </Avatar>
                      <Typography color="text.secondary" fontWeight={600} fontSize={16}>Placement Readiness</Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 210, lineHeight: 1.6 }}>
                      {result
                        ? result.prediction || (result.persisted ? "Saved analysis result." : "")
                        : "Run the AI analysis below to get your score."}
                    </Typography>
                  </Box>
                  <CircularGauge
                    value={result?.readinessScore ?? null}
                    color={INK}
                    trackColor={PARCHMENT_DEEP}
                    trigger={mounted}
                    subText="Score"
                  />
                </Stack>
              </CardContent>
            </Card>
          </Grow>

          <Grow in={mounted} timeout={650} style={{ transitionDelay: mounted ? "90ms" : "0ms" }}>
            <Card sx={cardHoverSx}>
              <CardContent sx={{ p: 3.5 }}>
                <Stack direction="row" spacing={3} alignItems="center" justifyContent="space-between">
                  <Box>
                    <Stack direction="row" spacing={1.5} alignItems="center" mb={1}>
                      <Avatar sx={{ bgcolor: alpha(TEAL, 0.12), color: TEAL, width: 44, height: 44 }}>
                        <CheckCircle />
                      </Avatar>
                      <Typography color="text.secondary" fontWeight={600} fontSize={16}>Current CGPA</Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 210, lineHeight: 1.6 }}>
                      {displayCgpa == null
                        ? "Set your CGPA in your profile to track academic standing."
                        : displayCgpa >= 8.5 ? "Excellent academic standing."
                        : displayCgpa >= 7 ? "Solid academic standing."
                        : "Keep going — you're improving."}
                    </Typography>
                  </Box>
                  <CircularGauge
                    value={displayCgpa != null ? displayCgpa * 10 : null}
                    color={TEAL}
                    trackColor={alpha(TEAL, 0.12)}
                    trigger={mounted}
                    subText="out of 10"
                    formatMain={(v) => (v / 10).toFixed(1)}
                  />
                </Stack>
              </CardContent>
            </Card>
          </Grow>
        </Box>

        {/* ---------------- AI ANALYSIS + RESUME ---------------- */}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3, mb: 3 }}>

          <Grow in={mounted} timeout={700} style={{ transitionDelay: mounted ? "150ms" : "0ms" }}>
            <Card sx={cardHoverSx}>
              <CardContent sx={{ p: 4 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar sx={{ bgcolor: INK, width: 56, height: 56, color: GOLD_LIGHT }}>
                    <SmartToy />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontFamily: FONT_DISPLAY, fontWeight: 700 }}>AI Placement Analysis</Typography>
                    <Typography variant="caption" color="text.secondary">Uses your real academic profile + live attendance</Typography>
                  </Box>
                </Stack>

                {!result ? (
                  <>
                    <Typography sx={{ mt: 3, color: "text.secondary", lineHeight: 1.8, fontSize: 16 }}>
                      Analyze your profile to discover your placement readiness score.
                      The analysis uses your saved academic details, so complete your
                      {" "}
                      <Typography component="span" fontWeight={700} color={INK}>Placement Profile</Typography>
                      {" "}in the profile page first.
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={checkReadiness}
                      disabled={loading || !profile}
                      sx={{
                        mt: 4, borderRadius: 2, px: 4, py: 1.3, fontWeight: 700, textTransform: "none", bgcolor: INK,
                        transition: "all .25s cubic-bezier(.34,1.56,.64,1)",
                        "&:hover": { bgcolor: INK_SOFT, transform: "translateY(-2px)", boxShadow: `0 10px 22px ${alpha(INK, 0.35)}` },
                        "&:active": { transform: "translateY(0) scale(.97)" },
                      }}
                    >
                      {loading ? <CircularProgress size={22} color="inherit" /> : "Analyze My Profile"}
                    </Button>
                  </>
                ) : (
                  <Zoom in={!!result} timeout={450}>
                    <Box mt={3}>
                      <Typography sx={{ fontFamily: FONT_MONO, fontWeight: 700, fontSize: "2rem", color: INK }}>
                        {result.readinessScore != null ? `${result.readinessScore}%` : "—"}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={result.readinessScore ?? 0}
                        sx={{
                          mt: 2, height: 10, borderRadius: 5, bgcolor: PARCHMENT_DEEP,
                          "& .MuiLinearProgress-bar": { borderRadius: 5, background: `linear-gradient(90deg, ${GOLD_LIGHT}, ${GOLD})` },
                        }}
                      />

                      {(result.factorsSupportingPlacement?.length > 0 || result.factorsAgainstPlacement?.length > 0) && (
                        <Box sx={{ mt: 3 }}>
                          {result.factorsSupportingPlacement?.length > 0 && (
                            <>
                              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                                <TrendingUp fontSize="small" sx={{ color: TEAL }} />
                                <Typography variant="subtitle2" fontWeight={700} color={TEAL}>Working in your favour</Typography>
                              </Stack>
                              <Stack spacing={0.75} sx={{ mb: 2 }}>
                                {result.factorsSupportingPlacement.slice(0, 4).map((f, i) => (
                                  <Typography key={i} variant="body2" color="text.secondary">• {f}</Typography>
                                ))}
                              </Stack>
                            </>
                          )}
                          {result.factorsAgainstPlacement?.length > 0 && (
                            <>
                              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                                <WarningAmberRounded fontSize="small" sx={{ color: AMBER }} />
                                <Typography variant="subtitle2" fontWeight={700} color={AMBER}>Focus areas</Typography>
                              </Stack>
                              <Stack spacing={0.75}>
                                {result.factorsAgainstPlacement.slice(0, 4).map((f, i) => (
                                  <Typography key={i} variant="body2" color="text.secondary">• {f}</Typography>
                                ))}
                              </Stack>
                            </>
                          )}
                        </Box>
                      )}

                      <Button size="small" onClick={() => { setLiveResult(null); setStoredResult(null); }} sx={{ mt: 2, color: INK }}>
                        Re-run analysis
                      </Button>
                    </Box>
                  </Zoom>
                )}
              </CardContent>
            </Card>
          </Grow>

          <Grow in={mounted} timeout={700} style={{ transitionDelay: mounted ? "210ms" : "0ms" }}>
            <Card sx={cardHoverSx}>
              <CardContent sx={{ p: 4 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar sx={{ bgcolor: alpha(PLUM, 0.12), color: PLUM, width: 56, height: 56 }}>
                    <Description />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontFamily: FONT_DISPLAY, fontWeight: 700 }}>Resume</Typography>
                    <Typography variant="caption" color="text.secondary">AI-powered suggestions</Typography>
                  </Box>
                </Stack>

                {!resume ? (
                  <Box
                    component="label"
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    sx={{
                      mt: 4, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                      border: `2px dashed ${isDragging ? PLUM : alpha(PLUM, 0.3)}`,
                      bgcolor: isDragging ? alpha(PLUM, 0.08) : alpha(PLUM, 0.02),
                      borderRadius: 2, py: 4, cursor: "pointer",
                      transition: "all .25s",
                      transform: isDragging ? "scale(1.015)" : "scale(1)",
                      "&:hover": { borderColor: PLUM, bgcolor: alpha(PLUM, 0.06) },
                    }}
                  >
                    <CloudUpload
                      sx={{
                        fontSize: 36, color: PLUM, mb: 1,
                        animation: isDragging ? "float 1s ease-in-out infinite" : "none",
                      }}
                    />
                    <Typography fontWeight={700} sx={{ color: PLUM }}>Drag & drop or click to upload</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>PDF only</Typography>
                    <input hidden accept=".pdf" type="file" onChange={handleResumeUpload} />
                  </Box>
                ) : (
                  <Zoom in={!resumeRemoving} timeout={280}>
                    <Box>
                      <Paper
                        elevation={0}
                        sx={{
                          mt: 4, p: 2, bgcolor: alpha(PLUM, 0.04), display: "flex", justifyContent: "space-between",
                          alignItems: "center", borderRadius: 2, border: `1px solid ${alpha(PLUM, 0.15)}`,
                        }}
                      >
                        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
                          <InsertDriveFile sx={{ color: PLUM, flexShrink: 0 }} />
                          <Typography fontWeight={700} noWrap sx={{ maxWidth: 180 }}>{resume.name}</Typography>
                        </Stack>

                        <Stack direction="row" spacing={1}>
                          {resume.saved && (
                            <Tooltip title="View Resume">
                              <IconButton
                                onClick={() => window.open(`http://localhost:8080/uploads/profile/resumes/${resume.name}`, '_blank')}
                                sx={{ color: TEAL, transition: "transform .3s", "&:hover": { transform: "scale(1.1)", bgcolor: alpha(TEAL, 0.08) } }}
                              >
                                <Visibility />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Delete Resume">
                            <IconButton
                              onClick={removeResume}
                              sx={{ color: "#8C2F39", transition: "transform .3s", "&:hover": { transform: "rotate(90deg)", bgcolor: alpha("#8C2F39", 0.08) } }}
                            >
                              <Delete />
                            </IconButton>
                          </Tooltip>
                        </Stack>

                      </Paper>

                      {!resume.saved && (
                        <Button
                          fullWidth
                          variant="contained"
                          onClick={saveResumeToDatabase}
                          disabled={resumeUploading}
                          sx={{ mt: 2, bgcolor: PLUM, borderRadius: 2, fontWeight: 700, textTransform: "none", "&:hover": { bgcolor: "#4A3D73" } }}
                        >
                          {resumeUploading ? <CircularProgress size={20} color="inherit" /> : "Save Resume"}
                        </Button>
                      )}
                    </Box>
                  </Zoom>
                )}
              </CardContent>
            </Card>
          </Grow>
        </Box>

        {/* ---------------- BOTTOM SECTION ---------------- */}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr 1fr" }, gap: 3 }}>

          <Grow in={mounted} timeout={650} style={{ transitionDelay: mounted ? "260ms" : "0ms" }}>
            <Card sx={{ ...cardHoverSx, height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center" mb={3}>
                  <Avatar sx={{ bgcolor: alpha(PLUM, 0.12), color: PLUM }}><Assignment /></Avatar>
                  <Typography variant="h6" sx={{ fontFamily: FONT_DISPLAY, fontWeight: 700 }}>Quizzes & Tests</Typography>
                </Stack>
                <List disablePadding>
                  <ListItem disableGutters sx={{ borderRadius: 2, transition: "background .2s", "&:hover": { bgcolor: alpha(PLUM, 0.05) } }}>
                    <ListItemText
                      primary={`${upcomingTests.length} pending assessment${upcomingTests.length === 1 ? "" : "s"}`}
                      secondary={upcomingTests.length > 0 ? upcomingTests[0].title : "All caught up"}
                      primaryTypographyProps={{ fontWeight: 600 }}
                    />
                  </ListItem>
                </List>
              </CardContent>
              <Box sx={{ p: 2, pt: 0 }}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => setSection("internal")}
                  sx={{
                    borderRadius: 2, fontWeight: 700, textTransform: "none", bgcolor: PLUM,
                    transition: "all .25s",
                    "&:hover": { bgcolor: "#4A3D73", transform: "translateY(-2px)", boxShadow: `0 10px 20px ${alpha(PLUM, 0.35)}` },
                    "&:active": { transform: "translateY(0) scale(.97)" },
                  }}
                >
                  Open Assessments
                </Button>
              </Box>
            </Card>
          </Grow>

          <Grow in={mounted} timeout={650} style={{ transitionDelay: mounted ? "320ms" : "0ms" }}>
            <Card sx={{ ...cardHoverSx, height: "100%" }}>
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center" mb={3}>
                  <Avatar sx={{ bgcolor: alpha(INK, 0.08), color: INK }}><QuizIcon /></Avatar>
                  <Typography variant="h6" sx={{ fontFamily: FONT_DISPLAY, fontWeight: 700 }}>Upcoming Assessments</Typography>
                </Stack>
                <Stack spacing={1.5}>
                  {upcomingTests.length > 0 ? upcomingTests.map((test) => (
                    <Box
                      key={test.id}
                      onClick={() => navigate(`/student/tests/${test.id}/take`)}
                      sx={{
                        cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        p: 1.4, borderRadius: 2, borderLeft: `3px solid ${AMBER}`,
                        bgcolor: alpha(AMBER, 0.04), transition: "all .25s",
                        "&:hover": { bgcolor: alpha(AMBER, 0.09), transform: "translateX(4px)" },
                      }}
                    >
                      <Box>
                        <Typography fontWeight={700} fontSize={14.5}>{test.title}</Typography>
                        <Typography color="text.secondary" variant="body2">
                          {test.durationMinutes} min • {test.questions?.length ?? 0} questions
                        </Typography>
                      </Box>
                    </Box>
                  )) : (
                    <Typography color="text.secondary" variant="body2">
                      No pending assessments right now. New tests published by faculty will appear here.
                    </Typography>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grow>

          <Grow in={mounted} timeout={650} style={{ transitionDelay: mounted ? "380ms" : "0ms" }}>
            <Card sx={{ ...cardHoverSx, height: "100%" }}>
              <CardContent sx={{ p: 3.5 }}>
                <Stack direction="row" spacing={2} alignItems="center" mb={3.5}>
                  <Avatar sx={{ bgcolor: alpha(INK, 0.08), color: INK }}><TrendingUp /></Avatar>
                  <Typography variant="h6" sx={{ fontFamily: FONT_DISPLAY, fontWeight: 700 }}>My Skills</Typography>
                </Stack>

                {skillsList.length > 0 ? (
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {skillsList.map((skill) => (
                      <Chip
                        key={skill}
                        label={skill}
                        sx={{
                          fontWeight: 700,
                          bgcolor: alpha(TEAL, 0.08),
                          color: TEAL,
                          border: `1px solid ${alpha(TEAL, 0.25)}`,
                        }}
                      />
                    ))}
                  </Stack>
                ) : (
                  <Typography color="text.secondary" variant="body2">
                    Add skills in your profile so faculty and the AI engine can see them.
                  </Typography>
                )}
                <Button
                  size="small"
                  onClick={() => navigate("/profile")}
                  sx={{ mt: 2.5, color: INK, textTransform: "none", fontWeight: 700 }}
                >
                  Manage skills →
                </Button>
              </CardContent>
            </Card>
          </Grow>

          <Grow in={mounted} timeout={650} style={{ transitionDelay: mounted ? "440ms" : "0ms" }}>
            <Card sx={{ ...cardHoverSx, height: "100%" }}>
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center" mb={3}>
                  <Avatar sx={{ bgcolor: alpha(AMBER, 0.14), color: AMBER }}><Notifications /></Avatar>
                  <Typography variant="h6" sx={{ fontFamily: FONT_DISPLAY, fontWeight: 700 }}>Notifications</Typography>
                </Stack>
                {realNotifications.length > 0 ? (
                  <List disablePadding>
                    {realNotifications.map((n, idx) => (
                      <React.Fragment key={n.id ?? idx}>
                        <ListItem disableGutters sx={{ borderRadius: 2, transition: "background .2s", "&:hover": { bgcolor: alpha(AMBER, 0.06) } }}>
                          <Stack direction="row" spacing={1.2} alignItems="flex-start" sx={{ width: "100%" }}>
                            <Box sx={{ width: 8, flexShrink: 0, mt: 0.9 }}>
                              {n.status === "UNREAD" && (
                                <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: AMBER, animation: "dotPulse 1.8s infinite" }} />
                              )}
                            </Box>
                            <ListItemText
                              primary={n.message}
                              secondary={n.sentDate ? new Date(n.sentDate).toLocaleDateString() : ""}
                              primaryTypographyProps={{ fontWeight: 700, fontSize: 13.5 }}
                            />
                          </Stack>
                        </ListItem>
                        {idx < realNotifications.length - 1 && <Divider component="li" sx={{ listStyle: "none" }} />}
                      </React.Fragment>
                    ))}
                  </List>
                ) : (
                  <Typography color="text.secondary" variant="body2">
                    No notifications yet. Alerts from your tutors and placement updates will appear here.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grow>

        </Box>
      </Box>
    </Box>
  );
}

export default StudentDashboard;
