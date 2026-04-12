package com.safevoice.backend.api.dto;

import com.safevoice.backend.domain.entity.Official;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OfficialProfileResponse {
    private UUID id;
    private String email;
    private String fullName;
    private String officialIdNumber;
    private String department;
    private Official.OfficialRole role;
    private Boolean isVerified;
    private Boolean isActive;
    private LocalDateTime createdAt;

    public static OfficialProfileResponse from(Official official) {
        return OfficialProfileResponse.builder()
            .id(official.getId())
            .email(official.getEmail())
            .fullName(official.getFullName())
            .officialIdNumber(official.getOfficialIdNumber())
            .department(official.getDepartment())
            .role(official.getRole())
            .isVerified(official.getIsVerified())
            .isActive(official.getIsActive())
            .createdAt(official.getCreatedAt())
            .build();
    }
}
