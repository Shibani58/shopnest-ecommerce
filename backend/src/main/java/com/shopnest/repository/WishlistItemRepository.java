package com.shopnest.repository;

import com.shopnest.entity.WishlistItem;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;

import java.util.List;
import java.util.Optional;

public interface WishlistItemRepository extends JpaRepository<WishlistItem, Long> {

    @EntityGraph(attributePaths = {"product", "product.category"})
    List<WishlistItem> findByUserIdOrderByAddedAtDesc(Long userId);

    Optional<WishlistItem> findByUserIdAndProductId(Long userId, Long productId);

    @Modifying
    void deleteByProductId(Long productId);
}
