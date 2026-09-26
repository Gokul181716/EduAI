package com.eduai.backend_java.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SkillGap {
    private String skill;
    private int currentScore;
    private int targetScore;
    private String priority;
    private String status;
}
