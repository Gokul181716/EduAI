package com.eduai.backend_java.config;

import jakarta.annotation.PostConstruct;
import org.springframework.context.annotation.Configuration;

import java.util.*;

@Configuration
public class CareerRoleConfig {

    private final Map<String, CareerRole> roles = new LinkedHashMap<>();
    private final SkillThresholds thresholds = new SkillThresholds();
    private final Weights weights = new Weights();

    @PostConstruct
    public void init() {
        roles.put("Software Developer", new CareerRole(
                "Designs, develops, and maintains software applications using modern programming languages and frameworks.",
                List.of(
                        new SkillWeight("Data Structures", 0.25),
                        new SkillWeight("Algorithms", 0.20),
                        new SkillWeight("OOP", 0.20),
                        new SkillWeight("Programming", 0.15),
                        new SkillWeight("Database", 0.10),
                        new SkillWeight("Git", 0.10)
                ),
                List.of(
                        new SkillWeight("Web Development", 0.5),
                        new SkillWeight("Operating Systems", 0.5)
                )
        ));

        roles.put("Data Analyst", new CareerRole(
                "Analyzes complex datasets to derive actionable business insights using SQL, Python, and visualization tools.",
                List.of(
                        new SkillWeight("SQL", 0.25),
                        new SkillWeight("Python", 0.25),
                        new SkillWeight("Statistics", 0.20),
                        new SkillWeight("Data Visualization", 0.15),
                        new SkillWeight("Excel", 0.15)
                ),
                List.of(
                        new SkillWeight("Machine Learning", 0.4),
                        new SkillWeight("Database", 0.6)
                )
        ));

        roles.put("Data Scientist", new CareerRole(
                "Builds predictive models and applies machine learning to extract patterns and insights from large datasets.",
                List.of(
                        new SkillWeight("Python", 0.22),
                        new SkillWeight("Machine Learning", 0.22),
                        new SkillWeight("Statistics", 0.18),
                        new SkillWeight("SQL", 0.13),
                        new SkillWeight("Data Structures", 0.12),
                        new SkillWeight("Deep Learning", 0.13)
                ),
                List.of(
                        new SkillWeight("Algorithms", 0.4),
                        new SkillWeight("Data Visualization", 0.6)
                )
        ));

        roles.put("AI/ML Engineer", new CareerRole(
                "Designs and deploys machine learning models and AI systems at scale for real-world applications.",
                List.of(
                        new SkillWeight("Python", 0.22),
                        new SkillWeight("Machine Learning", 0.22),
                        new SkillWeight("Deep Learning", 0.18),
                        new SkillWeight("Statistics", 0.14),
                        new SkillWeight("Data Structures", 0.12),
                        new SkillWeight("Algorithms", 0.12)
                ),
                List.of(
                        new SkillWeight("SQL", 0.3),
                        new SkillWeight("OOP", 0.4),
                        new SkillWeight("Database", 0.3)
                )
        ));

        roles.put("Backend Developer", new CareerRole(
                "Builds and maintains server-side logic, APIs, and database integrations for web applications.",
                List.of(
                        new SkillWeight("Programming", 0.22),
                        new SkillWeight("Database", 0.22),
                        new SkillWeight("OOP", 0.18),
                        new SkillWeight("SQL", 0.15),
                        new SkillWeight("Data Structures", 0.12),
                        new SkillWeight("Web Development", 0.11)
                ),
                List.of(
                        new SkillWeight("Algorithms", 0.4),
                        new SkillWeight("Git", 0.6)
                )
        ));

        roles.put("Frontend Developer", new CareerRole(
                "Builds responsive, accessible user interfaces using modern web technologies and frameworks.",
                List.of(
                        new SkillWeight("Web Development", 0.28),
                        new SkillWeight("Programming", 0.22),
                        new SkillWeight("Data Structures", 0.15),
                        new SkillWeight("OOP", 0.15),
                        new SkillWeight("UI/UX Design", 0.20)
                ),
                List.of(
                        new SkillWeight("Database", 0.4),
                        new SkillWeight("Git", 0.6)
                )
        ));

        roles.put("Full Stack Developer", new CareerRole(
                "Works across the entire application stack, from frontend interfaces to backend services and databases.",
                List.of(
                        new SkillWeight("Web Development", 0.20),
                        new SkillWeight("Programming", 0.18),
                        new SkillWeight("Database", 0.16),
                        new SkillWeight("SQL", 0.12),
                        new SkillWeight("OOP", 0.14),
                        new SkillWeight("Data Structures", 0.10),
                        new SkillWeight("Git", 0.10)
                ),
                List.of(
                        new SkillWeight("Algorithms", 0.5),
                        new SkillWeight("UI/UX Design", 0.5)
                )
        ));

        roles.put("Cloud Engineer", new CareerRole(
                "Designs, deploys, and manages cloud infrastructure and services for scalable applications.",
                List.of(
                        new SkillWeight("Database", 0.20),
                        new SkillWeight("SQL", 0.18),
                        new SkillWeight("Programming", 0.18),
                        new SkillWeight("Operating Systems", 0.17),
                        new SkillWeight("Computer Networks", 0.14),
                        new SkillWeight("Web Development", 0.13)
                ),
                List.of(
                        new SkillWeight("OOP", 0.4),
                        new SkillWeight("Git", 0.6)
                )
        ));

        roles.put("Cybersecurity Analyst", new CareerRole(
                "Protects systems and networks from cyber threats through monitoring, analysis, and incident response.",
                List.of(
                        new SkillWeight("Computer Networks", 0.22),
                        new SkillWeight("Operating Systems", 0.20),
                        new SkillWeight("Database", 0.16),
                        new SkillWeight("SQL", 0.14),
                        new SkillWeight("Programming", 0.14),
                        new SkillWeight("Cryptography", 0.14)
                ),
                List.of(
                        new SkillWeight("OOP", 0.4),
                        new SkillWeight("Git", 0.6)
                )
        ));

        roles.put("Business Analyst", new CareerRole(
                "Bridges business needs and technology solutions through requirements analysis, data analysis, and process improvement.",
                List.of(
                        new SkillWeight("SQL", 0.22),
                        new SkillWeight("Data Visualization", 0.18),
                        new SkillWeight("Statistics", 0.16),
                        new SkillWeight("Excel", 0.16),
                        new SkillWeight("Web Development", 0.14),
                        new SkillWeight("Machine Learning", 0.14)
                ),
                List.of(
                        new SkillWeight("Python", 0.5),
                        new SkillWeight("Communication", 0.5)
                )
        ));
    }

    public Map<String, CareerRole> getRoles() { return roles; }
    public SkillThresholds getThresholds() { return thresholds; }
    public Weights getWeights() { return weights; }

    @lombok.Data
    public static class CareerRole {
        private String description;
        private List<SkillWeight> requiredSkills;
        private List<SkillWeight> preferredSkills;

        public CareerRole(String description, List<SkillWeight> requiredSkills, List<SkillWeight> preferredSkills) {
            this.description = description;
            this.requiredSkills = requiredSkills;
            this.preferredSkills = preferredSkills;
        }
    }

    @lombok.Data
    public static class SkillWeight {
        private String skill;
        private double weight;

        public SkillWeight(String skill, double weight) {
            this.skill = skill;
            this.weight = weight;
        }
    }

    @lombok.Data
    public static class SkillThresholds {
        private int strongMin = 85;
        private int goodMin = 70;
        private int developingMin = 50;

        private int gapHighPriorityMax = 49;
        private int gapMediumPriorityMax = 69;
        private int gapLowPriorityMax = 84;
    }

    @lombok.Data
    public static class Weights {
        private double mcqContribution = 0.40;
        private double codingContribution = 0.60;
    }
}
