package com.safevoice.backend.infrastructure.storage;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class SupabaseStorageService {
    private static final Pattern UNSAFE_FILENAME_CHARS = Pattern.compile("[^a-zA-Z0-9._-]");

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.bucket-name}")
    private String bucketName;

    @Value("${supabase.service-key}")
    private String serviceKey;

    private final RestTemplate restTemplate;

    public String uploadImage(MultipartFile file, String folderPrefix) {
        try {
            String safeName = sanitizeFileName(file.getOriginalFilename());
            String fileName = folderPrefix + "/" + UUID.randomUUID() + "_" + safeName;
            String uploadUrl = supabaseUrl + "/storage/v1/object/" + bucketName + "/" + fileName;

            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(serviceKey);
            headers.setContentType(MediaType.parseMediaType(file.getContentType() == null
                ? MediaType.APPLICATION_OCTET_STREAM_VALUE
                : file.getContentType()));

            HttpEntity<byte[]> entity = new HttpEntity<>(file.getBytes(), headers);
            ResponseEntity<String> response = restTemplate.exchange(uploadUrl, HttpMethod.POST, entity, String.class);

            if (!response.getStatusCode().is2xxSuccessful()) {
                log.error("Supabase upload failed: status={}, body={}", response.getStatusCode(), response.getBody());
                throw new RuntimeException("Supabase upload failed with status " + response.getStatusCode());
            }

            // Construct the public URL for accessing the uploaded image
            String publicUrl = supabaseUrl + "/storage/v1/object/public/" + bucketName + "/" + fileName;
            log.info("Image uploaded successfully: {}", publicUrl);
            return publicUrl;
        } catch (IOException ex) {
            log.error("Error uploading file to Supabase", ex);
            throw new RuntimeException("Failed to upload file to Supabase", ex);
        }
    }

    private String sanitizeFileName(String originalFilename) {
        String value = (originalFilename == null || originalFilename.isBlank()) ? "upload" : originalFilename.trim();
        value = value.replace("\\", "_").replace("/", "_");
        value = UNSAFE_FILENAME_CHARS.matcher(value).replaceAll("_");
        return value;
    }
}
