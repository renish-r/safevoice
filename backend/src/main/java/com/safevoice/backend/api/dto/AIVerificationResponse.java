package com.safevoice.backend.api.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AIVerificationResponse {

    @JsonProperty("similarity_score")
    private Double similarityScore;

    @JsonProperty("deepfake_detected")
    private Boolean deepfakeDetected;

    @JsonProperty("verification_status")
    private String verificationStatus;

    @JsonProperty("confidence_score")
    private Double confidenceScore;
}
