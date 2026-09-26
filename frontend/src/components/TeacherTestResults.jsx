import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
  MenuItem,
  TextField,
  Chip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  LinearProgress,
  Alert,
  alpha,
} from "@mui/material";
import {
  Videocam,
  Close,
  WarningAmberRounded,
  Quiz,
  Refresh,
} from "@mui/icons-material";

import api, { API_BASE_URL, describeError } from "../services/api";
import { COLORS, FONTS, formatDateTime, formatClock, injectLedgerFonts } from "../theme";

const STATUS_COLORS = {
  SUBMITTED: COLORS.TEAL,
  ACTIVE: "#B8892B",
  TERMINATED: COLORS.CRIMSON,
  EXPIRED: "#5B4B8A",
  SUSPICIOUS: COLORS.CRIMSON,
};

function statusChip(status) {
  const color = STATUS_COLORS[status] || "#777";
  return (
    <Chip
      size="small"
      label={status}
      sx={{
        fontFamily: FONTS.mono,
        fontWeight: 700,
        bgcolor: alpha(color, 0.12),
        color,
        border: `1px solid ${alpha(color, 0.35)}`,
      }}
    />
  );
}

/**
 * Teacher/Admin review console for proctored test attempts.
 * - Lists every published assessment and its real attempt records
 * - Streams screen recordings ONLY through the authorized endpoint
 *   (never a public/static URL)
 * - Shows the full proctoring violation timeline per attempt
 */
function TeacherTestResults() {
  injectLedgerFonts();

  const [assessments, setAssessments] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [attempts, setAttempts] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingAttempts, setLoadingAttempts] = useState(false);
  const [error, setError] = useState("");

  // Recording viewer
  const [viewAttempt, setViewAttempt] = useState(null); // AttemptSummary
  const [videoUrl, setVideoUrl] = useState("");
  const [videoLoading, setVideoLoading] = useState(false);
  const [violations, setViolations] = useState([]);
  const [videoError, setVideoError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get("/api/assessments");
        if (!cancelled) setAssessments(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        if (!cancelled) setError(describeError(err, "Could not load assessments."));
      } finally {
        if (!cancelled) setLoadingList(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadAttempts = async (assessmentId) => {
    setSelectedId(assessmentId);
    if (!assessmentId) {
      setAttempts([]);
      return;
    }
    setLoadingAttempts(true);
    setError("");
    try {
      const res = await api.get(`/api/attempts/assessment/${assessmentId}`);
      setAttempts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(describeError(err));
      setAttempts([]);
    } finally {
      setLoadingAttempts(false);
    }
  };

  const openViewer = async (attempt) => {
    setViewAttempt(attempt);
    setVideoUrl("");
    setVideoError("");
    setViolations([]);

    // Violations timeline
    try {
      const vRes = await api.get(`/api/attempts/${attempt.id}/violations`);
      setViolations(Array.isArray(vRes.data) ? vRes.data : []);
    } catch (_) {
      /* non-fatal */
    }

    // Stream recording as an authenticated blob (cookies attached by api instance)
    if (attempt.hasRecording) {
      setVideoLoading(true);
      try {
        const res = await api.get(`/api/attempts/${attempt.id}/recording`, {
          responseType: "blob",
          timeout: 120000,
        });
        setVideoUrl(URL.createObjectURL(res.data));
      } catch (err) {
        setVideoError(describeError(err, "Could not load the recording."));
      } finally {
        setVideoLoading(false);
      }
    }
  };

  const closeViewer = () => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setViewAttempt(null);
    setVideoUrl("");
    setViolations([]);
  };

  return (
    <Box>
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: "14px",
          border: "1px solid rgba(20,27,51,0.1)",
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontFamily: FONTS.display, fontWeight: 700, color: COLORS.INK }}>
            Proctored Test Results
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Review scores, proctoring violations and screen recordings for every published test.
            Recordings are streamed securely — they are never publicly accessible.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} alignItems="center">
          <TextField
            select
            size="small"
            label="Select assessment"
            value={selectedId}
            onChange={(e) => loadAttempts(e.target.value)}
            disabled={loadingList || assessments.length === 0}
            sx={{ minWidth: 280, bgcolor: "#fff" }}
          >
            <MenuItem value="">
              <em>— choose a published test —</em>
            </MenuItem>
            {assessments.map((a) => (
              <MenuItem key={a.id} value={a.id}>
                {a.title} ({a.questions?.length ?? 0} Q)
              </MenuItem>
            ))}
          </TextField>
          <IconButton
            onClick={() => selectedId && loadAttempts(selectedId)}
            title="Refresh"
            sx={{ border: "1px solid #ddd", borderRadius: "10px" }}
          >
            <Refresh fontSize="small" />
          </IconButton>
        </Stack>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loadingList && (
        <Box sx={{ textAlign: "center", py: 6 }}>
          <LinearProgress sx={{ maxWidth: 300, mx: "auto" }} />
        </Box>
      )}

      {!loadingList && !selectedId && (
        <Paper
          elevation={0}
          sx={{
            p: 6,
            textAlign: "center",
            borderRadius: "14px",
            border: "1px solid rgba(20,27,51,0.1)",
          }}
        >
          <Quiz sx={{ fontSize: 44, color: COLORS.GOLD, mb: 1 }} />
          <Typography variant="h6" sx={{ color: COLORS.INK }}>
            Choose an assessment above to view its attempt records.
          </Typography>
        </Paper>
      )}

      {!loadingList && selectedId && loadingAttempts && (
        <Box sx={{ py: 4 }}>
          <LinearProgress />
        </Box>
      )}

      {!loadingList && !loadingAttempts && selectedId && attempts.length === 0 && (
        <Paper
          elevation={0}
          sx={{
            p: 6,
            textAlign: "center",
            borderRadius: "14px",
            border: "1px solid rgba(20,27,51,0.1)",
          }}
        >
          <Typography variant="h6" sx={{ color: COLORS.INK }}>
            No students have attempted this test yet.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Records appear here the moment a student starts the proctored environment.
          </Typography>
        </Paper>
      )}

      {!loadingAttempts && attempts.length > 0 && (
        <Paper elevation={0} sx={{ borderRadius: "14px", overflow: "hidden", border: "1px solid rgba(20,27,51,0.1)" }}>
          <Table>
            <TableHead sx={{ background: `linear-gradient(135deg, ${COLORS.INK} 0%, #0D1226 100%)` }}>
              <TableRow>
                <TableCell sx={{ color: "#FBF8F1", fontWeight: 700 }}>Student</TableCell>
                <TableCell sx={{ color: "#FBF8F1", fontWeight: 700 }}>Started</TableCell>
                <TableCell sx={{ color: "#FBF8F1", fontWeight: 700 }}>Time Used</TableCell>
                <TableCell sx={{ color: "#FBF8F1", fontWeight: 700 }}>Score</TableCell>
                <TableCell sx={{ color: "#FBF8F1", fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ color: "#FBF8F1", fontWeight: 700 }}>Violations</TableCell>
                <TableCell align="right" sx={{ color: "#FBF8F1", fontWeight: 700 }}>Recording</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {attempts.map((a) => (
                <TableRow key={a.id} hover>
                  <TableCell>
                    <Typography sx={{ fontWeight: 700, color: COLORS.INK }}>{a.studentName}</Typography>
                    <Typography variant="caption" sx={{ fontFamily: FONTS.mono, color: "text.secondary" }}>
                      {a.registerNumber !== "-" ? `Reg: ${a.registerNumber}` : `ID #${a.studentId}`}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{formatDateTime(a.startedAt)}</Typography>
                    {a.submittedAt && (
                      <Typography variant="caption" color="text.secondary">
                        submitted {formatDateTime(a.submittedAt)}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontFamily: FONTS.mono, fontWeight: 600 }}>
                      {formatClock(a.actualDurationSeconds || 0)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {a.score != null && a.totalScore > 0 ? (
                      <Chip
                        size="small"
                        label={`${Math.round(a.score)} / ${Math.round(a.totalScore)}`}
                        sx={{
                          fontFamily: FONTS.mono,
                          fontWeight: 700,
                          bgcolor: alpha(COLORS.TEAL, 0.1),
                          color: COLORS.TEAL,
                        }}
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary">—</Typography>
                    )}
                  </TableCell>
                  <TableCell>{statusChip(a.status)}</TableCell>
                  <TableCell>
                    {a.violationCount > 0 ? (
                      <Chip
                        size="small"
                        icon={<WarningAmberRounded style={{ color: COLORS.CRIMSON }} />}
                        label={a.violationCount}
                        sx={{
                          fontFamily: FONTS.mono,
                          fontWeight: 700,
                          bgcolor: alpha(COLORS.CRIMSON, 0.08),
                          color: COLORS.CRIMSON,
                        }}
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary">0</Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {a.hasRecording ? (
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Videocam />}
                        onClick={() => openViewer(a)}
                        sx={{
                          borderColor: COLORS.PLUM,
                          color: COLORS.PLUM,
                          fontWeight: 700,
                          "&:hover": { bgcolor: alpha(COLORS.PLUM, 0.06), borderColor: COLORS.PLUM },
                        }}
                      >
                        Watch
                      </Button>
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        Not stored
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      {/* ------------------------- Recording Viewer ------------------------- */}
      <Dialog open={Boolean(viewAttempt)} onClose={closeViewer} maxWidth="md" fullWidth>
        <DialogTitle
          sx={{
            background: `linear-gradient(135deg, ${COLORS.INK} 0%, #0D1226 100%)`,
            color: "#FBF8F1",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: `3px solid ${COLORS.GOLD}`,
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Videocam sx={{ color: COLORS.GOLD }} />
            <Box>
              <Typography sx={{ fontFamily: FONTS.display, fontWeight: 700 }}>
                {viewAttempt?.studentName} — {viewAttempt?.assessmentTitle}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                Started {formatDateTime(viewAttempt?.startedAt)} • Status {viewAttempt?.status}
              </Typography>
            </Box>
          </Stack>
          <IconButton onClick={closeViewer} sx={{ color: "#FBF8F1" }}>
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ mt: 2, bgcolor: "#FBF8F1" }}>
          {!viewAttempt?.hasRecording && (
            <Alert severity="info" sx={{ mb: 2 }}>
              No recording was stored for this attempt. Either the student never enabled screen
              sharing or the upload failed before completion.
            </Alert>
          )}

          {videoLoading && (
            <Box sx={{ py: 4 }}>
              <LinearProgress />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Streaming recording securely…
              </Typography>
            </Box>
          )}

          {videoError && <Alert severity="error" sx={{ mb: 2 }}>{videoError}</Alert>}

          {videoUrl && (
            <video
              key={videoUrl}
              controls
              style={{ width: "100%", borderRadius: 10, background: "#000", maxHeight: 480 }}
              src={videoUrl}
            />
          )}

          {/* Violation timeline */}
          <Typography variant="h6" sx={{ fontFamily: FONTS.display, fontWeight: 700, mt: 3, mb: 1.5, color: COLORS.INK }}>
            Proctoring Timeline
          </Typography>
          {violations.length === 0 ? (
            <Alert severity="success">No violations were recorded during this attempt.</Alert>
          ) : (
            <Paper variant="outlined" sx={{ maxHeight: 260, overflowY: "auto", borderRadius: "10px" }}>
              {violations.map((v) => {
                const critical = v.severity === "CRITICAL";
                return (
                  <Stack
                    key={v.id}
                    direction="row"
                    spacing={1.5}
                    alignItems="center"
                    sx={{
                      px: 2,
                      py: 1.25,
                      borderBottom: "1px solid #eee",
                      bgcolor: critical ? alpha(COLORS.CRIMSON, 0.04) : "transparent",
                    }}
                  >
                    <Chip
                      size="small"
                      label={v.type.replace(/_/g, " ")}
                      sx={{
                        fontFamily: FONTS.mono,
                        fontWeight: 700,
                        minWidth: 150,
                        bgcolor: critical ? alpha(COLORS.CRIMSON, 0.1) : alpha("#B8892B", 0.12),
                        color: critical ? COLORS.CRIMSON : "#8a6516",
                      }}
                    />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ color: COLORS.INK }}>
                        {v.description}
                      </Typography>
                      <Typography variant="caption" sx={{ fontFamily: FONTS.mono, color: "text.secondary" }}>
                        {formatDateTime(v.timestamp)}
                      </Typography>
                    </Box>
                  </Stack>
                );
              })}
            </Paper>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}

export default TeacherTestResults;
