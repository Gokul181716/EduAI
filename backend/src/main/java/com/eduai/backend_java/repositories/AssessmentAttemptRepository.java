package com.eduai.backend_java.repositories;

import com.eduai.backend_java.models.AttemptStatus;
import com.eduai.backend_java.models.AssessmentAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AssessmentAttemptRepository extends JpaRepository<AssessmentAttempt, Long> {

    Optional<AssessmentAttempt> findByAssessmentIdAndStudentId(Long assessmentId, Long studentId);

    List<AssessmentAttempt> findByStudentIdOrderByStartedAtDesc(Long studentId);

    List<AssessmentAttempt> findByAssessmentIdOrderByStartedAtDesc(Long assessmentId);

    long countByStatus(AttemptStatus status);

    @Query("SELECT a.assessment.id, AVG(a.score) FROM AssessmentAttempt a " +
           "WHERE a.status IN (com.eduai.backend_java.models.AttemptStatus.SUBMITTED, " +
           "com.eduai.backend_java.models.AttemptStatus.EXPIRED) AND a.score IS NOT NULL " +
           "GROUP BY a.assessment.id")
    List<Object[]> findAverageScorePerAssessment();

    @Query("SELECT a FROM AssessmentAttempt a WHERE a.status = :status ORDER BY a.startedAt DESC")
    List<AssessmentAttempt> findByStatusOrdered(@Param("status") AttemptStatus status);
}
