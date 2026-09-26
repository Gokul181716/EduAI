package com.eduai.backend_java.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CareerRecommendationResponse {
    private CareerRoleMatch recommendedRole;
    private List<CareerRoleMatch> alternativeRoles;
    private List<SkillScore> skillAnalysis;
    private List<SkillGap> skillGaps;
    private List<PersonalizedRecommendation> recommendations;
    private List<LearningPathWeek> learningPath;
    private int totalAssessmentsAnalyzed;
    private int totalQuestionsAnalyzed;
}
