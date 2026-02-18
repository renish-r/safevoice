package com.safevoice.backend.api.controller;

import com.safevoice.backend.api.dto.ResolutionResponse;
import com.safevoice.backend.api.dto.UploadResolutionRequest;
import com.safevoice.backend.application.service.ResolutionService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/official")
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('OFFICIAL')")
public class OfficialController {

    private final ResolutionService resolutionService;

    public OfficialController(ResolutionService resolutionService) {
        this.resolutionService = resolutionService;
    }

    @PostMapping("/resolutions")
    public ResponseEntity<ResolutionResponse> uploadResolution(
            @Valid @ModelAttribute UploadResolutionRequest request) {

        UUID problemId = UUID.fromString(request.getProblemId());
        UUID officialId = getCurrentOfficialId();

        log.info("Official {} uploading resolution for problem {}", officialId, problemId);

        ResolutionResponse response = resolutionService.uploadResolution(
            problemId, officialId, request.getResolvedImageFile());

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    private UUID getCurrentOfficialId() {
        // In a production environment, extract from JWT token
        // For now, return a placeholder
        return UUID.randomUUID();
    }
}
