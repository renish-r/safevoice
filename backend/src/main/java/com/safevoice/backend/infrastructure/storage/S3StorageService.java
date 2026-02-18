package com.safevoice.backend.infrastructure.storage;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectResponse;
import software.amazon.awssdk.core.sync.RequestBody;

import java.io.IOException;
import java.util.UUID;

@Slf4j
@Service
public class S3StorageService {

    private final S3Client s3Client;

    @Value("${aws.s3.bucket-name}")
    private String bucketName;

    @Value("${aws.s3.region}")
    private String region;

    public S3StorageService(S3Client s3Client) {
        this.s3Client = s3Client;
    }

    public String uploadImage(MultipartFile file, String folderPrefix) {
        try {
            String fileName = folderPrefix + "/" + UUID.randomUUID() + "_" + file.getOriginalFilename();
            
            byte[] fileContent = file.getBytes();
            
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(fileName)
                .contentType(file.getContentType())
                .contentLength((long) fileContent.length)
                .build();

            PutObjectResponse response = s3Client.putObject(putObjectRequest,
                RequestBody.fromBytes(fileContent));

            String imageUrl = String.format("https://%s.s3.%s.amazonaws.com/%s",
                bucketName, region, fileName);

            log.info("Image uploaded successfully to S3: {}", imageUrl);
            return imageUrl;

        } catch (IOException e) {
            log.error("Error uploading file to S3", e);
            throw new RuntimeException("Failed to upload file to S3", e);
        }
    }

    public void deleteImage(String imageUrl) {
        try {
            String key = extractKeyFromUrl(imageUrl);
            s3Client.deleteObject(req -> req.bucket(bucketName).key(key));
            log.info("Image deleted from S3: {}", imageUrl);
        } catch (Exception e) {
            log.warn("Error deleting file from S3: {}", imageUrl, e);
        }
    }

    private String extractKeyFromUrl(String imageUrl) {
        // Extract key from S3 URL
        String[] parts = imageUrl.split("/");
        return String.join("/", java.util.Arrays.copyOfRange(parts, 4, parts.length));
    }
}
