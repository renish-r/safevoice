package com.safevoice.backend.domain.repository;

import com.safevoice.backend.domain.entity.Problem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ProblemRepository extends JpaRepository<Problem, UUID> {
    Page<Problem> findByStatus(Problem.ProblemStatus status, Pageable pageable);
    Page<Problem> findAll(Pageable pageable);
}
