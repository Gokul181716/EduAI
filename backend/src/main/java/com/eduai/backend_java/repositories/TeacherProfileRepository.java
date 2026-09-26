package com.eduai.backend_java.repositories;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.eduai.backend_java.models.TeacherProfile;

@Repository
public interface TeacherProfileRepository extends JpaRepository<TeacherProfile, Long> {

    // Find profile using login user ID
    Optional<TeacherProfile> findByUserId(Long userId);

    // Find profile using staff ID
    Optional<TeacherProfile> findByStaffId(String staffId);

    // Check if staff ID already exists
    boolean existsByStaffId(String staffId);

    // Check if email already exists
    boolean existsByEmail(String email);
}