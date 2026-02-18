package com.safevoice.backend.application.service;

import com.safevoice.backend.api.dto.AIModerationResponse;
import com.safevoice.backend.api.dto.CreateProblemRequest;
import com.safevoice.backend.api.dto.ProblemPageResponse;
import com.safevoice.backend.api.dto.ProblemResponse;
import com.safevoice.backend.domain.entity.Problem;
import com.safevoice.backend.domain.repository.ProblemRepository;
import com.safevoice.backend.infrastructure.exception.ExternalServiceException;
import com.safevoice.backend.infrastructure.exception.ResourceNotFoundException;
import com.safevoice.backend.infrastructure.exception.ValidationException;
import com.safevoice.backend.infrastructure.http.AIServiceClient;
import com.safevoice.backend.infrastructure.image.ImageProcessingService;
import com.safevoice.backend.infrastructure.storage.SupabaseStorageService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@Transactional
public class ProblemService {

    private final ProblemRepository problemRepository;
    private final SupabaseStorageService storageService;
    private final ImageProcessingService imageProcessingService;
    private final AIServiceClient aiServiceClient;

    @Value("${ai.service.moderation-threshold:0.8}")
    private Double moderationThreshold;

    public ProblemService(
            ProblemRepository problemRepository,
            SupabaseStorageService storageService,
            ImageProcessingService imageProcessingService,
            AIServiceClient aiServiceClient) {
        this.problemRepository = problemRepository;
        this.storageService = storageService;
        this.imageProcessingService = imageProcessingService;
        this.aiServiceClient = aiServiceClient;
    }

    public ProblemResponse createProblem(CreateProblemRequest request, String ipAddress) {
        log.info("Creating new problem from IP: {}", ipAddress);

        // Validate image
        imageProcessingService.validateImage(request.getImageFile());

        // Strip metadata
        byte[] cleanImageData = imageProcessingService.removeExifMetadata(request.getImageFile());

        // Call AI Moderation Service
        AIModerationResponse moderationResult = aiServiceClient.callModerationService(request.getImageFile());

        log.info("Moderation result - NSFW: {}, Violence: {}, Confidence: {}",
            moderationResult.getNsfwScore(),
            moderationResult.getViolenceScore(),
            moderationResult.getFinalConfidence());

        // Check if moderation confidence exceeds threshold
        if (moderationResult.getFinalConfidence() > moderationThreshold) {
            log.warn("Problem rejected due to high moderation confidence: {}", moderationResult.getFinalConfidence());
            throw new ValidationException("Content rejected due to moderation policy violation");
        }

        // Upload image to Supabase Storage
        String imageUrl = storageService.uploadImage(request.getImageFile(), "problems");

        // Save problem to database
        Problem problem = Problem.builder()
            .imageUrl(imageUrl)
            .latitude(request.getLatitude())
            .longitude(request.getLongitude())
            .description(request.getDescription())
            .status(Problem.ProblemStatus.OPEN)
            .aiModerationScore(moderationResult.getFinalConfidence())
            .moderationPassed(true)
            .reporterIpAddress(ipAddress)
            .build();

        Problem savedProblem = problemRepository.save(problem);
        log.info("Problem created successfully with ID: {}", savedProblem.getId());

        return mapToResponse(savedProblem);
    }

    public ProblemPageResponse getAllProblems(Pageable pageable) {
        log.debug("Fetching problems with pagination: page={}, size={}", pageable.getPageNumber(), pageable.getPageSize());

        Page<Problem> page = problemRepository.findAll(pageable);

        return ProblemPageResponse.builder()
            .content(page.getContent().stream().map(this::mapToResponse).collect(Collectors.toList()))
            .pageNumber(page.getNumber())
            .pageSize(page.getSize())
            .totalElements(page.getTotalElements())
            .totalPages(page.getTotalPages())
            .isLast(page.isLast())
            .build();
    }

    public ProblemResponse getProblemById(UUID problemId) {
        log.debug("Fetching problem with ID: {}", problemId);

        Problem problem = problemRepository.findById(problemId)
            .orElseThrow(() -> new ResourceNotFoundException("Problem not found with ID: " + problemId));

        return mapToResponse(problem);
    }

    public ProblemResponse updateProblemStatus(UUID problemId, Problem.ProblemStatus newStatus) {
        log.info("Updating problem {} status to {}", problemId, newStatus);

        Problem problem = problemRepository.findById(problemId)
            .orElseThrow(() -> new ResourceNotFoundException("Problem not found with ID: " + problemId));

        problem.setStatus(newStatus);
        Problem updatedProblem = problemRepository.save(problem);

        log.info("Problem status updated successfully");
        return mapToResponse(updatedProblem);
    }

    private ProblemResponse mapToResponse(Problem problem) {
        return ProblemResponse.builder()
            .id(problem.getId())
            .imageUrl(problem.getImageUrl())
            .latitude(problem.getLatitude())
            .longitude(problem.getLongitude())
            .description(problem.getDescription())
            .status(problem.getStatus())
            .aiModerationScore(problem.getAiModerationScore())
            .createdAt(problem.getCreatedAt())
            .updatedAt(problem.getUpdatedAt())
            .resolutionCount(problem.getResolutions() != null ? problem.getResolutions().size() : 0)
            .build();
    }
}
