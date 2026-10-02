package com.shopnest.dto;

import com.shopnest.entity.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public final class OrderDtos {

    private OrderDtos() {
    }

    public record AddressDto(
            @NotBlank @Size(max = 80) String recipientName,
            @NotBlank @Pattern(regexp = "^[0-9+\\- ]{7,20}$", message = "is not a valid phone number") String phone,
            @NotBlank @Size(max = 150) String line1,
            @Size(max = 150) String line2,
            @NotBlank @Size(max = 60) String city,
            @NotBlank @Size(max = 60) String state,
            @NotBlank @Pattern(regexp = "^[A-Za-z0-9 \\-]{3,12}$", message = "is not a valid postal code") String postalCode,
            @NotBlank @Size(max = 60) String country) {

        public ShippingAddress toEntity() {
            ShippingAddress a = new ShippingAddress();
            a.setRecipientName(recipientName);
            a.setPhone(phone);
            a.setLine1(line1);
            a.setLine2(line2);
            a.setCity(city);
            a.setState(state);
            a.setPostalCode(postalCode);
            a.setCountry(country);
            return a;
        }

        public static AddressDto from(ShippingAddress a) {
            return new AddressDto(a.getRecipientName(), a.getPhone(), a.getLine1(), a.getLine2(),
                    a.getCity(), a.getState(), a.getPostalCode(), a.getCountry());
        }
    }

    /**
     * Card details for the simulated payment gateway. They are validated and then discarded;
     * only the last four digits are kept on the order.
     */
    public record CardDetails(
            @NotBlank @Pattern(regexp = "^[0-9 ]{12,23}$", message = "is not a valid card number") String number,
            @NotBlank @Pattern(regexp = "^(0[1-9]|1[0-2])/[0-9]{2}$", message = "must be MM/YY") String expiry,
            @NotBlank @Pattern(regexp = "^[0-9]{3,4}$", message = "must be 3 or 4 digits") String cvv) {
    }

    public record CheckoutRequest(
            @NotNull @Valid AddressDto shippingAddress,
            @NotNull PaymentMethod paymentMethod,
            @Valid CardDetails card) {
    }

    public record StatusUpdateRequest(@NotNull OrderStatus status) {
    }

    public record OrderItemResponse(Long productId, String productName, String imageUrl,
                                    BigDecimal unitPrice, int quantity, BigDecimal lineTotal) {

        public static OrderItemResponse from(OrderItem i) {
            Long productId = i.getProduct() == null ? null : i.getProduct().getId();
            return new OrderItemResponse(productId, i.getProductName(), i.getImageUrl(),
                    i.getUnitPrice(), i.getQuantity(), i.getLineTotal());
        }
    }

    public record OrderResponse(
            Long id,
            OrderStatus status,
            PaymentMethod paymentMethod,
            String paymentReference,
            List<OrderItemResponse> items,
            BigDecimal subtotal,
            BigDecimal shippingFee,
            BigDecimal total,
            AddressDto shippingAddress,
            String customerName,
            String customerEmail,
            Instant createdAt,
            Instant updatedAt) {

        public static OrderResponse from(Order o) {
            return new OrderResponse(
                    o.getId(), o.getStatus(), o.getPaymentMethod(), o.getPaymentReference(),
                    o.getItems().stream().map(OrderItemResponse::from).toList(),
                    o.getSubtotal(), o.getShippingFee(), o.getTotal(),
                    AddressDto.from(o.getShippingAddress()),
                    o.getUser().getFullName(), o.getUser().getEmail(),
                    o.getCreatedAt(), o.getUpdatedAt());
        }
    }
}
