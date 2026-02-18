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
public class AIModerationResponse {

    @JsonProperty("nsfw_score")
    private Double nsfwScore;

    @JsonProperty("violence_score")
    private Double violenceScore;

    @JsonProperty("ocr_flag")
    private Boolean ocrFlag;

    @JsonProperty("final_confidence")
    private Double finalConfidence;
}
