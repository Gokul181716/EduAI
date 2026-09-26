package com.eduai.backend_java.controllers;

import com.eduai.backend_java.models.AttemptStatus;
import com.eduai.backend_java.models.StudentResult;
import com.eduai.backend_java.repositories.AssessmentAttemptRepository;
import com.eduai.backend_java.repositories.AttendanceRepository;
import com.eduai.backend_java.repositories.StudentResultRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.ResourceAccessException;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class EduAiController {

    /** URL of the Python placement microservice (Flask, port 5001). Configurable via application.properties. */
    @Value("${flask.placement.url:http://localhost:5001/predict}")
    private String flaskApiUrl;

    @Autowired
    private StudentResultRepository studentResultRepository;

    @Autowired
    private AssessmentAttemptRepository attemptRepository;

    @Autowired
    private AttendanceRepository attendanceRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @GetMapping("/status")
    public Map<String, Object> getSystemStatus() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "success");
        response.put("message", "Java Backend is online and ready on Port 8080!");
        return response;
    }

    /**
     * Runs the placement-readiness analysis through the Python AI microservice using REAL data only.
     * Attendance is recomputed on the server from actual attendance records when available.
     * The resulting prediction is persisted to placement_results so dashboards reflect reality.
     */
    @PostMapping("/placement/analyze")
    public ResponseEntity<?> analyzePlacement(@RequestBody Map<String, Object> studentData, HttpSession session) {
        Object role = session != null ? session.getAttribute("role") : null;
        if (role == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Please log in before running an analysis."));
        }
        Long userId = extractUserId(session);

        try {
            // --- Server-side validation of required AI input fields ---
            for (String field : REQUIRED_FIELDS) {
                Object v = studentData.get(field);
                if (v == null || v.toString().isBlank()) {
                    return ResponseEntity.badRequest().body(Map.of(
                            "error", "Missing required academic detail: '" + field + "'.",
                            "missingField", field));
                }
            }

            // --- Recompute attendance server-side when possible (never trust the client blindly) ---
            Double realAttendance = resolveAttendance(studentData, userId);
            studentData.put("attendance", realAttendance);

            // --- Fill missing skill ratings from REAL placement-assessment performance ---
            // The ML model expects aptitude_rating / coding_rating; when the student has
            // completed admin-published placement assessments we derive those features from
            // actual scores (avg percentage mapped onto the model's 0-10 rating scale)
            // instead of letting a blank default to zero.
            Double aptitudeRating = ratingFromPlacementAttempts(userId, "APTITUDE");
            if (aptitudeRating != null && isBlank(studentData.get("aptitude_rating"))) {
                studentData.put("aptitude_rating", aptitudeRating);
                outRatingDerived(studentData, "aptitude_rating");
            }
            Double codingRating = ratingFromPlacementAttempts(userId, "CODING");
            if (codingRating != null && isBlank(studentData.get("coding_rating"))) {
                studentData.put("coding_rating", codingRating);
                outRatingDerived(studentData, "coding_rating");
            }

            // --- Forward to the Python microservice ---
            RestTemplate restTemplate = new RestTemplate();
            ResponseEntity<String> flaskResponse =
                    restTemplate.postForEntity(flaskApiUrl, buildFlaskPayload(studentData), String.class);

            JsonNode ai = objectMapper.readTree(flaskResponse.getBody());

            // --- Build a stable response shape for the UI ---
            Map<String, Object> out = new LinkedHashMap<>();
            out.put("status", "success");
            out.put("studentId", str(studentData.get("studentId")));
            out.put("name", str(studentData.get("name")));
            out.put("prediction", text(ai, "prediction"));
            out.put("confidence", ai.path("confidence").asDouble(0));

            JsonNode probNode = ai.path("probability");
            double probPlaced = probNode.path("placed").asDouble(
                    ai.hasNonNull("confidence") ? ai.path("confidence").asDouble(0) : 0.0);
            double readinessScore = Math.round(probPlaced * 10.0) / 10.0;
            out.put("readinessScore", readinessScore);
            if (probNode.isObject()) {
                out.put("probability", objectMapper.convertValue(probNode, Map.class));
            } else {
                out.put("probability", Map.of());
            }
            out.put("factorsSupportingPlacement", toStringList(ai.get("factors_supporting_placement")));
            out.put("factorsAgainstPlacement", toStringList(ai.get("factors_reducing_placement_probability")));
            out.put("attendanceUsed", realAttendance);

            // --- Persist to placement_results (upsert) so admin/teacher views are real ---
            try {
                persistResult(out, studentData, userId);
                out.put("persisted", true);
            } catch (Exception pe) {
                pe.printStackTrace();
                out.put("persisted", false);
            }

            return ResponseEntity.ok(out);

        } catch (ResourceAccessException e) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of(
                    "error", "The AI microservice is offline. Start it with: python app.py (flask_file/Placement)."));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "error", "Analysis failed: " + e.getMessage()));
        }
    }

    private static final List<String> REQUIRED_FIELDS = List.of(
            "branch", "cgpa", "tenth_percentage", "twelfth_percentage", "backlogs",
            "projects", "internships", "hackathons", "certifications",
            "coding_rating", "communication_rating", "aptitude_rating");

    /** Translates frontend field names into the snake_case names the Flask ML microservice expects. */
    private Map<String, Object> buildFlaskPayload(Map<String, Object> studentData) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("branch",                studentData.get("branch"));
        payload.put("cgpa",                  studentData.get("cgpa"));
        payload.put("tenth_percentage",      studentData.get("tenth_percentage"));
        payload.put("twelfth_percentage",    studentData.get("twelfth_percentage"));
        payload.put("backlogs",              studentData.get("backlogs"));
        payload.put("attendance_percentage", studentData.get("attendance"));
        payload.put("projects_completed",    studentData.get("projects"));
        payload.put("internships_completed", studentData.get("internships"));
        payload.put("hackathons_participated", studentData.get("hackathons"));
        payload.put("certifications_count",  studentData.get("certifications"));
        payload.put("coding_skill_rating",   studentData.get("coding_rating"));
        payload.put("communication_skill_rating", studentData.get("communication_rating"));
        payload.put("aptitude_skill_rating", studentData.get("aptitude_rating"));
        return payload;
    }

    /** Real attendance % over the last 90 days; falls back only to a client-supplied figure when no records exist. */
    private Double resolveAttendance(Map<String, Object> studentData, Long userId) {
        if (userId != null) {
            LocalDate end = LocalDate.now();
            LocalDate start = end.minusDays(90);
            var records = attendanceRepository.findByStudentIdAndDateBetween(userId, start, end);
            if (!records.isEmpty()) {
                long present = records.stream()
                        .filter(r -> r.getStatus() != null && r.getStatus().name().equals("PRESENT"))
                        .count();
                return Math.round((present * 10000.0) / records.size()) / 100.0;
            }
        }
        Object provided = studentData.get("attendance");
        try {
            return provided != null ? Double.parseDouble(provided.toString()) : 0.0;
        } catch (NumberFormatException e) {
            return 0.0;
        }
    }

    /** Average percentage across finished attempts of this user — real assessment performance. */
    private Double computeAvgAssessmentScore(Long userId) {
        if (userId == null) return null;
        var attempts = attemptRepository.findByStudentIdOrderByStartedAtDesc(userId).stream()
                .filter(a -> (a.getStatus() == AttemptStatus.SUBMITTED || a.getStatus() == AttemptStatus.EXPIRED
                        || a.getStatus() == AttemptStatus.TERMINATED))
                .filter(a -> a.getCorrectCount() != null && a.getTotalQuestions() != null
                        && a.getTotalQuestions() > 0)
                .toList();
        if (attempts.isEmpty()) return null;
        double sum = 0;
        for (var a : attempts) {
            sum += (a.getCorrectCount() * 100.0) / a.getTotalQuestions();
        }
        return Math.round((sum / attempts.size()) * 10.0) / 10.0;
    }

    /**
     * Average percentage across the student's finished PLACEMENT assessments of the
     * given type, expressed on the model's 0-10 rating scale. Returns null when there
     * is no real placement-assessment data yet so callers keep their own input.
     */
    private Double ratingFromPlacementAttempts(Long userId, String assessmentType) {
        if (userId == null) return null;
        List<Integer> percents = attemptRepository.findByStudentIdOrderByStartedAtDesc(userId).stream()
                .filter(a -> a.getStatus() == AttemptStatus.SUBMITTED || a.getStatus() == AttemptStatus.EXPIRED
                        || a.getStatus() == AttemptStatus.TERMINATED)
                .filter(a -> a.getAssessment() != null && a.getAssessment().isPlacement())
                .filter(a -> assessmentType.equalsIgnoreCase(
                        a.getAssessment().getType() == null ? "" : a.getAssessment().getType()))
                .filter(a -> a.getCorrectCount() != null && a.getTotalQuestions() != null
                        && a.getTotalQuestions() > 0)
                .map(a -> (int) Math.round((a.getCorrectCount() * 100.0) / a.getTotalQuestions()))
                .toList();
        if (percents.isEmpty()) return null;
        double avgPercent = percents.stream().mapToInt(Integer::intValue).average().orElse(0);
        double rating10 = Math.round((avgPercent / 10.0) * 10.0) / 10.0;
        return Math.max(0.0, Math.min(10.0, rating10));
    }

    private boolean isBlank(Object v) {
        return v == null || v.toString().isBlank();
    }

    private void outRatingDerived(Map<String, Object> studentData, String field) {
        studentData.put(field + "_derived_from_assessment", true);
    }

    private void persistResult(Map<String, Object> out, Map<String, Object> studentData, Long userId) {
        String studentId = str(studentData.get("studentId"));
        StudentResult result = studentResultRepository.findByStudentId(studentId)
                .orElseGet(StudentResult::new);
        result.setStudentId(studentId);
        result.setName(str(studentData.get("name")));
        Object att = out.get("attendanceUsed");
        if (att instanceof Number n) result.setAttendance(n.doubleValue());
        result.setReadinessScore(((Number) out.get("readinessScore")).doubleValue());
        result.setPrediction(str(out.get("prediction")));
        result.setShapExplanation(buildShapText(out));
        result.setAssessmentScore(computeAvgAssessmentScore(userId));
        studentResultRepository.save(result);
    }

    private String buildShapText(Map<String, Object> out) {
        StringBuilder sb = new StringBuilder();
        sb.append("Supporting: ");
        appendList(sb, out.get("factorsSupportingPlacement"));
        sb.append(" | Against: ");
        appendList(sb, out.get("factorsAgainstPlacement"));
        return sb.toString();
    }

    @SuppressWarnings("unchecked")
    private void appendList(StringBuilder sb, Object list) {
        if (list instanceof List<?> l) {
            sb.append(String.join("; ", l.stream().map(String::valueOf).limit(5).toList()));
        } else {
            sb.append("-");
        }
    }

    private List<String> toStringList(JsonNode node) {
        if (node == null || !node.isArray()) return List.of();
        List<String> list = new ArrayList<>();
        node.forEach(n -> list.add(n.asText()));
        return list;
    }

    private Long extractUserId(HttpSession session) {
        Object uid = session != null ? session.getAttribute("userId") : null;
        if (uid instanceof Long l) return l;
        if (uid instanceof Integer i) return i.longValue();
        return null;
    }

    private String text(JsonNode node, String field) {
        return node != null && node.hasNonNull(field) ? node.get(field).asText() : "";
    }

    private String str(Object o) {
        return o != null ? o.toString() : "";
    }
}
