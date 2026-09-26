package com.eduai.backend_java.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Configurable proctoring thresholds and recording storage settings.
 * Override via application.properties, e.g.:
 *   proctoring.max-violations=5
 *   proctoring.warning-threshold=1
 */
@Component
@ConfigurationProperties(prefix = "proctoring")
public class ProctoringProperties {

    /** Number of CRITICAL violations after which the attempt is terminated. */
    private int maxViolations = 5;

    /** Number of WARNING violations that trigger a visible warning dialog first. */
    private int warningThreshold = 1;

    /** Directory where encrypted-at-rest-by-filesystem-permissions recordings are stored (NOT inside webroot). */
    private String recordingDir = "uploads/proctoring";

    /** Maximum accepted recording size in MB. */
    private int maxRecordingMb = 200;

    public int getMaxViolations() { return maxViolations; }
    public void setMaxViolations(int maxViolations) { this.maxViolations = maxViolations; }

    public int getWarningThreshold() { return warningThreshold; }
    public void setWarningThreshold(int warningThreshold) { this.warningThreshold = warningThreshold; }

    public String getRecordingDir() { return recordingDir; }
    public void setRecordingDir(String recordingDir) { this.recordingDir = recordingDir; }

    public int getMaxRecordingMb() { return maxRecordingMb; }
    public void setMaxRecordingMb(int maxRecordingMb) { this.maxRecordingMb = maxRecordingMb; }
}
