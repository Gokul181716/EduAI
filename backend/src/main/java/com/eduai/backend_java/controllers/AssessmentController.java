package com.eduai.backend_java.controllers;

import com.eduai.backend_java.models.Assessment;
import com.eduai.backend_java.models.Question;
import com.eduai.backend_java.models.User;
import com.eduai.backend_java.repositories.UserRepository;
import com.eduai.backend_java.services.AttemptService;
import com.eduai.backend_java.services.AssessmentEvaluationService;
import com.eduai.backend_java.dto.AttemptSummary;
import com.eduai.backend_java.repositories.AssessmentRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Assessment management with hard role separation:
 *   Teacher -> creates/manages INTERNAL assessments (scoped to a class).
 *   Admin   -> creates/manages PLACEMENT assessments.
 *   Student -> may only READ assessments visible to them and never mutate anything.
 * All checks run server-side against the authenticated session, not the client UI.
 */
@RestController
@RequestMapping("/api/assessments")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class AssessmentController {

    @Autowired
    private AssessmentRepository assessmentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AttemptService attemptService;

    @Autowired
    private AssessmentEvaluationService evaluationService;

    @Autowired
    private ObjectMapper objectMapper;

    // ------------------------------------------------------------------
    // Session helpers
    // ------------------------------------------------------------------

    private String role(HttpSession session) {
        Object role = session != null ? session.getAttribute("role") : null;
        return role == null ? "" : role.toString();
    }

    private Long userId(HttpSession session) {
        Object uid = session != null ? session.getAttribute("userId") : null;
        if (uid instanceof Long l) return l;
        if (uid instanceof Integer i) return i.longValue();
        return null;
    }

    private boolean isTeacher(HttpSession s) { return "Teacher".equalsIgnoreCase(role(s)); }

    private boolean isAdmin(HttpSession s) { return "Admin".equalsIgnoreCase(role(s)); }

    private boolean isPrivileged(HttpSession session) {
        return isTeacher(session) || isAdmin(session);
    }

    private User currentUser(HttpSession session) {
        Long id = userId(session);
        return id == null ? null : userRepository.findById(id).orElse(null);
    }

    /** True when this student is allowed to see this assessment. */
    private boolean visibleToStudent(Assessment a, User student) {
        if (!a.isAvailableNow()) return false;
        if (a.isPlacement()) return true;
        // INTERNAL assessments are scoped to department/year/section.
        // When the student hasn't filled in their profile yet (null/blank fields),
        // show all available internal assessments so they are not locked out.
        if (isBlank(student.getDepartment()) && isBlank(student.getYear()) && isBlank(student.getClassSection())) {
            return true;
        }
        // Only enforce a scope filter when BOTH the assessment and student have the field set.
        if (!isBlank(a.getAssignedDepartment()) && !isBlank(student.getDepartment())
                && !a.getAssignedDepartment().equalsIgnoreCase(student.getDepartment())) {
            return false;
        }
        if (!isBlank(a.getAssignedYear()) && !isBlank(student.getYear())
                && !a.getAssignedYear().equalsIgnoreCase(student.getYear())) {
            return false;
        }
        if (!isBlank(a.getAssignedSection()) && !isBlank(student.getClassSection())
                && !a.getAssignedSection().equalsIgnoreCase(student.getClassSection())) {
            return false;
        }
        return true;
    }

    private boolean isBlank(String s) { return s == null || s.isBlank(); }

    /** Resolve a question's effective MCQ/CODING type (blank -> derive from assessment). */
    private String translateType(String questionType, String assessmentType) {
        if (!isBlank(questionType)) {
            String t = questionType.trim().toUpperCase();
            if (t.equals("MCQ") || t.equals("CODING")) return t;
        }
        return "APTITUDE".equalsIgnoreCase(assessmentType) ? "MCQ" : "CODING";
    }

    /**
     * Strips only what would give a student the answer before a test:
     * the correct MCQ option and the hidden grading test cases.
     * The sample expected output stays visible so students understand the
     * required output format, exactly like LeetCode's "Sample Output".
     * Grading never trusts this payload — it always reads the stored Assessment
     * server-side, so removing these fields only blocks leakage, not scoring.
     */
    private JsonNode withoutAnswers(Assessment a) {
        JsonNode tree = objectMapper.valueToTree(a);
        JsonNode qs = tree.get("questions");
        if (qs != null && qs.isArray()) {
            for (JsonNode q : qs) {
                if (q instanceof ObjectNode on) {
                    on.remove("answer");
                    on.remove("hiddenTestCases");
                }
            }
        }
        return tree;
    }

    /** Owner check: teachers manage their own internal assessments, admins manage placement ones. */
    private boolean canManage(Assessment a, HttpSession session) {
        if (isAdmin(session)) return true;                       // admins manage everything
        if (!isTeacher(session)) return false;
        if (!a.isInternal()) return false;                       // teacher can never touch PLACEMENT
        return a.getCreatedBy() == null || a.getCreatedBy().equals(usernameOf(session));
    }

    private String usernameOf(HttpSession session) {
        User u = currentUser(session);
        return u != null ? u.getUsername() : null;
    }

    private ResponseEntity<?> forbidden(String msg) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", msg));
    }

    // ------------------------------------------------------------------
    // Read
    // ------------------------------------------------------------------

    /**
     * Role-aware listing.
     *   Student: published + in-window; PLACEMENT for everyone, INTERNAL only when class matches.
     *   Teacher: their own INTERNAL assessments.
     *   Admin:   all PLACEMENT assessments.
     * Optional ?category=INTERNAL|PLACEMENT narrows within what the caller may see.
     */
    @GetMapping
    public ResponseEntity<?> getAllAssessments(@RequestParam(required = false) String category,
                                               HttpSession session) {
        try {
            List<Assessment> all = assessmentRepository.findAll();
            String r = role(session);
            List<Assessment> visible;

            if ("Student".equalsIgnoreCase(r)) {
                User student = currentUser(session);
                if (student == null) return ResponseEntity.ok(List.of());
                visible = all.stream()
                        .filter(a -> category == null || category.equalsIgnoreCase(a.getAssessmentCategory())
                                || (category.equalsIgnoreCase("PLACEMENT") && a.isPlacement()))
                        .filter(a -> visibleToStudent(a, student))
                        .toList();
                List<JsonNode> sanitized = new java.util.ArrayList<>();
                for (Assessment a : visible) sanitized.add(withoutAnswers(a));
                return ResponseEntity.ok(sanitized);
            } else if (isTeacher(session)) {
                String me = usernameOf(session);
                visible = all.stream()
                        .filter(Assessment::isInternal)
                        .filter(a -> a.getCreatedBy() == null || me == null || a.getCreatedBy().equals(me))
                        .toList();
            } else if (isAdmin(session)) {
                visible = all.stream().filter(Assessment::isPlacement).toList();
            } else {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Please log in."));
            }
            return ResponseEntity.ok(visible);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Could not load assessments: " + e.getMessage()));
        }
    }

    /** Students can fetch details only of assessments visible to them. */
    @GetMapping("/{id}")
    public ResponseEntity<?> getAssessment(@PathVariable Long id, HttpSession session) {
        Optional<Assessment> assessment = assessmentRepository.findById(id);
        if (assessment.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Assessment not found."));
        }
        if ("Student".equalsIgnoreCase(role(session))) {
            User student = currentUser(session);
            if (student == null || !visibleToStudent(assessment.get(), student)) {
                return forbidden("This assessment is not available to you.");
            }
            return ResponseEntity.ok(withoutAnswers(assessment.get()));
        }
        return ResponseEntity.ok(assessment.get());
    }

    // ------------------------------------------------------------------
    // Create / update / publish / delete
    // ------------------------------------------------------------------

    /** Teachers create INTERNAL assessments; admins create PLACEMENT ones. Students are rejected. */
    @PostMapping("/create")
    public ResponseEntity<?> createAssessment(@RequestBody Assessment assessment, HttpSession session) {
        if (!isPrivileged(session)) {
            return forbidden("Only teachers and admins can create assessments.");
        }
        try {
            if (isAdmin(session)) {
                assessment.setAssessmentCategory("PLACEMENT");
            } else {
                assessment.setAssessmentCategory("INTERNAL");
            }
            String error = validate(assessment);
            if (error != null) return ResponseEntity.badRequest().body(Map.of("error", error));

            assessment.setCreatedBy(usernameOf(session));
            assessment.setCreatorRole(isAdmin(session) ? "Admin" : "Teacher");
            if (assessment.getPublished() == null) assessment.setPublished(Boolean.TRUE);
            if (assessment.getTotalMarks() == null) {
                assessment.setTotalMarks(assessment.getQuestions().size());
            }

            Assessment saved = assessmentRepository.save(assessment);
            return new ResponseEntity<>(saved, HttpStatus.CREATED);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Save error: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateAssessment(@PathVariable Long id,
                                              @RequestBody Assessment updated,
                                              HttpSession session) {
        Optional<Assessment> existing = assessmentRepository.findById(id);
        if (existing.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Assessment not found."));
        }
        if (!canManage(existing.get(), session)) {
            return forbidden("You cannot modify this assessment.");
        }
        try {
            Assessment a = existing.get();
            if (updated.getTitle() != null) a.setTitle(updated.getTitle());
            if (updated.getType() != null) a.setType(updated.getType());
            if (updated.getDurationMinutes() != null) a.setDurationMinutes(updated.getDurationMinutes());
            if (updated.getSubject() != null) a.setSubject(updated.getSubject());
            if (updated.getDescription() != null) a.setDescription(updated.getDescription());
            if (updated.getInstructions() != null) a.setInstructions(updated.getInstructions());
            if (updated.getStartDate() != null) a.setStartDate(updated.getStartDate());
            if (updated.getEndDate() != null) a.setEndDate(updated.getEndDate());
            if (updated.getTotalMarks() != null) a.setTotalMarks(updated.getTotalMarks());
            if (updated.getPassingMarks() != null) a.setPassingMarks(updated.getPassingMarks());
            if (updated.getPublished() != null) a.setPublished(updated.getPublished());
            if (updated.getAssignedDepartment() != null) a.setAssignedDepartment(updated.getAssignedDepartment());
            if (updated.getAssignedYear() != null) a.setAssignedYear(updated.getAssignedYear());
            if (updated.getAssignedSection() != null) a.setAssignedSection(updated.getAssignedSection());
            if (updated.getQuestions() != null && !updated.getQuestions().isEmpty()) {
                a.getQuestions().clear();
                a.getQuestions().addAll(updated.getQuestions());
            }
            String err = validate(a);
            if (err != null) return ResponseEntity.badRequest().body(Map.of("error", err));
            return ResponseEntity.ok(assessmentRepository.save(a));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Update failed: " + e.getMessage()));
        }
    }

    /** Publish / unpublish toggle — owner-only. */
    @PostMapping("/{id}/publish")
    public ResponseEntity<?> publishAssessment(@PathVariable Long id,
                                               @RequestBody Map<String, Object> body,
                                               HttpSession session) {
        Optional<Assessment> existing = assessmentRepository.findById(id);
        if (existing.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Assessment not found."));
        }
        if (!canManage(existing.get(), session)) {
            return forbidden("You cannot publish or unpublish this assessment.");
        }
        Assessment a = existing.get();
        Object flag = body.get("published");
        a.setPublished(flag instanceof Boolean b ? b : Boolean.parseBoolean(String.valueOf(flag)));
        return ResponseEntity.ok(assessmentRepository.save(a));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAssessment(@PathVariable Long id, HttpSession session) {
        if (!isPrivileged(session)) {
            return forbidden("Only teachers and admins can delete assessments.");
        }
        Optional<Assessment> existing = assessmentRepository.findById(id);
        if (existing.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Assessment not found."));
        }
        if (!canManage(existing.get(), session)) {
            return forbidden("You cannot delete this assessment.");
        }
        try {
            attemptService.deleteAssessmentCascade(id);
            return ResponseEntity.ok(Map.of("message", "Deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Delete failed: " + e.getMessage()));
        }
    }

    /**
     * Legacy direct-submission endpoint (kept for backward compatibility).
     * The secure flow is POST /api/attempts/{id}/submit which enforces a server-side
     * timer and proctoring state.
     */
    @PostMapping("/{id}/submit")
    public ResponseEntity<?> submitAssessment(@PathVariable Long id,
                                              @RequestBody Map<String, Object> submission,
                                              HttpSession session) {
        try {
            Assessment assessment = assessmentRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Assessment not found"));

            @SuppressWarnings("unchecked")
            Map<String, String> answers = submission.get("answers") != null
                    ? (Map<String, String>) submission.get("answers") : Map.of();

            AssessmentEvaluationService.EvaluationResult result =
                    evaluationService.evaluate(assessment, answers, null);
            double percentage = evaluationService.percentage(result.correctCount(), result.totalGraded());

            return ResponseEntity.ok(Map.of(
                    "score", percentage,
                    "status", percentage >= 60 ? "PASSED" : "FAILED",
                    "correctCount", result.correctCount(),
                    "totalGraded", result.totalGraded()
            ));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Evaluation error: " + e.getMessage()));
        }
    }

    /** Attempts for one assessment — teacher/admin review view. */
    @GetMapping("/{id}/attempts")
    public ResponseEntity<?> attemptsForAssessment(@PathVariable Long id, HttpSession session) {
        if (!isPrivileged(session)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Only teachers and admins can review attempts."));
        }
        return ResponseEntity.ok(attemptService.getAttemptsForAssessment(id));
    }

    // ------------------------------------------------------------------
    // Validation
    // ------------------------------------------------------------------

    private String validate(Assessment a) {
        if (a.getTitle() == null || a.getTitle().isBlank()) return "Assessment title is required.";
        if (a.getQuestions() == null || a.getQuestions().isEmpty()) {
            return "An assessment needs at least one question.";
        }
        if (a.getDurationMinutes() == null || a.getDurationMinutes() <= 0) a.setDurationMinutes(20);
        if (a.isInternal()) {
            if (a.getSubject() == null || a.getSubject().isBlank()) {
                return "Subject is required for an internal assessment.";
            }
            if (a.getStartDate() != null && a.getEndDate() != null && a.getEndDate().isBefore(a.getStartDate())) {
                return "End date must be after the start date.";
            }
        }
        int qIdx = 0;
        for (Question q : a.getQuestions()) {
            int idx = ++qIdx;
            if (q.getText() == null || q.getText().isBlank()) {
                return "Question " + idx + ": text is required.";
            }
            boolean mcq = "MCQ".equalsIgnoreCase(translateType(q.getType(), a.getType()));
            if (mcq) {
                List<String> opts = q.getOptions();
                long filled = opts == null ? 0 : opts.stream()
                        .filter(o -> o != null && !o.isBlank()).count();
                if (filled < 2) {
                    return "Question " + idx + " (MCQ): at least 2 options are required so it can be answered.";
                }
                if (q.getAnswer() == null || q.getAnswer().isBlank()) {
                    return "Question " + idx + " (MCQ): the correct answer letter is required, otherwise the question is silently excluded from grading.";
                }
            } else {
                // CODING questions must carry a sample case; without expectedOutput
                // they are skipped during grading, which makes scores look wrong.
                if (q.getExpectedOutput() == null || q.getExpectedOutput().isBlank()) {
                    return "Question " + idx + " (CODING): the expected output is required — without it the question cannot be graded and will be excluded from the score.";
                }
                if (q.getTestCaseInput() == null || q.getTestCaseInput().isBlank()) {
                    return "Question " + idx + " (CODING): a sample test-case input is required so students can run their code.";
                }
            }
        }
        LocalDateTime now = LocalDateTime.now();
        if (a.getStartDate() != null && a.getEndDate() != null && a.getEndDate().isBefore(a.getStartDate())) {
            return "End date must be after the start date.";
        }
        return null;
    }
}
