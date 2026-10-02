package com.shopnest.dto;

import com.shopnest.entity.CartItem;
import com.shopnest.entity.Product;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;

public final class CartDtos {

    private CartDtos() {
    }

    public record AddToCartRequest(@NotNull Long productId, @Min(1) @Max(20) int quantity) {
    }

    public record UpdateQuantityRequest(@Min(1) @Max(20) int quantity) {
    }

    public record CartItemResponse(
            Long productId,
            String name,
            String imageUrl,
            BigDecimal unitPrice,
            int quantity,
            BigDecimal lineTotal,
            int stock) {

        public static CartItemResponse from(CartItem item) {
            Product p = item.getProduct();
            BigDecimal unit = p.getSellingPrice();
            return new CartItemResponse(p.getId(), p.getName(), p.getImageUrl(), unit, item.getQuantity(),
                    unit.multiply(BigDecimal.valueOf(item.getQuantity())), p.getStock());
        }
    }

    public record CartResponse(
            List<CartItemResponse> items,
            int itemCount,
            BigDecimal subtotal,
            BigDecimal shippingFee,
            BigDecimal total) {
    }
}
