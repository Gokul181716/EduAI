package com.eduai.backend_java.dto;

import com.eduai.backend_java.models.AttemptStatus;
import com.eduai.backend_java.models.ViolationType;

public record ViolationResponse(
        Long attemptId,
        ViolationType type,
        int totalViolations,
        int criticalViolations,
        int maxViolations,
        boolean terminated,
        AttemptStatus status,
        String message
) {
    public static ViolationResponse of(Long attemptId, ViolationType type, int total, int critical,
                                       int max, boolean terminated, AttemptStatus status) {
        String msg = terminated
                ? "Maximum violations exceeded. This attempt has been terminated."
                : "Violation recorded: " + type.name().replace('_', ' ').toLowerCase();
        return new ViolationResponse(attemptId, type, total, critical, max, terminated, status, msg);
    }
}
