package com.eduai.backend_java.services;

import com.eduai.backend_java.config.CareerRoleConfig;
import com.eduai.backend_java.dto.*;
import com.eduai.backend_java.models.User;
import com.eduai.backend_java.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CareerRecommendationService {

    private final SkillEvaluationService skillEvaluationService;
    private final CareerRoleConfig careerRoleConfig;
    private final UserRepository userRepository;

    public record RecommendationResult(boolean success, String error, CareerRecommendationResponse response) {}

    public RecommendationResult getRecommendation(Long studentId) {
        Optional<User> userOpt = userRepository.findById(studentId);
        if (userOpt.isEmpty()) {
            return new RecommendationResult(false, "Student not found with ID: " + studentId, null);
        }

        User user = userOpt.get();
        if (!"Student".equalsIgnoreCase(user.getRole())) {
            return new RecommendationResult(false, "User is not a student", null);
        }

        SkillEvaluationService.EvaluationResult evalResult =
                skillEvaluationService.evaluateStudentSkills(studentId);

        if (evalResult.skillScores().isEmpty()) {
            return new RecommendationResult(false,
                    "No assessment data found. Complete at least one MCQ or coding assessment to receive career recommendations.",
                    null);
        }

        Map<String, Integer> skillScoreMap = evalResult.skillScores().stream()
                .collect(Collectors.toMap(SkillScore::getSkill, SkillScore::getScore, (a, b) -> Math.max(a, b)));

        List<CareerRoleMatch> allRoleMatches = new ArrayList<>();
        for (Map.Entry<String, CareerRoleConfig.CareerRole> entry : careerRoleConfig.getRoles().entrySet()) {
            CareerRoleMatch match = calculateRoleMatch(
                    entry.getKey(), entry.getValue(), skillScoreMap);
            allRoleMatches.add(match);
        }

        allRoleMatches.sort(Comparator.comparingInt(CareerRoleMatch::getMatchScore).reversed());

        CareerRoleMatch recommended = allRoleMatches.isEmpty() ? null : allRoleMatches.get(0);
        List<CareerRoleMatch> alternatives = allRoleMatches.size() > 1
                ? allRoleMatches.subList(1, Math.min(5, allRoleMatches.size()))
                : List.of();

        List<SkillGap> skillGaps = List.of();
        List<PersonalizedRecommendation> recommendations = List.of();
        List<LearningPathWeek> learningPath = List.of();

        if (recommended != null) {
            skillGaps = analyzeSkillGaps(recommended.getName(), skillScoreMap);
            recommendations = generateRecommendations(skillGaps);
            learningPath = buildLearningPath(skillGaps, evalResult.skillScores());
        }

        CareerRecommendationResponse response = CareerRecommendationResponse.builder()
                .recommendedRole(recommended)
                .alternativeRoles(alternatives)
                .skillAnalysis(evalResult.skillScores())
                .skillGaps(skillGaps)
                .recommendations(recommendations)
                .learningPath(learningPath)
                .totalAssessmentsAnalyzed(evalResult.totalAssessmentsAnalyzed())
                .totalQuestionsAnalyzed(evalResult.totalQuestionsAnalyzed())
                .build();

        return new RecommendationResult(true, null, response);
    }

    private CareerRoleMatch calculateRoleMatch(
            String roleName,
            CareerRoleConfig.CareerRole role,
            Map<String, Integer> studentScores
    ) {
        double totalWeightedScore = 0;
        double totalWeight = 0;
        List<String> reasons = new ArrayList<>();

        for (CareerRoleConfig.SkillWeight sw : role.getRequiredSkills()) {
            Integer score = studentScores.get(sw.getSkill());
            double skillScore = score != null ? score : 0.0;

            totalWeightedScore += skillScore * sw.getWeight();
            totalWeight += sw.getWeight();

            if (score != null) {
                if (score >= 85) {
                    reasons.add("Strong " + sw.getSkill() + " performance (" + score + "%)");
                } else if (score >= 70) {
                    reasons.add("Good " + sw.getSkill() + " performance (" + score + "%)");
                } else if (score >= 50) {
                    reasons.add("Developing " + sw.getSkill() + " skills (" + score + "%)");
                } else {
                    reasons.add("Needs improvement in " + sw.getSkill() + " (" + score + "%)");
                }
            } else {
                reasons.add(sw.getSkill() + " not yet assessed");
            }
        }

        if (role.getPreferredSkills() != null) {
            for (CareerRoleConfig.SkillWeight sw : role.getPreferredSkills()) {
                Integer score = studentScores.get(sw.getSkill());
                if (score != null) {
                    totalWeightedScore += score * sw.getWeight();
                    totalWeight += sw.getWeight();
                }
            }
        }

        int matchScore = totalWeight > 0 ? (int) Math.round(totalWeightedScore / totalWeight) : 0;
        matchScore = Math.max(0, Math.min(100, matchScore));

        reasons.sort((a, b) -> {
            boolean aStrong = a.startsWith("Strong");
            boolean bStrong = b.startsWith("Strong");
            if (aStrong != bStrong) return aStrong ? -1 : 1;
            boolean aGood = a.startsWith("Good");
            boolean bGood = b.startsWith("Good");
            if (aGood != bGood) return aGood ? -1 : 1;
            return 0;
        });

        return CareerRoleMatch.builder()
                .name(roleName)
                .description(role.getDescription())
                .matchScore(matchScore)
                .reason(reasons)
                .build();
    }

    private List<SkillGap> analyzeSkillGaps(String roleName, Map<String, Integer> studentScores) {
        CareerRoleConfig.CareerRole role = careerRoleConfig.getRoles().get(roleName);
        if (role == null) return List.of();

        CareerRoleConfig.SkillThresholds thresholds = careerRoleConfig.getThresholds();
        List<SkillGap> gaps = new ArrayList<>();

        for (CareerRoleConfig.SkillWeight sw : role.getRequiredSkills()) {
            Integer score = studentScores.get(sw.getSkill());

            int currentScore;
            String status;
            if (score != null) {
                currentScore = score;
                status = "Assessed";
            } else {
                currentScore = -1;
                status = "Not Assessed";
            }

            int targetScore = thresholds.getStrongMin();
            String priority;
            if (score == null) {
                priority = "High";
            } else if (score <= thresholds.getGapHighPriorityMax()) {
                priority = "High";
            } else if (score <= thresholds.getGapMediumPriorityMax()) {
                priority = "Medium";
            } else if (score <= thresholds.getGapLowPriorityMax()) {
                priority = "Low";
            } else {
                priority = "No Gap";
            }

            gaps.add(SkillGap.builder()
                    .skill(sw.getSkill())
                    .currentScore(currentScore)
                    .targetScore(targetScore)
                    .priority(priority)
                    .status(status)
                    .build());
        }

        gaps.sort(Comparator
                .comparing((SkillGap g) -> {
                    switch (g.getPriority()) {
                        case "High": return 0;
                        case "Medium": return 1;
                        case "Low": return 2;
                        default: return 3;
                    }
                })
                .thenComparing(Comparator.comparingInt(SkillGap::getCurrentScore)));

        return gaps;
    }

    private List<PersonalizedRecommendation> generateRecommendations(List<SkillGap> skillGaps) {
        List<PersonalizedRecommendation> recs = new ArrayList<>();

        for (SkillGap gap : skillGaps) {
            if ("No Gap".equals(gap.getPriority())) continue;

            String whatToLearn = getWhatToLearn(gap.getSkill());
            String practice = getPracticeSuggestion(gap.getSkill());
            String project = getProjectSuggestion(gap.getSkill());
            String cert = getCertificationCategory(gap.getSkill());

            recs.add(PersonalizedRecommendation.builder()
                    .skill(gap.getSkill())
                    .currentScore(gap.getCurrentScore())
                    .targetScore(gap.getTargetScore())
                    .priority(gap.getPriority())
                    .whatToLearn(whatToLearn)
                    .practice(practice)
                    .projectSuggestion(project)
                    .certificationCategory(cert)
                    .build());
        }

        return recs;
    }

    private String getWhatToLearn(String skill) {
        return switch (skill.toLowerCase()) {
            case "python" -> "Focus on advanced Python concepts: decorators, generators, context managers, async/await, and common libraries like NumPy, Pandas, and requests.";
            case "sql" -> "Master SQL joins (INNER, LEFT, RIGHT, FULL), subqueries, aggregate functions (GROUP BY, HAVING), window functions, and query optimization techniques.";
            case "data structures" -> "Study arrays, linked lists, stacks, queues, trees (BST, AVL), heaps, hash maps, and graphs. Understand time and space complexity (Big-O).";
            case "algorithms" -> "Learn sorting (quicksort, mergesort), searching (binary search), graph algorithms (BFS, DFS, Dijkstra), dynamic programming, and greedy algorithms.";
            case "oop" -> "Deepen understanding of encapsulation, inheritance, polymorphism, and abstraction. Practice SOLID principles and design patterns.";
            case "machine learning" -> "Study supervised learning (regression, classification), unsupervised learning (clustering, dimensionality reduction), model evaluation, and scikit-learn usage.";
            case "deep learning" -> "Learn neural network fundamentals, backpropagation, CNNs, RNNs, transformers, and frameworks like TensorFlow or PyTorch.";
            case "statistics" -> "Study probability distributions, hypothesis testing, confidence intervals, regression analysis, Bayesian thinking, and statistical significance.";
            case "database" -> "Learn database design, normalization (1NF-3NF), indexing, transactions, ACID properties, and NoSQL concepts.";
            case "web development" -> "Master HTML/CSS/JavaScript fundamentals, RESTful APIs, HTTP protocols, frontend frameworks (React/Angular), and backend frameworks (Node.js/Spring/Django).";
            case "computer networks" -> "Study OSI model, TCP/IP, HTTP/HTTPS, DNS, routing, subnetting, firewalls, and network security fundamentals.";
            case "data visualization" -> "Learn chart types and when to use them, tools like Matplotlib, Seaborn, Tableau, or Power BI, and principles of effective data storytelling.";
            case "excel" -> "Master formulas (VLOOKUP, INDEX-MATCH), pivot tables, data validation, conditional formatting, macros, and advanced data analysis.";
            case "operating systems" -> "Study process management, memory management, file systems, CPU scheduling, deadlocks, virtual memory, and Linux command line.";
            case "programming" -> "Strengthen fundamentals: variables, control flow, functions, error handling, I/O operations, and file handling in your primary language.";
            case "git" -> "Learn branching strategies, merge vs rebase, pull requests, conflict resolution, and collaborative workflows using Git.";
            case "ui/ux design" -> "Study user-centered design principles, wireframing, prototyping, accessibility (WCAG), and usability testing.";
            case "cryptography" -> "Learn symmetric/asymmetric encryption, hashing, digital signatures, TLS/SSL, and common vulnerabilities.";
            case "communication" -> "Practice technical writing, presentation skills, requirements gathering, stakeholder communication, and documentation.";
            default -> "Focus on strengthening fundamentals in " + skill + " through structured learning and hands-on practice.";
        };
    }

    private String getPracticeSuggestion(String skill) {
        return switch (skill.toLowerCase()) {
            case "python" -> "Solve 25+ problems on LeetCode/HackerRank using Python. Implement data structures from scratch. Build a CLI tool or web scraper.";
            case "sql" -> "Solve 20+ SQL problems covering joins, GROUP BY, subqueries, and window functions on platforms like StrataScratch or LeetCode SQL.";
            case "data structures" -> "Implement each data structure from scratch. Solve 30+ array/string/tree problems on LeetCode focusing on pattern recognition.";
            case "algorithms" -> "Solve 25+ algorithmic problems covering sorting, searching, graph traversal, and dynamic programming on LeetCode or Codeforces.";
            case "oop" -> "Build a small project applying all four OOP pillars. Refactor existing code to follow SOLID principles. Implement 3 design patterns.";
            case "machine learning" -> "Complete 5 Kaggle competitions or guided projects. Build end-to-end ML pipelines with train/test splits, cross-validation, and hyperparameter tuning.";
            case "deep learning" -> "Build and train a CNN image classifier and an RNN text classifier from scratch. Experiment with transfer learning on pre-trained models.";
            case "statistics" -> "Work through 15+ practice problems on hypothesis testing, confidence intervals, and regression. Apply statistical methods to real datasets.";
            case "database" -> "Design a normalized database schema for a real-world application. Write complex queries with joins, subqueries, and window functions.";
            case "web development" -> "Build 3 full-stack projects: a CRUD app, a real-time chat application, and a REST API with authentication.";
            case "computer networks" -> "Set up a local network, configure firewalls, analyze traffic with Wireshark, and build a simple client-server application.";
            case "data visualization" -> "Create 5 different types of visualizations using real datasets. Build an interactive dashboard using Plotly or Streamlit.";
            case "excel" -> "Analyze a real business dataset using pivot tables, VLOOKUP, and charts. Create a dynamic dashboard with slicers.";
            case "operating systems" -> "Write a simple shell script for task automation. Practice Linux command line. Implement a basic process scheduler simulation.";
            case "programming" -> "Solve 20+ basic coding problems. Build a simple application that demonstrates proper error handling and file I/O.";
            case "git" -> "Contribute to an open-source project on GitHub. Practice branching, merging, and resolving conflicts in a team workflow.";
            case "ui/ux design" -> "Redesign an existing app's interface. Create wireframes and prototypes. Conduct usability testing with 3-5 users.";
            case "cryptography" -> "Implement basic encryption/decryption algorithms. Study and analyze common security vulnerabilities in web applications.";
            case "communication" -> "Write technical documentation for a project. Prepare and deliver a 10-minute technical presentation. Practice requirements gathering.";
            default -> "Complete 15+ practice problems and build 1-2 projects demonstrating competency in " + skill + ".";
        };
    }

    private String getProjectSuggestion(String skill) {
        return switch (skill.toLowerCase()) {
            case "python" -> "Build a Task Management CLI with CRUD operations, data persistence (JSON/SQLite), and a clean command-line interface.";
            case "sql" -> "Build a Student Placement Analytics Dashboard using SQL queries to analyze assessment scores, attendance patterns, and placement predictions.";
            case "data structures" -> "Implement a library management system using custom hash maps, trees, and sorting algorithms with full CRUD operations.";
            case "algorithms" -> "Build a route planner using graph algorithms (Dijkstra/A*) to find optimal paths between locations on a map.";
            case "oop" -> "Design and build a hotel management system demonstrating inheritance, polymorphism, encapsulation, and common design patterns.";
            case "machine learning" -> "Build a student performance predictor using real assessment data. Compare multiple ML algorithms and tune hyperparameters.";
            case "deep learning" -> "Build an image classification system for handwritten digits (MNIST) and extend it with data augmentation and transfer learning.";
            case "statistics" -> "Analyze student placement data using statistical methods: hypothesis testing for placement factors, regression analysis for readiness scores.";
            case "database" -> "Design and implement a complete university database system with normalized schemas, stored procedures, and complex queries.";
            case "web development" -> "Build a full-stack quiz platform with user authentication, timed assessments, result tracking, and an analytics dashboard.";
            case "computer networks" -> "Build a simple chat application using socket programming with support for multiple concurrent clients.";
            case "data visualization" -> "Create an interactive placement analytics dashboard showing trends, distributions, and comparisons across departments.";
            case "excel" -> "Build a comprehensive student tracking spreadsheet with automated grading, attendance summary, and placement readiness indicators.";
            case "operating systems" -> "Build a CPU scheduling simulator that compares FCFS, SJF, Round Robin, and priority scheduling algorithms.";
            case "programming" -> "Build a personal finance tracker with file-based data storage, input validation, and formatted report generation.";
            case "git" -> "Create a well-documented open-source project with proper README, CONTRIBUTING guide, issues, and pull request workflow.";
            case "ui/ux design" -> "Design and prototype a mobile app for course registration with intuitive navigation and accessibility features.";
            case "cryptography" -> "Build a secure messaging application implementing end-to-end encryption with key exchange protocols.";
            case "communication" -> "Create a technical blog or wiki documenting project architectures, API designs, and troubleshooting guides.";
            default -> "Build a project that demonstrates practical application of " + skill + " in a real-world scenario.";
        };
    }

    private String getCertificationCategory(String skill) {
        return switch (skill.toLowerCase()) {
            case "python" -> "Python Professional Certification (PCEP/PCAP)";
            case "sql" -> "Database SQL Certification (Oracle/MySQL)";
            case "data structures" -> "Data Structures and Algorithms Specialization";
            case "algorithms" -> "Algorithms Specialization (Stanford/Coursera)";
            case "oop" -> "Object-Oriented Design and Patterns";
            case "machine learning" -> "Machine Learning Specialization (Stanford/Coursera)";
            case "deep learning" -> "Deep Learning Specialization (DeepLearning.AI)";
            case "statistics" -> "Statistics with Python Specialization (Michigan/Coursera)";
            case "database" -> "Database Systems Certification";
            case "web development" -> "Full Stack Web Development Specialization";
            case "computer networks" -> "Networking Fundamentals (Cisco CCNA)";
            case "data visualization" -> "Data Visualization Certification (Tableau/Power BI)";
            case "excel" -> "Microsoft Excel Expert Certification (MOS)";
            case "operating systems" -> "Linux System Administration Certification";
            case "programming" -> "Programming Foundations Specialization";
            case "git" -> "Git and GitHub Specialization";
            case "ui/ux design" -> "UX Design Specialization (Google/Coursera)";
            case "cryptography" -> "Cryptography and Network Security";
            case "communication" -> "Business Communication and Technical Writing";
            default -> "Professional Development in " + skill;
        };
    }

    // ------------------------------------------------------------------
    // Week-by-week learning path
    // ------------------------------------------------------------------

    private static final String[] PHASES = {"Foundations", "Core Concepts", "Application & Mastery"};

    /**
     * Builds a week-by-week learning path from every weak skill area.
     * Combines gaps for the recommended role with any OTHER assessed skill that is
     * still below the "strong" threshold, so students always see a real plan even
     * when their recommended role is already a good fit.
     */
    public List<LearningPathWeek> buildLearningPath(List<SkillGap> roleGaps, List<SkillScore> allSkillScores) {
        CareerRoleConfig.SkillThresholds t = careerRoleConfig.getThresholds();

        List<String[]> weakSkills = new ArrayList<>(); // {skill, priority}
        Map<String, Integer> scoreBySkill = new HashMap<>();

        for (SkillScore ss : allSkillScores) {
            scoreBySkill.put(ss.getSkill(), ss.getScore());
        }

        for (SkillGap gap : roleGaps) {
            if ("No Gap".equals(gap.getPriority())) continue;
            String skill = gap.getSkill();
            if (!containsSkill(weakSkills, skill)) {
                weakSkills.add(new String[]{skill, gap.getPriority()});
            }
        }

        for (SkillScore ss : allSkillScores) {
            if (ss.getScore() >= t.getStrongMin()) continue;
            String skill = ss.getSkill();
            if (containsSkill(weakSkills, skill)) continue;
            String priority;
            if (ss.getScore() <= t.getGapHighPriorityMax()) priority = "High";
            else if (ss.getScore() <= t.getGapMediumPriorityMax()) priority = "Medium";
            else priority = "Low";
            weakSkills.add(new String[]{skill, priority});
        }

        // Weakest skill (lowest score) comes first so Week 1 addresses the biggest gap.
        weakSkills.sort(Comparator.<String[]>comparingInt(a -> {
                    int p;
                    switch (a[1]) {
                        case "High": p = 0; break;
                        case "Medium": p = 1; break;
                        default: p = 2;
                    }
                    return p;
                })
                .thenComparingInt(a -> scoreBySkill.getOrDefault(a[0], -1)));

        List<LearningPathWeek> path = new ArrayList<>();
        int weekNumber = 1;

        for (String[] weak : weakSkills) {
            String skill = weak[0];
            String priority = weak[1];
            int currentScore = scoreBySkill.getOrDefault(skill, -1);
            int totalWeeks = switch (priority) {
                case "High" -> 3;
                case "Medium" -> 2;
                default -> 1;
            };

            List<String> topics = getSkillTopics(skill);
            int perWeek = Math.max(1, (int) Math.ceil(topics.size() / (double) totalWeeks));

            for (int w = 0; w < totalWeeks; w++) {
                String phase = PHASES[Math.min(w, PHASES.length - 1)];
                int from = w * perWeek;
                int to = Math.min(topics.size(), (w + 1) * perWeek);
                List<String> weekTopics = new ArrayList<>(topics.subList(from, to));
                if (weekTopics.isEmpty() && !topics.isEmpty()) {
                    weekTopics.add(topics.get(topics.size() - 1));
                }

                int base = currentScore >= 0 ? currentScore : 0;
                int targetScore = switch (phase) {
                    case "Core Concepts" -> Math.min(85, Math.max(65, base + 35));
                    case "Application & Mastery" -> 85;
                    default -> Math.min(85, Math.max(50, base + 20));
                };

                String goal = currentScore < 0
                        ? (w == 0
                                ? "Build a solid " + skill + " foundation from scratch and aim for " + targetScore + "%."
                                : "Keep building " + skill + " skills, reach " + targetScore + "%, and apply them in practice.")
                        : (w == 0
                                ? "Build a solid " + skill + " foundation and reach at least " + targetScore + "% proficiency."
                                : w == 1
                                        ? "Deepen your " + skill + " core concepts and reach " + targetScore + "%."
                                        : "Apply " + skill + " confidently in real projects and hit the " + targetScore + "% target.");

                String practice = w == 0
                        ? getPracticeSuggestion(skill)
                        : "Complete 8–10 targeted problems covering this week's topics and document your learnings.";

                path.add(LearningPathWeek.builder()
                        .weekNumber(weekNumber++)
                        .skill(skill)
                        .phase(phase)
                        .goal(goal)
                        .topics(weekTopics)
                        .practice(practice)
                        .build());
            }
        }
        return path;
    }

    private boolean containsSkill(List<String[]> list, String skill) {
        for (String[] entry : list) {
            if (entry[0].equals(skill)) return true;
        }
        return false;
    }

    private List<String> getSkillTopics(String skill) {
        return switch (skill.toLowerCase()) {
            case "python" -> List.of(
                "Python syntax & data types",
                "Control flow: loops & conditionals",
                "Functions & scope",
                "Lists, tuples, dictionaries, sets",
                "String manipulation & methods",
                "File handling & exceptions",
                "OOP in Python (classes, inheritance)",
                "Decorators & generators",
                "List comprehensions & iterators",
                "Key libraries: NumPy, Pandas, requests"
            );
            case "sql" -> List.of(
                "SELECT, WHERE & basic filtering",
                "Sorting, LIMIT & OFFSET",
                "INNER, LEFT, RIGHT & FULL JOINs",
                "GROUP BY & aggregate functions",
                "HAVING, subqueries & CTEs",
                "Window functions (ROW_NUMBER, RANK)",
                "UNION, INTERSECT & EXCEPT",
                "Indexes & query optimization",
                "Stored procedures & views",
                "Transactions & constraints"
            );
            case "data structures" -> List.of(
                "Arrays & dynamic arrays",
                "Linked lists (singly, doubly)",
                "Stacks & queues",
                "Hash maps & hash sets",
                "Trees & binary search trees",
                "Heaps & priority queues",
                "Graphs: adjacency list & matrix",
                "Tries & advanced structures",
                "Recursion & backtracking",
                "Big-O time & space complexity"
            );
            case "algorithms" -> List.of(
                "Big-O analysis & asymptotic complexity",
                "Sorting: bubble, insertion, selection",
                "Merge sort & quicksort",
                "Binary search & variants",
                "Two pointers & sliding window",
                "BFS & DFS graph traversal",
                "Greedy algorithms",
                "Dynamic programming basics",
                "Advanced DP (knapsack, LIS, LCS)",
                "Graph algorithms (Dijkstra, topological sort)"
            );
            case "oop" -> List.of(
                "Classes, objects & constructors",
                "Encapsulation & access modifiers",
                "Inheritance & method overriding",
                "Polymorphism (compile-time & runtime)",
                "Abstraction & interfaces",
                "Composition vs inheritance",
                "SOLID principles",
                "Design patterns (Singleton, Factory, Observer)",
                "UML basics & class diagrams",
                "Refactoring & code quality"
            );
            case "machine learning" -> List.of(
                "ML pipeline & problem framing",
                "Data preprocessing & cleaning",
                "Feature encoding & scaling",
                "Linear & logistic regression",
                "Decision trees & random forests",
                "SVMs & k-NN basics",
                "K-Means & clustering",
                "Model evaluation metrics",
                "Cross-validation & overfitting",
                "Hyperparameter tuning & ensemble methods"
            );
            case "deep learning" -> List.of(
                "Neural network architecture",
                "Activation functions & loss",
                "Backpropagation & optimization",
                "CNNs for image recognition",
                "RNNs & sequence modeling",
                "Transformers & attention mechanisms",
                "Transfer learning & fine-tuning",
                "Regularization (dropout, batch norm)",
                "Data augmentation & pipelines",
                "Model deployment basics"
            );
            case "statistics" -> List.of(
                "Descriptive statistics (mean, median, mode)",
                "Variability & distributions",
                "Normal distribution & Z-scores",
                "Sampling & standard error",
                "Confidence intervals",
                "Hypothesis testing & p-values",
                "Correlation & regression",
                "Chi-square & ANOVA basics",
                "Bayes' theorem",
                "Practical A/B testing"
            );
            case "database" -> List.of(
                "Relational model & ER diagrams",
                "Normalization (1NF – 3NF)",
                "CRUD operations",
                "JOINs & foreign keys",
                "Indexing & query performance",
                "Transactions & ACID properties",
                "Stored procedures & triggers",
                "Views & materialized views",
                "Concurrency & locking",
                "NoSQL concepts (MongoDB, Redis)"
            );
            case "web development" -> List.of(
                "HTML structure & semantics",
                "CSS layout: flexbox & grid",
                "JavaScript fundamentals & DOM",
                "ES6+ features",
                "HTTP methods & REST principles",
                "Fetch API & async/await",
                "React components & state management",
                "Forms, validation & auth basics",
                "Responsive design & accessibility",
                "Deployment & CI/CD basics"
            );
            case "computer networks" -> List.of(
                "OSI model & layer functions",
                "TCP/IP stack",
                "IP addressing & subnetting",
                "DNS, DHCP & routing",
                "HTTP/HTTPS & web protocols",
                "Network devices & switching",
                "Firewalls & network security",
                "Wireless & LAN standards",
                "Network troubleshooting tools",
                "Cloud networking basics"
            );
            case "programming" -> List.of(
                "Variables, types & operators",
                "Conditional logic",
                "Loops & iteration",
                "Functions & parameters",
                "Arrays & strings",
                "Error handling & exceptions",
                "File I/O",
                "Debugging & testing",
                "Modules & imports",
                "Clean coding & documentation"
            );
            case "data visualization" -> List.of(
                "Choosing the right chart type",
                "Matplotlib fundamentals",
                "Seaborn for statistical plots",
                "Plotly for interactive charts",
                "Storytelling with data",
                "Dashboard design principles",
                "Power BI / Tableau basics",
                "Color, accessibility & layout",
                "Data dashboards from real datasets",
                "Final visualization project"
            );
            case "excel" -> List.of(
                "Workbook basics & navigation",
                "Formulas & cell references",
                "Logical functions (IF, AND, OR)",
                "VLOOKUP & INDEX-MATCH",
                "Data cleaning with text functions",
                "Pivot Tables & charts",
                "Data validation & conditional formatting",
                "Filters, sorting & tables",
                "Macros & automation basics",
                "Advanced dashboard creation"
            );
            case "ui/ux design" -> List.of(
                "UX principles & user research",
                "Personas & user journeys",
                "Wireframing & low-fidelity mockups",
                "Information architecture",
                "Prototyping in Figma",
                "Visual hierarchy & typography",
                "Color systems & design tokens",
                "WCAG accessibility standards",
                "Usability testing methods",
                "Portfolio & case studies"
            );
            case "operating systems" -> List.of(
                "OS overview & process model",
                "Process scheduling algorithms",
                "Process synchronization",
                "Deadlocks & resolution",
                "Memory management & paging",
                "Virtual memory & page replacement",
                "File systems & I/O",
                "Linux command line & shell scripting",
                "Security & access control",
                "Threads & parallelism"
            );
            case "git" -> List.of(
                "Git basics & repo setup",
                "Commits & commit messages",
                "Branching & merging",
                "Pull requests & code review",
                "Rebase vs merge",
                "Resolving merge conflicts",
                "Stashing & cherry-picking",
                "GitHub Actions & CI basics",
                "Open-source contribution workflow",
                "Git hooks & advanced workflows"
            );
            case "communication" -> List.of(
                "Clear writing & email etiquette",
                "Technical documentation",
                "Effective presentations",
                "Stakeholder communication",
                "Active listening & feedback",
                "Requirements gathering",
                "Meeting facilitation",
                "Interview & resume skills",
                "Cross-team collaboration",
                "Personal brand & networking"
            );
            case "cryptography" -> List.of(
                "Cryptography fundamentals",
                "Symmetric encryption (AES, DES)",
                "Asymmetric encryption (RSA)",
                "Hashing (SHA, MD5)",
                "Digital signatures",
                "TLS/SSL & certificates",
                "Key exchange (Diffie-Hellman)",
                "Common attacks & defenses",
                "Secure coding (OWASP)",
                "Security auditing & pen testing"
            );
            default -> List.of(
                "Fundamentals of " + skill,
                "Core concepts & terminology",
                "Essential tools & setup",
                "Guided practice problems",
                "Intermediate theory",
                "Hands-on mini-projects",
                "Advanced topics",
                "Applied projects & portfolios",
                "Interview-style questions",
                "Continuous improvement plan"
            );
        };
    }
}
