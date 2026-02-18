package com.safevoice.backend.api.dto;

import com.safevoice.backend.domain.entity.Resolution;
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
public class ResolutionResponse {

    private UUID id;
    private UUID problemId;
    private UUID officialId;
    private String resolvedImageUrl;
    private Double aiSimilarityScore;
    private Boolean deepfakeDetected;
    private Resolution.VerificationStatus verificationStatus;
    private LocalDateTime createdAt;
}
