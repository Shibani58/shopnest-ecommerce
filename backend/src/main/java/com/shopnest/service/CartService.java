package com.shopnest.service;

import com.shopnest.dto.CartDtos.CartItemResponse;
import com.shopnest.dto.CartDtos.CartResponse;
import com.shopnest.entity.CartItem;
import com.shopnest.entity.Product;
import com.shopnest.exception.BusinessException;
import com.shopnest.exception.ResourceNotFoundException;
import com.shopnest.repository.CartItemRepository;
import com.shopnest.repository.ProductRepository;
import com.shopnest.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CartService {

    static final int MAX_QUANTITY_PER_ITEM = 20;

    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public CartResponse getCart(Long userId) {
        return toResponse(cartItemRepository.findByUserIdOrderByIdAsc(userId));
    }

    @Transactional
    public CartResponse addItem(Long userId, Long productId, int quantity) {
        Product product = findActiveProduct(productId);
        CartItem item = cartItemRepository.findByUserIdAndProductId(userId, productId)
                .orElseGet(() -> new CartItem(userRepository.getReferenceById(userId), product, 0));
        int newQuantity = item.getQuantity() + quantity;
        checkQuantity(product, newQuantity);
        item.setQuantity(newQuantity);
        cartItemRepository.save(item);
        return getCart(userId);
    }

    @Transactional
    public CartResponse updateQuantity(Long userId, Long productId, int quantity) {
        CartItem item = cartItemRepository.findByUserIdAndProductId(userId, productId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item for product", productId));
        checkQuantity(item.getProduct(), quantity);
        item.setQuantity(quantity);
        return getCart(userId);
    }

    @Transactional
    public CartResponse removeItem(Long userId, Long productId) {
        cartItemRepository.findByUserIdAndProductId(userId, productId).ifPresent(cartItemRepository::delete);
        return getCart(userId);
    }

    @Transactional
    public void clear(Long userId) {
        cartItemRepository.deleteByUserId(userId);
    }

    private Product findActiveProduct(Long productId) {
        return productRepository.findById(productId)
                .filter(Product::isActive)
                .orElseThrow(() -> new ResourceNotFoundException("Product", productId));
    }

    private static void checkQuantity(Product product, int quantity) {
        if (product.getStock() <= 0) {
            throw new BusinessException(product.getName() + " is out of stock");
        }
        if (quantity > product.getStock()) {
            throw new BusinessException("Only " + product.getStock() + " of " + product.getName() + " left in stock");
        }
        if (quantity > MAX_QUANTITY_PER_ITEM) {
            throw new BusinessException("You can buy at most " + MAX_QUANTITY_PER_ITEM + " of one item");
        }
    }

    static CartResponse toResponse(List<CartItem> items) {
        List<CartItemResponse> lines = items.stream().map(CartItemResponse::from).toList();
        BigDecimal subtotal = lines.stream().map(CartItemResponse::lineTotal).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal shipping = Pricing.shippingFor(subtotal);
        int count = lines.stream().mapToInt(CartItemResponse::quantity).sum();
        return new CartResponse(lines, count, subtotal, shipping, subtotal.add(shipping));
    }
}
