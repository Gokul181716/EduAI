package com.eduai.backend_java.services;

import java.util.List;
import org.springframework.web.multipart.MultipartFile;
import com.eduai.backend_java.models.TeacherProfile;

public interface TeacherProfileService {
    TeacherProfile getProfileByUserId(Long userId);
    TeacherProfile getProfileById(Long id);
    List<TeacherProfile> getAllProfiles();
    TeacherProfile createProfile(TeacherProfile teacherProfile);
    TeacherProfile updateProfile(Long id, TeacherProfile teacherProfile);
    void deleteProfile(Long id);
    String uploadProfilePhoto(Long id, MultipartFile file) throws Exception;
}