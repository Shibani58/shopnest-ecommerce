package com.shopnest.service;

import com.shopnest.dto.CatalogDtos.ReviewRequest;
import com.shopnest.dto.CatalogDtos.ReviewResponse;
import com.shopnest.dto.PageResponse;
import com.shopnest.entity.Product;
import com.shopnest.entity.Review;
import com.shopnest.exception.ResourceNotFoundException;
import com.shopnest.repository.OrderRepository;
import com.shopnest.repository.ProductRepository;
import com.shopnest.repository.ReviewRepository;
import com.shopnest.repository.UserRepository;
import com.shopnest.security.AppUserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;

    @Transactional(readOnly = true)
    public PageResponse<ReviewResponse> forProduct(Long productId, int page, int size) {
        var pageable = PageRequest.of(Math.max(page, 0), Math.clamp(size, 1, 50));
        return PageResponse.from(reviewRepository.findByProductIdOrderByCreatedAtDesc(productId, pageable)
                .map(ReviewResponse::from));
    }

    /** One review per user per product: posting again updates the earlier review. */
    @Transactional
    public ReviewResponse upsert(Long productId, Long userId, ReviewRequest req) {
        Product product = productRepository.findById(productId)
                .filter(Product::isActive)
                .orElseThrow(() -> new ResourceNotFoundException("Product", productId));

        Review review = reviewRepository.findByProductIdAndUserId(productId, userId).orElseGet(() -> {
            Review r = new Review();
            r.setProduct(product);
            r.setUser(userRepository.getReferenceById(userId));
            return r;
        });
        review.setRating(req.rating());
        review.setComment(req.comment() == null ? null : req.comment().trim());
        review.setVerifiedPurchase(orderRepository.hasPurchased(userId, productId));
        Review saved = reviewRepository.saveAndFlush(review);

        refreshRating(product);
        return ReviewResponse.from(saved);
    }

    @Transactional
    public void delete(Long reviewId, AppUserPrincipal principal) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review", reviewId));
        boolean isOwner = review.getUser().getId().equals(principal.id());
        if (!isOwner && !"ADMIN".equals(principal.role())) {
            throw new AccessDeniedException("Not your review");
        }
        Product product = review.getProduct();
        reviewRepository.delete(review);
        reviewRepository.flush();
        refreshRating(product);
    }

    private void refreshRating(Product product) {
        product.setAverageRating(reviewRepository.averageRating(product.getId()));
        product.setReviewCount((int) reviewRepository.countByProductId(product.getId()));
    }
}
