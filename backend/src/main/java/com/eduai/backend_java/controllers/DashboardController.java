package com.eduai.backend_java.controllers;

import com.eduai.backend_java.services.DashboardService;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class DashboardController {

    @Autowired
    private DashboardService dashboardService;

    @GetMapping("/admin")
    public ResponseEntity<?> getAdminDashboard(HttpSession session) {
        Object role = session != null ? session.getAttribute("role") : null;
        if (!"ADMIN".equalsIgnoreCase(String.valueOf(role))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Admin access required."));
        }
        return ResponseEntity.ok(dashboardService.getAdminDashboardData());
    }

    @GetMapping("/teacher")
    public ResponseEntity<?> getTeacherDashboard(HttpSession session) {
        Object role = session != null ? session.getAttribute("role") : null;
        String r = String.valueOf(role);
        if (!"TEACHER".equalsIgnoreCase(r) && !"ADMIN".equalsIgnoreCase(r)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Teacher access required."));
        }
        Long userId = extractUserId(session);
        return ResponseEntity.ok(dashboardService.getTeacherDashboardData(userId));
    }

    @GetMapping("/teacher/at-risk")
    public ResponseEntity<?> getTeacherAtRisk(@RequestParam(defaultValue = "75") double threshold,
                                              HttpSession session) {
        Object role = session != null ? session.getAttribute("role") : null;
        String r = String.valueOf(role);
        if (!"TEACHER".equalsIgnoreCase(r) && !"ADMIN".equalsIgnoreCase(r)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Teacher access required."));
        }
        return ResponseEntity.ok(dashboardService.getAtRiskStudents(threshold, 30));
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<?> getStudentDashboard(@PathVariable String studentId, HttpSession session) {
        Object role = session != null ? session.getAttribute("role") : null;
        if (role == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Please log in."));
        }
        return ResponseEntity.ok(dashboardService.getStudentDashboardData(studentId));
    }

    private Long extractUserId(HttpSession session) {
        Object uid = session != null ? session.getAttribute("userId") : null;
        if (uid instanceof Long l) return l;
        if (uid instanceof Integer i) return i.longValue();
        return null;
    }
}
