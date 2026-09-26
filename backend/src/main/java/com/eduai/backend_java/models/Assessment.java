package com.eduai.backend_java.models;

import jakarta.persistence.*;
import org.hibernate.annotations.Fetch;
import org.hibernate.annotations.FetchMode;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "assessments")
public class Assessment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @Column(name = "assessment_type")
    private String type;

    private Integer durationMinutes;

    /** INTERNAL (teacher-created, class-scoped) or PLACEMENT (admin-created, open to eligible students). */
    @Column(name = "assessment_category")
    private String assessmentCategory;

    private String subject;

    @Column(length = 2000)
    private String description;

    @Column(length = 2000)
    private String instructions;

    private LocalDateTime startDate;

    private LocalDateTime endDate;

    private Integer totalMarks;

    private Integer passingMarks;

    private Boolean published;

    private String createdBy;

    @Column(name = "creator_role")
    private String creatorRole;

    private String assignedDepartment;

    private String assignedYear;

    private String assignedSection;

    // FIX: Apply SUBSELECT to the main questions list as well
    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JoinColumn(name = "assessment_id")
    @Fetch(FetchMode.SUBSELECT)
    private List<Question> questions;

    public boolean isInternal() {
        return "INTERNAL".equalsIgnoreCase(assessmentCategory);
    }

    public boolean isPlacement() {
        return !isInternal();
    }

    /** Students may only see a published assessment whose availability window is open. */
    public boolean isAvailableNow() {
        if (published == null || !published) return false;
        LocalDateTime now = LocalDateTime.now();
        if (startDate != null && now.isBefore(startDate)) return false;
        if (endDate != null && now.isAfter(endDate)) return false;
        return true;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public Integer getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; }
    public String getAssessmentCategory() { return assessmentCategory; }
    public void setAssessmentCategory(String assessmentCategory) { this.assessmentCategory = assessmentCategory; }
    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getInstructions() { return instructions; }
    public void setInstructions(String instructions) { this.instructions = instructions; }
    public LocalDateTime getStartDate() { return startDate; }
    public void setStartDate(LocalDateTime startDate) { this.startDate = startDate; }
    public LocalDateTime getEndDate() { return endDate; }
    public void setEndDate(LocalDateTime endDate) { this.endDate = endDate; }
    public Integer getTotalMarks() { return totalMarks; }
    public void setTotalMarks(Integer totalMarks) { this.totalMarks = totalMarks; }
    public Integer getPassingMarks() { return passingMarks; }
    public void setPassingMarks(Integer passingMarks) { this.passingMarks = passingMarks; }
    public Boolean getPublished() { return published; }
    public void setPublished(Boolean published) { this.published = published; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public String getCreatorRole() { return creatorRole; }
    public void setCreatorRole(String creatorRole) { this.creatorRole = creatorRole; }
    public String getAssignedDepartment() { return assignedDepartment; }
    public void setAssignedDepartment(String assignedDepartment) { this.assignedDepartment = assignedDepartment; }
    public String getAssignedYear() { return assignedYear; }
    public void setAssignedYear(String assignedYear) { this.assignedYear = assignedYear; }
    public String getAssignedSection() { return assignedSection; }
    public void setAssignedSection(String assignedSection) { this.assignedSection = assignedSection; }
    public List<Question> getQuestions() { return questions; }
    public void setQuestions(List<Question> questions) { this.questions = questions; }
}
