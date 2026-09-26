import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  Tabs,
  Tab,
  Paper,
  Stack,
  Alert,
  Snackbar,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Videocam,
  Warning as WarningIcon,
  Timer as TimerIcon,
  CheckCircle,
  Cancel,
  NavigateNext,
  NavigateBefore,
  Flag,
  PlayArrow,
  ScreenShare,
  GppBad as ShieldBad,
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";

import api, { describeError } from "../services/api";
import { COLORS, FONTS, formatClock, injectLedgerFonts } from "../theme";

// ---------------------------------------------------------------------------
// Ledger-styled primitives
// ---------------------------------------------------------------------------
const PageShell = styled(Box)(() => ({
  minHeight: "100vh",
  background: COLORS.PARCHMENT,
  padding: { xs: 2, md: 4 },
}));

const LedgerCard = styled(Card)(() => ({
  borderRadius: "14px",
  border: `1px solid ${COLORS.GOLD}33`,
  boxShadow: "0 12px 32px -18px rgba(20,27,51,0.35)",
  backgroundColor: "#FFFFFF",
}));

const SectionLabel = ({ children }) => (
  <Typography
    sx={{
      fontFamily: FONTS.mono,
      fontSize: "0.68rem",
      letterSpacing: "0.18em",
      textTransform: "uppercase",
      color: COLORS.INK,
      opacity: 0.55,
      mb: 0.5,
    }}
  >
    {children}
  </Typography>
);

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function ProtectedTest() {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  injectLedgerFonts();

  // --- lifecycle state -------------------------------------------------------
  // preflight -> active -> submitting -> result | terminated | blocked
  const [phase, setPhase] = useState("preflight");
  const [loadingAssessment, setLoadingAssessment] = useState(true);
  const [assessment, setAssessment] = useState(null);
  const [alreadyDone, setAlreadyDone] = useState(null); // previous attempt summary
  const [fatalError, setFatalError] = useState("");

  // --- attempt / proctoring state --------------------------------------------
  const attemptIdRef = useRef(null);
  const [attemptState, setAttemptState] = useState(null); // server AttemptStateResponse
  const [runningCode, setRunningCode] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [codeLangs, setCodeLangs] = useState({}); // questionId -> language used
  const [recordingOn, setRecordingOn] = useState(false);
  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const startedAtMsRef = useRef(null);
  const recordingStartRef = useRef(null);
  const blurGuardRef = useRef(0);
  const reportViolationRef = useRef(null);
  const doSubmitRef = useRef(null);

  // --- webcam state ---
  const [webcamOn, setWebcamOn] = useState(false);
  const webcamStreamRef = useRef(null);
  const webcamRecorderRef = useRef(null);
  const webcamChunksRef = useRef([]);
  const webcamStartRef = useRef(null);

  // --- test-taking state ------------------------------------------------------
  const [answers, setAnswers] = useState({});
  const [qIndex, setQIndex] = useState(0);
  const [codeLangTab, setCodeLangTab] = useState(0);
  const [flagged, setFlagged] = useState(() => new Set());

  // --- timer ------------------------------------------------------------------
  const [remaining, setRemaining] = useState(0);
  const lastSyncRef = useRef(Date.now());

  // --- dialogs / toasts --------------------------------------------------------
  const [warningOpen, setWarningOpen] = useState(false);
  const [warningMsg, setWarningMsg] = useState("");
  const [submitOpen, setSubmitOpen] = useState(false);
  const [snack, setSnack] = useState({ open: false, msg: "", severity: "info" });

  const [result, setResult] = useState(null); // SubmissionResult
  const [terminatedInfo, setTerminatedInfo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const questions = assessment?.questions ?? [];
  const question = questions[qIndex];

  // Clear stale run output when navigating between questions
  useEffect(() => {
    setRunResult(null);
    setRunningCode(false);
  }, [question?.id]);
  const answeredCount = Object.values(answers).filter((v) => v != null && String(v).trim() !== "").length;

  // ---------------------------------------------------------------------------
  // Initial load: fetch assessment + verify no completed attempt exists
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [aRes, attemptsRes] = await Promise.all([
          api.get(`/api/assessments/${assessmentId}`),
          api.get("/api/attempts/my"),
        ]);
        if (cancelled) return;
        setAssessment(aRes.data);
        const prev = (attemptsRes.data || []).find(
          (t) => String(t.assessmentId) === String(assessmentId)
        );
        if (prev && ["SUBMITTED", "EXPIRED", "TERMINATED"].includes(prev.status)) {
          setAlreadyDone(prev);
        }
      } catch (err) {
        if (!cancelled) setFatalError(describeError(err, "Could not load this test."));
      } finally {
        if (!cancelled) setLoadingAssessment(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [assessmentId]);

  // ---------------------------------------------------------------------------
  // Recording helpers
  // ---------------------------------------------------------------------------
  const pickMimeType = () => {
    const candidates = ["video/webm;codecs=vp8", "video/webm;codecs=vp9", "video/webm"];
    for (const c of candidates) {
      if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(c)) return c;
    }
    return "";
  };

  const stopRecording = useCallback(() => {
    try {
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        recorderRef.current.stop();
      }
    } catch (_) { /* already stopped */ }
    try {
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    } catch (_) { /* noop */ }
    try {
      if (webcamRecorderRef.current && webcamRecorderRef.current.state !== "inactive") {
        webcamRecorderRef.current.stop();
      }
    } catch (_) { /* already stopped */ }
    try {
      if (webcamStreamRef.current) webcamStreamRef.current.getTracks().forEach((t) => t.stop());
    } catch (_) { /* noop */ }
    setRecordingOn(false);
    setWebcamOn(false);
  }, []);

  /** Uploads the assembled webm blob (if any) for this attempt. */
  const uploadRecording = useCallback(async () => {
    const id = attemptIdRef.current;
    if (!id) return;
    const chunks = chunksRef.current;
    if (!chunks.length) return;
    const durationSeconds = recordingStartRef.current
      ? Math.round((Date.now() - recordingStartRef.current) / 1000)
      : null;
    try {
      const blob = new Blob(chunks, { type: "video/webm" });
      const form = new FormData();
      form.append("file", blob, `attempt_${id}.webm`);
      if (durationSeconds != null) form.append("durationSeconds", String(durationSeconds));
      await api.post(`/api/attempts/${id}/recording`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    } catch (err) {
      setSnack({
        open: true,
        msg: describeError(err, "Could not store the screen recording."),
        severity: "error",
      });
    }
  }, []);

  /** Uploads the webcam recording blob (if any) for this attempt. */
  const uploadWebcam = useCallback(async () => {
    const id = attemptIdRef.current;
    if (!id) return;
    const chunks = webcamChunksRef.current;
    if (!chunks.length) return;
    const durationSeconds = webcamStartRef.current
      ? Math.round((Date.now() - webcamStartRef.current) / 1000)
      : null;
    try {
      const blob = new Blob(chunks, { type: "video/webm" });
      const form = new FormData();
      form.append("file", blob, `attempt_${id}_webcam.webm`);
      if (durationSeconds != null) form.append("durationSeconds", String(durationSeconds));
      await api.post(`/api/attempts/${id}/webcam`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    } catch (err) {
      setSnack({
        open: true,
        msg: describeError(err, "Could not store the webcam recording."),
        severity: "error",
      });
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Violation reporting
  // ---------------------------------------------------------------------------
  const reportViolation = useCallback(async (type, description) => {
    const id = attemptIdRef.current;
    if (!id || phase !== "active") return;
    try {
      const res = await api.post(`/api/attempts/${id}/violations`, { type, description });
      if (res.data?.terminated) {
        setTerminatedInfo(res.data.message || "Attempt terminated due to repeated violations.");
        stopRecording();
        setPhase("terminating");
        await Promise.all([uploadRecording(), uploadWebcam()]);
        setPhase("terminated");
      } else {
        setWarningMsg(res.data?.message || "Proctoring warning recorded.");
        if (res.data) {
          setAttemptState((s) =>
            s
              ? {
                  ...s,
                  violationCount: res.data.totalViolations ?? s.violationCount,
                  maxViolations: res.data.maxViolations ?? s.maxViolations,
                }
              : s
          );
        }
        setWarningOpen(true);
      }
    } catch (err) {
      setSnack({ open: true, msg: describeError(err), severity: "error" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, stopRecording, uploadRecording, uploadWebcam]);
  reportViolationRef.current = reportViolation;

  // ---------------------------------------------------------------------------
  // Submit flow
  // ---------------------------------------------------------------------------
  const doSubmit = useCallback(async () => {
    const id = attemptIdRef.current;
    if (!id) return;
    setSubmitting(true);
    setPhase("submitting");
    try {
      const res = await api.post(`/api/attempts/${id}/submit`, { answers, languages: codeLangs });
      setResult(res.data);
      stopRecording();
      await Promise.all([uploadRecording(), uploadWebcam()]);
      setPhase("result");
    } catch (err) {
      const msg = describeError(err);
      if (msg.toLowerCase().includes("terminate")) {
        setTerminatedInfo(msg);
        stopRecording();
        await Promise.all([uploadRecording(), uploadWebcam()]);
        setPhase("terminated");
      } else {
        setFatalError(msg);
        setPhase("result");
      }
    } finally {
      setSubmitting(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, stopRecording, uploadRecording, uploadWebcam]);
  doSubmitRef.current = doSubmit;

  // ---------------------------------------------------------------------------
  // Start the protected attempt
  // ---------------------------------------------------------------------------
  const startProtectedAttempt = async () => {
    setFatalError("");

    if (!navigator.mediaDevices?.getDisplayMedia) {
      setFatalError(
        "This browser does not support screen recording (getDisplayMedia). Please use the latest Chrome or Edge on desktop."
      );
      return;
    }

    let stream;
    try {
      stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 5 },
        audio: false,
      });
    } catch (err) {
      setFatalError(
        "Screen recording permission is mandatory for this test. The test cannot start without it."
      );
      return;
    }

    streamRef.current = stream;

    // Request webcam — best-effort, test continues if denied
    let webcamStream = null;
    try {
      webcamStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, frameRate: 15 },
        audio: false,
      });
      webcamStreamRef.current = webcamStream;
    } catch (_) {
      // Webcam denied — continue without it
    }

    try {
      const res = await api.post("/api/attempts/start", {
        assessmentId: Number(assessmentId),
      });
      const state = res.data;
      attemptIdRef.current = state.attemptId;
      setAttemptState(state);
      setRemaining(state.remainingSeconds ?? 0);
      lastSyncRef.current = Date.now();
      startedAtMsRef.current = Date.now();
      recordingStartRef.current = Date.now();

      // Wire screen recorder
      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.start(5000);

      stream.getVideoTracks()[0]?.addEventListener("ended", () => {
        reportViolationRef.current?.("RECORDING_STOPPED", "Screen sharing was stopped during the test.");
      });

      setRecordingOn(true);

      // Wire webcam recorder
      if (webcamStream) {
        const wmimeType = pickMimeType();
        const webcamRecorder = new MediaRecorder(webcamStream, wmimeType ? { mimeType: wmimeType } : undefined);
        webcamChunksRef.current = [];
        webcamRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) webcamChunksRef.current.push(e.data);
        };
        webcamRecorder.start(5000);
        webcamStartRef.current = Date.now();
        setWebcamOn(true);
      }

      document.documentElement.requestFullscreen?.().catch(() => {});

      setPhase("active");
      window.history.pushState({ eduaiTest: true }, "");
    } catch (err) {
      try { stream.getTracks().forEach((t) => t.stop()); } catch (_) {}
      try { webcamStream?.getTracks().forEach((t) => t.stop()); } catch (_) {}
      setFatalError(describeError(err, "Could not start the test."));
    }
  };

  // ---------------------------------------------------------------------------
  // Violation listeners — active ONLY while a test is in progress
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (phase !== "active") return undefined;

    // When switching tabs, the `blur` event fires BEFORE `visibilitychange`.
    // To ensure TAB_SWITCH (CRITICAL) is always reported instead of being
    // suppressed by the shared debounce, we defer the blur handler slightly
    // so visibilitychange gets priority.
    let blurTimer = null;

    const onVisibility = () => {
      if (document.hidden) {
        // Cancel any pending blur handler — this tab-switch takes priority.
        if (blurTimer) {
          clearTimeout(blurTimer);
          blurTimer = null;
        }
        if (Date.now() - blurGuardRef.current > 300) {
          blurGuardRef.current = Date.now();
          reportViolationRef.current?.("TAB_SWITCH", "Student switched away from the test tab.");
        }
      }
    };
    const onBlur = () => {
      if (Date.now() - blurGuardRef.current > 300 && !blurTimer) {
        // Delay to let visibilitychange fire first (it fires ~0-100ms after blur).
        blurTimer = setTimeout(() => {
          blurTimer = null;
          if (Date.now() - blurGuardRef.current > 300) {
            blurGuardRef.current = Date.now();
            reportViolationRef.current?.("WINDOW_BLUR", "Test window lost focus.");
          }
        }, 150);
      }
    };
    const onFullscreenChange = () => {
      if (!document.fullscreenElement) {
        reportViolationRef.current?.("FULLSCREEN_EXIT", "Full-screen mode was exited.");
      }
    };
    const blocked = (label, evtName) => (e) => {
      e.preventDefault();
      reportViolationRef.current?.(evtName, `${label} attempt inside the secure test environment.`);
      return false;
    };
    const onCopy = blocked("Copy", "COPY_ATTEMPT");
    const onCut = blocked("Cut", "CUT_ATTEMPT");
    const onPaste = blocked("Paste", "PASTE_ATTEMPT");
    const onContextMenu = (e) => {
      e.preventDefault();
      reportViolationRef.current?.("CONTEXT_MENU_ATTEMPT", "Right-click menu opened during the test.");
      return false;
    };
    const onBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
      return "";
    };
    const onPopState = () => {
      // Keep the student in the test; re-push our guard entry.
      window.history.pushState({ eduaiTest: true }, "");
      setSnack({
        open: true,
        msg: "Navigation is locked while the test is in progress.",
        severity: "warning",
      });
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("copy", onCopy, true);
    document.addEventListener("cut", onCut, true);
    document.addEventListener("paste", onPaste, true);
    document.addEventListener("contextmenu", onContextMenu);
    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("popstate", onPopState);

    return () => {
      if (blurTimer) {
        clearTimeout(blurTimer);
        blurTimer = null;
      }
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("copy", onCopy, true);
      document.removeEventListener("cut", onCut, true);
      document.removeEventListener("paste", onPaste, true);
      document.removeEventListener("contextmenu", onContextMenu);
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("popstate", onPopState);
    };
  }, [phase]);

  // ---------------------------------------------------------------------------
  // Server-synced timer: tick locally, re-sync with backend every 30 s
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (phase !== "active") return undefined;

    const tick = setInterval(() => {
      const drift = Math.floor((Date.now() - lastSyncRef.current) / 1000);
      const serverRemaining = Math.max(0, (attemptState?.remainingSeconds ?? 0));
      setRemaining(Math.max(0, serverRemaining - drift));
    }, 1000);

    const sync = setInterval(async () => {
      const id = attemptIdRef.current;
      if (!id) return;
      try {
        const res = await api.get(`/api/attempts/${id}`);
        const s = res.data;
        setAttemptState(s);
        lastSyncRef.current = Date.now();
        if (s.status === "TERMINATED") {
          setTerminatedInfo(s.terminatedReason || "Attempt terminated by the system.");
          stopRecording();
          setPhase("terminated");
        } else if (s.status === "EXPIRED") {
          setTerminatedInfo("Time expired — your answers were submitted automatically.");
          stopRecording();
          await Promise.all([uploadRecording(), uploadWebcam()]);
          setPhase("result");
        }
      } catch (_) { /* transient network error; next sync retries */ }
    }, 30000);

    return () => {
      clearInterval(tick);
      clearInterval(sync);
    };
  }, [phase, attemptState, stopRecording, uploadRecording, uploadWebcam]);

  // Auto-submit exactly when the timer reaches zero
  useEffect(() => {
    if (phase === "active" && attemptState && remaining <= 0) {
      doSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, phase]);

  // Auto-submit when violation limit is exceeded
  useEffect(() => {
    if (phase === "active" && attemptState && attemptState.violationCount >= attemptState.maxViolations) {
      doSubmitRef.current?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, attemptState?.violationCount, attemptState?.maxViolations]);

  // ---------------------------------------------------------------------------
  // Cleanup on unmount: make sure tracks are released
  // ---------------------------------------------------------------------------
  useEffect(() => () => {
    stopRecording();
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
  }, [stopRecording]);

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  const renderPreflight = () => (
    <Box sx={{ maxWidth: 720, mx: "auto", mt: { xs: 2, md: 6 } }}>
      <SectionLabel>Secure Examination Environment</SectionLabel>
      <Typography variant="h4" sx={{ fontFamily: FONTS.display, color: COLORS.INK, fontWeight: 700, mb: 2 }}>
        {assessment?.title ?? "Loading…"}
      </Typography>

      {alreadyDone && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          You have already completed this test ({alreadyDone.status}) — score{" "}
          {alreadyDone.score}/{alreadyDone.totalScore}. Retaking published tests is disabled to keep
          results fair.
        </Alert>
      )}

      <LedgerCard>
        <CardContent>
          <Typography sx={{ color: COLORS.INK, mb: 2 }}>
            This is a <strong>proctored assessment</strong>. Before starting, please review the rules:
          </Typography>
          <Stack spacing={1.25} sx={{ mb: 3 }}>
            {[
              { icon: <ScreenShare fontSize="small" />, text: "Your screen will be recorded for review by faculty." },
              { icon: <Videocam fontSize="small" />, text: "Your webcam will be recorded to verify your identity during the test." },
              { icon: <NavigateNext fontSize="small" sx={{ transform: "rotate(180deg)" }} />, text: "Switching tabs or minimising the window is recorded as a violation." },
              { icon: <Cancel fontSize="small" />, text: "Copy, cut, paste and right-click are disabled while the test is active." },
              { icon: <ShieldBad fontSize="small" />, text: `After ${attemptState?.maxViolations ?? 3} critical violations the test is terminated automatically.` },
            ].map(({ icon, text }, i) => (
              <Stack key={i} direction="row" spacing={1.5} alignItems="center">
                <Box sx={{ color: COLORS.TEAL, display: "flex" }}>{icon}</Box>
                <Typography variant="body2" sx={{ color: COLORS.INK, opacity: 0.85 }}>{text}</Typography>
              </Stack>
            ))}
          </Stack>

          <Typography variant="body2" sx={{ color: COLORS.INK, opacity: 0.7, mb: 1 }}>
            Duration: <strong>{assessment?.durationMinutes ?? "—"} minutes</strong> • Questions:{" "}
            <strong>{questions.length}</strong> • The timer is controlled by the server.
          </Typography>

          {fatalError && <Alert severity="error" sx={{ mt: 2 }}>{fatalError}</Alert>}

          <Button
            fullWidth
            size="large"
            disabled={Boolean(alreadyDone)}
            onClick={startProtectedAttempt}
            startIcon={<Videocam />}
            sx={{
              mt: 3,
              py: 1.4,
              bgcolor: COLORS.TEAL,
              color: "#fff",
              fontFamily: FONTS.display,
              fontWeight: 700,
              "&:hover": { bgcolor: "#18585c" },
              "&:disabled": { bgcolor: "#ccc", color: "#fff" },
            }}
          >
            Enable Screen & Webcam Recording and Start Test
          </Button>
        </CardContent>
      </LedgerCard>
    </Box>
  );

  const currentAnswer = question ? answers[String(question.id)] : "";

  const setAnswerFor = (qid, value) =>
    setAnswers((prev) => ({ ...prev, [String(qid)]: value }));

  const starterCode = (() => {
    const langs = ["java", "cpp", "python"];
    const lang = langs[codeLangTab];
    return question?.starterCode?.[lang] ?? "";
  })();

  const handleRunCode = async () => {
    const id = attemptIdRef.current;
    if (!id || !question || phase !== "active") return;
    const langs = ["java", "cpp", "python"];
    setRunningCode(true);
    setRunResult(null);
    try {
      const res = await api.post(`/api/attempts/${id}/run`, {
        language: langs[codeLangTab],
        code: currentAnswer ?? starterCode,
        questionId: question.id,
      });
      setRunResult(res.data);
    } catch (err) {
      setSnack({ open: true, msg: describeError(err), severity: "error" });
    } finally {
      setRunningCode(false);
    }
  };

  const renderActiveTest = () => (
    <Box
      sx={{
        maxWidth: 980,
        mx: "auto",
        userSelect: "none",
      }}
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
      onPaste={(e) => e.preventDefault()}
    >
      {/* Header bar */}
      <Paper
        elevation={0}
        sx={{
          position: "sticky",
          top: 8,
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          px: 2,
          py: 1.25,
          borderRadius: "12px",
          border: `1px solid ${COLORS.GOLD}44`,
          bgcolor: COLORS.INK,
          color: "#fff",
          mb: 3,
          flexWrap: "wrap",
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          {recordingOn && (
            <Chip
              size="small"
              icon={<Videocam style={{ color: "#ff6b6b" }} />}
              label="REC"
              sx={{ bgcolor: "#2b1b1b", color: "#ff9b9b", fontFamily: FONTS.mono }}
            />
          )}
          {webcamOn && (
            <Chip
              size="small"
              icon={<Videocam style={{ color: "#6bff6b" }} />}
              label="CAM"
              sx={{ bgcolor: "#1b2b1b", color: "#9bff9b", fontFamily: FONTS.mono }}
            />
          )}
          <Typography noWrap sx={{ fontFamily: FONTS.display, fontWeight: 600, maxWidth: 320 }}>
            {assessment?.title}
          </Typography>
        </Stack>

        <Chip
          icon={<TimerIcon />}
          label={formatClock(remaining)}
          sx={{
            fontFamily: FONTS.mono,
            fontWeight: 700,
            fontSize: "0.95rem",
            bgcolor: remaining <= 300 ? COLORS.CRIMSON : COLORS.TEAL,
            color: "#fff",
            "& .MuiChip-icon": { color: "#fff" },
          }}
        />
      </Paper>

      {/* Progress */}
      <LinearProgress
        variant="determinate"
        value={questions.length ? (answeredCount / questions.length) * 100 : 0}
        sx={{ height: 6, borderRadius: 3, mb: 3, bgcolor: "#eee", "& .MuiLinearProgress-bar": { bgcolor: COLORS.GOLD } }}
      />

      {question && (
        <LedgerCard>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.5 }}>
              <SectionLabel>
                Question {qIndex + 1} of {questions.length}
              </SectionLabel>
              <Tooltip title="Flag for review">
                <IconButton
                  size="small"
                  onClick={() =>
                    setFlagged((prev) => {
                      const next = new Set(prev);
                      if (next.has(question.id)) {
                        next.delete(question.id);
                      } else {
                        next.add(question.id);
                      }
                      return next;
                    })
                  }
                >
                  <Flag fontSize="small" sx={{ color: flagged.has(question.id) ? COLORS.CRIMSON : "#bbb" }} />
                </IconButton>
              </Tooltip>
              {question.type !== "CODING" && (
                <Chip
                  size="small"
                  label={question.category}
                  sx={{ ml: "auto", fontFamily: FONTS.mono, bgcolor: `${COLORS.TEAL}14`, color: COLORS.TEAL }}
                />
              )}
            </Stack>

            <Typography sx={{ color: COLORS.INK, fontFamily: FONTS.display, fontSize: "1.15rem", mb: 2.5, whiteSpace: "pre-wrap" }}>
              {question.text}
            </Typography>

            {question.type === "MCQ" ? (
              <RadioGroup
                value={currentAnswer ?? ""}
                onChange={(e) => setAnswerFor(question.id, e.target.value)}
              >
                {(question.options ?? []).map((opt, i) => (
                  <FormControlLabel
                    key={i}
                    value={opt}
                    control={<Radio sx={{ color: COLORS.TEAL, "&.Mui-checked": { color: COLORS.TEAL } }} />}
                    label={<Typography sx={{ color: COLORS.INK }}>{opt}</Typography>}
                    sx={{
                      border: "1px solid #eee",
                      borderRadius: "10px",
                      px: 1.5,
                      py: 0.75,
                      mb: 1,
                      transition: "border-color .15s",
                      ...(currentAnswer === opt
                        ? { borderColor: COLORS.TEAL, bgcolor: `${COLORS.TEAL}08` }
                        : {}),
                    }}
                  />
                ))}
              </RadioGroup>
            ) : (
              <>
                <Tabs
                  value={codeLangTab}
                  onChange={(_, v) => {
                    setCodeLangTab(v);
                    if (question) {
                      const langs = ["java", "cpp", "python"];
                      setCodeLangs((prev) => ({ ...prev, [String(question.id)]: langs[v] }));
                    }
                  }}
                  sx={{ mb: 1, minHeight: 34, "& .MuiTab-root": { minHeight: 34, fontFamily: FONTS.mono, fontSize: "0.75rem" } }}
                >
                  <Tab label="Java" />
                  <Tab label="C++" />
                  <Tab label="Python" />
                </Tabs>
                <TextField
                  multiline
                  minRows={10}
                  fullWidth
                  value={currentAnswer ?? starterCode}
                  onChange={(e) => {
                    setAnswerFor(question.id, e.target.value);
                    const langs = ["java", "cpp", "python"];
                    setCodeLangs((prev) => ({ ...prev, [String(question.id)]: langs[codeLangTab] }));
                  }}
                  placeholder="Write your solution here. Your final code/output must match the expected output."
                  InputProps={{
                    sx: {
                      fontFamily: FONTS.mono,
                      fontSize: "0.85rem",
                      bgcolor: "#101426",
                      color: "#E6EDF3",
                      borderRadius: "10px",
                    },
                  }}
                />

                {question.testCaseInput && (
                  <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ mt: 1.5 }}>
                    <Box sx={{ flex: 1, border: "1px solid #ddd", borderRadius: "10px", p: 1.25 }}>
                      <Typography variant="caption" sx={{ fontFamily: FONTS.mono, fontWeight: 700, color: COLORS.TEAL }}>
                        SAMPLE INPUT (stdin)
                      </Typography>
                      <Typography sx={{ fontFamily: FONTS.mono, fontSize: "0.8rem", whiteSpace: "pre-wrap", color: COLORS.INK }}>
                        {question.testCaseInput}
                      </Typography>
                    </Box>
                    <Box sx={{ flex: 1, border: "1px solid #c6cbd4", borderRadius: "10px", p: 1.25 }}>
                      <Typography variant="caption" sx={{ fontFamily: FONTS.mono, fontWeight: 700, color: COLORS.INK_SOFT }}>
                        SAMPLE OUTPUT (stdout)
                      </Typography>
                      <Typography sx={{ fontFamily: FONTS.mono, fontSize: "0.8rem", whiteSpace: "pre-wrap", color: COLORS.INK }}>
                        {question.expectedOutput}
                      </Typography>
                      <Typography variant="caption" sx={{ fontFamily: FONTS.mono, fontSize: "0.68rem", color: COLORS.INK_SOFT, opacity: 0.7 }}>
                        Grading uses additional hidden test cases — they are not shown here.
                      </Typography>
                    </Box>
                  </Stack>
                )}

                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 1.5 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    disabled={runningCode}
                    onClick={handleRunCode}
                    startIcon={<PlayArrow />}
                    sx={{ borderColor: COLORS.TEAL, color: COLORS.TEAL }}
                  >
                    {runningCode ? "Running…" : "Run Code"}
                  </Button>
                  {runResult && (
                    <Chip
                      size="small"
                      label={
                        runResult.passed
                          ? "✓ Passed sample case"
                          : runResult.timedOut
                          ? "Time limit exceeded"
                          : runResult.error
                          ? String(runResult.error).slice(0, 60)
                          : "Output mismatch"
                      }
                      sx={{
                        fontFamily: FONTS.mono,
                        fontWeight: 700,
                        bgcolor: runResult.passed ? `${COLORS.TEAL}22` : `${COLORS.CRIMSON}18`,
                        color: runResult.passed ? COLORS.TEAL : COLORS.CRIMSON,
                      }}
                    />
                  )}
                </Stack>

                {runResult && (
                  <Box
                    sx={{
                      mt: 1,
                      p: 1.25,
                      borderRadius: "10px",
                      bgcolor: "#101426",
                      color: "#E6EDF3",
                      fontFamily: FONTS.mono,
                      fontSize: "0.78rem",
                      whiteSpace: "pre-wrap",
                      maxHeight: 220,
                      overflow: "auto",
                    }}
                  >
                    {runResult.stdout || runResult.stderr || "(no output)"}
                  </Box>
                )}

                <Alert severity="info" sx={{ mt: 1.5 }}>
                  Use Run Code to test your solution against the sample input. When you submit, your
                  code is graded against the sample plus additional hidden test cases.
                </Alert>
              </>
            )}

            {/* Navigation */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 3 }}>
              <Button
                disabled={qIndex === 0}
                onClick={() => setQIndex((i) => i - 1)}
                startIcon={<NavigateBefore />}
                sx={{ color: COLORS.INK }}
              >
                Previous
              </Button>

              {qIndex < questions.length - 1 ? (
                <Button
                  onClick={() => setQIndex((i) => i + 1)}
                  endIcon={<NavigateNext />}
                  variant="contained"
                  sx={{ bgcolor: COLORS.TEAL, "&:hover": { bgcolor: "#18585c" } }}
                >
                  Next
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={() => setSubmitOpen(true)}
                  startIcon={<CheckCircle />}
                  sx={{ bgcolor: COLORS.GOLD, "&:hover": { bgcolor: "#9a7422" } }}
                >
                  Submit Test
                </Button>
              )}
            </Stack>

            {/* Palette */}
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 3 }}>
              {questions.map((q, i) => {
                const answered = answers[String(q.id)] != null && String(answers[String(q.id)]).trim() !== "";
                return (
                  <Box
                    key={q.id}
                    onClick={() => setQIndex(i)}
                    sx={{
                      width: 30,
                      height: 30,
                      display: "grid",
                      placeItems: "center",
                      cursor: "pointer",
                      borderRadius: "8px",
                      fontFamily: FONTS.mono,
                      fontSize: "0.72rem",
                      border: `1px solid ${i === qIndex ? COLORS.GOLD : "#ddd"}`,
                      bgcolor: answered ? `${COLORS.TEAL}22` : "#fafafa",
                      color: COLORS.INK,
                    }}
                  >
                    {i + 1}
                  </Box>
                );
              })}
            </Stack>
          </CardContent>
        </LedgerCard>
      )}

      <Box sx={{ textAlign: "center", mt: 3 }}>
        <Button onClick={() => setSubmitOpen(true)} sx={{ color: COLORS.INK }}>
          Submit early
        </Button>
      </Box>

      {/* Floating webcam preview */}
      {webcamOn && (
        <Box
          sx={{
            position: "fixed",
            bottom: 16,
            right: 16,
            width: 160,
            height: 120,
            borderRadius: "12px",
            overflow: "hidden",
            border: `2px solid ${COLORS.TEAL}`,
            boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
            zIndex: 100,
            bgcolor: "#000",
          }}
        >
          <video
            autoPlay
            muted
            playsInline
            ref={(el) => {
              if (el && webcamStreamRef.current && el.srcObject !== webcamStreamRef.current) {
                el.srcObject = webcamStreamRef.current;
              }
            }}
            style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }}
          />
        </Box>
      )}

      {/* Violation warning dialog */}
      <Dialog open={warningOpen} onClose={() => setWarningOpen(false)}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, color: COLORS.AMBER }}>
          <WarningIcon /> Proctoring Warning
        </DialogTitle>
        <DialogContent>
          <Typography>{warningMsg}</Typography>
          {attemptState && (
            <Typography variant="body2" sx={{ mt: 1, color: COLORS.CRIMSON }}>
              Critical violations recorded: {attemptState.violationCount} / {attemptState.maxViolations}.
              Reaching the limit terminates this test immediately.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWarningOpen(false)} autoFocus sx={{ color: COLORS.TEAL }}>
            I understand
          </Button>
        </DialogActions>
      </Dialog>

      {/* Submit confirmation */}
      <Dialog open={submitOpen} onClose={() => setSubmitOpen(false)}>
        <DialogTitle>Submit this test?</DialogTitle>
        <DialogContent>
          <Typography>
            You answered <strong>{answeredCount}</strong> of <strong>{questions.length}</strong>{" "}
            questions. The screen recording will be uploaded for faculty review. This action cannot
            be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSubmitOpen(false)} sx={{ color: COLORS.INK }}>Keep working</Button>
          <Button onClick={doSubmit} disabled={submitting} variant="contained"
            sx={{ bgcolor: COLORS.TEAL, "&:hover": { bgcolor: "#18585c" } }}>
            {submitting ? "Submitting…" : "Submit now"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );

  const renderResult = () => (
    <Box sx={{ maxWidth: 560, mx: "auto", mt: { xs: 3, md: 8 } }}>
      <LedgerCard>
        <CardContent sx={{ textAlign: "center", py: 5 }}>
          {terminatedInfo ? (
            <>
              <Cancel sx={{ fontSize: 56, color: COLORS.CRIMSON, mb: 1 }} />
              <Typography variant="h5" sx={{ fontFamily: FONTS.display, color: COLORS.INK, mb: 1 }}>
                {terminatedInfo}
              </Typography>
            </>
          ) : result ? (
            <>
              <CheckCircle sx={{ fontSize: 56, color: COLORS.TEAL, mb: 1 }} />
              <SectionLabel>Test submitted</SectionLabel>
              <Typography variant="h3" sx={{ fontFamily: FONTS.display, color: COLORS.INK, fontWeight: 800 }}>
                {result.correctCount} / {result.totalQuestions}
              </Typography>
              <Typography sx={{ color: COLORS.INK, opacity: 0.7, mb: 2 }}>
                Score: {result.percentage}% • {result.grade}
              </Typography>
              {result.status === "EXPIRED" && (
                <Alert severity="warning" sx={{ mb: 2 }}>Time ran out before submission.</Alert>
              )}
            </>
          ) : fatalError ? (
            <Alert severity="error">{fatalError}</Alert>
          ) : (
            <Typography>Loading…</Typography>
          )}
          <Button
            variant="contained"
            onClick={() => navigate("/student/tests")}
            sx={{ mt: 3, bgcolor: COLORS.TEAL, "&:hover": { bgcolor: "#18585c" } }}
          >
            Back to My Tests
          </Button>
        </CardContent>
      </LedgerCard>
    </Box>
  );

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------
  return (
    <PageShell>
      {(phase === "preflight" || phase === "blocked") && loadingAssessment && (
        <Box sx={{ maxWidth: 720, mx: "auto", mt: 6 }}>
          <LinearProgress />
        </Box>
      )}
      {phase === "preflight" && !loadingAssessment && renderPreflight()}
      {(phase === "active" || phase === "submitting") && renderActiveTest()}
      {(phase === "result" || phase === "terminated") && renderResult()}
      {phase === "terminating" && (
        <Box sx={{ maxWidth: 480, mx: "auto", mt: 8, textAlign: "center" }}>
          <CircularProgressStatic />
          <Typography sx={{ mt: 2, color: COLORS.INK }}>
            Finalising attempt and uploading the recording…
          </Typography>
        </Box>
      )}

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snack.severity} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </PageShell>
  );
}

function CircularProgressStatic() {
  return <LinearProgress sx={{ width: 240, mx: "auto" }} />;
}

export default ProtectedTest;
