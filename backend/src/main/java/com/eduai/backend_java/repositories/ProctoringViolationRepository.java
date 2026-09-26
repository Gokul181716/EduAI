package com.eduai.backend_java.repositories;

import com.eduai.backend_java.models.ProctoringViolation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProctoringViolationRepository extends JpaRepository<ProctoringViolation, Long> {

    List<ProctoringViolation> findByAttemptIdOrderByTimestampAsc(Long attemptId);

    void deleteByAttemptId(Long attemptId);
}
