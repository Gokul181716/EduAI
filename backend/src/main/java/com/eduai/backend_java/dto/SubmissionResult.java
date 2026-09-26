package com.eduai.backend_java.dto;

import com.eduai.backend_java.models.AttemptStatus;

import java.time.LocalDateTime;

public record SubmissionResult(
        Long attemptId,
        AttemptStatus status,
        Double score,
        Double totalScore,
        Integer correctCount,
        Integer totalQuestions,
        double percentage,
        String grade,
        LocalDateTime submittedAt
) {}
