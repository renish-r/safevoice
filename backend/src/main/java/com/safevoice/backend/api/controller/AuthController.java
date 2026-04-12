package com.safevoice.backend.api.controller;

import com.safevoice.backend.api.dto.AuthResponse;
import com.safevoice.backend.api.dto.LoginRequest;
import com.safevoice.backend.api.dto.OfficialProfileResponse;
import com.safevoice.backend.api.dto.OfficialRegisterRequest;
import com.safevoice.backend.application.service.OfficialAuthService;
import com.safevoice.backend.domain.entity.Official;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final OfficialAuthService officialAuthService;

    public AuthController(OfficialAuthService officialAuthService) {
        this.officialAuthService = officialAuthService;
    }

    @PostMapping("/register")
    public ResponseEntity<String> registerOfficial(@Valid @RequestBody OfficialRegisterRequest request) {
        log.info("Registering new official: {}", request.getEmail());
        officialAuthService.registerOfficial(request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body("Official registered successfully. Awaiting admin verification.");
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        log.info("Login request from: {}", request.getEmail());
        AuthResponse response = officialAuthService.login(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<OfficialProfileResponse> getCurrentUserProfile() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        log.info("Fetching profile for official: {}", email);
        
        Official official = officialAuthService.getOfficialByEmail(email);
        OfficialProfileResponse profile = OfficialProfileResponse.from(official);
        
        return ResponseEntity.ok(profile);
    }
}
