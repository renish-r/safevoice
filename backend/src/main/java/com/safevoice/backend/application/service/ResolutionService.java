package com.safevoice.backend.application.service;

import com.safevoice.backend.api.dto.AIVerificationResponse;
import com.safevoice.backend.api.dto.ResolutionResponse;
import com.safevoice.backend.api.dto.UploadResolutionRequest;
import com.safevoice.backend.domain.entity.Problem;
import com.safevoice.backend.domain.entity.Resolution;
import com.safevoice.backend.domain.repository.ProblemRepository;
import com.safevoice.backend.domain.repository.ResolutionRepository;
import com.safevoice.backend.infrastructure.exception.ExternalServiceException;
import com.safevoice.backend.infrastructure.exception.ResourceNotFoundException;
import com.safevoice.backend.infrastructure.http.AIServiceClient;
import com.safevoice.backend.infrastructure.image.ImageProcessingService;
import com.safevoice.backend.infrastructure.storage.SupabaseStorageService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@Slf4j
@Service
@Transactional
public class ResolutionService {

    private final ResolutionRepository resolutionRepository;
    private final ProblemRepository problemRepository;
    private final SupabaseStorageService storageService;
    private final ImageProcessingService imageProcessingService;
    private final AIServiceClient aiServiceClient;

    @Value("${ai.service.verification-threshold:0.7}")
    private Double verificationThreshold;

    public ResolutionService(
            ResolutionRepository resolutionRepository,
            ProblemRepository problemRepository,
            SupabaseStorageService storageService,
            ImageProcessingService imageProcessingService,
            AIServiceClient aiServiceClient) {
        this.resolutionRepository = resolutionRepository;
        this.problemRepository = problemRepository;
        this.storageService = storageService;
        this.imageProcessingService = imageProcessingService;
        this.aiServiceClient = aiServiceClient;
    }

    public ResolutionResponse uploadResolution(UUID problemId, UUID officialId, MultipartFile resolvedImage) {
        log.info("Official {} uploading resolution for problem {}", officialId, problemId);

        // Validate image
        imageProcessingService.validateImage(resolvedImage);

        // Fetch original problem
        Problem problem = problemRepository.findById(problemId)
            .orElseThrow(() -> new ResourceNotFoundException("Problem not found with ID: " + problemId));

        // Download original image from storage
        MultipartFile originalImageFile = downloadImageFromUrl(problem.getImageUrl());

        // Call AI Verification Service
        AIVerificationResponse verificationResult = aiServiceClient.callVerificationService(
            originalImageFile, resolvedImage);

        log.info("Verification result - Similarity: {}, Deepfake: {}, Status: {}",
            verificationResult.getSimilarityScore(),
            verificationResult.getDeepfakeDetected(),
            verificationResult.getVerificationStatus());

        // Upload resolved image to Supabase Storage
        String resolvedImageUrl = storageService.uploadImage(resolvedImage, "resolutions");

        // Determine verification status
        Resolution.VerificationStatus status;
        if (verificationResult.getDeepfakeDetected()) {
            status = Resolution.VerificationStatus.REJECTED;
            log.warn("Resolution rejected due to deepfake detection");
        } else if (verificationResult.getSimilarityScore() > verificationThreshold) {
            status = Resolution.VerificationStatus.VERIFIED;
            problem.setStatus(Problem.ProblemStatus.RESOLVED);
            problemRepository.save(problem);
            log.info("Problem marked as RESOLVED");
        } else {
            status = Resolution.VerificationStatus.REJECTED;
            log.warn("Resolution rejected due to low similarity score");
        }

        // Save resolution
        Resolution resolution = Resolution.builder()
            .problem(problem)
            .officialId(officialId)
            .resolvedImageUrl(resolvedImageUrl)
            .aiSimilarityScore(verificationResult.getSimilarityScore())
            .deepfakeDetected(verificationResult.getDeepfakeDetected())
            .verificationStatus(status)
            .build();

        Resolution savedResolution = resolutionRepository.save(resolution);
        log.info("Resolution saved successfully with ID: {}", savedResolution.getId());

        return mapToResponse(savedResolution);
    }

    private MultipartFile downloadImageFromUrl(String imageUrl) {
        // In a production system, implement proper storage download or convert URL to MultipartFile
        // For now, this is a placeholder
        throw new ExternalServiceException("Image download not yet implemented");
    }

    private ResolutionResponse mapToResponse(Resolution resolution) {
        return ResolutionResponse.builder()
            .id(resolution.getId())
            .problemId(resolution.getProblem().getId())
            .officialId(resolution.getOfficialId())
            .resolvedImageUrl(resolution.getResolvedImageUrl())
            .aiSimilarityScore(resolution.getAiSimilarityScore())
            .deepfakeDetected(resolution.getDeepfakeDetected())
            .verificationStatus(resolution.getVerificationStatus())
            .createdAt(resolution.getCreatedAt())
            .build();
    }
}
