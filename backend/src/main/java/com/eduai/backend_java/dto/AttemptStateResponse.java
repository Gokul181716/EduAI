package com.eduai.backend_java.dto;

import com.eduai.backend_java.models.AttemptStatus;

import java.time.LocalDateTime;

/**
 * Server-authoritative state of a test attempt. The timer is derived from
 * startedAt on the server clock — never trusted from the client.
 */
public record AttemptStateResponse(
        Long attemptId,
        Long assessmentId,
        String assessmentTitle,
        Integer durationMinutes,
        AttemptStatus status,
        LocalDateTime startedAt,
        LocalDateTime submittedAt,
        long remainingSeconds,
        int violationCount,
        int maxViolations,
        int warningThreshold,
        boolean recordingActive,
        boolean webcamActive,
        Double score,
        Double totalScore,
        Integer correctCount,
        Integer totalQuestions,
        String terminatedReason
) {}
