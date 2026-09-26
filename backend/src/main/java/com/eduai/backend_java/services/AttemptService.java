package com.eduai.backend_java.services;

import com.eduai.backend_java.config.ProctoringProperties;
import com.eduai.backend_java.dto.AttemptStateResponse;
import com.eduai.backend_java.dto.AttemptSummary;
import com.eduai.backend_java.dto.SubmissionResult;
import com.eduai.backend_java.dto.ViolationResponse;
import com.eduai.backend_java.models.*;
import com.eduai.backend_java.repositories.AssessmentAttemptRepository;
import com.eduai.backend_java.repositories.AssessmentRepository;
import com.eduai.backend_java.repositories.ProctoringViolationRepository;
import com.eduai.backend_java.repositories.StudentProfileRepository;
import com.eduai.backend_java.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class AttemptService {

    @Autowired
    private AssessmentAttemptRepository attemptRepository;

    @Autowired
    private AssessmentRepository assessmentRepository;

    @Autowired
    private ProctoringViolationRepository violationRepository;

    @Autowired
    private CodeExecutionService codeExecutionService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StudentProfileRepository studentProfileRepository;

    @Autowired
    private AssessmentEvaluationService evaluationService;

    @Autowired
    private ProctoringProperties proctoringProperties;

    // ------------------------------------------------------------------
    // Lifecycle: start / state / terminate
    // ------------------------------------------------------------------

    @Transactional
    public AttemptStateResponse startAttempt(Long assessmentId, Long studentId) {
        Assessment assessment = assessmentRepository.findById(assessmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Assessment not found"));

        if (assessment.getQuestions() == null || assessment.getQuestions().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This assessment has no questions yet.");
        }

        AssessmentAttempt attempt = attemptRepository.findByAssessmentIdAndStudentId(assessmentId, studentId)
                .orElse(null);

        if (attempt != null) {
            switch (attempt.getStatus()) {
                case SUBMITTED, TERMINATED, EXPIRED -> throw new ResponseStatusException(
                        HttpStatus.CONFLICT, "You have already completed this test.");
                case ACTIVE -> {
                    // Idempotent resume (e.g. accidental refresh mid-test)
                    return toState(attempt);
                }
                default -> { /* NOT_STARTED / SUSPICIOUS -> restart below */ }
            }
        } else {
            attempt = AssessmentAttempt.builder()
                    .assessment(assessment)
                    .studentId(studentId)
                    .build();
        }

        attempt.setStatus(AttemptStatus.ACTIVE);
        attempt.setStartedAt(LocalDateTime.now());
        attempt.setSubmittedAt(null);
        attempt.setScore(null);
        attempt.setCorrectCount(null);
        attempt.setViolationCount(0);
        attempt.setWarningCount(0);
        attempt.setTerminatedReason(null);
        attempt.setRecordingFilename(null);
        attempt.setRecordingSizeBytes(null);
        attempt.setRecordingDurationSeconds(null);
        attempt.setRecordingUploadedAt(null);
        attempt.setWebcamFilename(null);
        attempt.setWebcamSizeBytes(null);
        attempt.setWebcamDurationSeconds(null);
        attempt.setWebcamUploadedAt(null);

        return toState(attemptRepository.save(attempt));
    }

    @Transactional
    public AttemptStateResponse getState(Long attemptId, Long requesterId, boolean isPrivileged) {
        AssessmentAttempt attempt = loadOwned(attemptId, requesterId, isPrivileged);

        // Auto-expire on read so the status stays truthful even if the client vanished.
        if (attempt.getStatus() == AttemptStatus.ACTIVE && attempt.computeRemainingSeconds() <= 0) {
            attempt.setStatus(AttemptStatus.EXPIRED);
            attempt.setSubmittedAt(LocalDateTime.now());
            gradeAndFinish(attempt, Map.of(), Map.of()); // no answers available; honest zero grading of unanswered
            attemptRepository.save(attempt);
        }
        return toState(attempt);
    }

    // ------------------------------------------------------------------
    // Violations
    // ------------------------------------------------------------------

    @Transactional
    public ViolationResponse recordViolation(Long attemptId, Long studentId, String typeStr, String description) {
        AssessmentAttempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Attempt not found"));

        if (!attempt.getStudentId().equals(studentId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only report violations for your own attempt.");
        }
        if (attempt.getStatus() != AttemptStatus.ACTIVE) {
            // Test already over — nothing to record, but do not crash the client.
            ViolationType ignored;
            try {
                ignored = ViolationType.valueOf(typeStr.trim().toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown violation type: " + typeStr);
            }
            return new ViolationResponse(attemptId, ignored,
                    attempt.getViolationCount(), criticalCount(attemptId),
                    proctoringProperties.getMaxViolations(), true, attempt.getStatus(),
                    "Attempt already " + attempt.getStatus().name().toLowerCase()
                            + "; violation not recorded.");
        }

        ViolationType type;
        try {
            type = ViolationType.valueOf(typeStr.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown violation type: " + typeStr);
        }

        ViolationSeverity severity =
                (type == ViolationType.TAB_SWITCH || type == ViolationType.FULLSCREEN_EXIT
                        || type == ViolationType.RECORDING_STOPPED)
                        ? ViolationSeverity.CRITICAL
                        : ViolationSeverity.WARNING;

        ProctoringViolation violation = ProctoringViolation.builder()
                .attempt(attempt)
                .studentId(studentId)
                .type(type)
                .timestamp(LocalDateTime.now())
                .description(truncate(description, 500))
                .severity(severity)
                .build();
        violationRepository.save(violation);

        if (severity == ViolationSeverity.CRITICAL) {
            attempt.setViolationCount(attempt.getViolationCount() + 1);
        } else {
            attempt.setWarningCount(attempt.getWarningCount() + 1);
        }

        boolean terminated = attempt.getViolationCount() >= proctoringProperties.getMaxViolations();
        if (terminated) {
            attempt.setStatus(AttemptStatus.TERMINATED);
            attempt.setSubmittedAt(LocalDateTime.now());
            attempt.setTerminatedReason(truncate("Terminated after " + attempt.getViolationCount()
                    + " critical violations. Last: " + type.name(), 500));
            gradeAndFinish(attempt, Map.of(), Map.of()); // grade what was answered before termination
            attemptRepository.save(attempt);
        } else {
            attemptRepository.save(attempt);
        }

        return ViolationResponse.of(attemptId, type, attempt.getViolationCount(),
                criticalCount(attemptId), proctoringProperties.getMaxViolations(), terminated, attempt.getStatus());
    }

    @Transactional(readOnly = true)
    public List<ProctoringViolation> getViolations(Long attemptId, Long requesterId, boolean isPrivileged) {
        loadOwned(attemptId, requesterId, isPrivileged);
        return violationRepository.findByAttemptIdOrderByTimestampAsc(attemptId);
    }

    // ------------------------------------------------------------------
    // Submission
    // ------------------------------------------------------------------

    @Transactional
    public SubmissionResult submitAttempt(Long attemptId, Long studentId,
                                          Map<String, String> answers,
                                          Map<String, String> languages) {
        AssessmentAttempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Attempt not found"));

        if (!attempt.getStudentId().equals(studentId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only submit your own attempt.");
        }

        boolean expired = attempt.getStatus() == AttemptStatus.ACTIVE && attempt.computeRemainingSeconds() <= 0;

        if (attempt.getStatus() == AttemptStatus.SUBMITTED || attempt.getStatus() == AttemptStatus.EXPIRED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This attempt was already submitted.");
        }
        if (attempt.getStatus() == AttemptStatus.TERMINATED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "This attempt was terminated due to proctoring violations.");
        }
        if (attempt.getStatus() != AttemptStatus.ACTIVE && !expired) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This attempt is not active.");
        }

        attempt.setStatus(expired ? AttemptStatus.EXPIRED : AttemptStatus.SUBMITTED);
        gradeAndFinish(attempt, answers == null ? Map.of() : answers, languages);
        attemptRepository.save(attempt);
        return toSubmissionResult(attempt, expired);
    }

    private void gradeAndFinish(AssessmentAttempt attempt, Map<String, String> answers, Map<String, String> languages) {
        Assessment assessment = attempt.getAssessment();
        AssessmentEvaluationService.EvaluationResult result =
                evaluationService.evaluate(assessment, answers, languages);
        attempt.setCorrectCount(result.correctCount());
        attempt.setTotalQuestions(result.totalGraded());
        attempt.setTotalScore((double) result.totalGraded());
        attempt.setScore((double) result.correctCount());
        if (attempt.getSubmittedAt() == null) {
            attempt.setSubmittedAt(LocalDateTime.now());
        }
    }

    @Transactional
    public AttemptStateResponse terminateAttempt(Long attemptId, Long studentId, String reason) {
        AssessmentAttempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Attempt not found"));

        if (!attempt.getStudentId().equals(studentId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your attempt.");
        }
        if (attempt.getStatus() != AttemptStatus.ACTIVE) {
            return toState(attempt); // already finished; idempotent
        }

        attempt.setStatus(AttemptStatus.TERMINATED);
        attempt.setSubmittedAt(LocalDateTime.now());
        attempt.setTerminatedReason(truncate(
                reason != null && !reason.isBlank() ? reason : "Terminated by student", 500));
        gradeAndFinish(attempt, Map.of(), Map.of());
        attemptRepository.save(attempt);
        return toState(attempt);
    }

    // ------------------------------------------------------------------
    // Recording storage (never exposed as a static/public URL)
    // ------------------------------------------------------------------

    @Transactional
    public void saveRecording(Long attemptId, Long studentId, MultipartFile file, Long durationSeconds) {
        AssessmentAttempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Attempt not found"));

        if (!attempt.getStudentId().equals(studentId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only upload a recording for your own attempt.");
        }
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Empty recording file.");
        }

        long maxBytes = proctoringProperties.getMaxRecordingMb() * 1024L * 1024L;
        if (file.getSize() > maxBytes) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE,
                    "Recording exceeds the maximum allowed size of " + proctoringProperties.getMaxRecordingMb() + " MB.");
        }

        try {
            Path dir = Paths.get(proctoringProperties.getRecordingDir());
            Files.createDirectories(dir);
            String filename = "attempt_" + attemptId + ".webm";
            Path target = dir.resolve(filename);
            try (var in = file.getInputStream()) {
                Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
            }
            attempt.setRecordingFilename(filename);
            attempt.setRecordingSizeBytes(file.getSize());
            attempt.setRecordingDurationSeconds(durationSeconds);
            attempt.setRecordingUploadedAt(LocalDateTime.now());
            attemptRepository.save(attempt);
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not store recording: " + e.getMessage());
        }
    }

    @Transactional
    public void saveWebcamRecording(Long attemptId, Long studentId, MultipartFile file, Long durationSeconds) {
        AssessmentAttempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Attempt not found"));

        if (!attempt.getStudentId().equals(studentId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only upload a webcam recording for your own attempt.");
        }
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Empty webcam recording file.");
        }

        long maxBytes = proctoringProperties.getMaxRecordingMb() * 1024L * 1024L;
        if (file.getSize() > maxBytes) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE,
                    "Webcam recording exceeds the maximum allowed size of " + proctoringProperties.getMaxRecordingMb() + " MB.");
        }

        try {
            Path dir = Paths.get(proctoringProperties.getRecordingDir());
            Files.createDirectories(dir);
            String filename = "attempt_" + attemptId + "_webcam.webm";
            Path target = dir.resolve(filename);
            try (var in = file.getInputStream()) {
                Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
            }
            attempt.setWebcamFilename(filename);
            attempt.setWebcamSizeBytes(file.getSize());
            attempt.setWebcamDurationSeconds(durationSeconds);
            attempt.setWebcamUploadedAt(LocalDateTime.now());
            attemptRepository.save(attempt);
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not store webcam recording: " + e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public Path getWebcamPath(Long attemptId, Long requesterId, boolean isPrivileged) {
        AssessmentAttempt attempt = loadOwnedOrTeacher(attemptId, requesterId, isPrivileged);
        if (attempt.getWebcamFilename() == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No webcam recording stored for this attempt.");
        }
        Path p = Paths.get(proctoringProperties.getRecordingDir()).resolve(attempt.getWebcamFilename()).normalize();
        if (!p.startsWith(Paths.get(proctoringProperties.getRecordingDir()).normalize()) || !Files.exists(p)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Webcam recording file is missing on the server.");
        }
        return p;
    }

    @Transactional(readOnly = true)
    public Path getRecordingPath(Long attemptId, Long requesterId, boolean isPrivileged) {
        AssessmentAttempt attempt = loadOwnedOrTeacher(attemptId, requesterId, isPrivileged);
        if (attempt.getRecordingFilename() == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No recording stored for this attempt.");
        }
        Path p = Paths.get(proctoringProperties.getRecordingDir()).resolve(attempt.getRecordingFilename()).normalize();
        if (!p.startsWith(Paths.get(proctoringProperties.getRecordingDir()).normalize()) || !Files.exists(p)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Recording file is missing on the server.");
        }
        return p;
    }

    // ------------------------------------------------------------------
    // Listings
    // ------------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<AttemptSummary> getMyAttempts(Long studentId) {
        List<AttemptSummary> out = new ArrayList<>();
        for (AssessmentAttempt a : attemptRepository.findByStudentIdOrderByStartedAtDesc(studentId)) {
            out.add(toSummary(a));
        }
        return out;
    }

    @Transactional(readOnly = true)
    public List<AttemptSummary> getAttemptsForAssessment(Long assessmentId) {
        List<AttemptSummary> out = new ArrayList<>();
        for (AssessmentAttempt a : attemptRepository.findByAssessmentIdOrderByStartedAtDesc(assessmentId)) {
            out.add(toSummary(a));
        }
        return out;
    }

    @Transactional(readOnly = true)
    public List<AttemptSummary> getRecordedAttempts() {
        List<AssessmentAttempt> all = attemptRepository.findAll();
        return all.stream()
                .filter(a -> (a.getRecordingFilename() != null || a.getWebcamFilename() != null)
                        && a.getStartedAt() != null)
                .sorted((x, y) -> y.getStartedAt().compareTo(x.getStartedAt()))
                .map(this::toSummary)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AttemptSummary> getRecentAttempts(int limit) {
        return attemptRepository.findAll().stream()
                .filter(a -> a.getStartedAt() != null)
                .sorted((x, y) -> y.getStartedAt().compareTo(x.getStartedAt()))
                .limit(limit)
                .map(this::toSummary)
                .toList();
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    private AssessmentAttempt loadOwned(Long attemptId, Long requesterId, boolean isPrivileged) {
        AssessmentAttempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Attempt not found"));
        if (!isPrivileged && !attempt.getStudentId().equals(requesterId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your attempt.");
        }
        return attempt;
    }

    /** Recordings are teacher/admin-only; owning students cannot re-watch their own video. */
    private AssessmentAttempt loadOwnedOrTeacher(Long attemptId, Long requesterId, boolean isPrivileged) {
        return loadOwned(attemptId, requesterId, isPrivileged);
    }

    public Map<String, Object> runCode(Long attemptId, Long studentId, Long questionId, String language, String code) {
        AssessmentAttempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Attempt not found"));
        if (!attempt.getStudentId().equals(studentId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only run code for your own attempt.");
        }
        if (attempt.getStatus() != AttemptStatus.ACTIVE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This attempt is not active.");
        }
        Question question = attempt.getAssessment().getQuestions().stream()
                .filter(q -> questionId != null && questionId.equals(q.getId()))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Question not found in this assessment."));
        CodeExecutionService.RunResult result =
                codeExecutionService.run(language, code, question.getTestCaseInput());
        String actual = result.stdout() == null ? "" : result.stdout().trim();
        String expected = question.getExpectedOutput() == null ? "" : question.getExpectedOutput().trim();
        boolean passed = result.error() == null && !actual.isEmpty() && actual.equalsIgnoreCase(expected);
        return Map.of(
                "stdout", result.stdout() == null ? "" : result.stdout(),
                "stderr", result.stderr() == null ? "" : result.stderr(),
                "timedOut", result.timedOut(),
                "error", result.error() == null ? "" : result.error(),
                "passed", passed);
    }

    @Transactional
    public void deleteAssessmentCascade(Long assessmentId) {
        Assessment assessment = assessmentRepository.findById(assessmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Assessment not found."));
        List<AssessmentAttempt> attempts = attemptRepository.findByAssessmentIdOrderByStartedAtDesc(assessmentId);
        for (AssessmentAttempt attempt : attempts) {
            violationRepository.deleteByAttemptId(attempt.getId());
        }
        attemptRepository.deleteAll(attempts);
        assessmentRepository.delete(assessment);
    }

    private int criticalCount(Long attemptId) {
        return (int) violationRepository.findByAttemptIdOrderByTimestampAsc(attemptId).stream()
                .filter(v -> v.getSeverity() == ViolationSeverity.CRITICAL).count();
    }

    private AttemptStateResponse toState(AssessmentAttempt a) {
        long remaining = Math.max(0, a.computeRemainingSeconds());
        return new AttemptStateResponse(
                a.getId(),
                a.getAssessment().getId(),
                a.getAssessment().getTitle(),
                a.getAssessment().getDurationMinutes(),
                a.getStatus(),
                a.getStartedAt(),
                a.getSubmittedAt(),
                remaining,
                a.getViolationCount(),
                proctoringProperties.getMaxViolations(),
                proctoringProperties.getWarningThreshold(),
                a.getRecordingFilename() != null,
                a.getWebcamFilename() != null,
                a.getScore(),
                a.getTotalScore(),
                a.getCorrectCount(),
                a.getTotalQuestions(),
                a.getTerminatedReason());
    }

    private SubmissionResult toSubmissionResult(AssessmentAttempt a, boolean expired) {
        double pct = evaluationService.percentage(
                a.getCorrectCount() == null ? 0 : a.getCorrectCount(),
                a.getTotalQuestions() == null ? 0 : a.getTotalQuestions());
        String grade = pct >= 60 ? "PASSED" : "FAILED";
        return new SubmissionResult(a.getId(), a.getStatus(), a.getScore(), a.getTotalScore(),
                a.getCorrectCount(), a.getTotalQuestions(), pct, grade, a.getSubmittedAt());
    }

    private AttemptSummary toSummary(AssessmentAttempt a) {
        String studentName = userRepository.findById(a.getStudentId())
                .map(u -> u.getUsername())
                .orElse("Unknown (#" + a.getStudentId() + ")");
        String regNo = studentProfileRepository.findByUserId(a.getStudentId())
                .map(StudentProfile::getRegisterNumber).orElse("-");

        LocalDateTime end = a.getSubmittedAt() != null ? a.getSubmittedAt() : LocalDateTime.now();
        long actualSeconds = a.getStartedAt() != null ? Duration.between(a.getStartedAt(), end).getSeconds() : 0;

        return new AttemptSummary(
                a.getId(),
                a.getAssessment().getId(),
                a.getAssessment().getTitle(),
                a.getAssessment().isInternal() ? "INTERNAL" : "PLACEMENT",
                a.getStudentId(),
                studentName,
                regNo,
                a.getStatus(),
                a.getStartedAt(),
                a.getSubmittedAt(),
                actualSeconds,
                a.getScore(),
                a.getTotalScore(),
                a.getCorrectCount(),
                a.getTotalQuestions(),
                a.getViolationCount(),
                a.getRecordingFilename() != null,
                a.getWebcamFilename() != null);
    }

    private String truncate(String s, int len) {
        if (s == null) return null;
        return s.length() <= len ? s : s.substring(0, len - 3) + "...";
    }
}
