package com.eduai.backend_java.services;

import com.eduai.backend_java.models.Attendance;
import com.eduai.backend_java.models.Notification;
import com.eduai.backend_java.models.Status;
import com.eduai.backend_java.models.StudentProfile;
import com.eduai.backend_java.repositories.AttendanceRepository;
import com.eduai.backend_java.repositories.NotificationRepository;
import com.eduai.backend_java.repositories.StudentProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class AttendanceAnalyzerService {

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private StudentProfileRepository studentProfileRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private NotificationRepository notificationRepository;

    /**
     * Counts total absent days in the week of the marked attendance for a student.
     * If absent on 3 or more days, sends email alerts to Parent, Tutor, and HOD.
     * Triggered after every attendance mark (MORNING or AFTERNOON).
     */
    public void checkWeeklyAbsentPattern(Long studentId, LocalDate referenceDate) {

        // The week window is based on the date the teacher marked, not "today",
        // so marking future absences (e.g. next week) counts immediately.
        LocalDate weekRef = referenceDate != null ? referenceDate : LocalDate.now();
        LocalDate startOfWeek = weekRef.with(DayOfWeek.MONDAY);
        LocalDate endOfWeek = weekRef.with(DayOfWeek.SUNDAY);

        List<Attendance> attendanceList =
                attendanceRepository.findByStudentIdAndDateBetween(
                        studentId, startOfWeek, endOfWeek);

        // Count distinct days where the student was absent (any session)
        Set<LocalDate> absentDays = new HashSet<>();
        for (Attendance a : attendanceList) {
            if (a.getStatus() == Status.ABSENT) {
                absentDays.add(a.getDate());
            }
        }

        int absentDayCount = absentDays.size();

        System.out.println("Student ID : " + studentId);
        System.out.println("Weekly Absent Day Count : " + absentDayCount);

        if (absentDayCount < 3) {
            return;
        }

        StudentProfile student = studentProfileRepository.findByUserId(studentId).orElse(null);
        if (student == null) {
            return;
        }

        // Prevent duplicate alerts for the SAME week (a week-unique token in the
        // message makes the check per-week instead of per-student-forever).
        boolean alreadySent =
                notificationRepository.existsByStudentIdAndMessageContaining(
                        student.getRegisterNumber(),
                        "WK_START:" + startOfWeek);
        if (alreadySent) {
            System.out.println("Weekly absence alert already sent for week " + startOfWeek);
            return;
        }

        String fullName = student.getFirstName()
                + (student.getLastName() != null ? " " + student.getLastName() : "");
        String subject = "EduAI Weekly Absence Alert";

        String message =
                "Weekly Absence Alert\n\n"
                + "Dear Parent/Tutor/HOD,\n\n"
                + "This is to inform you that the student has been absent for 3 or more days this week.\n\n"
                + "WK_START:" + startOfWeek + "\n"
                + "Student Name    : " + fullName + "\n"
                + "Register Number : " + student.getRegisterNumber() + "\n"
                + "Department      : " + student.getDepartment() + "\n"
                + "Year            : " + student.getYear() + "\n"
                + "Section         : " + (student.getSection() != null ? student.getSection() : "N/A") + "\n"
                + "Absent Days     : " + absentDayCount + " (out of " + attendanceList.size() + " records this week)\n\n"
                + "Please counsel the student and take necessary action.\n\n"
                + "Regards,\n"
                + "EduAI Attendance System";

        // Parent Alert
        if (student.getParentEmail() != null && !student.getParentEmail().isEmpty()) {
            emailService.sendEmail(student.getParentEmail(), subject, message);
            saveNotification(student, fullName, "Parent", student.getParentEmail(), message);
        }

        // Tutor Alert
        if (student.getTutorEmail() != null && !student.getTutorEmail().isEmpty()) {
            emailService.sendEmail(student.getTutorEmail(), subject, message);
            saveNotification(student, fullName, "Tutor", student.getTutorEmail(), message);
        }

        // HOD Alert
        if (student.getHodEmail() != null && !student.getHodEmail().isEmpty()) {
            emailService.sendEmail(student.getHodEmail(), subject, message);
            saveNotification(student, fullName, "HOD", student.getHodEmail(), message);
        }

        System.out.println("Weekly Absence Alert Sent Successfully.");
    }

    private void saveNotification(StudentProfile student, String fullName,
                                   String recipient, String email, String message) {
        Notification n = new Notification();
        n.setStudentId(student.getRegisterNumber());
        n.setStudentName(fullName);
        n.setRecipient(recipient);
        n.setRecipientEmail(email);
        n.setMessage(message);
        n.setStatus("SENT");
        notificationService.saveNotification(n);
    }
}
