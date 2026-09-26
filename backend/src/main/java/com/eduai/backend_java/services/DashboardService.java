package com.eduai.backend_java.services;

import com.eduai.backend_java.models.Assessment;
import com.eduai.backend_java.models.AttemptStatus;
import com.eduai.backend_java.models.StudentResult;
import com.eduai.backend_java.repositories.AssessmentAttemptRepository;
import com.eduai.backend_java.repositories.AssessmentRepository;
import com.eduai.backend_java.repositories.AttendanceRepository;
import com.eduai.backend_java.repositories.StudentProfileRepository;
import com.eduai.backend_java.repositories.StudentResultRepository;
import com.eduai.backend_java.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class DashboardService {

    private static final int ATTENDANCE_WINDOW_DAYS = 30;

    @Autowired
    private StudentResultRepository repository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private AssessmentRepository assessmentRepository;

    @Autowired
    private AssessmentAttemptRepository attemptRepository;

    @Autowired
    private StudentProfileRepository studentProfileRepository;

    // --- ADMIN DATA (all values computed from live database records) ---
    public Map<String, Object> getAdminDashboardData() {
        Map<String, Object> data = new HashMap<>();

        LocalDate end = LocalDate.now();
        LocalDate start = end.minusDays(ATTENDANCE_WINDOW_DAYS);

        long totalStudents = userRepository.countByRole("STUDENT");
        long totalTeachers = userRepository.countByRole("TEACHER");

        Double overallPlacement = repository.calculateOverallPlacementRate();

        long assessmentsCount = assessmentRepository.count();
        long activeAlerts = countStudentsBelowAttendance(75.0, start, end);

        data.put("totalStudents", totalStudents);
        data.put("totalTeachers", totalTeachers);
        data.put("activeCourses", assessmentsCount);
        data.put("assessmentsCount", assessmentsCount);
        data.put("avgAttendance", averageAttendance(start, end));
        data.put("overallPlacementRate", overallPlacement != null
                ? Math.round(overallPlacement * 10.0) / 10.0 : 0.0);
        data.put("activeAlerts", activeAlerts);
        data.put("systemStatus", "Live & Connected to MySQL");
        data.put("attendanceWindowDays", ATTENDANCE_WINDOW_DAYS);

        // Real chart data — empty lists render as honest empty states in the UI.
        data.put("readinessDistribution", readinessDistribution());
        data.put("attendanceByDept", attendanceByDepartment(start, end));
        data.put("assessmentAverages", assessmentAverages());
        data.put("recentActivity", recentAttempts(8));

        return data;
    }

    // --- TEACHER DATA ---
    public Map<String, Object> getTeacherDashboardData(Long teacherUserId) {
        Map<String, Object> data = new HashMap<>();

        LocalDate end = LocalDate.now();
        LocalDate start = end.minusDays(ATTENDANCE_WINDOW_DAYS);

        List<Object[]> rows = attendanceRepository.findStudentPresentTotals(start, end);
        List<Map<String, Object>> myStudentsPct = perStudentPercentages(rows);

        long myStudents = userRepository.countByRole("STUDENT");
        long atRisk = myStudentsPct.stream().filter(m -> ((Double) m.get("percentage")) < 75.0).count();

        // Real class labels from the students actually registered in the system
        List<String> classes = studentProfileRepository.findAll().stream()
                .map(p -> p.getDepartment() + " • Year " + p.getYear()
                        + (p.getSection() != null && !p.getSection().isBlank() ? " • Sec " + p.getSection() : ""))
                .distinct()
                .sorted()
                .toList();
        if (classes.isEmpty()) classes = List.of();

        data.put("assignedClasses", classes);
        data.put("myStudents", myStudents);
        data.put("atRiskCount", atRisk);
        data.put("avgAttendance", averageAttendance(start, end));
        data.put("attendanceWindowDays", ATTENDANCE_WINDOW_DAYS);

        data.put("attendanceDistribution", attendanceBuckets(myStudentsPct));
        data.put("assessmentAverages", assessmentAverages());
        data.put("recentAttempts", recentAttempts(8));

        return data;
    }

    // --- STUDENT DATA ---
    public Map<String, Object> getStudentDashboardData(String studentId) {
        Map<String, Object> data = new HashMap<>();

        var studentOpt = repository.findByStudentId(studentId);
        if (studentOpt.isPresent()) {
            StudentResult student = studentOpt.get();
            data.put("studentId", student.getStudentId());
            data.put("name", student.getName());
            data.put("currentAttendance", student.getAttendance() != null ? student.getAttendance() : 0.0);
            data.put("averageAssessmentScore", student.getAssessmentScore());
            data.put("readinessScore", student.getReadinessScore() != null ? student.getReadinessScore() : 0.0);
            data.put("prediction", student.getPrediction());
            data.put("shapExplanation", student.getShapExplanation());
        } else {
            // Honest empty state: no analysis has been run for this student yet.
            data.put("error", "No placement analysis found. Complete your Placement Profile and run the analysis.");
        }

        return data;
    }

    // ------------------------------------------------------------------
    // Aggregation helpers
    // ------------------------------------------------------------------

    /** Overall present/total percentage across the window; null when no records exist. */
    private Double averageAttendance(LocalDate start, LocalDate end) {
        long total = attendanceRepository.countByDateBetween(start, end);
        if (total == 0) return null;
        long present = attendanceRepository.countPresentBetween(start, end);
        return Math.round((present * 10000.0) / total) / 100.0;
    }

    /** Students whose real rolling-window attendance is below the threshold. */
    private long countStudentsBelowAttendance(double threshold, LocalDate start, LocalDate end) {
        return perStudentPercentages(
                attendanceRepository.findStudentPresentTotals(start, end)).stream()
                .filter(m -> ((Double) m.get("percentage")) < threshold)
                .count();
    }

    /** Named at-risk list (attendance below threshold over the rolling window) for the Monitoring view. */
    public List<Map<String, Object>> getAtRiskStudents(double threshold, int windowDays) {
        LocalDate end = LocalDate.now();
        LocalDate start = end.minusDays(windowDays);
        List<Map<String, Object>> rows = perStudentPercentages(
                attendanceRepository.findStudentPresentTotals(start, end));
        List<Map<String, Object>> out = new ArrayList<>();
        for (Map<String, Object> m : rows) {
            if (((Double) m.get("percentage")) >= threshold) continue;
            Long studentId = (Long) m.get("studentId");
            userRepository.findById(studentId).ifPresent(u -> {
                m.put("username", u.getUsername());
                m.put("department", u.getDepartment());
                m.put("year", u.getYear());
                m.put("classSection", u.getClassSection());
                out.add(m);
            });
        }
        out.sort((a, b) -> ((Double) a.get("percentage")).compareTo((Double) b.get("percentage")));
        return out;
    }

    private List<Map<String, Object>> perStudentPercentages(List<Object[]> rows) {
        List<Map<String, Object>> out = new ArrayList<>();
        for (Object[] row : rows) {
            Long studentId = (Long) row[0];
            long total = ((Number) row[1]).longValue();
            long present = row[2] == null ? 0 : ((Number) row[2]).longValue();
            double pct = Math.round((present * 10000.0) / total) / 100.0;
            Map<String, Object> m = new HashMap<>();
            m.put("studentId", studentId);
            m.put("percentage", pct);
            out.add(m);
        }
        return out;
    }

    private List<Map<String, Object>> attendanceBuckets(List<Map<String, Object>> percentages) {
        long b1 = percentages.stream().filter(m -> ((Double) m.get("percentage")) < 50).count();
        long b2 = percentages.stream().filter(m -> {
            double p = (Double) m.get("percentage");
            return p >= 50 && p < 75;
        }).count();
        long b3 = percentages.stream().filter(m -> {
            double p = (Double) m.get("percentage");
            return p >= 75 && p < 90;
        }).count();
        long b4 = percentages.stream().filter(m -> ((Double) m.get("percentage")) >= 90).count();
        return List.of(
                Map.of("name", "<50%", "value", b1),
                Map.of("name", "50-74%", "value", b2),
                Map.of("name", "75-89%", "value", b3),
                Map.of("name", "90%+", "value", b4));
    }

    private List<Map<String, Object>> readinessDistribution() {
        List<StudentResult> all = repository.findAll();
        long placed = all.stream()
                .filter(r -> r.getPrediction() != null && r.getPrediction().toLowerCase().contains("placed")
                        && !r.getPrediction().toLowerCase().contains("not"))
                .count();
        long notPlaced = all.stream()
                .filter(r -> r.getPrediction() != null && r.getPrediction().toLowerCase().contains("not"))
                .count();
        return List.of(
                Map.of("name", "Placement Ready", "value", placed),
                Map.of("name", "Needs Improvement", "value", notPlaced));
    }

    private List<Map<String, Object>> attendanceByDepartment(LocalDate start, LocalDate end) {
        List<Map<String, Object>> out = new ArrayList<>();
        for (Object[] row : attendanceRepository.findDepartmentPresentTotals(start, end)) {
            String dept = String.valueOf(row[0]);
            long total = ((Number) row[1]).longValue();
            long present = row[2] == null ? 0 : ((Number) row[2]).longValue();
            double pct = Math.round((present * 10000.0) / total) / 100.0;
            Map<String, Object> m = new HashMap<>();
            m.put("name", dept);
            m.put("value", pct);
            out.add(m);
        }
        return out;
    }

    private List<Map<String, Object>> assessmentAverages() {
        List<Map<String, Object>> out = new ArrayList<>();
        Map<Long, Assessment> cache = new HashMap<>();
        for (Object[] row : attemptRepository.findAverageScorePerAssessment()) {
            Long assessmentId = (Long) row[0];
            Double avgScore = row[1] == null ? null : ((Number) row[1]).doubleValue();
            if (avgScore == null) continue;
            Assessment a = cache.computeIfAbsent(assessmentId, id ->
                    assessmentRepository.findById(id).orElse(null));
            if (a == null) continue;
            Map<String, Object> m = new HashMap<>();
            m.put("name", a.getTitle());
            m.put("score", Math.round(avgScore * 10.0) / 10.0);
            out.add(m);
        }
        return out;
    }

    private List<Map<String, Object>> recentAttempts(int limit) {
        List<Map<String, Object>> out = new ArrayList<>();
        attemptRepository.findAll().stream()
                .filter(a -> a.getStartedAt() != null)
                .sorted((x, y) -> y.getStartedAt().compareTo(x.getStartedAt()))
                .limit(limit)
                .forEach(a -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("attemptId", a.getId());
                    m.put("studentId", a.getStudentId());
                    userRepository.findById(a.getStudentId()).ifPresent(u -> m.put("studentName", u.getUsername()));
                    studentProfileRepository.findByUserId(a.getStudentId())
                            .ifPresent(p -> m.put("registerNumber", p.getRegisterNumber()));
                    m.put("assessmentTitle", a.getAssessment() != null ? a.getAssessment().getTitle() : "-");
                    m.put("status", a.getStatus() != null ? a.getStatus().name() : "");
                    boolean finished = a.getStatus() == AttemptStatus.SUBMITTED
                            || a.getStatus() == AttemptStatus.EXPIRED || a.getStatus() == AttemptStatus.TERMINATED;
                    m.put("score", finished ? a.getCorrectCount() : null);
                    m.put("totalQuestions", a.getTotalQuestions());
                    m.put("violations", a.getViolationCount());
                    m.put("startedAt", a.getStartedAt().toString());
                    out.add(m);
                });
        return out;
    }
}
