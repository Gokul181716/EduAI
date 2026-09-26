import React, { useEffect, useMemo, useState } from "react";
import {
  Alert, Box, Button, Card, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, Divider, FormControl, Grid, IconButton,
  InputLabel, MenuItem, Paper, Select, Stack, TextField, Tooltip, Typography,
} from "@mui/material";
import {
  AddCircle, Delete, PlayArrow, PauseCircle, Quiz, Code as CodeIcon,
  Visibility,
} from "@mui/icons-material";
import api, { describeError } from "../services/api";
import { COLORS, FONTS, formatDateTime } from "../theme";
import questionPools from "../data/questionPools";

const EMPTY_QUESTION = () => ({
  text: "",
  category: "",
  type: "MCQ",
  options: ["", "", "", ""],
  answer: "",
  testCaseInput: "",
  expectedOutput: "",
  starterCode: { java: "", cpp: "", python: "" },
  hiddenTestCases: [],
});

function toLocalInput(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function QuestionEditor({ qIndex, q, onChange, onOptionChange, onHiddenCase }) {
  return (
    <Paper variant="outlined" sx={{ p: 2.5, mb: 2 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
        <Typography variant="subtitle2">Question {qIndex + 1}</Typography>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <Select
            value={q.type}
            onChange={(e) => onChange(qIndex, "type", e.target.value)}
            displayEmpty
          >
            <MenuItem value="MCQ">MCQ</MenuItem>
            <MenuItem value="CODING">Coding</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      <TextField
        fullWidth required label="Question text"
        multiline minRows={2}
        value={q.text}
        onChange={(e) => onChange(qIndex, "text", e.target.value)}
        sx={{ mb: 2 }}
      />

      {q.type === "MCQ" ? (
        <>
          <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
            {q.options.map((opt, oi) => (
              <Grid item xs={12} sm={6} key={oi}>
                <TextField
                  fullWidth label={`Option ${String.fromCharCode(65 + oi)}`}
                  value={opt}
                  onChange={(e) => onOptionChange(qIndex, oi, e.target.value)}
                />
              </Grid>
            ))}
          </Grid>
          <TextField
            label="Correct option letter (A–D)" size="small" required
            value={q.answer}
            onChange={(e) => onChange(qIndex, "answer", e.target.value.toUpperCase().slice(0, 1))}
            sx={{ width: 220 }}
          />
        </>
      ) : (
        <>
          <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth required label="Sample input (shown to students)"
                value={q.testCaseInput}
                onChange={(e) => onChange(qIndex, "testCaseInput", e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth required label="Expected output"
                value={q.expectedOutput}
                onChange={(e) => onChange(qIndex, "expectedOutput", e.target.value)} />
            </Grid>
          </Grid>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="caption" fontWeight={700} color="text.secondary">
              HIDDEN TEST CASES ({q.hiddenTestCases.length})
            </Typography>
            <Button size="small" startIcon={<AddCircle />} onClick={() => onHiddenCase(qIndex, "add")}>
              Add case
            </Button>
          </Stack>
          {q.hiddenTestCases.map((tc, ci) => (
            <Stack direction="row" spacing={1} key={ci} sx={{ mb: 1 }}>
              <TextField size="small" fullWidth placeholder={`Hidden input #${ci + 1}`}
                value={tc.input}
                onChange={(e) => onHiddenCase(qIndex, "set", ci, "input", e.target.value)} />
              <TextField size="small" fullWidth placeholder="Expected output"
                value={tc.output}
                onChange={(e) => onHiddenCase(qIndex, "set", ci, "output", e.target.value)} />
              <IconButton size="small" onClick={() => onHiddenCase(qIndex, "remove", ci)}>
                <Delete fontSize="small" />
              </IconButton>
            </Stack>
          ))}
        </>
      )}
    </Paper>
  );
}

/**
 * Teacher-facing INTERNAL assessment manager:
 * create (class-scoped metadata + questions), list, publish/unpublish, delete.
 * The backend forces assessmentCategory=INTERNAL for teachers regardless of payload.
 */
export default function InternalAssessmentManager({ user }) {
  const [list, setList] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const [autoCount, setAutoCount] = useState(5);
  const [autoCategory, setAutoCategory] = useState("All Topics (Mixed)");
  const [generating, setGenerating] = useState(false);

  // form state
  const blankForm = () => ({
    title: "",
    subject: "",
    description: "",
    instructions: "",
    durationMinutes: 45,
    totalMarks: "",
    passingMarks: "",
    assignedDepartment: user?.department || "",
    assignedYear: user?.year || "",
    assignedSection: user?.classSection || "",
    startDate: "",
    endDate: "",
    published: true,
    questions: [EMPTY_QUESTION()],
  });
  const [form, setForm] = useState(blankForm());

  const loadList = async () => {
    setLoadingList(true);
    try {
      const res = await api.get("/api/assessments?category=INTERNAL");
      setList(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setMsg({ severity: "error", text: describeError(err, "Could not load your assessments.") });
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => { loadList(); }, []);

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const setQuestion = (qi, field, value) => {
    setForm((f) => {
      const qs = [...f.questions];
      qs[qi] = { ...qs[qi], [field]: value };
      return { ...f, questions: qs };
    });
  };

  const setOption = (qi, oi, value) => {
    setForm((f) => {
      const qs = [...f.questions];
      const opts = [...qs[qi].options];
      opts[oi] = value;
      qs[qi] = { ...qs[qi], options: opts };
      return { ...f, questions: qs };
    });
  };

  const setHiddenCase = (qi, action, ci, field, value) => {
    setForm((f) => {
      const qs = [...f.questions];
      let cases = [...(qs[qi].hiddenTestCases || [])];
      if (action === "add") cases.push({ input: "", output: "" });
      else if (action === "remove") cases = cases.filter((_, i) => i !== ci);
      else if (action === "set") cases[ci] = { ...cases[ci], [field]: value };
      qs[qi] = { ...qs[qi], hiddenTestCases: cases };
      return { ...f, questions: qs };
    });
  };

  const autoGenerateQuestions = () => {
    const pools = questionPools;

    const catKey = autoCategory.toLowerCase();
    const pool = pools[catKey] || null;

    const shuffle = (arr) => {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    };

    const count = Math.max(1, Math.min(autoCount, 20));

    let candidates;
    if (pool) {
      candidates = shuffle(pool);
    } else {
      candidates = shuffle(Object.values(pools).flat());
    }

    const generated = [];
    const usedTexts = new Set();
    for (let i = 0; i < candidates.length && generated.length < count; i++) {
      const item = candidates[i];
      if (usedTexts.has(item.q)) continue;
      usedTexts.add(item.q);
      generated.push({
        text: item.q,
        category: item.cat,
        type: "MCQ",
        options: [...item.opts],
        answer: item.ans,
        testCaseInput: "",
        expectedOutput: "",
        starterCode: { java: "", cpp: "", python: "" },
        hiddenTestCases: [],
      });
    }
    // Drop any blank/unfinished rows (the dialog starts with one empty question)
    // so auto-generated questions don't fail server-side validation.
    setForm((f) => ({
      ...f,
      questions: [...f.questions.filter((q) => q.text && q.text.trim() !== ""), ...generated],
    }));
    const catCounts = {};
    generated.forEach((g) => { catCounts[g.category] = (catCounts[g.category] || 0) + 1; });
    const catSummary = Object.entries(catCounts).map(([c, n]) => `${n} ${c}`).join(", ");
    setMsg({ severity: "success", text: `Generated ${count} questions: ${catSummary}` });
  };

  const handleSave = async () => {
    setMsg(null);
    if (!form.title.trim()) return setMsg({ severity: "error", text: "Title is required." });
    if (!form.subject.trim()) return setMsg({ severity: "error", text: "Subject is required." });

    const payload = {
      title: form.title.trim(),
      subject: form.subject.trim(),
      description: form.description,
      instructions: form.instructions,
      durationMinutes: Number(form.durationMinutes) || 45,
      totalMarks: form.totalMarks === "" ? null : Number(form.totalMarks),
      passingMarks: form.passingMarks === "" ? null : Number(form.passingMarks),
      assignedDepartment: form.assignedDepartment || null,
      assignedYear: form.assignedYear || null,
      assignedSection: form.assignedSection || null,
      startDate: form.startDate ? new Date(form.startDate).toISOString() : null,
      endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
      published: form.published,
      questions: form.questions,
    };

    setSaving(true);
    try {
      await api.post("/api/assessments/create", payload);
      setCreateOpen(false);
      setForm(blankForm());
      setMsg({ severity: "success", text: "Internal assessment published." });
      loadList();
    } catch (err) {
      setMsg({ severity: "error", text: describeError(err, "Could not save the assessment.") });
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (a) => {
    try {
      await api.post(`/api/assessments/${a.id}/publish`, { published: !a.published });
      loadList();
    } catch (err) {
      setMsg({ severity: "error", text: describeError(err, "Could not update publish state.") });
    }
  };

  const removeAssessment = async (a) => {
    if (!window.confirm(`Delete "${a.title}"? This also removes all attempts.`)) return;
    try {
      await api.delete(`/api/assessments/${a.id}`);
      loadList();
    } catch (err) {
      setMsg({ severity: "error", text: describeError(err, "Could not delete.") });
    }
  };

  const stats = useMemo(() => ({
    total: list.length,
    live: list.filter((a) => a.published && (!a.endDate || new Date(a.endDate) > new Date())).length,
    questions: list.reduce((s, a) => s + (a.questions?.length || 0), 0),
  }), [list]);

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5">Internal Assessments</Typography>
          <Typography variant="body2" color="text.secondary">
            Class-scoped academic tests visible only to your assigned department / year / section.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddCircle />} onClick={() => setCreateOpen(true)}>
          Create Assessment
        </Button>
      </Stack>

      {msg && <Alert severity={msg.severity} sx={{ mb: 2 }} onClose={() => setMsg(null)}>{msg.text}</Alert>}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: "Assessments created", value: stats.total },
          { label: "Live now", value: stats.live },
          { label: "Questions authored", value: stats.questions },
        ].map((s) => (
          <Grid item xs={12} sm={4} key={s.label}>
            <Card>
              <Box sx={{ p: 2.5 }}>
                <Typography variant="h4">{s.value}</Typography>
                <Typography variant="body2" color="text.secondary" fontWeight={600}>{s.label}</Typography>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {loadingList ? (
        <Box sx={{ textAlign: "center", py: 6 }}><CircularProgress /></Box>
      ) : list.length === 0 ? (
        <Paper elevation={0} sx={{ p: 6, textAlign: "center" }}>
          <Quiz sx={{ fontSize: 44, color: COLORS.GOLD, mb: 1 }} />
          <Typography variant="h6">No internal assessments yet.</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
            Create your first class-scoped assessment to make it available to students.
          </Typography>
          <Button variant="contained" startIcon={<AddCircle />} onClick={() => setCreateOpen(true)}>
            Create Assessment
          </Button>
        </Paper>
      ) : (
        <Card>
          {list.map((a, i) => (
            <React.Fragment key={a.id}>
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={1.5}
                alignItems={{ xs: "stretch", md: "center" }}
                sx={{ px: 3, py: 2 }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography fontWeight={800}>{a.title}</Typography>
                    <Chip
                      size="small"
                      label={a.published ? "Published" : "Draft"}
                      sx={{
                        bgcolor: a.published ? `${COLORS.TEAL}16` : `${COLORS.GOLD}22`,
                        color: a.published ? COLORS.TEAL : COLORS.AMBER,
                        fontSize: "0.66rem",
                      }}
                    />
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    {[a.subject, `${a.durationMinutes} min`, `${a.questions?.length || 0} questions`,
                      a.assignedDepartment ? `${a.assignedDepartment}${a.assignedYear ? " • Yr " + a.assignedYear : ""}${a.assignedSection ? " • Sec " + a.assignedSection : ""}` : null]
                      .filter(Boolean).join("  •  ")}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                  <Tooltip title="View details">
                    <IconButton onClick={() => setViewItem(a)}><Visibility fontSize="small" /></IconButton>
                  </Tooltip>
                  <Tooltip title={a.published ? "Unpublish" : "Publish"}>
                    <IconButton onClick={() => togglePublish(a)}>
                      {a.published ? <PauseCircle fontSize="small" /> : <PlayArrow fontSize="small" />}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton color="error" onClick={() => removeAssessment(a)}><Delete fontSize="small" /></IconButton>
                  </Tooltip>
                </Stack>
              </Stack>
              {i < list.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </Card>
      )}

      {/* ---------- CREATE DIALOG ---------- */}
      <Dialog open={createOpen} onClose={() => !saving && setCreateOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>New Internal Assessment</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={7}>
              <TextField fullWidth required label="Title" value={form.title}
                onChange={(e) => setField("title", e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={5}>
              <TextField fullWidth required label="Subject" value={form.subject}
                onChange={(e) => setField("subject", e.target.value)} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline minRows={2} label="Description" value={form.description}
                onChange={(e) => setField("description", e.target.value)} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline minRows={2} label="Instructions for students" value={form.instructions}
                onChange={(e) => setField("instructions", e.target.value)} />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField fullWidth type="number" label="Duration (min)" value={form.durationMinutes}
                onChange={(e) => setField("durationMinutes", e.target.value)} />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField fullWidth type="number" label="Total marks (optional)" value={form.totalMarks}
                onChange={(e) => setField("totalMarks", e.target.value)} />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField fullWidth type="number" label="Passing marks (optional)" value={form.passingMarks}
                onChange={(e) => setField("passingMarks", e.target.value)} />
            </Grid>
            <Grid item xs={6} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select value={form.published ? "p" : "d"} label="Status"
                  onChange={(e) => setField("published", e.target.value === "p")}>
                  <MenuItem value="p">Published</MenuItem>
                  <MenuItem value="d">Draft</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}><Divider><Typography variant="caption" color="text.secondary">ASSIGNED CLASS</Typography></Divider></Grid>
            <Grid item xs={4}>
              <TextField fullWidth label="Department" value={form.assignedDepartment}
                onChange={(e) => setField("assignedDepartment", e.target.value)} />
            </Grid>
            <Grid item xs={4}>
              <TextField fullWidth label="Year" value={form.assignedYear}
                onChange={(e) => setField("assignedYear", e.target.value)} />
            </Grid>
            <Grid item xs={4}>
              <TextField fullWidth label="Section" value={form.assignedSection}
                onChange={(e) => setField("assignedSection", e.target.value)} />
            </Grid>

            <Grid item xs={12}><Divider><Typography variant="caption" color="text.secondary">AVAILABILITY WINDOW</Typography></Divider></Grid>
            <Grid item xs={6}>
              <TextField fullWidth type="datetime-local" label="Start date"
                value={toLocalInput(form.startDate)}
                onChange={(e) => setField("startDate", e.target.value ? new Date(e.target.value).toISOString() : "")}
                InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth type="datetime-local" label="End date (deadline)"
                value={toLocalInput(form.endDate)}
                onChange={(e) => setField("endDate", e.target.value ? new Date(e.target.value).toISOString() : "")}
                InputLabelProps={{ shrink: true }} />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography variant="subtitle2">QUESTIONS ({form.questions.length})</Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <FormControl size="small" sx={{ minWidth: 180 }}>
                    <InputLabel>Category / Topic</InputLabel>
                    <Select value={autoCategory} label="Category / Topic" onChange={(e) => setAutoCategory(e.target.value)}>
                      <MenuItem value="All Topics (Mixed)">All Topics (Mixed)</MenuItem>
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
                  <TextField
                    size="small" type="number" label="Count"
                    value={autoCount}
                    onChange={(e) => setAutoCount(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
                    sx={{ width: 70 }}
                    InputLabelProps={{ shrink: true }}
                  />
                  <Button
                    size="small" variant="outlined"
                    onClick={autoGenerateQuestions}
                    sx={{ fontWeight: 700, textTransform: "none", borderColor: COLORS.TEAL, color: COLORS.TEAL, "&:hover": { borderColor: COLORS.TEAL, bgcolor: `${COLORS.TEAL}08` } }}
                  >
                    Auto-Generate MCQs
                  </Button>
                </Stack>
              </Stack>
              {form.questions.map((q, qi) => (
                <QuestionEditor
                  key={qi} qIndex={qi} q={q}
                  onChange={setQuestion}
                  onOptionChange={setOption}
                  onHiddenCase={setHiddenCase}
                />
              ))}
              <Button startIcon={<AddCircle />} onClick={() =>
                setForm((f) => ({ ...f, questions: [...f.questions, EMPTY_QUESTION()] }))}>
                Add Question Manually
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button disabled={saving} onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button disabled={saving} variant="contained" onClick={handleSave}>
            {saving ? "Saving…" : "Publish Assessment"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ---------- VIEW DIALOG ---------- */}
      <Dialog open={Boolean(viewItem)} onClose={() => setViewItem(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{viewItem?.title}</DialogTitle>
        <DialogContent dividers>
          {viewItem && (
            <Stack spacing={1.5}>
              <Chip size="small" label={`${viewItem.questions?.length || 0} questions`} sx={{ alignSelf: "flex-start" }} />
              {viewItem.subject && <Typography><strong>Subject:</strong> {viewItem.subject}</Typography>}
              {viewItem.description && <Typography variant="body2">{viewItem.description}</Typography>}
              {viewItem.instructions && (
                <Alert severity="info"><Typography variant="body2" whiteSpace="pre-line">{viewItem.instructions}</Typography></Alert>
              )}
              <Typography variant="body2"><strong>Duration:</strong> {viewItem.durationMinutes} minutes</Typography>
              <Typography variant="body2"><strong>Total marks:</strong> {viewItem.totalMarks ?? viewItem.questions?.length ?? "—"}</Typography>
              {viewItem.passingMarks != null && (
                <Typography variant="body2"><strong>Passing marks:</strong> {viewItem.passingMarks}</Typography>
              )}
              {(viewItem.startDate || viewItem.endDate) && (
                <Typography variant="body2">
                  <strong>Window:</strong> {formatDateTime(viewItem.startDate)} → {formatDateTime(viewItem.endDate)}
                </Typography>
              )}
              <Typography variant="body2">
                <strong>Assigned to:</strong>{" "}
                {[viewItem.assignedDepartment, viewItem.assignedYear, viewItem.assignedSection].filter(Boolean).join(" / ") || "All classes"}
              </Typography>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewItem(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
