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
public class CareerRoleMatch {
    private String name;
    private String description;
    private int matchScore;
    private List<String> reason;
}
