package com.safevoice.backend.domain.repository;

import com.safevoice.backend.domain.entity.Official;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface OfficialRepository extends JpaRepository<Official, UUID> {
    Optional<Official> findByEmail(String email);
    Optional<Official> findByOfficialIdNumber(String officialIdNumber);
    boolean existsByOfficialIdNumber(String officialIdNumber);
}
