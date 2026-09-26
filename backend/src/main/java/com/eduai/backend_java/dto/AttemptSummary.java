package com.eduai.backend_java.dto;

import com.eduai.backend_java.models.AttemptStatus;

import java.time.LocalDateTime;

/**
 * Row shown to teachers/admins reviewing attempts for an assessment.
 * Contains no recording URL by design — recordings are streamed through
 * an authorized endpoint only.
 */
public record AttemptSummary(
        Long id,
        Long assessmentId,
        String assessmentTitle,
        String assessmentCategory,
        Long studentId,
        String studentName,
        String registerNumber,
        AttemptStatus status,
        LocalDateTime startedAt,
        LocalDateTime submittedAt,
        Long actualDurationSeconds,
        Double score,
        Double totalScore,
        Integer correctCount,
        Integer totalQuestions,
        Integer violationCount,
        boolean hasRecording,
        boolean hasWebcam
) {}
