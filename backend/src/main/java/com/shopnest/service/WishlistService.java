package com.shopnest.service;

import com.shopnest.dto.CatalogDtos.ProductResponse;
import com.shopnest.entity.Product;
import com.shopnest.entity.WishlistItem;
import com.shopnest.exception.ResourceNotFoundException;
import com.shopnest.repository.ProductRepository;
import com.shopnest.repository.UserRepository;
import com.shopnest.repository.WishlistItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class WishlistService {

    private final WishlistItemRepository wishlistItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<ProductResponse> list(Long userId) {
        return wishlistItemRepository.findByUserIdOrderByAddedAtDesc(userId).stream()
                .map(w -> ProductResponse.from(w.getProduct()))
                .toList();
    }

    /** Adding twice is harmless. */
    @Transactional
    public void add(Long userId, Long productId) {
        if (wishlistItemRepository.findByUserIdAndProductId(userId, productId).isPresent()) {
            return;
        }
        Product product = productRepository.findById(productId)
                .filter(Product::isActive)
                .orElseThrow(() -> new ResourceNotFoundException("Product", productId));
        wishlistItemRepository.save(new WishlistItem(userRepository.getReferenceById(userId), product));
    }

    @Transactional
    public void remove(Long userId, Long productId) {
        wishlistItemRepository.findByUserIdAndProductId(userId, productId).ifPresent(wishlistItemRepository::delete);
    }
}
