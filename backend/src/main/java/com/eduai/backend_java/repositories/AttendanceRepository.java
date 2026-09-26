package com.eduai.backend_java.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.eduai.backend_java.models.Attendance;
import com.eduai.backend_java.models.Session;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {

    // Get attendance of a student between two dates (used for weekly analysis)
    List<Attendance> findByStudentIdAndDateBetween(
            Long studentId,
            LocalDate startDate,
            LocalDate endDate
    );

    // Get attendance of a student for a particular day
    List<Attendance> findByStudentIdAndDate(
            Long studentId,
            LocalDate date
    );

    // Get all attendance records for a particular date
    List<Attendance> findByDate(LocalDate date);

    // Filter attendance records by date and session (Morning / Afternoon)
    List<Attendance> findByDateAndSession(LocalDate date, Session session);

    // Find specific record for upsert verification
    Optional<Attendance> findByStudentIdAndDateAndSession(Long studentId, LocalDate date, Session session);

    // --- Aggregates for real dashboard statistics ---

    @Query("SELECT a.studentId, COUNT(a), " +
           "SUM(CASE WHEN a.status = com.eduai.backend_java.models.Status.PRESENT THEN 1 ELSE 0 END) " +
           "FROM Attendance a WHERE a.date BETWEEN :start AND :end GROUP BY a.studentId")
    List<Object[]> findStudentPresentTotals(@Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query("SELECT a.department, COUNT(a), " +
           "SUM(CASE WHEN a.status = com.eduai.backend_java.models.Status.PRESENT THEN 1 ELSE 0 END) " +
           "FROM Attendance a WHERE a.date BETWEEN :start AND :end AND a.department IS NOT NULL " +
           "GROUP BY a.department")
    List<Object[]> findDepartmentPresentTotals(@Param("start") LocalDate start, @Param("end") LocalDate end);

    long countByDateBetween(LocalDate start, LocalDate end);

    @Query("SELECT COUNT(a) FROM Attendance a WHERE a.date BETWEEN :start AND :end " +
           "AND a.status = com.eduai.backend_java.models.Status.PRESENT")
    long countPresentBetween(@Param("start") LocalDate start, @Param("end") LocalDate end);
}