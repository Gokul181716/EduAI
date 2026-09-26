package com.eduai.backend_java.services;

import com.eduai.backend_java.models.Attendance;
import com.eduai.backend_java.models.Session;
import com.eduai.backend_java.models.Status;
import com.eduai.backend_java.repositories.AttendanceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class AttendanceService {

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private AttendanceAnalyzerService attendanceAnalyzerService;

    // Save or Update Attendance (Upsert logic)
    public Attendance saveAttendance(Attendance attendance) {
        Optional<Attendance> existingRecord = attendanceRepository.findByStudentIdAndDateAndSession(
                attendance.getStudentId(),
                attendance.getDate(),
                attendance.getSession()
        );

        Attendance savedAttendance;
        if (existingRecord.isPresent()) {
            Attendance target = existingRecord.get();
            target.setStatus(attendance.getStatus());
            target.setSubject(attendance.getSubject());
            target.setFacultyId(attendance.getFacultyId());
            target.setDepartment(attendance.getDepartment());
            target.setYear(attendance.getYear());
            target.setSection(attendance.getSection());
            savedAttendance = attendanceRepository.save(target);
        } else {
            savedAttendance = attendanceRepository.save(attendance);
        }

        // Weekly analysis — trigger after every mark (both MORNING and AFTERNOON)
        attendanceAnalyzerService.checkWeeklyAbsentPattern(savedAttendance.getStudentId(), savedAttendance.getDate());

        return savedAttendance;
    }

    // Get attendance filtered by date and session
    public List<Attendance> getAttendanceByDateAndSession(LocalDate date, Session session) {
        return attendanceRepository.findByDateAndSession(date, session);
    }

    public List<Attendance> getStudentAttendance(Long studentId) {
        return attendanceRepository.findByStudentIdAndDateBetween(
                studentId,
                LocalDate.now().minusMonths(6),
                LocalDate.now()
        );
    }

    public List<Attendance> getTodayAttendance() {
        return attendanceRepository.findByDate(LocalDate.now());
    }

    // 💡 NEW: Logic to safely calculate the percentage
    public double getStudentAttendancePercentage(Long studentId) {
        // Fetch records from the last 6 months using the existing method
        List<Attendance> records = getStudentAttendance(studentId);

        // Safety Check 1: If the student is new or has no records, prevent division by zero
        if (records == null || records.isEmpty()) {
            return 0.0; // Return 0% to prevent the 500 server crash
        }

        double totalClasses = records.size();
        
        // Count how many times the status was PRESENT
        double presentClasses = records.stream()
                .filter(record -> record.getStatus() == Status.PRESENT)
                .count();

        // Calculate the raw percentage
        double percentage = (presentClasses / totalClasses) * 100.0;

        // Round to 1 decimal place (e.g., 87.5) and return
        return Math.round(percentage * 10.0) / 10.0;
    }
}