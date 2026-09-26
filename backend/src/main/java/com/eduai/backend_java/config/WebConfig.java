package com.eduai.backend_java.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    // 💡 Pulls the exact same save-folder location from your application.properties
    @Value("${file.upload-dir}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        
        // 1. Get the absolute path to exactly where the files are being saved
        String absoluteUploadPath = Paths.get(uploadDir).toAbsolutePath().toUri().toString();
        
        // Ensure it ends with a slash so Spring can look inside the folder
        if (!absoluteUploadPath.endsWith("/")) {
            absoluteUploadPath += "/";
        }

        // 2. Map the exact URL your React app is requesting to that exact folder
        registry.addResourceHandler("/uploads/profile/students/**")
                .addResourceLocations(absoluteUploadPath);
        
        // 3. NEW: Resumes Config
        String absoluteResumePath = Paths.get("uploads/profile/resumes").toAbsolutePath().toUri().toString();
        if (!absoluteResumePath.endsWith("/")) {
            absoluteResumePath += "/";
        }
        registry.addResourceHandler("/uploads/profile/resumes/**")
                .addResourceLocations(absoluteResumePath);
    }
}