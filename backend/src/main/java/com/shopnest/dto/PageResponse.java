package com.shopnest.dto;

import org.springframework.data.domain.Page;

import java.util.List;

/** Stable JSON shape for paged results (Spring's own Page serialisation is not guaranteed). */
public record PageResponse<T>(List<T> content, int page, int size, long totalElements, int totalPages, boolean last) {

    public static <T> PageResponse<T> from(Page<T> page) {
        return new PageResponse<>(page.getContent(), page.getNumber(), page.getSize(),
                page.getTotalElements(), page.getTotalPages(), page.isLast());
    }
}
