package com.eduai.backend_java.models;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapKeyColumn;
import jakarta.persistence.Table;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
@Entity
@Table(name = "questions")
public class Question {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String text;

    private String category;

    @Column(name = "question_type")
    private String type;

    @Column(name = "test_case_input", columnDefinition = "TEXT")
    private String testCaseInput;

    @Column(name = "expected_output", columnDefinition = "TEXT")
    private String expectedOutput;

    @ElementCollection
    @CollectionTable(name = "question_options", joinColumns = @JoinColumn(name = "question_id"))
    @Column(name = "option_text")
    private List<String> options;

    private String answer;

    @ElementCollection
    @CollectionTable(name = "question_starter_codes", joinColumns = @JoinColumn(name = "question_id"))
    @MapKeyColumn(name = "language")
    @Column(name = "code_snippet", columnDefinition = "TEXT")
    private Map<String, String> starterCode;

    /**
     * Hidden test cases used for automatic grading of CODING questions.
     * Students never see these; the visible sample shown in the test UI is
     * the testCaseInput/expectedOutput pair.
     */
    @Convert(converter = HiddenCasesConverter.class)
    @Column(name = "hidden_test_cases", columnDefinition = "TEXT")
    private List<QuestionTestCase> hiddenTestCases;

    @Data
    public static class QuestionTestCase {
        private String input;
        private String output;

        public QuestionTestCase() {}

        public QuestionTestCase(String input, String output) {
            this.input = input;
            this.output = output;
        }
    }
}
