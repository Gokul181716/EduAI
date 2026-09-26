package com.eduai.backend_java.controllers;

import com.eduai.backend_java.dto.CareerRecommendationResponse;
import com.eduai.backend_java.services.CareerRecommendationService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/career-recommendation")
@RequiredArgsConstructor
public class CareerRecommendationController {

    private final CareerRecommendationService careerRecommendationService;

    @GetMapping("/{studentId}")
    public ResponseEntity<?> getRecommendation(
            @PathVariable Long studentId,
            HttpSession session
    ) {
        Long sessionUserId = (Long) session.getAttribute("userId");
        String role = (String) session.getAttribute("role");

        if (sessionUserId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }

        if ("Student".equalsIgnoreCase(role) && !sessionUserId.equals(studentId)) {
            return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
        }

        CareerRecommendationService.RecommendationResult result =
                careerRecommendationService.getRecommendation(studentId);

        if (!result.success()) {
            return ResponseEntity.badRequest().body(Map.of("error", result.error()));
        }

        return ResponseEntity.ok(result.response());
    }
}
