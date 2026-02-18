package com.safevoice.backend.application.service;

import com.safevoice.backend.api.dto.AuthResponse;
import com.safevoice.backend.api.dto.LoginRequest;
import com.safevoice.backend.api.dto.OfficialRegisterRequest;
import com.safevoice.backend.domain.entity.Official;
import com.safevoice.backend.domain.repository.OfficialRepository;
import com.safevoice.backend.infrastructure.exception.ValidationException;
import com.safevoice.backend.infrastructure.security.JwtTokenProvider;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@Transactional
public class OfficialAuthService {

    private final OfficialRepository officialRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public OfficialAuthService(
            OfficialRepository officialRepository,
            PasswordEncoder passwordEncoder,
            JwtTokenProvider jwtTokenProvider) {
        this.officialRepository = officialRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    public void registerOfficial(OfficialRegisterRequest request) {
        log.info("Registering new official: {}", request.getEmail());

        // Check if email already exists
        if (officialRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new ValidationException("Email already registered");
        }

        // Check if official ID already exists
        if (officialRepository.existsByOfficialIdNumber(request.getOfficialIdNumber())) {
            throw new ValidationException("Official ID number already registered");
        }

        // Create new official
        Official official = Official.builder()
            .email(request.getEmail())
            .passwordHash(passwordEncoder.encode(request.getPassword()))
            .fullName(request.getFullName())
            .officialIdNumber(request.getOfficialIdNumber())
            .department(request.getDepartment())
            .role(Official.OfficialRole.OFFICIAL)
            .isVerified(false) // Requires ADMIN verification
            .isActive(true)
            .build();

        officialRepository.save(official);
        log.info("Official registered successfully. Awaiting admin verification: {}", request.getEmail());
    }

    public AuthResponse login(LoginRequest request) {
        log.info("Login attempt for official: {}", request.getEmail());

        Official official = officialRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new ValidationException("Invalid email or password"));

        if (!official.getIsActive()) {
            log.warn("Login attempt on inactive official: {}", request.getEmail());
            throw new ValidationException("Official account is inactive");
        }

        if (!official.getIsVerified()) {
            log.warn("Login attempt on unverified official: {}", request.getEmail());
            throw new ValidationException("Official account is pending verification");
        }

        if (!passwordEncoder.matches(request.getPassword(), official.getPassword())) {
            log.warn("Failed login attempt for official: {}", request.getEmail());
            throw new ValidationException("Invalid email or password");
        }

        String token = jwtTokenProvider.generateToken(official);
        Long expiresIn = jwtTokenProvider.getExpirationTime();

        log.info("Official logged in successfully: {}", request.getEmail());

        return AuthResponse.builder()
            .accessToken(token)
            .tokenType("Bearer")
            .expiresIn(expiresIn)
            .email(official.getEmail())
            .build();
    }

    public Official getOfficialByEmail(String email) {
        return officialRepository.findByEmail(email)
            .orElseThrow(() -> new ValidationException("Official not found"));
    }
}
