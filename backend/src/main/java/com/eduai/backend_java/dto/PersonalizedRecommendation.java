package com.eduai.backend_java.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PersonalizedRecommendation {
    private String skill;
    private int currentScore;
    private int targetScore;
    private String priority;
    private String whatToLearn;
    private String practice;
    private String projectSuggestion;
    private String certificationCategory;
}
