package com.shopnest.dto;

import com.shopnest.entity.Category;
import com.shopnest.entity.Product;
import com.shopnest.entity.Review;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.Instant;

public final class CatalogDtos {

    private CatalogDtos() {
    }

    public record CategoryRequest(
            @NotBlank @Size(max = 60) String name,
            @Size(max = 255) String description) {
    }

    public record CategoryResponse(Long id, String name, String description) {

        public static CategoryResponse from(Category category) {
            return new CategoryResponse(category.getId(), category.getName(), category.getDescription());
        }
    }

    public record ProductRequest(
            @NotBlank @Size(max = 120) String name,
            @Size(max = 2000) String description,
            @NotNull @DecimalMin(value = "1.00") @Digits(integer = 10, fraction = 2) BigDecimal price,
            @Min(0) @Max(90) int discountPercent,
            @Min(0) int stock,
            @Size(max = 500) String imageUrl,
            @NotNull Long categoryId,
            Boolean active) {
    }

    public record ProductResponse(
            Long id,
            String name,
            String description,
            BigDecimal price,
            int discountPercent,
            BigDecimal sellingPrice,
            int stock,
            String imageUrl,
            Long categoryId,
            String categoryName,
            double averageRating,
            int reviewCount,
            boolean active,
            Instant createdAt) {

        public static ProductResponse from(Product p) {
            return new ProductResponse(
                    p.getId(), p.getName(), p.getDescription(), p.getPrice(), p.getDiscountPercent(),
                    p.getSellingPrice(), p.getStock(), p.getImageUrl(),
                    p.getCategory().getId(), p.getCategory().getName(),
                    Math.round(p.getAverageRating() * 10) / 10.0, p.getReviewCount(),
                    p.isActive(), p.getCreatedAt());
        }
    }

    public record ReviewRequest(
            @Min(1) @Max(5) int rating,
            @Size(max = 1000) String comment) {
    }

    public record ReviewResponse(Long id, int rating, String comment, Long reviewerId, String reviewerName,
                                 boolean verifiedPurchase, Instant createdAt) {

        public static ReviewResponse from(Review r) {
            return new ReviewResponse(r.getId(), r.getRating(), r.getComment(),
                    r.getUser().getId(), r.getUser().getFullName(), r.isVerifiedPurchase(), r.getCreatedAt());
        }
    }
}
