package com.safevoice.backend.api.controller;

import com.safevoice.backend.api.dto.ResolutionResponse;
import com.safevoice.backend.api.dto.UploadResolutionRequest;
import com.safevoice.backend.application.service.OfficialAuthService;
import com.safevoice.backend.application.service.ResolutionService;
import com.safevoice.backend.domain.entity.Official;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/official")
@PreAuthorize("hasRole('OFFICIAL')")
public class OfficialController {

    private final ResolutionService resolutionService;
    private final OfficialAuthService officialAuthService;

    public OfficialController(
            ResolutionService resolutionService,
            OfficialAuthService officialAuthService) {
        this.resolutionService = resolutionService;
        this.officialAuthService = officialAuthService;
    }

    @PostMapping("/resolutions")
    public ResponseEntity<ResolutionResponse> uploadResolution(
            @Valid @ModelAttribute UploadResolutionRequest request) {

        UUID problemId = UUID.fromString(request.getProblemId());
        UUID officialId = getCurrentOfficialId();

        log.info("Official {} uploading resolution for problem {}", officialId, problemId);

        ResolutionResponse response = resolutionService.uploadResolution(
            problemId,
            officialId,
            request.getResolvedImageFile(),
            request.getDescription(),
            request.getLatitude(),
            request.getLongitude());

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    private UUID getCurrentOfficialId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        Official official = officialAuthService.getOfficialByEmail(email);
        return official.getId();
    }
}
