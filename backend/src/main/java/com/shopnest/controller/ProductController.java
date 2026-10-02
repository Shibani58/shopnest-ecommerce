package com.shopnest.controller;

import com.shopnest.dto.CatalogDtos.*;
import com.shopnest.dto.PageResponse;
import com.shopnest.security.AppUserPrincipal;
import com.shopnest.service.ProductQuery;
import com.shopnest.service.ProductService;
import com.shopnest.service.ReviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

/** Browsing and reviews are public to read; product writes need ADMIN (see SecurityConfig). */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "Products & reviews")
public class ProductController {

    private final ProductService productService;
    private final ReviewService reviewService;

    @GetMapping("/products")
    @Operation(summary = "Search the catalogue", description = "sort: newest | price_asc | price_desc | rating | name")
    public PageResponse<ProductResponse> search(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(defaultValue = "false") boolean inStock,
            @RequestParam(defaultValue = "newest") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        var query = new ProductQuery(q, categoryId, minPrice, maxPrice, inStock, sort, page, size);
        return productService.search(query, false);
    }

    @GetMapping("/products/new-arrivals")
    public List<ProductResponse> newArrivals() {
        return productService.newArrivals();
    }

    @GetMapping("/products/{id}")
    public ProductResponse get(@PathVariable Long id) {
        return productService.findById(id, false);
    }

    @PostMapping("/products")
    @ResponseStatus(HttpStatus.CREATED)
    public ProductResponse create(@Valid @RequestBody ProductRequest req) {
        return productService.create(req);
    }

    @PutMapping("/products/{id}")
    public ProductResponse update(@PathVariable Long id, @Valid @RequestBody ProductRequest req) {
        return productService.update(id, req);
    }

    @DeleteMapping("/products/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Hide a product from the shop (soft delete)")
    public void delete(@PathVariable Long id) {
        productService.delete(id);
    }

    @GetMapping("/products/{id}/reviews")
    public PageResponse<ReviewResponse> reviews(@PathVariable Long id,
                                                @RequestParam(defaultValue = "0") int page,
                                                @RequestParam(defaultValue = "10") int size) {
        return reviewService.forProduct(id, page, size);
    }

    @PostMapping("/products/{id}/reviews")
    @Operation(summary = "Add a review, or update your existing one")
    public ReviewResponse review(@PathVariable Long id, @Valid @RequestBody ReviewRequest req,
                                 @AuthenticationPrincipal AppUserPrincipal me) {
        return reviewService.upsert(id, me.id(), req);
    }

    @DeleteMapping("/reviews/{reviewId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteReview(@PathVariable Long reviewId, @AuthenticationPrincipal AppUserPrincipal me) {
        reviewService.delete(reviewId, me);
    }
}
