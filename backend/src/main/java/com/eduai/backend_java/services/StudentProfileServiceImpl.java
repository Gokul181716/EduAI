package com.eduai.backend_java.services;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import com.eduai.backend_java.exception.ResourceNotFoundException;
import com.eduai.backend_java.models.StudentProfile;
import com.eduai.backend_java.repositories.StudentProfileRepository;

@Service
public class StudentProfileServiceImpl implements StudentProfileService {

    @Autowired
    private StudentProfileRepository repository;

    @Value("${file.upload-dir}")
    private String uploadDir;

    @Override
    public StudentProfile getProfileByUserId(Long userId) {
        return repository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Student Profile not found for User ID : " + userId));
    }

    @Override
    public StudentProfile getProfileById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student Profile not found with ID : " + id));
    }

    @Override
    public List<StudentProfile> getAllProfiles() {
        return repository.findAll();
    }

    @Override
    public StudentProfile createProfile(StudentProfile studentProfile) {
        if (repository.existsByRegisterNumber(studentProfile.getRegisterNumber())) {
            throw new RuntimeException("Register Number already exists.");
        }
        if (repository.existsByEmail(studentProfile.getEmail())) {
            throw new RuntimeException("Email already exists.");
        }
        return repository.save(studentProfile);
    }

    @Override
    public StudentProfile updateProfile(Long id, StudentProfile studentProfile) {
        StudentProfile existing = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student Profile not found with ID : " + id));

        // Personal Details & Register Number
        existing.setRegisterNumber(studentProfile.getRegisterNumber());
        existing.setFirstName(studentProfile.getFirstName());
        existing.setLastName(studentProfile.getLastName());
        existing.setEmail(studentProfile.getEmail());
        existing.setPhone(studentProfile.getPhone());
        existing.setGender(studentProfile.getGender());
        existing.setDateOfBirth(studentProfile.getDateOfBirth());
        existing.setAddress(studentProfile.getAddress());

        // Academic Details
        existing.setDepartment(studentProfile.getDepartment());
        existing.setYear(studentProfile.getYear());
        existing.setSemester(studentProfile.getSemester());
        existing.setSection(studentProfile.getSection());
        existing.setCgpa(studentProfile.getCgpa());

        // --- Parent, Tutor, and HOD Details (ADDED) ---
        existing.setParentName(studentProfile.getParentName());
        existing.setParentEmail(studentProfile.getParentEmail());
        existing.setTutorName(studentProfile.getTutorName());
        existing.setTutorEmail(studentProfile.getTutorEmail());
        existing.setHodName(studentProfile.getHodName());
        existing.setHodEmail(studentProfile.getHodEmail());
        // ----------------------------------------------

        // Professional Details
        existing.setSkills(studentProfile.getSkills());
        existing.setGithub(studentProfile.getGithub());
        existing.setLinkedin(studentProfile.getLinkedin());
        existing.setPortfolio(studentProfile.getPortfolio());
        existing.setResume(studentProfile.getResume());
        
        // About & Placement
        existing.setBio(studentProfile.getBio());
        existing.setPlacementStatus(studentProfile.getPlacementStatus());

        // Placement Readiness inputs (AI microservice)
        existing.setTenthPercentage(studentProfile.getTenthPercentage());
        existing.setTwelfthPercentage(studentProfile.getTwelfthPercentage());
        existing.setBacklogs(studentProfile.getBacklogs());
        existing.setProjectsCompleted(studentProfile.getProjectsCompleted());
        existing.setInternshipsCompleted(studentProfile.getInternshipsCompleted());
        existing.setHackathonsParticipated(studentProfile.getHackathonsParticipated());
        existing.setCertificationsCount(studentProfile.getCertificationsCount());
        existing.setCodingSkillRating(studentProfile.getCodingSkillRating());
        existing.setCommunicationSkillRating(studentProfile.getCommunicationSkillRating());
        existing.setAptitudeSkillRating(studentProfile.getAptitudeSkillRating());

        return repository.save(existing);
    }

    @Override
    public void deleteProfile(Long id) {
        StudentProfile existing = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student Profile not found with ID : " + id));

        if (existing.getProfilePhoto() != null && !existing.getProfilePhoto().isBlank()) {
            File oldImage = new File(uploadDir, existing.getProfilePhoto());
            if (oldImage.exists()) {
                oldImage.delete();
            }
        }
        repository.delete(existing);
    }

    @Override
    public String uploadProfilePhoto(Long id, MultipartFile file) throws Exception {
        StudentProfile student = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student Profile not found with ID : " + id));

        if (file.isEmpty()) {
            throw new RuntimeException("Please select a profile image.");
        }

        String contentType = file.getContentType();
        if (contentType == null || (!contentType.equalsIgnoreCase("image/jpeg")
                && !contentType.equalsIgnoreCase("image/jpg")
                && !contentType.equalsIgnoreCase("image/png"))) {
            throw new RuntimeException("Only JPG, JPEG and PNG images are allowed.");
        }

        File folder = new File(uploadDir);
        if (!folder.exists()) {
            folder.mkdirs();
        }

        if (student.getProfilePhoto() != null && !student.getProfilePhoto().isBlank()) {
            File oldImage = new File(uploadDir, student.getProfilePhoto());
            if (oldImage.exists()) {
                oldImage.delete();
            }
        }

        String originalFile = file.getOriginalFilename();
        String extension = "";
        if (originalFile != null && originalFile.contains(".")) {
            extension = originalFile.substring(originalFile.lastIndexOf("."));
        }

        String fileName = UUID.randomUUID().toString() + extension;
        File destination = new File(folder, fileName);

        Files.copy(file.getInputStream(), destination.toPath(), StandardCopyOption.REPLACE_EXISTING);

        student.setProfilePhoto(fileName);
        repository.save(student);

        return fileName;
    }
    // =====================================
    // ADD THIS AT THE BOTTOM OF THE CLASS
    // =====================================
    @Override
    public String uploadResume(Long id, MultipartFile file) throws Exception {
        StudentProfile student = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student Profile not found with ID : " + id));

        if (file.isEmpty()) {
            throw new RuntimeException("Please select a resume file.");
        }

        // Ensure it is a PDF
        String contentType = file.getContentType();
        if (contentType == null || !contentType.equalsIgnoreCase("application/pdf")) {
            throw new RuntimeException("Only PDF files are allowed for resumes.");
        }

        // Create a specific folder for resumes
        String resumeDir = "uploads/profile/resumes/";
        File folder = new File(resumeDir);
        if (!folder.exists()) {
            folder.mkdirs();
        }

        // Delete old resume if it exists
        if (student.getResume() != null && !student.getResume().isBlank()) {
            File oldResume = new File(resumeDir, student.getResume());
            if (oldResume.exists()) {
                oldResume.delete();
            }
        }

        // Generate safe unique filename
        String originalFile = file.getOriginalFilename();
        String extension = ".pdf";
        if (originalFile != null && originalFile.contains(".")) {
            extension = originalFile.substring(originalFile.lastIndexOf("."));
        }

        String fileName = UUID.randomUUID().toString() + "_resume" + extension;
        File destination = new File(folder, fileName);

        // Save physical file
        Files.copy(file.getInputStream(), destination.toPath(), StandardCopyOption.REPLACE_EXISTING);

        // Save to database
        student.setResume(fileName);
        repository.save(student);

        return fileName;
    }
}