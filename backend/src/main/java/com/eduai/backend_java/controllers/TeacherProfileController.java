package com.eduai.backend_java.controllers;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.eduai.backend_java.models.TeacherProfile;
import com.eduai.backend_java.services.TeacherProfileService;

@RestController
@RequestMapping("/api/teacher/profile")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class TeacherProfileController {

    @Autowired
    private TeacherProfileService teacherProfileService;

    // ===========================
    // Get Teacher Profile by User ID
    // ===========================
    @GetMapping("/user/{userId}")
    public ResponseEntity<TeacherProfile> getProfileByUserId(@PathVariable Long userId) {
        TeacherProfile profile = teacherProfileService.getProfileByUserId(userId);
        return ResponseEntity.ok(profile);
    }

    // ===========================
    // Get Teacher Profile by Profile ID
    // ===========================
    @GetMapping("/{id}")
    public ResponseEntity<TeacherProfile> getProfileById(@PathVariable Long id) {
        TeacherProfile profile = teacherProfileService.getProfileById(id);
        return ResponseEntity.ok(profile);
    }

    // ===========================
    // Get All Teacher Profiles
    // ===========================
    @GetMapping("/all")
    public ResponseEntity<List<TeacherProfile>> getAllProfiles() {
        return ResponseEntity.ok(teacherProfileService.getAllProfiles());
    }

    // ===========================
    // Create Teacher Profile
    // ===========================
    @PostMapping
    public ResponseEntity<TeacherProfile> createProfile(@RequestBody TeacherProfile teacherProfile) {
        TeacherProfile savedProfile = teacherProfileService.createProfile(teacherProfile);
        return new ResponseEntity<>(savedProfile, HttpStatus.CREATED);
    }

    // ===========================
    // Update Teacher Profile
    // ===========================
    @PutMapping("/{id}")
    public ResponseEntity<TeacherProfile> updateProfile(@PathVariable Long id, @RequestBody TeacherProfile teacherProfile) {
        TeacherProfile updatedProfile = teacherProfileService.updateProfile(id, teacherProfile);
        return ResponseEntity.ok(updatedProfile);
    }

    // ===========================
    // Delete Teacher Profile
    // ===========================
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteProfile(@PathVariable Long id) {
        teacherProfileService.deleteProfile(id);
        return ResponseEntity.ok("Teacher Profile Deleted Successfully");
    }

    // ===========================
    // Upload Profile Photo
    // ===========================
    @PostMapping(value = "/upload-photo/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> uploadProfilePhoto(@PathVariable Long id, @RequestParam("file") MultipartFile file) throws Exception {
        String fileName = teacherProfileService.uploadProfilePhoto(id, file);
        return ResponseEntity.ok(fileName);
    }
}