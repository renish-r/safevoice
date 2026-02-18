package com.safevoice.backend.infrastructure.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
public class RateLimitingService {

    @Value("${rate-limiting.requests-per-minute:30}")
    private Integer requestsPerMinute;

    private final Map<String, Bucket> cache = new ConcurrentHashMap<>();

    public boolean isAllowed(String ipAddress) {

        Bucket bucket = cache.computeIfAbsent(ipAddress, key -> {
            Bandwidth limit = Bandwidth.builder()
                    .capacity(requestsPerMinute)
                    .refillIntervally(requestsPerMinute, Duration.ofMinutes(1))
                    .build();

            return Bucket.builder()
                    .addLimit(limit)
                    .build();
        });

        boolean allowed = bucket.tryConsume(1);

        if (!allowed) {
            log.warn("Rate limit exceeded for IP: {}", ipAddress);
        }

        return allowed;
    }
}