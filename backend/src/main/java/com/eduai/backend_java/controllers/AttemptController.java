package com.eduai.backend_java.controllers;

import com.eduai.backend_java.config.ProctoringProperties;
import com.eduai.backend_java.dto.AttemptStateResponse;
import com.eduai.backend_java.dto.AttemptSummary;
import com.eduai.backend_java.dto.SubmissionResult;
import com.eduai.backend_java.dto.ViolationResponse;
import com.eduai.backend_java.models.ProctoringViolation;
import com.eduai.backend_java.services.AttemptService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.servlet.http.HttpSession;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/attempts")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class AttemptController {

    @Autowired
    private AttemptService attemptService;

    @Autowired
    private ProctoringProperties proctoringProperties;

    // ------------------------------------------------------------------
    // Student endpoints (role-checked against the session)
    // ------------------------------------------------------------------

    @PostMapping("/start")
    public ResponseEntity<?> start(@RequestBody Map<String, Long> body, HttpSession session) {
        Long studentId = requireStudent(session);
        if (studentId == null) return forbidden();
        try {
            return ResponseEntity.ok(attemptService.startAttempt(body.get("assessmentId"), studentId));
        } catch (Exception e) {
            return error(e);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> state(@PathVariable Long id, HttpSession session) {
        Long studentId = currentUserId(session);
        String role = currentRole(session);
        boolean privileged = isPrivileged(role);
        if (studentId == null && !privileged) return unauthorized();
        try {
            return ResponseEntity.ok(attemptService.getState(id, studentId == null ? -1L : studentId, privileged));
        } catch (Exception e) {
            return error(e);
        }
    }

    @PostMapping("/{id}/violations")
    public ResponseEntity<?> violation(@PathVariable Long id,
                                       @RequestBody Map<String, String> body,
                                       HttpSession session) {
        Long studentId = requireStudent(session);
        if (studentId == null) return forbidden();
        try {
            return ResponseEntity.ok(attemptService.recordViolation(
                    id, studentId, body.getOrDefault("type", "WINDOW_BLUR"),
                    body.get("description")));
        } catch (Exception e) {
            return error(e);
        }
    }

    @PostMapping("/{id}/submit")
    public ResponseEntity<?> submit(@PathVariable Long id,
                                    @RequestBody Map<String, Object> body,
                                    HttpSession session) {
        Long studentId = requireStudent(session);
        if (studentId == null) return forbidden();

        @SuppressWarnings("unchecked")
        Map<String, String> answers = body.get("answers") != null
                ? (Map<String, String>) body.get("answers") : Map.of();
        @SuppressWarnings("unchecked")
        Map<String, String> languages = body.get("languages") != null
                ? (Map<String, String>) body.get("languages") : Map.of();
        try {
            return ResponseEntity.ok(attemptService.submitAttempt(id, studentId, answers, languages));
        } catch (Exception e) {
            return error(e);
        }
    }

    @PostMapping("/{id}/run")
    public ResponseEntity<?> runCode(@PathVariable Long id,
                                     @RequestBody Map<String, Object> body,
                                     HttpSession session) {
        Long studentId = requireStudent(session);
        if (studentId == null) return forbidden();
        try {
            Long questionId = body.get("questionId") == null
                    ? null : Long.valueOf(String.valueOf(body.get("questionId")));
            String language = String.valueOf(body.getOrDefault("language", ""));
            String code = body.get("code") == null ? "" : String.valueOf(body.get("code"));
            return ResponseEntity.ok(attemptService.runCode(id, studentId, questionId, language, code));
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid questionId."));
        } catch (Exception e) {
            return error(e);
        }
    }

    @PostMapping("/{id}/terminate")
    public ResponseEntity<?> terminate(@PathVariable Long id,
                                       @RequestBody(required = false) Map<String, String> body,
                                       HttpSession session) {
        Long studentId = requireStudent(session);
        if (studentId == null) return forbidden();
        try {
            String reason = body != null ? body.get("reason") : null;
            return ResponseEntity.ok(attemptService.terminateAttempt(id, studentId, reason));
        } catch (Exception e) {
            return error(e);
        }
    }

    @PostMapping("/{id}/recording")
    public ResponseEntity<?> uploadRecording(@PathVariable Long id,
                                              @RequestParam("file") MultipartFile file,
                                              @RequestParam(value = "durationSeconds", required = false) Long durationSeconds,
                                              HttpSession session) {
        Long studentId = requireStudent(session);
        if (studentId == null) return forbidden();
        try {
            attemptService.saveRecording(id, studentId, file, durationSeconds);
            return ResponseEntity.ok(Map.of("status", "stored"));
        } catch (Exception e) {
            return error(e);
        }
    }

    @PostMapping("/{id}/webcam")
    public ResponseEntity<?> uploadWebcam(@PathVariable Long id,
                                           @RequestParam("file") MultipartFile file,
                                           @RequestParam(value = "durationSeconds", required = false) Long durationSeconds,
                                           HttpSession session) {
        Long studentId = requireStudent(session);
        if (studentId == null) return forbidden();
        try {
            attemptService.saveWebcamRecording(id, studentId, file, durationSeconds);
            return ResponseEntity.ok(Map.of("status", "stored"));
        } catch (Exception e) {
            return error(e);
        }
    }

    @GetMapping("/my")
    public ResponseEntity<?> myAttempts(HttpSession session) {
        Long studentId = requireStudent(session);
        if (studentId == null) return forbidden();
        return ResponseEntity.ok(attemptService.getMyAttempts(studentId));
    }

    // ------------------------------------------------------------------
    // Teacher / Admin review endpoints — recordings are NEVER public
    // ------------------------------------------------------------------

    @GetMapping("/recorded")
    public ResponseEntity<?> recordedAttempts(HttpSession session) {
        if (!isPrivileged(currentRole(session))) return forbidden();
        return ResponseEntity.ok(attemptService.getRecordedAttempts());
    }

    @GetMapping("/assessment/{assessmentId}")
    public ResponseEntity<?> attemptsForAssessment(@PathVariable Long assessmentId, HttpSession session) {
        if (!isPrivileged(currentRole(session))) return forbidden();
        return ResponseEntity.ok(attemptService.getAttemptsForAssessment(assessmentId));
    }

    @GetMapping("/{id}/violations")
    public ResponseEntity<?> violations(@PathVariable Long id, HttpSession session) {
        Long studentId = currentUserId(session);
        boolean privileged = isPrivileged(currentRole(session));
        if (!privileged && studentId == null) return unauthorized();
        try {
            List<ProctoringViolation> list = attemptService.getViolations(
                    id, studentId == null ? -1L : studentId, privileged);
            return ResponseEntity.ok(list.stream().map(v -> Map.of(
                    "id", v.getId(),
                    "type", v.getType().name(),
                    "severity", v.getSeverity().name(),
                    "timestamp", v.getTimestamp().toString(),
                    "description", v.getDescription() == null ? "" : v.getDescription()
            )).toList());
        } catch (Exception e) {
            return error(e);
        }
    }

    /** Streams a screen recording. Teacher/Admin only, never a static URL. */
    @GetMapping("/{id}/recording")
    public ResponseEntity<?> streamRecording(@PathVariable Long id, HttpSession session) {
        if (!isPrivileged(currentRole(session))) return forbidden();
        try {
            Path path = attemptService.getRecordingPath(id, -1L, true);
            long size = Files.size(path);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType("video/webm"));
            headers.setContentLength(size);
            headers.set(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"attempt_" + id + ".webm\"");
            return new ResponseEntity<>(new FileSystemResource(path), headers, HttpStatus.OK);
        } catch (Exception e) {
            return error(e);
        }
    }

    /** Streams a webcam recording. Teacher/Admin only. */
    @GetMapping("/{id}/webcam")
    public ResponseEntity<?> streamWebcam(@PathVariable Long id, HttpSession session) {
        if (!isPrivileged(currentRole(session))) return forbidden();
        try {
            Path path = attemptService.getWebcamPath(id, -1L, true);
            long size = Files.size(path);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType("video/webm"));
            headers.setContentLength(size);
            headers.set(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"attempt_" + id + "_webcam.webm\"");
            return new ResponseEntity<>(new FileSystemResource(path), headers, HttpStatus.OK);
        } catch (Exception e) {
            return error(e);
        }
    }

    @GetMapping("/config")
    public ResponseEntity<?> config() {
        // Public-safe subset so the client can render accurate warnings.
        return ResponseEntity.ok(Map.of(
                "maxViolations", proctoringProperties.getMaxViolations(),
                "warningThreshold", proctoringProperties.getWarningThreshold()));
    }

    // ------------------------------------------------------------------
    // Session helpers (roles are stored as "Admin" / "Teacher" / "Student")
    // ------------------------------------------------------------------

    private String currentRole(HttpSession session) {
        Object role = session != null ? session.getAttribute("role") : null;
        return role != null ? role.toString() : null;
    }

    private Long currentUserId(HttpSession session) {
        Object uid = session != null ? session.getAttribute("userId") : null;
        return uid instanceof Long ? (Long) uid : uid instanceof Integer ? ((Integer) uid).longValue() : null;
    }

    private Long requireStudent(HttpSession session) {
        if (!"Student".equalsIgnoreCase(currentRole(session))) return null;
        return currentUserId(session);
    }

    private boolean isPrivileged(String role) {
        return "Teacher".equalsIgnoreCase(role) || "Admin".equalsIgnoreCase(role);
    }

    private ResponseEntity<Object> forbidden() {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("error", "Access denied. You are not authorized for this action."));
    }

    private ResponseEntity<Object> unauthorized() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", "Please log in to continue."));
    }

    private ResponseEntity<Object> error(Exception e) {
        HttpStatus status = HttpStatus.INTERNAL_SERVER_ERROR;
        if (e instanceof org.springframework.web.server.ResponseStatusException rse) {
            status = HttpStatus.resolve(rse.getStatusCode().value());
            if (status == null) status = HttpStatus.INTERNAL_SERVER_ERROR;
            return ResponseEntity.status(status)
                    .body(Map.of("error", rse.getReason() != null ? rse.getReason() : "Request failed."));
        }
        return ResponseEntity.status(status).body(Map.of("error", e.getMessage()));
    }
}
