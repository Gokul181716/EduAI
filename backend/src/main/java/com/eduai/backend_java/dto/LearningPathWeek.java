package com.eduai.backend_java.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LearningPathWeek {
    private int weekNumber;
    private String skill;
    private String phase;
    private String goal;
    private List<String> topics;
    private String practice;
}