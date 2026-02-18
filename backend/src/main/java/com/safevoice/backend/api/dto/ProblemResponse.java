package com.safevoice.backend.api.dto;

import com.safevoice.backend.domain.entity.Problem;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProblemResponse {

    private UUID id;
    private String imageUrl;
    private Double latitude;
    private Double longitude;
    private String description;
    private Problem.ProblemStatus status;
    private Double aiModerationScore;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Integer resolutionCount;
}
