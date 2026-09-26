package com.eduai.backend_java.services;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import com.eduai.backend_java.exception.ResourceNotFoundException;
import com.eduai.backend_java.models.TeacherProfile;
import com.eduai.backend_java.repositories.TeacherProfileRepository;

@Service
public class TeacherProfileServiceImpl implements TeacherProfileService {

    @Autowired
    private TeacherProfileRepository repository;

    // Hardcoded path to separate teacher photos from student photos
    private final String uploadDir = "uploads/profile/teachers/";

    @Override
    public TeacherProfile getProfileByUserId(Long userId) {
        return repository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Teacher Profile not found for User ID : " + userId));
    }

    @Override
    public TeacherProfile getProfileById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Teacher Profile not found with ID : " + id));
    }

    @Override
    public List<TeacherProfile> getAllProfiles() {
        return repository.findAll();
    }

    @Override
    public TeacherProfile createProfile(TeacherProfile teacherProfile) {
        if (repository.existsByStaffId(teacherProfile.getStaffId())) {
            throw new RuntimeException("Staff ID already exists.");
        }
        if (repository.existsByEmail(teacherProfile.getEmail())) {
            throw new RuntimeException("Email already exists.");
        }
        return repository.save(teacherProfile);
    }

    @Override
    public TeacherProfile updateProfile(Long id, TeacherProfile teacherProfile) {
        TeacherProfile existing = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Teacher Profile not found with ID : " + id));

        // Personal Details
        existing.setStaffId(teacherProfile.getStaffId());
        existing.setFirstName(teacherProfile.getFirstName());
        existing.setLastName(teacherProfile.getLastName());
        existing.setEmail(teacherProfile.getEmail());
        existing.setPhone(teacherProfile.getPhone());
        existing.setAddress(teacherProfile.getAddress());

        // Professional Details
        existing.setDepartment(teacherProfile.getDepartment());
        existing.setDesignation(teacherProfile.getDesignation());
        existing.setQualification(teacherProfile.getQualification());
        existing.setExperience(teacherProfile.getExperience());
        
        // About & Subjects
        existing.setBio(teacherProfile.getBio());
        existing.setSubjects(teacherProfile.getSubjects());

        return repository.save(existing);
    }

    @Override
    public void deleteProfile(Long id) {
        TeacherProfile existing = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Teacher Profile not found with ID : " + id));

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
        TeacherProfile teacher = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Teacher Profile not found with ID : " + id));

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

        if (teacher.getProfilePhoto() != null && !teacher.getProfilePhoto().isBlank()) {
            File oldImage = new File(uploadDir, teacher.getProfilePhoto());
            if (oldImage.exists()) {
                oldImage.delete();
            }
        }

        String originalFile = file.getOriginalFilename();
        String extension = "";
        if (originalFile != null && originalFile.contains(".")) {
            extension = originalFile.substring(originalFile.lastIndexOf("."));
        }

        String fileName = UUID.randomUUID().toString() + "_teacher" + extension;
        File destination = new File(folder, fileName);

        Files.copy(file.getInputStream(), destination.toPath(), StandardCopyOption.REPLACE_EXISTING);

        teacher.setProfilePhoto(fileName);
        repository.save(teacher);

        return fileName;
    }
}