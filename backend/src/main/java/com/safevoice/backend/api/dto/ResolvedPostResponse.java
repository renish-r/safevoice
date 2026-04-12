package com.safevoice.backend.api.dto;

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
public class ResolvedPostResponse {
    private UUID problemId;
    private UUID resolutionId;
    private String originalImageUrl;
    private String resolvedImageUrl;
    private String originalDescription;
    private String officialDescription;
    private Double problemLatitude;
    private Double problemLongitude;
    private Double officialLatitude;
    private Double officialLongitude;
    private Double aiSimilarityScore;
    private String verificationReason;
    private LocalDateTime resolvedAt;
}
