package com.safevoice.backend.api.controller;

import com.safevoice.backend.api.dto.CreateProblemRequest;
import com.safevoice.backend.api.dto.ProblemPageResponse;
import com.safevoice.backend.api.dto.ProblemResponse;
import com.safevoice.backend.api.dto.UpdateProblemStatusRequest;
import com.safevoice.backend.application.service.ProblemService;
import com.safevoice.backend.domain.entity.Problem;
import com.safevoice.backend.infrastructure.security.RateLimitingService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/problems")
@CrossOrigin(origins = "*")
public class ProblemController {

    private final ProblemService problemService;
    private final RateLimitingService rateLimitingService;

    public ProblemController(
            ProblemService problemService,
            RateLimitingService rateLimitingService) {
        this.problemService = problemService;
        this.rateLimitingService = rateLimitingService;
    }

    @PostMapping
    public ResponseEntity<ProblemResponse> createProblem(
            @Valid @ModelAttribute CreateProblemRequest request,
            HttpServletRequest httpRequest) {
        
        String ipAddress = getClientIpAddress(httpRequest);
        log.info("Problem creation request from IP: {}", ipAddress);

        // Apply rate limiting
        if (!rateLimitingService.isAllowed(ipAddress)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .build();
        }

        ProblemResponse response = problemService.createProblem(request, ipAddress);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<ProblemPageResponse> getAllProblems(
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "10") Integer size) {
        
        log.info("Fetching problems: page={}, size={}", page, size);

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        ProblemPageResponse response = problemService.getAllProblems(pageable);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProblemResponse> getProblemById(@PathVariable UUID id) {
        log.info("Fetching problem with ID: {}", id);
        ProblemResponse response = problemService.getProblemById(id);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('OFFICIAL')")
    public ResponseEntity<ProblemResponse> updateProblemStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateProblemStatusRequest request) {
        
        log.info("Updating problem {} status to: {}", id, request.getStatus());

        Problem.ProblemStatus status = Problem.ProblemStatus.valueOf(request.getStatus().toUpperCase());
        ProblemResponse response = problemService.updateProblemStatus(id, status);

        return ResponseEntity.ok(response);
    }

    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0];
        }
        return request.getRemoteAddr();
    }
}
