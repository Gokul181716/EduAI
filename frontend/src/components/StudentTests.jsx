import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert, Avatar, Box, Button, Card, CardContent, Chip, CircularProgress,
  Divider, Grid, Paper, Snackbar, Stack, Tab, Tabs, Typography,
} from '@mui/material';
import {
  CheckCircle, Code, PlayArrow, Lock, Quiz, Schedule,
  GppGood as ShieldIcon, Person, TrendingUp, EventNote,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import api, { describeError } from '../services/api';
import { COLORS, FONTS, formatDateTime } from '../theme';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import WorkIcon from '@mui/icons-material/Work';

const CATEGORY_META = {
  INTERNAL: {
    label: 'Internal Assessments',
    empty: 'No internal assessments available right now.',
    emptyHint: 'Assessments published by your faculty for your class will appear here.',
    accent: COLORS.AMBER,
    Icon: MenuBookIcon,
  },
  PLACEMENT: {
    label: 'Placement Assessments',
    empty: 'No placement assessments available right now.',
    emptyHint: 'Placement tests published by the admin team will appear here.',
    accent: COLORS.PLUM,
    Icon: WorkIcon,
  },
};

function Stat({ icon, label, value }) {
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      {icon}
      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1 }}>
          {label}
        </Typography>
        <Typography variant="body2" fontWeight={800} sx={{ lineHeight: 1.4 }}>
          {value}
        </Typography>
      </Box>
    </Stack>
  );
}

function AssessmentCard({ test, prevAttempt, onTake }) {
  const isInternal = test.assessmentCategory === 'INTERNAL';
  const accent = isInternal ? COLORS.AMBER : COLORS.PLUM;
  const finished = Boolean(prevAttempt && ['SUBMITTED', 'EXPIRED', 'TERMINATED'].includes(prevAttempt.status));
  const pct = finished && prevAttempt.totalQuestions > 0
    ? Math.round((prevAttempt.score / prevAttempt.totalQuestions) * 100)
    : null;
  const questionCount = test.questions?.length || 0;

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ height: 4, bgcolor: accent }} />
      <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', flex: 1 }}>
        <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ mb: 2 }}>
          <Avatar variant="rounded" sx={{ bgcolor: `${accent}18`, color: accent, borderRadius: 2 }}>
            {test.type === 'CODING' ? <Code /> : <Quiz />}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Chip
              size="small"
              label={isInternal ? 'INTERNAL' : 'PLACEMENT'}
              sx={{ bgcolor: `${accent}16`, color: accent, fontSize: '0.66rem', letterSpacing: '0.6px', mb: 0.5 }}
            />
            <Typography variant="subtitle1" fontWeight={800} noWrap sx={{ fontFamily: FONTS.display }}>
              {test.title}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {test.subject || (isInternal ? 'Subject not set' : 'Placement')}
              {test.createdBy ? ` • by ${test.createdBy}` : ''}
            </Typography>
          </Box>
        </Stack>

        {test.description && (
          <Typography variant="body2" color="text.secondary" sx={{
            mb: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {test.description}
          </Typography>
        )}

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6}>
            <Stat
              icon={<Schedule fontSize="small" sx={{ color: accent }} />}
              label="Duration" value={`${test.durationMinutes || '—'} min`}
            />
          </Grid>
          <Grid item xs={6}>
            <Stat
              icon={<Quiz fontSize="small" sx={{ color: accent }} />}
              label="Questions" value={questionCount}
            />
          </Grid>
          <Grid item xs={6}>
            <Stat
              icon={<TrendingUp fontSize="small" sx={{ color: accent }} />}
              label="Total marks" value={test.totalMarks ?? questionCount}
            />
          </Grid>
          <Grid item xs={6}>
            <Stat
              icon={<EventNote fontSize="small" sx={{ color: accent }} />}
              label={test.endDate ? 'Deadline' : 'Available'}
              value={test.endDate ? formatDateTime(test.endDate).split(',')[0] : 'Now'}
            />
          </Grid>
        </Grid>

        <Box sx={{ flex: 1 }} />

        {finished ? (
          <Alert severity={pct >= 60 ? 'success' : 'warning'} icon={<CheckCircle />} sx={{ mb: 1.5 }}>
            Completed • Score {prevAttempt.score}/{prevAttempt.totalQuestions}{pct != null ? ` (${pct}%)` : ''}
          </Alert>
        ) : prevAttempt ? (
          <Alert severity="info" sx={{ mb: 1.5 }}>Test in progress — resume before time runs out.</Alert>
        ) : null}

        <Button
          fullWidth
          variant="contained"
          size="large"
          disabled={finished}
          startIcon={finished ? <Lock /> : <PlayArrow />}
          onClick={() => onTake(test.id)}
          sx={{
            py: 1.2, borderRadius: '10px',
            bgcolor: finished ? '#B9B9B9' : COLORS.INK,
            '&:hover': { bgcolor: finished ? '#B9B9B9' : COLORS.INK_SOFT },
            '&.Mui-disabled': { color: '#fff' },
          }}
        >
          {finished ? 'Completed' : prevAttempt ? 'Resume Test' : 'Start Assessment'}
        </Button>
      </CardContent>
    </Card>
  );
}

function ResultsTable({ rows }) {
  return (
    <Paper elevation={0} sx={{ overflowX: 'auto' }}>
      <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
        <thead>
          <tr>
            {['Assessment', 'Category', 'Score', 'Percentage', 'Status', 'Date'].map((h) => (
              <Box
                key={h}
                component="th"
                sx={{
                  textAlign: 'left', px: 2.5, py: 1.4,
                  bgcolor: 'rgba(20,27,51,0.04)',
                  fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.5px',
                  textTransform: 'uppercase', color: alphaText(),
                }}
              >
                {h}
              </Box>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((a) => {
            const pct = a.totalQuestions > 0 ? Math.round((a.score / a.totalQuestions) * 100) : 0;
            return (
              <Box key={a.id} component="tr" sx={{ '&:hover': { bgcolor: 'rgba(20,27,51,0.02)' } }}>
                <Box component="td" sx={{ px: 2.5, py: 1.6 }}>
                  <Typography fontWeight={700} variant="body2">{a.assessmentTitle}</Typography>
                </Box>
                <Box component="td" sx={{ px: 2.5, py: 1.6 }}>
                  <Chip
                    size="small"
                    label={a.assessmentCategory === 'INTERNAL' ? 'Internal' : 'Placement'}
                    sx={{
                      bgcolor: a.assessmentCategory === 'INTERNAL' ? `${COLORS.AMBER}18` : `${COLORS.PLUM}15`,
                      color: a.assessmentCategory === 'INTERNAL' ? COLORS.AMBER : COLORS.PLUM,
                      fontSize: '0.68rem',
                    }}
                  />
                </Box>
                <Box component="td" sx={{ px: 2.5, py: 1.6, fontWeight: 700 }}>
                  {a.score ?? '—'} / {a.totalQuestions}
                </Box>
                <Box component="td" sx={{ px: 2.5, py: 1.6 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box sx={{ width: 64 }}>
                      <Paper elevation={0} sx={{ height: 5, borderRadius: 3, bgcolor: 'rgba(20,27,51,0.08)' }}>
                        <Box sx={{
                          height: 5, borderRadius: 3, width: `${pct}%`,
                          bgcolor: pct >= 60 ? COLORS.TEAL : COLORS.CRIMSON,
                        }} />
                      </Paper>
                    </Box>
                    <Typography variant="caption" fontWeight={800}>{pct}%</Typography>
                  </Stack>
                </Box>
                <Box component="td" sx={{ px: 2.5, py: 1.6 }}>
                  <Chip size="small" label={a.status === 'SUBMITTED' ? 'Graded' : a.status}
                    sx={{ bgcolor: a.status === 'SUBMITTED' ? `${COLORS.TEAL}18` : `${COLORS.CRIMSON}12`, fontSize: '0.68rem' }} />
                </Box>
                <Box component="td" sx={{ px: 2.5, py: 1.6, whiteSpace: 'nowrap' }}>
                  <Typography variant="caption" color="text.secondary">{formatDateTime(a.submittedAt || a.startedAt)}</Typography>
                </Box>
              </Box>
            );
          })}
        </tbody>
      </Box>
    </Paper>
  );
}

function alphaText() {
  return 'rgba(20,27,51,0.62)';
}

function StudentTests({ defaultCategory = null, resultsOnly = false }) {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState(defaultCategory === 'PLACEMENT' ? 'PLACEMENT' : 'INTERNAL');
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'info' });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [testsRes, attemptsRes] = await Promise.all([
          api.get('/api/assessments'),
          api.get('/api/attempts/my').catch(() => ({ data: [] })),
        ]);
        if (cancelled) return;
        setTests(Array.isArray(testsRes.data) ? testsRes.data : []);
        setAttempts(Array.isArray(attemptsRes.data) ? attemptsRes.data : []);
      } catch (err) {
        if (!cancelled) setError(describeError(err, 'Could not load assessments.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const attemptByAssessment = {};
  attempts.forEach((a) => { attemptByAssessment[a.assessmentId] = a; });

  const byCategory = useMemo(() => ({
    INTERNAL: tests.filter((t) => t.assessmentCategory !== 'PLACEMENT'),
    PLACEMENT: tests.filter((t) => t.assessmentCategory === 'PLACEMENT'),
  }), [tests]);

  const finishedAttempts = attempts.filter((a) => ['SUBMITTED', 'EXPIRED', 'TERMINATED'].includes(a.status));
  const internalResults = finishedAttempts.filter((a) => a.assessmentCategory === 'INTERNAL');
  const placementResults = finishedAttempts.filter((a) => a.assessmentCategory !== 'INTERNAL');

  const counts = {
    INTERNAL: byCategory.INTERNAL.length,
    PLACEMENT: byCategory.PLACEMENT.length,
  };

  return (
    <Box>
      {/* Header */}
      {!resultsOnly && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4">Assessments</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Proctored assessments with screen recording, copy/paste restriction and full-screen monitoring.
          </Typography>
        </Box>
      )}

      {/* Two clear categories */}
      {!resultsOnly && (
        <Grid container spacing={2} sx={{ mb: 4 }}>
        {['INTERNAL', 'PLACEMENT'].map((cat) => {
          const meta = CATEGORY_META[cat];
          const active = tab === cat;
          return (
            <Grid item xs={12} sm={6} key={cat}>
              <Paper
                elevation={0}
                onClick={() => setTab(cat)}
                sx={{
                  p: 2.5, cursor: 'pointer',
                  border: `1.5px solid ${active ? meta.accent : 'rgba(20,27,51,0.10)'}`,
                  bgcolor: active ? `${meta.accent}0A` : '#fff',
                  transition: 'all .15s ease',
                  '&:hover': { borderColor: meta.accent },
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar sx={{ bgcolor: `${meta.accent}18`, color: meta.accent }}><meta.Icon /></Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography fontWeight={800}>{meta.label}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {counts[cat]} available
                    </Typography>
                  </Box>
                  {active && <Chip size="small" label="Viewing" sx={{ bgcolor: meta.accent, color: '#fff' }} />}
                </Stack>
              </Paper>
            </Grid>
          );
        })}
        </Grid>
      )}

      {loading && (
        <Paper elevation={0} sx={{ p: 6, textAlign: 'center' }}>
          <CircularProgress size={32} sx={{ color: COLORS.TEAL }} />
          <Typography sx={{ mt: 2 }}>Loading assessments…</Typography>
        </Paper>
      )}

      {!loading && error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {!loading && !error && !resultsOnly && (
        <>
          <Divider sx={{ display: 'none' }} />
          <Box sx={{ mb: 2 }}>
            <Tabs
              value={tab}
              onChange={(e, v) => setTab(v)}
              sx={{ '& .MuiTab-root': { fontWeight: 800 } }}
            >
              <Tab value="INTERNAL" label={`Internal (${counts.INTERNAL})`} />
              <Tab value="PLACEMENT" label={`Placement (${counts.PLACEMENT})`} />
            </Tabs>
          </Box>

          {byCategory[tab].length > 0 ? (
            <Grid container spacing={3}>
              {byCategory[tab].map((test) => (
                <Grid item xs={12} md={6} lg={4} key={test.id}>
                  <AssessmentCard
                    test={test}
                    prevAttempt={attemptByAssessment[test.id]}
                    onTake={(id) => navigate(`/student/tests/${id}/take`)}
                  />
                </Grid>
              ))}
            </Grid>
          ) : (
            <Paper elevation={0} sx={{ p: 6, textAlign: 'center' }}>
              <ShieldIcon sx={{ fontSize: 46, color: CATEGORY_META[tab].accent, mb: 1.5 }} />
              <Typography variant="h6">{CATEGORY_META[tab].empty}</Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }}>{CATEGORY_META[tab].emptyHint}</Typography>
            </Paper>
          )}
        </>
      )}

      {/* Results — separated by category */}
      {!loading && !error && (
        <Box sx={{ mt: resultsOnly ? 0 : 6 }}>
          <Typography variant={resultsOnly ? 'h4' : 'h5'} sx={{ mb: 2.5 }}>My Results</Typography>

          <Typography variant="subtitle2" sx={{ color: COLORS.AMBER, mb: 1 }}>
            INTERNAL ASSESSMENT RESULTS
          </Typography>
          {internalResults.length > 0 ? (
            <ResultsTable rows={internalResults} />
          ) : (
            <Paper elevation={0} sx={{ p: 3, mb: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">No internal assessment attempts yet.</Typography>
            </Paper>
          )}

          <Typography variant="subtitle2" sx={{ color: COLORS.PLUM, mt: 3, mb: 1 }}>
            PLACEMENT ASSESSMENT RESULTS
          </Typography>
          {placementResults.length > 0 ? (
            <ResultsTable rows={placementResults} />
          ) : (
            <Paper elevation={0} sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">No placement assessment attempts yet.</Typography>
            </Paper>
          )}
        </Box>
      )}

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
        <Alert severity={snack.severity}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
}

export default StudentTests;
