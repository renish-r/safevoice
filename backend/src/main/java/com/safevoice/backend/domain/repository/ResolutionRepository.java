package com.safevoice.backend.domain.repository;

import com.safevoice.backend.domain.entity.Resolution;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.safevoice.backend.domain.entity.Resolution.VerificationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;
import java.util.UUID;

@Repository
public interface ResolutionRepository extends JpaRepository<Resolution, UUID> {
    List<Resolution> findByProblemId(UUID problemId);
    Page<Resolution> findByVerificationStatusOrderByCreatedAtDesc(VerificationStatus verificationStatus, Pageable pageable);
}
