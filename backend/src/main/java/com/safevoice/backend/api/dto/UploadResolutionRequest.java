package com.safevoice.backend.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.constraints.NotNull;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UploadResolutionRequest {

    @NotNull(message = "Problem ID is required")
    private String problemId;

    @NotNull(message = "Resolved image file is required")
    private MultipartFile resolvedImageFile;
}
