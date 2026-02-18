package com.safevoice.backend.api.controller;

import com.safevoice.backend.api.dto.AuthResponse;
import com.safevoice.backend.api.dto.LoginRequest;
import com.safevoice.backend.api.dto.OfficialRegisterRequest;
import com.safevoice.backend.application.service.OfficialAuthService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
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
}
