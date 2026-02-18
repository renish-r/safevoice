package com.safevoice.backend.infrastructure.http;

import com.safevoice.backend.api.dto.AIModerationResponse;
import com.safevoice.backend.api.dto.AIVerificationResponse;
import com.safevoice.backend.infrastructure.exception.ExternalServiceException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Slf4j
@Service
public class AIServiceClient {

    private final RestTemplate restTemplate;

    @Value("${ai.service.moderation-url}")
    private String moderationUrl;

    @Value("${ai.service.verification-url}")
    private String verificationUrl;

    @Value("${ai.service.timeout-seconds:30}")
    private Integer timeoutSeconds;

    public AIServiceClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public AIModerationResponse callModerationService(MultipartFile imageFile) {
        try {
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", new ByteArrayResource(imageFile.getBytes()) {
                @Override
                public String getFilename() {
                    return imageFile.getOriginalFilename();
                }
            });

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);
            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

            log.info("Calling AI moderation service");
            ResponseEntity<AIModerationResponse> response = restTemplate.postForEntity(
                moderationUrl, requestEntity, AIModerationResponse.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                log.info("AI moderation completed. Confidence: {}", response.getBody().getFinalConfidence());
                return response.getBody();
            }

            throw new ExternalServiceException("AI moderation service returned error status");

        } catch (IOException e) {
            log.error("Error reading image file for moderation", e);
            throw new ExternalServiceException("Failed to process image for moderation", e);
        } catch (RestClientException e) {
            log.error("Error calling AI moderation service", e);
            throw new ExternalServiceException("Failed to call AI moderation service", e);
        }
    }

    public AIVerificationResponse callVerificationService(MultipartFile originalImage, MultipartFile resolvedImage) {
        try {
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("original", new ByteArrayResource(originalImage.getBytes()) {
                @Override
                public String getFilename() {
                    return originalImage.getOriginalFilename();
                }
            });
            body.add("resolved", new ByteArrayResource(resolvedImage.getBytes()) {
                @Override
                public String getFilename() {
                    return resolvedImage.getOriginalFilename();
                }
            });

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);
            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

            log.info("Calling AI verification service");
            ResponseEntity<AIVerificationResponse> response = restTemplate.postForEntity(
                verificationUrl, requestEntity, AIVerificationResponse.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                log.info("AI verification completed. Status: {}", response.getBody().getVerificationStatus());
                return response.getBody();
            }

            throw new ExternalServiceException("AI verification service returned error status");

        } catch (IOException e) {
            log.error("Error reading image files for verification", e);
            throw new ExternalServiceException("Failed to process images for verification", e);
        } catch (RestClientException e) {
            log.error("Error calling AI verification service", e);
            throw new ExternalServiceException("Failed to call AI verification service", e);
        }
    }
}
