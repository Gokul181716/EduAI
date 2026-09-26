package com.eduai.backend_java.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "assessment_attempts",
       uniqueConstraints = @UniqueConstraint(columnNames = {"assessment_id", "student_id"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssessmentAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assessment_id", nullable = false)
    private Assessment assessment;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private AttemptStatus status = AttemptStatus.NOT_STARTED;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @Column(name = "score")
    private Double score;

    @Column(name = "total_score")
    private Double totalScore;

    @Column(name = "correct_count")
    private Integer correctCount;

    @Column(name = "total_questions")
    private Integer totalQuestions;

    @Column(name = "violation_count", nullable = false)
    @Builder.Default
    private Integer violationCount = 0;

    @Column(name = "warning_count", nullable = false)
    @Builder.Default
    private Integer warningCount = 0;

    @Column(name = "terminated_reason", length = 500)
    private String terminatedReason;

    // --- Screen recording metadata (file stored outside webroot, streamed via authorized endpoint) ---
    @Column(name = "recording_filename", length = 500)
    private String recordingFilename;

    @Column(name = "recording_size_bytes")
    private Long recordingSizeBytes;

    @Column(name = "recording_duration_seconds")
    private Long recordingDurationSeconds;

    @Column(name = "recording_uploaded_at")
    private LocalDateTime recordingUploadedAt;

    // --- Webcam recording metadata ---
    @Column(name = "webcam_filename", length = 500)
    private String webcamFilename;

    @Column(name = "webcam_size_bytes")
    private Long webcamSizeBytes;

    @Column(name = "webcam_duration_seconds")
    private Long webcamDurationSeconds;

    @Column(name = "webcam_uploaded_at")
    private LocalDateTime webcamUploadedAt;

    /**
     * Remaining seconds based on server clock. Negative if the deadline passed.
     */
    @Transient
    public long computeRemainingSeconds() {
        if (startedAt == null) {
            return assessment != null && assessment.getDurationMinutes() != null
                    ? assessment.getDurationMinutes() * 60L : 0L;
        }
        long elapsed = java.time.Duration.between(startedAt, LocalDateTime.now()).getSeconds();
        long total = assessment != null && assessment.getDurationMinutes() != null
                ? assessment.getDurationMinutes() * 60L : 0L;
        return total - elapsed;
    }
}
