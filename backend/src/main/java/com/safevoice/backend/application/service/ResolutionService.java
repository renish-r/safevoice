package com.safevoice.backend.application.service;

import com.safevoice.backend.api.dto.AIVerificationResponse;
import com.safevoice.backend.api.dto.AIModerationResponse;
import com.safevoice.backend.api.dto.ResolvedPostResponse;
import com.safevoice.backend.api.dto.ResolutionResponse;
import com.safevoice.backend.domain.entity.Problem;
import com.safevoice.backend.domain.entity.Resolution;
import com.safevoice.backend.domain.repository.ProblemRepository;
import com.safevoice.backend.domain.repository.ResolutionRepository;
import com.safevoice.backend.infrastructure.exception.ExternalServiceException;
import com.safevoice.backend.infrastructure.exception.ResourceNotFoundException;
import com.safevoice.backend.infrastructure.exception.ValidationException;
import com.safevoice.backend.infrastructure.http.AIServiceClient;
import com.safevoice.backend.infrastructure.image.ImageProcessingService;
import com.safevoice.backend.infrastructure.storage.SupabaseStorageService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@Transactional
public class ResolutionService {

    private final ResolutionRepository resolutionRepository;
    private final ProblemRepository problemRepository;
    private final SupabaseStorageService storageService;
    private final ImageProcessingService imageProcessingService;
    private final AIServiceClient aiServiceClient;
    private final RestTemplate restTemplate;

    @Value("${ai.service.verification-threshold:0.60}")
    private Double verificationThreshold;
    @Value("${resolution.moderation.threshold:0.65}")
    private Double resolutionModerationThreshold;
    @Value("${resolution.verification.max-similarity:0.97}")
    private Double maxSimilarityForResolved;
    @Value("${resolution.verification.max-distance-km:2.0}")
    private Double maxDistanceKm;
    @Value("${resolution.verification.description-min-jaccard:0.35}")
    private Double minDescriptionJaccard;

    public ResolutionService(
            ResolutionRepository resolutionRepository,
            ProblemRepository problemRepository,
            SupabaseStorageService storageService,
            ImageProcessingService imageProcessingService,
            AIServiceClient aiServiceClient,
            RestTemplate restTemplate) {
        this.resolutionRepository = resolutionRepository;
        this.problemRepository = problemRepository;
        this.storageService = storageService;
        this.imageProcessingService = imageProcessingService;
        this.aiServiceClient = aiServiceClient;
        this.restTemplate = restTemplate;
    }

    public ResolutionResponse uploadResolution(
            UUID problemId,
            UUID officialId,
            MultipartFile resolvedImage,
            String resolutionDescription,
            Double officialLatitude,
            Double officialLongitude) {
        log.info("Official {} uploading resolution for problem {}", officialId, problemId);

        // Validate image
        imageProcessingService.validateImage(resolvedImage);

        // Moderate official resolution image as well (no unsafe content in resolved feed)
        AIModerationResponse resolutionModeration = aiServiceClient.callModerationService(resolvedImage);
        boolean unsafeResolvedImage = Boolean.TRUE.equals(resolutionModeration.getOcrFlag())
            || resolutionModeration.getNsfwScore() > resolutionModerationThreshold
            || resolutionModeration.getViolenceScore() > resolutionModerationThreshold
            || resolutionModeration.getFinalConfidence() > resolutionModerationThreshold;
        if (unsafeResolvedImage) {
            String moderationReason = String.format(
                "Resolved image rejected by moderation policy (nsfw=%.3f, violence=%.3f, ocr=%s, final=%.3f)",
                resolutionModeration.getNsfwScore(),
                resolutionModeration.getViolenceScore(),
                resolutionModeration.getOcrFlag(),
                resolutionModeration.getFinalConfidence()
            );
            log.warn(moderationReason);
            throw new ValidationException(moderationReason);
        }

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

        // Determine verification status from multiple signals
        Resolution.VerificationStatus status;
        String verificationReason;
        boolean locationMatched = isLocationMatched(
            problem.getLatitude(), problem.getLongitude(), officialLatitude, officialLongitude);
        boolean descriptionMatched = isDescriptionMatched(problem.getDescription(), resolutionDescription);
        boolean meaningfulChange = verificationResult.getSimilarityScore() < maxSimilarityForResolved;

        if (verificationResult.getDeepfakeDetected()) {
            status = Resolution.VerificationStatus.REJECTED;
            verificationReason = "Rejected: deepfake detected in resolution image";
            log.warn("Resolution rejected due to deepfake detection");
        } else if (locationMatched
                && meaningfulChange
                && (verificationResult.getSimilarityScore() > verificationThreshold || descriptionMatched)) {
            status = Resolution.VerificationStatus.VERIFIED;
            verificationReason = descriptionMatched
                ? "Verified: location and description checks passed"
                : "Verified: location and image similarity checks passed";
            problem.setStatus(Problem.ProblemStatus.RESOLVED);
            problemRepository.save(problem);
            log.info("Problem marked as RESOLVED");
        } else {
            status = Resolution.VerificationStatus.REJECTED;
            if (!locationMatched) {
                verificationReason = "location too far from issue";
            } else {
                StringBuilder reason = new StringBuilder("Rejected: ");
                if (!descriptionMatched) {
                    reason.append("description mismatch; ");
                }
                if (verificationResult.getSimilarityScore() <= verificationThreshold) {
                    reason.append("low image similarity; ");
                }
                if (!meaningfulChange) {
                    reason.append("resolved image is too similar to original; ");
                }
                verificationReason = reason.toString().trim();
            }
            log.warn("Resolution rejected. {}", verificationReason);
        }

        // Save resolution
        Resolution resolution = Resolution.builder()
            .problem(problem)
            .officialId(officialId)
            .resolvedImageUrl(resolvedImageUrl)
            .officialDescription(resolutionDescription)
            .officialLatitude(officialLatitude)
            .officialLongitude(officialLongitude)
            .aiSimilarityScore(verificationResult.getSimilarityScore())
            .deepfakeDetected(verificationResult.getDeepfakeDetected())
            .verificationStatus(status)
            .verificationReason(verificationReason)
            .build();

        Resolution savedResolution = resolutionRepository.save(resolution);
        log.info("Resolution saved successfully with ID: {}", savedResolution.getId());

        return mapToResponse(savedResolution);
    }

    private MultipartFile downloadImageFromUrl(String imageUrl) {
        try {
            ResponseEntity<byte[]> response = restTemplate.getForEntity(toSafeUri(imageUrl), byte[].class);
            byte[] imageBytes = response.getBody();

            if (imageBytes == null || imageBytes.length == 0) {
                throw new ExternalServiceException("Downloaded original image is empty");
            }

            String contentType = resolveContentType(response.getHeaders(), imageUrl);
            String fileName = extractFileName(imageUrl);

            return new InMemoryMultipartFile("original", fileName, contentType, imageBytes);
        } catch (IllegalArgumentException | RestClientException ex) {
            log.error("Failed to download original image from URL: {}", imageUrl, ex);
            throw new ExternalServiceException("Failed to download original image", ex);
        }
    }

    public Page<ResolvedPostResponse> getResolvedPosts(Pageable pageable) {
        return resolutionRepository
            .findByVerificationStatusOrderByCreatedAtDesc(Resolution.VerificationStatus.VERIFIED, pageable)
            .map(this::mapToResolvedPostResponse);
    }

    private URI toSafeUri(String rawUrl) {
        try {
            return URI.create(rawUrl);
        } catch (IllegalArgumentException ex) {
            // Handle legacy URLs that include spaces from unsanitized filenames.
            String encoded = rawUrl.replace(" ", "%20");
            return URI.create(encoded);
        }
    }

    private String resolveContentType(HttpHeaders headers, String imageUrl) {
        String headerType = headers.getFirst(HttpHeaders.CONTENT_TYPE);
        if (headerType != null && !headerType.isBlank()) {
            return headerType.split(";")[0].trim();
        }

        String lowerUrl = imageUrl.toLowerCase();
        if (lowerUrl.endsWith(".png")) {
            return "image/png";
        }
        if (lowerUrl.endsWith(".webp")) {
            return "image/webp";
        }
        if (lowerUrl.endsWith(".gif")) {
            return "image/gif";
        }
        return "image/jpeg";
    }

    private String extractFileName(String imageUrl) {
        String path = toSafeUri(imageUrl).getPath();
        if (path == null || path.isBlank()) {
            return "original.jpg";
        }

        int lastSlash = path.lastIndexOf('/');
        String fileName = lastSlash >= 0 ? path.substring(lastSlash + 1) : path;
        return fileName.isBlank() ? "original.jpg" : fileName;
    }

    private static class InMemoryMultipartFile implements MultipartFile {
        private final String name;
        private final String originalFilename;
        private final String contentType;
        private final byte[] content;

        private InMemoryMultipartFile(String name, String originalFilename, String contentType, byte[] content) {
            this.name = name;
            this.originalFilename = originalFilename;
            this.contentType = contentType;
            this.content = content;
        }

        @Override
        public String getName() {
            return name;
        }

        @Override
        public String getOriginalFilename() {
            return originalFilename;
        }

        @Override
        public String getContentType() {
            return contentType;
        }

        @Override
        public boolean isEmpty() {
            return content.length == 0;
        }

        @Override
        public long getSize() {
            return content.length;
        }

        @Override
        public byte[] getBytes() {
            return content;
        }

        @Override
        public InputStream getInputStream() {
            return new ByteArrayInputStream(content);
        }

        @Override
        public void transferTo(java.io.File dest) throws IOException, IllegalStateException {
            throw new UnsupportedOperationException("transferTo(File) is not supported for in-memory files");
        }
    }

    private ResolutionResponse mapToResponse(Resolution resolution) {
        return ResolutionResponse.builder()
            .id(resolution.getId())
            .problemId(resolution.getProblem().getId())
            .officialId(resolution.getOfficialId())
            .resolvedImageUrl(resolution.getResolvedImageUrl())
            .officialDescription(resolution.getOfficialDescription())
            .officialLatitude(resolution.getOfficialLatitude())
            .officialLongitude(resolution.getOfficialLongitude())
            .aiSimilarityScore(resolution.getAiSimilarityScore())
            .deepfakeDetected(resolution.getDeepfakeDetected())
            .verificationStatus(resolution.getVerificationStatus())
            .verificationReason(resolution.getVerificationReason())
            .createdAt(resolution.getCreatedAt())
            .build();
    }

    private ResolvedPostResponse mapToResolvedPostResponse(Resolution resolution) {
        Problem problem = resolution.getProblem();
        return ResolvedPostResponse.builder()
            .problemId(problem.getId())
            .resolutionId(resolution.getId())
            .originalImageUrl(problem.getImageUrl())
            .resolvedImageUrl(resolution.getResolvedImageUrl())
            .originalDescription(problem.getDescription())
            .officialDescription(resolution.getOfficialDescription())
            .problemLatitude(problem.getLatitude())
            .problemLongitude(problem.getLongitude())
            .officialLatitude(resolution.getOfficialLatitude())
            .officialLongitude(resolution.getOfficialLongitude())
            .aiSimilarityScore(resolution.getAiSimilarityScore())
            .verificationReason(resolution.getVerificationReason())
            .resolvedAt(resolution.getCreatedAt())
            .build();
    }

    private boolean isLocationMatched(
            Double problemLatitude,
            Double problemLongitude,
            Double officialLatitude,
            Double officialLongitude) {
        if (problemLatitude == null || problemLongitude == null || officialLatitude == null || officialLongitude == null) {
            return false;
        }

        double distanceKm = haversineKm(problemLatitude, problemLongitude, officialLatitude, officialLongitude);
        return distanceKm <= maxDistanceKm;
    }

    private double haversineKm(double lat1, double lon1, double lat2, double lon2) {
        final double earthRadiusKm = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
            + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
            * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return earthRadiusKm * c;
    }

    private boolean isDescriptionMatched(String problemDescription, String resolutionDescription) {
        Set<String> problemTokens = tokenize(problemDescription);
        Set<String> resolutionTokens = tokenize(resolutionDescription);

        if (problemTokens.isEmpty() || resolutionTokens.isEmpty()) {
            return false;
        }

        Set<String> intersection = problemTokens.stream()
            .filter(resolutionTokens::contains)
            .collect(Collectors.toSet());

        Set<String> union = problemTokens.stream().collect(Collectors.toSet());
        union.addAll(resolutionTokens);

        double jaccard = (double) intersection.size() / (double) union.size();
        return jaccard >= minDescriptionJaccard;
    }

    private Set<String> tokenize(String text) {
        if (text == null || text.isBlank()) {
            return Set.of();
        }
        return java.util.Arrays.stream(text.toLowerCase().split("\\W+"))
            .filter(token -> token.length() >= 4)
            .collect(Collectors.toSet());
    }
}
