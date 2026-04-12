package com.safevoice.backend.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.constraints.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UploadResolutionRequest {

    @NotNull(message = "Problem ID is required")
    private String problemId;

    @NotNull(message = "Resolved image file is required")
    private MultipartFile resolvedImageFile;

    @NotBlank(message = "Resolution description is required")
    @Size(min = 10, max = 1000, message = "Resolution description must be between 10 and 1000 characters")
    private String description;

    @NotNull(message = "Official latitude is required")
    @DecimalMin(value = "-90", message = "Latitude must be between -90 and 90")
    @DecimalMax(value = "90", message = "Latitude must be between -90 and 90")
    private Double latitude;

    @NotNull(message = "Official longitude is required")
    @DecimalMin(value = "-180", message = "Longitude must be between -180 and 180")
    @DecimalMax(value = "180", message = "Longitude must be between -180 and 180")
    private Double longitude;
}
