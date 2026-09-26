import React, { useState, useEffect, useCallback } from "react";
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
  GlobalStyles,
  alpha,
  Alert,
  Snackbar,
  Collapse,
} from "@mui/material";

import {
  RocketLaunch,
  TrendingUp,
  CheckCircle,
  ExpandMore,
  ExpandLess,
  AutoAwesome,
  WorkspacePremium,
  WarningAmberRounded,
  BarChart,
  EventNote,
} from "@mui/icons-material";

import axios from "axios";
import { describeError } from "../services/api";

axios.defaults.withCredentials = true;

const INK = "#141B33";
const PARCHMENT = "#FBF8F1";
const PARCHMENT_DEEP = "#F3EEE0";
const GOLD = "#B8892B";
const GOLD_LIGHT = "#E2B857";
const TEAL = "#1F6F73";
const AMBER = "#C9772E";
const PLUM = "#5B4B8A";
const CRIMSON = "#8C2F39";

const FONT_DISPLAY = "'Fraunces', Georgia, 'Times New Roman', serif";
const FONT_MONO = "'JetBrains Mono', 'Roboto Mono', 'Courier New', monospace";

const GRADIENT_LEDGER = `linear-gradient(120deg, ${INK} 0%, #1B234A 45%, ${PLUM} 130%)`;

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
  "@keyframes sealPulse": {
    "0%, 100%": { boxShadow: `0 0 0 0 ${alpha(GOLD_LIGHT, 0.5)}` },
    "50%": { boxShadow: `0 0 0 10px ${alpha(GOLD_LIGHT, 0)}` },
  },
  "@keyframes pulseText": {
    "0%, 100%": { opacity: 0.5 },
    "50%": { opacity: 1 },
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
  "@keyframes scanSweep": {
    "0%": { top: "-4%", opacity: 0 },
    "6%": { opacity: 0.55 },
    "50%": { opacity: 0.55 },
    "94%": { opacity: 0 },
    "100%": { top: "104%", opacity: 0 },
  },
};

const cardHoverSx = {
  borderRadius: 3,
  border: `1px solid ${alpha(INK, 0.1)}`,
  boxShadow: `0 16px 34px -24px ${alpha(INK, 0.5)}`,
  transition:
    "transform .35s cubic-bezier(.25,.8,.25,1), box-shadow .35s cubic-bezier(.25,.8,.25,1)",
  "&:hover": {
    transform: "translateY(-6px)",
    boxShadow: `0 22px 44px -18px ${alpha(INK, 0.35)}`,
  },
};

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

function useCountUp(target, { duration = 1200, trigger = true } = {}) {
  const [value, setValue] = useState(0);
  const rafRef = React.useRef();

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
}) {
  const animated = useCountUp(value ?? 0, {
    duration: 1400,
    trigger: trigger && value != null,
  });
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value ?? 0));
  const offset =
    circumference -
    ((trigger && value != null ? clamped : 0) / 100) * circumference;
  const mainText =
    value == null ? "—" : `${Math.round(animated)}%`;

  return (
    <Box
      sx={{
        position: "relative",
        width: size,
        height: size,
        flexShrink: 0,
      }}
    >
      <svg
        width={size}
        height={size}
        style={{ transform: "rotate(-90deg)", display: "block" }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
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
          style={{
            transition:
              "stroke-dashoffset 1.4s cubic-bezier(0.65,0,0.35,1)",
          }}
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
        <Typography
          sx={{
            fontFamily: FONT_MONO,
            fontWeight: 700,
            color,
            lineHeight: 1,
            fontSize: "1.4rem",
          }}
        >
          {mainText}
        </Typography>
        {subText && (
          <Typography
            variant="caption"
            color="text.secondary"
            fontWeight={600}
            sx={{ mt: 0.4 }}
          >
            {subText}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

function PriorityChip({ priority }) {
  const colorMap = {
    High: { bg: alpha(CRIMSON, 0.12), color: CRIMSON },
    Medium: { bg: alpha(AMBER, 0.12), color: AMBER },
    Low: { bg: alpha(TEAL, 0.12), color: TEAL },
    "No Gap": { bg: alpha(TEAL, 0.12), color: TEAL },
  };
  const c = colorMap[priority] || colorMap.Low;
  return (
    <Chip
      size="small"
      label={priority}
      sx={{
        fontWeight: 700,
        bgcolor: c.bg,
        color: c.color,
        fontSize: "0.72rem",
      }}
    />
  );
}

function ScoreBar({ score, maxScore = 100, color = INK }) {
  return (
    <Box sx={{ width: "100%" }}>
      <LinearProgress
        variant="determinate"
        value={score}
        sx={{
          height: 8,
          borderRadius: 4,
          bgcolor: PARCHMENT_DEEP,
          "& .MuiLinearProgress-bar": {
            borderRadius: 4,
            background: `linear-gradient(90deg, ${alpha(color, 0.6)}, ${color})`,
          },
        }}
      />
    </Box>
  );
}

function RecommendationSection({ rec, expanded, onToggle }) {
  return (
    <Card
      sx={{
        border: `1px solid ${alpha(INK, 0.08)}`,
        borderRadius: 3,
        boxShadow: "none",
        "&:hover": { boxShadow: `0 4px 16px -8px ${alpha(INK, 0.15)}` },
        transition: "box-shadow .25s",
      }}
    >
      <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
        <Box
          onClick={onToggle}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 2.5,
            py: 2,
            cursor: "pointer",
            "&:hover": { bgcolor: alpha(INK, 0.02) },
            transition: "background .15s",
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
            <PriorityChip priority={rec.priority} />
            <Typography fontWeight={700} sx={{ fontSize: "0.95rem" }}>
              {rec.skill}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
              {rec.currentScore >= 0 ? `${rec.currentScore}% → ${rec.targetScore}%` : "Not assessed → " + rec.targetScore + "%"}
            </Typography>
          </Stack>
          <IconButton size="small">
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>
        <Collapse in={expanded}>
          <Box sx={{ px: 2.5, pb: 2.5, pt: 0 }}>
            <Divider sx={{ mb: 2 }} />
            <Stack spacing={1.5}>
              <Box>
                <Typography variant="caption" fontWeight={700} color={INK} sx={{ textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  What to Learn
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.6 }}>
                  {rec.whatToLearn}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" fontWeight={700} color={INK} sx={{ textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Practice
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.6 }}>
                  {rec.practice}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" fontWeight={700} color={INK} sx={{ textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Project Suggestion
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.6 }}>
                  {rec.projectSuggestion}
                </Typography>
              </Box>
              {rec.certificationCategory && (
                <Box>
                  <Typography variant="caption" fontWeight={700} color={INK} sx={{ textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Recommended Certification
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {rec.certificationCategory}
                  </Typography>
                </Box>
              )}
            </Stack>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
}

function CareerRecommendation() {
  useLedgerFonts();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [expandedRec, setExpandedRec] = useState(null);
  const [snack, setSnack] = useState({ open: false, msg: "", severity: "info" });

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 120);
    return () => clearTimeout(t);
  }, []);

  const fetchRecommendation = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const userRes = await axios.get("http://localhost:8080/api/auth/me");
      const userId = userRes.data.id;
      const res = await axios.get(
        `http://localhost:8080/api/career-recommendation/${userId}`
      );
      setData(res.data);
    } catch (err) {
      const msg = describeError(err, "Failed to load career recommendation.");
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecommendation();
  }, [fetchRecommendation]);

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 400,
          gap: 2,
        }}
      >
        <CircularProgress size={46} thickness={4} sx={{ color: INK }} />
        <Typography
          color="text.secondary"
          fontWeight={600}
          sx={{
            fontFamily: FONT_DISPLAY,
            animation: "pulseText 1.6s ease-in-out infinite",
          }}
        >
          Analyzing your skills and career fit...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ maxWidth: 720, mx: "auto" }}>
        <Card sx={cardHoverSx}>
          <CardContent sx={{ p: 4, textAlign: "center" }}>
            <Avatar
              sx={{
                bgcolor: alpha(AMBER, 0.12),
                color: AMBER,
                width: 64,
                height: 64,
                mx: "auto",
                mb: 2,
              }}
            >
              <WarningAmberRounded sx={{ fontSize: 32 }} />
            </Avatar>
            <Typography
              variant="h6"
              sx={{ fontFamily: FONT_DISPLAY, fontWeight: 700, mb: 1 }}
            >
              Unable to Load Recommendations
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              {error}
            </Typography>
            <Button
              variant="contained"
              onClick={fetchRecommendation}
              sx={{
                bgcolor: INK,
                "&:hover": { bgcolor: "#0F1730" },
                fontWeight: 700,
                px: 4,
              }}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  if (!data) return null;

  const { recommendedRole, alternativeRoles, skillAnalysis, skillGaps, recommendations } = data;

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto" }}>
      <GlobalStyles styles={keyframesStyles} />

      {/* Hero Banner */}
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
            sx={{
              position: "absolute",
              width: 280,
              height: 280,
              borderRadius: "50%",
              bgcolor: alpha("#fff", 0.08),
              filter: "blur(4px)",
              top: -100,
              right: -70,
              animation: "floatSlow 11s ease-in-out infinite",
            }}
          />
          <Box sx={{ position: "relative", zIndex: 1, flex: 1, minWidth: 0 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Box
                sx={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: `radial-gradient(circle at 35% 30%, ${GOLD_LIGHT}, ${GOLD} 70%)`,
                  animation: "sealPulse 2.6s ease-in-out infinite",
                }}
              >
                <RocketLaunch sx={{ fontSize: 15, color: INK }} />
              </Box>
              <Typography
                sx={{
                  opacity: 0.8,
                  fontWeight: 700,
                  letterSpacing: 2,
                  fontSize: 12,
                  textTransform: "uppercase",
                }}
              >
                AI Career Recommendation
              </Typography>
            </Stack>
            <Typography
              variant="h3"
              sx={{
                mt: 0.5,
                fontFamily: FONT_DISPLAY,
                fontWeight: 700,
                backgroundImage: `linear-gradient(90deg, #ffffff, ${alpha(
                  GOLD_LIGHT,
                  0.9
                )})`,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
                fontSize: { xs: "1.8rem", md: "2.4rem" },
              }}
            >
              Your Career Path
            </Typography>
            <Typography sx={{ mt: 1, opacity: 0.85, fontSize: 16, maxWidth: 560 }}>
              Analyzed {data.totalAssessmentsAnalyzed} assessments covering{" "}
              {data.totalQuestionsAnalyzed} questions across{" "}
              {skillAnalysis.length} skills.
            </Typography>
          </Box>
        </Paper>
      </Grow>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 3, mb: 3 }}>
        {/* Recommended Role */}
        {recommendedRole && (
          <Grow in={mounted} timeout={650}>
            <Card sx={cardHoverSx}>
              <CardContent sx={{ p: 4 }}>
                <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                  <Avatar
                    sx={{
                      bgcolor: alpha(TEAL, 0.12),
                      color: TEAL,
                      width: 52,
                      height: 52,
                    }}
                  >
                    <WorkspacePremium />
                  </Avatar>
                  <Box>
                    <Typography
                      variant="caption"
                      fontWeight={700}
                      color="text.secondary"
                      sx={{ textTransform: "uppercase", letterSpacing: "1px" }}
                    >
                      Recommended Role
                    </Typography>
                    <Typography
                      variant="h5"
                      sx={{
                        fontFamily: FONT_DISPLAY,
                        fontWeight: 700,
                        lineHeight: 1.2,
                      }}
                    >
                      {recommendedRole.name}
                    </Typography>
                  </Box>
                </Stack>

                <Box sx={{ my: 3, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <CircularGauge
                    value={recommendedRole.matchScore}
                    size={140}
                    strokeWidth={12}
                    color={TEAL}
                    trigger={mounted}
                    subText="Match"
                  />
                </Box>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 1.5, lineHeight: 1.6, fontStyle: "italic" }}
                >
                  {recommendedRole.description}
                </Typography>

                <Box>
                  <Typography
                    variant="caption"
                    fontWeight={700}
                    color={INK}
                    sx={{ textTransform: "uppercase", letterSpacing: "0.5px" }}
                  >
                    Why this role?
                  </Typography>
                  <List disablePadding sx={{ mt: 1 }}>
                    {(recommendedRole.reason || []).slice(0, 5).map((r, i) => (
                      <ListItem key={i} disableGutters sx={{ py: 0.3 }}>
                        <ListItemText
                          primary={
                            <Stack direction="row" spacing={1} alignItems="center">
                              <CheckCircle
                                sx={{
                                  fontSize: 16,
                                  color: r.startsWith("Strong")
                                    ? TEAL
                                    : r.startsWith("Good")
                                    ? GOLD
                                    : alpha(INK, 0.4),
                                }}
                              />
                              <Typography variant="body2" fontWeight={600}>
                                {r}
                              </Typography>
                            </Stack>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              </CardContent>
            </Card>
          </Grow>
        )}

        {/* Alternative Roles */}
        <Grow in={mounted} timeout={700}>
          <Card sx={{ ...cardHoverSx, display: "flex", flexDirection: "column" }}>
            <CardContent sx={{ p: 4, flex: 1 }}>
              <Stack direction="row" spacing={2} alignItems="center" mb={3}>
                <Avatar
                  sx={{
                    bgcolor: alpha(PLUM, 0.12),
                    color: PLUM,
                    width: 52,
                    height: 52,
                  }}
                >
                  <TrendingUp />
                </Avatar>
                <Box>
                  <Typography
                    variant="caption"
                    fontWeight={700}
                    color="text.secondary"
                    sx={{ textTransform: "uppercase", letterSpacing: "1px" }}
                  >
                    Other Suitable Roles
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{ fontFamily: FONT_DISPLAY, fontWeight: 700 }}
                  >
                    Ranked by Match
                  </Typography>
                </Box>
              </Stack>

              {alternativeRoles && alternativeRoles.length > 0 ? (
                <Stack spacing={2}>
                  {alternativeRoles.map((role, i) => (
                    <Box
                      key={i}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        p: 2,
                        borderRadius: 2,
                        bgcolor: alpha(PLUM, 0.03),
                        border: `1px solid ${alpha(PLUM, 0.1)}`,
                        transition: "all .2s",
                        "&:hover": {
                          bgcolor: alpha(PLUM, 0.06),
                          borderColor: alpha(PLUM, 0.2),
                        },
                      }}
                    >
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Typography
                          sx={{
                            fontFamily: FONT_MONO,
                            fontWeight: 700,
                            color: PLUM,
                            fontSize: "0.85rem",
                            minWidth: 28,
                          }}
                        >
                          #{i + 2}
                        </Typography>
                        <Box>
                          <Typography fontWeight={700} fontSize="0.95rem">
                            {role.name}
                          </Typography>
                        </Box>
                      </Stack>
                      <Box sx={{ width: 120, display: "flex", alignItems: "center", gap: 1.5 }}>
                        <ScoreBar score={role.matchScore} color={PLUM} />
                        <Typography
                          fontFamily={FONT_MONO}
                          fontWeight={700}
                          fontSize="0.85rem"
                          color={PLUM}
                          sx={{ minWidth: 38, textAlign: "right" }}
                        >
                          {role.matchScore}%
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Stack>
              ) : (
                <Typography color="text.secondary" variant="body2">
                  No additional roles matched above threshold.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grow>
      </Box>

      {/* Skill Analysis */}
      <Grow in={mounted} timeout={750}>
        <Card sx={{ ...cardHoverSx, mb: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <Stack direction="row" spacing={2} alignItems="center" mb={3}>
              <Avatar
                sx={{
                  bgcolor: alpha(INK, 0.08),
                  color: INK,
                  width: 52,
                  height: 52,
                }}
              >
                <BarChart />
              </Avatar>
              <Box>
                <Typography
                  variant="caption"
                  fontWeight={700}
                  color="text.secondary"
                  sx={{ textTransform: "uppercase", letterSpacing: "1px" }}
                >
                  Skill Analysis
                </Typography>
                <Typography
                  variant="h6"
                  sx={{ fontFamily: FONT_DISPLAY, fontWeight: 700 }}
                >
                  Your Performance Across Skills
                </Typography>
              </Box>
            </Stack>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
              {skillAnalysis.map((skill, i) => (
                <Box
                  key={i}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: alpha(
                      skill.level === "Strong"
                        ? TEAL
                        : skill.level === "Good"
                        ? GOLD
                        : skill.level === "Developing"
                        ? AMBER
                        : CRIMSON,
                      0.04
                    ),
                    border: `1px solid ${alpha(
                      skill.level === "Strong"
                        ? TEAL
                        : skill.level === "Good"
                        ? GOLD
                        : skill.level === "Developing"
                        ? AMBER
                        : CRIMSON,
                      0.12
                    )}`,
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                      <Typography fontWeight={700} fontSize="0.9rem" noWrap>
                        {skill.skill}
                      </Typography>
                      <Typography
                        fontFamily={FONT_MONO}
                        fontWeight={700}
                        fontSize="0.85rem"
                        color={
                          skill.level === "Strong"
                            ? TEAL
                            : skill.level === "Good"
                            ? GOLD
                            : skill.level === "Developing"
                            ? AMBER
                            : CRIMSON
                        }
                      >
                        {skill.score}%
                      </Typography>
                    </Stack>
                    <ScoreBar
                      score={skill.score}
                      color={
                        skill.level === "Strong"
                          ? TEAL
                          : skill.level === "Good"
                          ? GOLD
                          : skill.level === "Developing"
                          ? AMBER
                          : CRIMSON
                      }
                    />
                    <Typography
                      variant="caption"
                      fontWeight={700}
                      sx={{
                        mt: 0.5,
                        display: "block",
                        color:
                          skill.level === "Strong"
                            ? TEAL
                            : skill.level === "Good"
                            ? GOLD
                            : skill.level === "Developing"
                            ? AMBER
                            : CRIMSON,
                      }}
                    >
                      {skill.level}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      </Grow>

      {/* Skill Gaps */}
      {skillGaps && skillGaps.length > 0 && (
        <Grow in={mounted} timeout={800}>
          <Card sx={{ ...cardHoverSx, mb: 3 }}>
            <CardContent sx={{ p: 4 }}>
              <Stack direction="row" spacing={2} alignItems="center" mb={3}>
                <Avatar
                  sx={{
                    bgcolor: alpha(AMBER, 0.12),
                    color: AMBER,
                    width: 52,
                    height: 52,
                  }}
                >
                  <WarningAmberRounded />
                </Avatar>
                <Box>
                  <Typography
                    variant="caption"
                    fontWeight={700}
                    color="text.secondary"
                    sx={{ textTransform: "uppercase", letterSpacing: "1px" }}
                  >
                    Skill Gaps for {recommendedRole?.name}
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{ fontFamily: FONT_DISPLAY, fontWeight: 700 }}
                  >
                    Areas to Improve
                  </Typography>
                </Box>
              </Stack>

              {(() => {
                const openGaps = skillGaps.filter((g) => g.priority !== "No Gap");
                if (openGaps.length === 0) {
                  return (
                    <Box
                      sx={{
                        p: 3,
                        borderRadius: 2,
                        bgcolor: alpha(TEAL, 0.05),
                        border: `1px solid ${alpha(TEAL, 0.2)}`,
                        textAlign: "center",
                      }}
                    >
                      <CheckCircle sx={{ color: TEAL, mb: 1 }} />
                      <Typography fontWeight={700} sx={{ mb: 0.5 }}>
                        You're on track for {recommendedRole?.name}!
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        All required skills for this role are met. Keep practicing and explore the
                        alternative roles or the weekly learning path below to stay sharp.
                      </Typography>
                    </Box>
                  );
                }
                return (
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" }, gap: 2 }}>
                    {openGaps.map((gap, i) => (
                      <Box
                        key={i}
                        sx={{
                          p: 2.5,
                          borderRadius: 2,
                          border: `1px solid ${alpha(
                            gap.priority === "High"
                              ? CRIMSON
                              : gap.priority === "Medium"
                              ? AMBER
                              : TEAL,
                            0.15
                          )}`,
                          bgcolor: alpha(
                            gap.priority === "High"
                              ? CRIMSON
                              : gap.priority === "Medium"
                              ? AMBER
                              : TEAL,
                            0.04
                          ),
                        }}
                      >
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                          <Typography fontWeight={700} fontSize="0.95rem">
                            {gap.skill}
                          </Typography>
                          <PriorityChip priority={gap.priority} />
                        </Stack>
                        <Typography variant="body2" color="text.secondary" fontWeight={600}>
                          {gap.status === "Not Assessed" ? (
                            "Not yet assessed"
                          ) : (
                            <>
                              {gap.currentScore}% → {gap.targetScore}% target
                            </>
                          )}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                );
              })()}
            </CardContent>
          </Card>
        </Grow>
      )}

      {/* Week-by-Week Learning Path */}
      {data.learningPath && data.learningPath.length > 0 && (
        <Grow in={mounted} timeout={830}>
          <Card sx={{ ...cardHoverSx, mb: 3 }}>
            <CardContent sx={{ p: 4 }}>
              <Stack direction="row" spacing={2} alignItems="center" mb={1}>
                <Avatar
                  sx={{
                    bgcolor: alpha(TEAL, 0.12),
                    color: TEAL,
                    width: 52,
                    height: 52,
                  }}
                >
                  <EventNote />
                </Avatar>
                <Box>
                  <Typography
                    variant="caption"
                    fontWeight={700}
                    color="text.secondary"
                    sx={{ textTransform: "uppercase", letterSpacing: "1px" }}
                  >
                    Your Learning Path
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{ fontFamily: FONT_DISPLAY, fontWeight: 700 }}
                  >
                    Week-by-Week Plan to Close Your Skill Gaps
                  </Typography>
                </Box>
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 720 }}>
                Built from every skill you're still weak in — whether it's required for your recommended
                role or just an area you've lagged behind. Each weak area gets its own weeks, starting with
                foundations and ending in applied practice. Follow the topics, then re-test yourself on EduAI
                assessments to track progress.
              </Typography>

              <Box>
                {data.learningPath.map((week, i) => {
                  const phaseColors = {
                    Foundations: CRIMSON,
                    "Core Concepts": AMBER,
                    "Application & Mastery": TEAL,
                  };
                  const pc = phaseColors[week.phase] || TEAL;
                  return (
                    <Box
                      key={i}
                      sx={{
                        display: "flex",
                        gap: 2,
                        position: "relative",
                        pb: 3,
                        "&:last-of-type": { pb: 0 },
                      }}
                    >
                      {i < data.learningPath.length - 1 && (
                        <Box
                          sx={{
                            position: "absolute",
                            left: 20,
                            top: 46,
                            bottom: 0,
                            width: 2,
                            bgcolor: alpha(GOLD, 0.28),
                          }}
                        />
                      )}
                      <Box
                        sx={{
                          width: 42,
                          height: 42,
                          borderRadius: "50%",
                          flexShrink: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          bgcolor: alpha(pc, 0.1),
                          color: pc,
                          border: `1.5px solid ${alpha(pc, 0.45)}`,
                          fontFamily: FONT_MONO,
                          fontWeight: 700,
                          fontSize: "0.72rem",
                        }}
                      >
                        {String(week.weekNumber).padStart(2, "0")}
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={1}
                          sx={{ flexWrap: "wrap" }}
                        >
                          <Typography fontWeight={700} fontSize="0.98rem">
                            {week.skill}
                          </Typography>
                          <Chip
                            size="small"
                            label={week.phase}
                            sx={{
                              fontWeight: 700,
                              fontSize: "0.68rem",
                              bgcolor: alpha(pc, 0.1),
                              color: pc,
                            }}
                          />
                        </Stack>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mt: 0.3, lineHeight: 1.5 }}
                        >
                          {week.goal}
                        </Typography>
                        <Stack
                          direction="row"
                          flexWrap="wrap"
                          spacing={0.75}
                          useFlexGap
                          sx={{ mt: 1.2, mb: 1 }}
                        >
                          {week.topics.map((t, ti) => (
                            <Chip
                              key={ti}
                              label={t}
                              size="small"
                              sx={{
                                fontSize: "0.72rem",
                                fontWeight: 600,
                                bgcolor: PARCHMENT_DEEP,
                                color: INK,
                                border: `1px solid ${alpha(INK, 0.1)}`,
                              }}
                            />
                          ))}
                        </Stack>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: "block", lineHeight: 1.5, fontStyle: "italic" }}
                        >
                          {week.practice}
                        </Typography>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </CardContent>
          </Card>
        </Grow>
      )}

      {/* Personalized Recommendations */}
      {recommendations && recommendations.length > 0 && (
        <Grow in={mounted} timeout={850}>
          <Box sx={{ mb: 3 }}>
            <Stack direction="row" spacing={2} alignItems="center" mb={2}>
              <Avatar
                sx={{
                  bgcolor: alpha(GOLD, 0.12),
                  color: GOLD,
                  width: 52,
                  height: 52,
                }}
              >
                <AutoAwesome />
              </Avatar>
              <Box>
                <Typography
                  variant="caption"
                  fontWeight={700}
                  color="text.secondary"
                  sx={{ textTransform: "uppercase", letterSpacing: "1px" }}
                >
                  Personalized Recommendations
                </Typography>
                <Typography
                  variant="h6"
                  sx={{ fontFamily: FONT_DISPLAY, fontWeight: 700 }}
                >
                  Learning Roadmap
                </Typography>
              </Box>
            </Stack>

            <Stack spacing={1.5}>
              {recommendations.map((rec, i) => (
                <RecommendationSection
                  key={i}
                  rec={rec}
                  expanded={expandedRec === i}
                  onToggle={() =>
                    setExpandedRec(expandedRec === i ? null : i)
                  }
                />
              ))}
            </Stack>
          </Box>
        </Grow>
      )}

      <Snackbar
        open={snack.open}
        autoHideDuration={5000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snack.severity}
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
        >
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default CareerRecommendation;
