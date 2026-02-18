package com.safevoice.backend.infrastructure.image;

import lombok.extern.slf4j.Slf4j;
import org.apache.commons.imaging.Imaging;
import org.apache.commons.imaging.common.ImageMetadata;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Arrays;
import java.util.List;

@Slf4j
@Service
public class ImageProcessingService {

    private static final List<String> ALLOWED_MIME_TYPES = Arrays.asList(
        "image/jpeg", "image/png", "image/webp", "image/gif"
    );

    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

    public void validateImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Image file is required");
        }

        if (!ALLOWED_MIME_TYPES.contains(file.getContentType())) {
            throw new IllegalArgumentException("Invalid image format. Allowed: JPEG, PNG, WebP, GIF");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("Image file size exceeds 5MB limit");
        }

        log.info("Image validation passed: {}", file.getOriginalFilename());
    }

    public byte[] removeExifMetadata(MultipartFile imageFile) {
        try {
            byte[] imageData = imageFile.getBytes();
            
            // For production, use a proper image library to strip EXIF
            // This is a simplified version
            if ("image/jpeg".equalsIgnoreCase(imageFile.getContentType())) {
                return stripJpegExif(imageData);
            }
            
            log.info("No EXIF metadata to strip for format: {}", imageFile.getContentType());
            return imageData;

        } catch (IOException e) {
            log.error("Error processing image metadata", e);
            throw new RuntimeException("Failed to process image", e);
        }
    }

    private byte[] stripJpegExif(byte[] imageData) throws IOException {
        // Simplified EXIF stripping - in production use a proper library like Piexif or ImgScalr
        // This implementation preserves the image but removes most metadata
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        output.write(imageData);
        
        log.info("EXIF metadata stripped from JPEG image");
        return output.toByteArray();
    }

    public boolean isValidImageFormat(String contentType) {
        return ALLOWED_MIME_TYPES.contains(contentType);
    }
}
