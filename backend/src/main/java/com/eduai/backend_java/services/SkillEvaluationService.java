package com.eduai.backend_java.services;

import com.eduai.backend_java.config.CareerRoleConfig;
import com.eduai.backend_java.dto.SkillScore;
import com.eduai.backend_java.models.Assessment;
import com.eduai.backend_java.models.AssessmentAttempt;
import com.eduai.backend_java.models.AttemptStatus;
import com.eduai.backend_java.models.Question;
import com.eduai.backend_java.repositories.AssessmentAttemptRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SkillEvaluationService {

    private final AssessmentAttemptRepository attemptRepository;
    private final CareerRoleConfig careerRoleConfig;

    public record EvaluationResult(
            List<SkillScore> skillScores,
            int totalAssessmentsAnalyzed,
            int totalQuestionsAnalyzed
    ) {}

    public EvaluationResult evaluateStudentSkills(Long studentId) {
        List<AssessmentAttempt> attempts = attemptRepository
                .findByStudentIdOrderByStartedAtDesc(studentId);

        List<AssessmentAttempt> completedAttempts = attempts.stream()
                .filter(a -> a.getStatus() == AttemptStatus.SUBMITTED
                        || a.getStatus() == AttemptStatus.EXPIRED)
                .filter(a -> a.getScore() != null && a.getTotalScore() != null && a.getTotalScore() > 0)
                .collect(Collectors.toList());

        if (completedAttempts.isEmpty()) {
            return new EvaluationResult(List.of(), 0, 0);
        }

        double mcqWeight = careerRoleConfig.getWeights().getMcqContribution();
        double codingWeight = careerRoleConfig.getWeights().getCodingContribution();

        Map<String, double[]> mcqSkillBuckets = new LinkedHashMap<>();
        Map<String, double[]> codingSkillBuckets = new LinkedHashMap<>();

        int totalQuestionsAnalyzed = 0;

        for (AssessmentAttempt attempt : completedAttempts) {
            Assessment assessment = attempt.getAssessment();
            if (assessment == null || assessment.getQuestions() == null) continue;

            List<Question> questions = assessment.getQuestions();
            if (questions.isEmpty()) continue;

            int totalQ = attempt.getTotalQuestions() != null ? attempt.getTotalQuestions() : questions.size();
            if (totalQ == 0) continue;

            double scoreRatio = attempt.getScore() / (double) attempt.getTotalScore();

            Map<String, List<Question>> byCategory = questions.stream()
                    .filter(q -> q.getCategory() != null && !q.getCategory().isBlank())
                    .collect(Collectors.groupingBy(Question::getCategory));

            String assessmentType = assessment.getType();

            for (Map.Entry<String, List<Question>> entry : byCategory.entrySet()) {
                String category = entry.getKey();
                List<Question> catQuestions = entry.getValue();
                int catCount = catQuestions.size();

                double estimatedCorrect = scoreRatio * catCount;

                Map<String, double[]> targetBuckets = resolveTargetBuckets(
                        assessmentType, catQuestions, mcqWeight, codingWeight
                );

                for (Map.Entry<String, double[]> bucket : targetBuckets.entrySet()) {
                    Map<String, double[]> store = "MCQ".equals(bucket.getKey()) ? mcqSkillBuckets : codingSkillBuckets;
                    store.computeIfAbsent(category, k -> new double[]{0.0, 0.0});
                    double[] pair = store.get(category);

                    String bucketType = bucket.getKey();
                    if ("MCQ".equals(bucketType)) {
                        double mcqRatio = bucket.getValue()[0];
                        pair[0] += estimatedCorrect * mcqRatio;
                        pair[1] += catCount * mcqRatio;
                    } else {
                        double codingRatio = bucket.getValue()[0];
                        pair[0] += estimatedCorrect * codingRatio;
                        pair[1] += catCount * codingRatio;
                    }
                }

                totalQuestionsAnalyzed += catCount;
            }
        }

        Set<String> allSkills = new LinkedHashSet<>();
        allSkills.addAll(mcqSkillBuckets.keySet());
        allSkills.addAll(codingSkillBuckets.keySet());

        List<SkillScore> skillScores = new ArrayList<>();
        for (String skill : allSkills) {
            double[] mcq = mcqSkillBuckets.getOrDefault(skill, new double[]{0.0, 0.0});
            double[] coding = codingSkillBuckets.getOrDefault(skill, new double[]{0.0, 0.0});

            int mcqCorrect = (int) Math.round(mcq[0]);
            int mcqTotal = (int) Math.round(mcq[1]);
            int codingCorrect = (int) Math.round(coding[0]);
            int codingTotal = (int) Math.round(coding[1]);

            int combinedCorrect = mcqCorrect + codingCorrect;
            int combinedTotal = mcqTotal + codingTotal;

            if (combinedTotal == 0) continue;

            int score;
            if (mcqTotal > 0 && codingTotal > 0) {
                double mcqPct = (mcqCorrect / (double) mcqTotal) * 100;
                double codingPct = (codingCorrect / (double) codingTotal) * 100;
                score = (int) Math.round(mcqPct * mcqWeight + codingPct * codingWeight);
            } else if (mcqTotal > 0) {
                score = (int) Math.round((mcqCorrect / (double) mcqTotal) * 100);
            } else {
                score = (int) Math.round((codingCorrect / (double) codingTotal) * 100);
            }

            score = Math.max(0, Math.min(100, score));

            skillScores.add(SkillScore.builder()
                    .skill(skill)
                    .score(score)
                    .level(SkillScore.levelFromScore(score))
                    .mcqAttempts(mcqTotal)
                    .mcqCorrect(mcqCorrect)
                    .codingAttempts(codingTotal)
                    .codingCorrect(codingCorrect)
                    .build());
        }

        skillScores.sort(Comparator.comparingInt(SkillScore::getScore).reversed());

        return new EvaluationResult(skillScores, completedAttempts.size(), totalQuestionsAnalyzed);
    }

    private Map<String, double[]> resolveTargetBuckets(
            String assessmentType,
            List<Question> catQuestions,
            double mcqWeight,
            double codingWeight
    ) {
        Map<String, double[]> result = new LinkedHashMap<>();

        long mcqCount = catQuestions.stream()
                .filter(q -> "MCQ".equalsIgnoreCase(q.getType()))
                .count();
        long codingCount = catQuestions.size() - mcqCount;

        if ("MCQ".equalsIgnoreCase(assessmentType) || (mcqCount > 0 && codingCount == 0)) {
            result.put("MCQ", new double[]{1.0, (double) catQuestions.size()});
        } else if ("CODING".equalsIgnoreCase(assessmentType) || (codingCount > 0 && mcqCount == 0)) {
            result.put("CODING", new double[]{1.0, (double) catQuestions.size()});
        } else {
            if (mcqCount > 0) {
                double mcqRatio = mcqCount / (double) catQuestions.size();
                result.put("MCQ", new double[]{mcqRatio, (double) catQuestions.size()});
            }
            if (codingCount > 0) {
                double codingRatio = codingCount / (double) catQuestions.size();
                result.put("CODING", new double[]{codingRatio, (double) catQuestions.size()});
            }
        }

        return result;
    }
}
