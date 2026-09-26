package com.eduai.backend_java.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SkillScore {
    private String skill;
    private int score;
    private String level;
    private int mcqAttempts;
    private int mcqCorrect;
    private int codingAttempts;
    private int codingCorrect;

    public static String levelFromScore(int score) {
        if (score >= 85) return "Strong";
        if (score >= 70) return "Good";
        if (score >= 50) return "Developing";
        return "Weak";
    }
}
