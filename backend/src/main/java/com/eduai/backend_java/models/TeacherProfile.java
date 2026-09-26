package com.eduai.backend_java.models;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "teacher_profile")
public class TeacherProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Login Account Reference
    @OneToOne
    @JoinColumn(name = "user_id", referencedColumnName = "id", nullable = false, unique = true)
    private User user;

    // Professional Identifiers
    @Column(nullable = false, unique = true)
    private String staffId;

    @Column(nullable = false)
    private String department;

    @Column(nullable = false)
    private String designation;

    @Column(nullable = false)
    private String qualification;

    private Integer experience;

    // Personal Details
    @Column(nullable = false)
    private String firstName;

    private String lastName;

    @Column(nullable = false)
    private String email;

    private String phone;

    @Column(length = 500)
    private String address;

    // Profile Information
    private String profilePhoto;

    @Column(length = 1000)
    private String bio;

    // Subjects and Expertise (Stored as comma-separated string)
    @Column(length = 1000)
    private String subjects;

    // Audit Fields
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    public void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}