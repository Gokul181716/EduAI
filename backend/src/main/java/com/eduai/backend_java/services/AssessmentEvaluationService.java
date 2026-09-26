package com.eduai.backend_java.services;

import com.eduai.backend_java.models.Assessment;
import com.eduai.backend_java.models.Question;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Real answer evaluation for assessments.
 * - MCQ: exact match after trim / case-insensitive comparison against the stored answer key.
 * - CODING: executes the submitted code (via CodeExecutionService) against the visible
 *   sample case plus every hidden test case; all must pass for the question to score.
 *   When the student's language is unknown, falls back to the legacy normalized
 *   textual comparison against expectedOutput.
 */
@Service
public class AssessmentEvaluationService {

    public record EvaluationResult(int correctCount, int totalGraded) {}

    private final CodeExecutionService codeExecutionService;

    @Autowired
    public AssessmentEvaluationService(CodeExecutionService codeExecutionService) {
        this.codeExecutionService = codeExecutionService;
    }

    private static String normalize(String s) {
        if (s == null) return "";
        return s.trim()
                .replaceAll("\\r\\n", "\n")
                .replaceAll("[ \\t]+", " ")
                .replaceAll("\\s*\\n\\s*", "\n")
                .toLowerCase();
    }

    public EvaluationResult evaluate(Assessment assessment, Map<String, String> answers) {
        return evaluate(assessment, answers, null);
    }

    public EvaluationResult evaluate(Assessment assessment,
                                     Map<String, String> answers,
                                     Map<String, String> languages) {
        int correct = 0;
        int graded = 0;

        for (Question q : assessment.getQuestions()) {
            boolean isMcq = "MCQ".equalsIgnoreCase(q.getType());
            String studentAns = answers != null ? answers.get(String.valueOf(q.getId())) : null;

            if (isMcq) {
                String expected = q.getAnswer();
                if (expected == null || expected.trim().isEmpty()) continue;
                graded++;
                if (studentAns == null) continue;
                String trimmed = studentAns.trim();
                // Direct letter match (e.g. "A")
                if (trimmed.equalsIgnoreCase(expected.trim())) {
                    correct++;
                    continue;
                }
                // Option text match: find the index of the selected option
                // and compare the corresponding letter (A=0, B=1, C=2, D=3)
                List<String> opts = q.getOptions();
                if (opts != null) {
                    for (int i = 0; i < opts.size(); i++) {
                        if (trimmed.equalsIgnoreCase(opts.get(i).trim())) {
                            String letterFromIndex = String.valueOf((char) ('A' + i));
                            if (letterFromIndex.equalsIgnoreCase(expected.trim())) {
                                correct++;
                            }
                            break;
                        }
                    }
                }
                continue;
            }

            // ---- CODING ----
            boolean hasSample = q.getExpectedOutput() != null && !q.getExpectedOutput().trim().isEmpty();
            List<Question.QuestionTestCase> cases = new ArrayList<>();
            if (hasSample) {
                cases.add(new Question.QuestionTestCase(q.getTestCaseInput(), q.getExpectedOutput()));
            }
            if (q.getHiddenTestCases() != null) {
                cases.addAll(q.getHiddenTestCases());
            }

            if (cases.isEmpty()) {
                // Nothing to grade against — excluded so scores are never fabricated.
                continue;
            }
            graded++;

            if (studentAns == null || studentAns.trim().isEmpty()) {
                continue;
            }

            String language = languages != null ? languages.get(String.valueOf(q.getId())) : null;
            if (language == null || language.isBlank()) {
                // Legacy fallback: textual comparison against the sample output.
                if (normalize(studentAns).equals(normalize(q.getExpectedOutput()))) {
                    correct++;
                }
                continue;
            }

            boolean allPassed = true;
            for (Question.QuestionTestCase tc : cases) {
                CodeExecutionService.RunResult run =
                        codeExecutionService.run(language, studentAns, tc.getInput());
                if (run.error() != null || run.timedOut()) {
                    allPassed = false;
                    break;
                }
                String actual = run.stdout() == null ? "" : run.stdout().trim();
                String expected = tc.getOutput() == null ? "" : tc.getOutput().trim();
                if (!actual.equalsIgnoreCase(expected)) {
                    allPassed = false;
                    break;
                }
            }
            if (allPassed) {
                correct++;
            }
        }
        return new EvaluationResult(correct, graded);
    }

    public double percentage(int correctCount, int totalGraded) {
        return totalGraded > 0 ? Math.round(((double) correctCount / totalGraded) * 1000.0) / 10.0 : 0.0;
    }
}
