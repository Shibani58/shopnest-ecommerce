package com.shopnest.service;

import org.springframework.data.domain.Sort;

import java.math.BigDecimal;

/** Catalogue search filters. Every field is optional. */
public record ProductQuery(
        String q,
        Long categoryId,
        BigDecimal minPrice,
        BigDecimal maxPrice,
        boolean inStockOnly,
        String sort,
        int page,
        int size) {

    public static final int MAX_PAGE_SIZE = 48;

    public int safePage() {
        return Math.max(page, 0);
    }

    public int safeSize() {
        return size < 1 ? 12 : Math.min(size, MAX_PAGE_SIZE);
    }

    public Sort toSort() {
        return switch (sort == null ? "" : sort) {
            case "price_asc" -> Sort.by("salePrice").ascending();
            case "price_desc" -> Sort.by("salePrice").descending();
            case "rating" -> Sort.by(Sort.Order.desc("averageRating"), Sort.Order.desc("reviewCount"));
            case "name" -> Sort.by("name").ascending();
            default -> Sort.by("createdAt").descending().and(Sort.by("id").descending());
        };
    }
}
