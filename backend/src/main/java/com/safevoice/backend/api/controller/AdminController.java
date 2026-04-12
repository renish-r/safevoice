package com.safevoice.backend.api.controller;

import com.safevoice.backend.api.dto.OfficialProfileResponse;
import com.safevoice.backend.application.service.OfficialAuthService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final OfficialAuthService officialAuthService;

    public AdminController(OfficialAuthService officialAuthService) {
        this.officialAuthService = officialAuthService;
    }

    @GetMapping("/officials")
    public ResponseEntity<List<OfficialProfileResponse>> listOfficials() {
        log.info("Fetching all officials for admin");
        return ResponseEntity.ok(officialAuthService.getAllOfficials());
    }

    @PutMapping("/officials/{id}")
    public ResponseEntity<OfficialProfileResponse> updateVerificationStatus(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "true") boolean verified) {
        log.info("Updating verification status for official {} to {}", id, verified);
        return ResponseEntity.ok(officialAuthService.updateOfficialVerification(id, verified));
    }
}
