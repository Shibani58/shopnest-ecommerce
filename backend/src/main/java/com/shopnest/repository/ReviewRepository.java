package com.shopnest.repository;

import com.shopnest.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    @EntityGraph(attributePaths = "user")
    Page<Review> findByProductIdOrderByCreatedAtDesc(Long productId, Pageable pageable);

    Optional<Review> findByProductIdAndUserId(Long productId, Long userId);

    long countByProductId(Long productId);

    @Query("select coalesce(avg(r.rating), 0.0) from Review r where r.product.id = :productId")
    double averageRating(Long productId);
}
