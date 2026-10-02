package com.shopnest.service;

import com.shopnest.dto.OrderDtos.CheckoutRequest;
import com.shopnest.dto.OrderDtos.OrderResponse;
import com.shopnest.dto.PageResponse;
import com.shopnest.entity.*;
import com.shopnest.exception.BusinessException;
import com.shopnest.exception.ResourceNotFoundException;
import com.shopnest.repository.CartItemRepository;
import com.shopnest.repository.OrderRepository;
import com.shopnest.repository.ProductRepository;
import com.shopnest.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final PaymentService paymentService;

    /**
     * Turns the user's cart into an order in one transaction: stock is re-checked under a row lock,
     * prices are copied onto the order, payment is taken and the cart is emptied. If any step fails
     * nothing is saved.
     */
    @Transactional
    public OrderResponse checkout(Long userId, CheckoutRequest req) {
        List<CartItem> cart = cartItemRepository.findByUserIdOrderByIdAsc(userId);
        if (cart.isEmpty()) {
            throw new BusinessException("Your cart is empty");
        }

        Order order = new Order();
        order.setUser(userRepository.getReferenceById(userId));
        order.setPaymentMethod(req.paymentMethod());
        order.setShippingAddress(req.shippingAddress().toEntity());

        BigDecimal subtotal = BigDecimal.ZERO;
        for (CartItem line : cart) {
            Product product = productRepository.findByIdForUpdate(line.getProduct().getId())
                    .filter(Product::isActive)
                    .orElseThrow(() -> new BusinessException(line.getProduct().getName() + " is no longer available"));
            if (product.getStock() < line.getQuantity()) {
                throw new BusinessException(HttpStatus.CONFLICT,
                        "Only " + product.getStock() + " of " + product.getName() + " left. Please update your cart.");
            }
            product.setStock(product.getStock() - line.getQuantity());

            OrderItem item = new OrderItem();
            item.setProduct(product);
            item.setProductName(product.getName());
            item.setImageUrl(product.getImageUrl());
            item.setUnitPrice(product.getSellingPrice());
            item.setQuantity(line.getQuantity());
            order.addItem(item);
            subtotal = subtotal.add(item.getLineTotal());
        }

        BigDecimal shipping = Pricing.shippingFor(subtotal);
        order.setSubtotal(subtotal);
        order.setShippingFee(shipping);
        order.setTotal(subtotal.add(shipping));
        order.setPaymentReference(paymentService.charge(req.paymentMethod(), req.card(), order.getTotal()));
        if (req.paymentMethod() == PaymentMethod.CARD) {
            order.setStatus(OrderStatus.CONFIRMED);
        }

        Order saved = orderRepository.save(order);
        cartItemRepository.deleteByUserId(userId);
        return OrderResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public PageResponse<OrderResponse> myOrders(Long userId, int page, int size) {
        Page<Order> orders = orderRepository.findByUserIdOrderByCreatedAtDesc(userId, pageRequest(page, size));
        return PageResponse.from(orders.map(OrderResponse::from));
    }

    @Transactional(readOnly = true)
    public OrderResponse myOrder(Long userId, Long orderId) {
        return OrderResponse.from(findOwned(userId, orderId));
    }

    @Transactional
    public OrderResponse cancel(Long userId, Long orderId) {
        Order order = findOwned(userId, orderId);
        changeStatus(order, OrderStatus.CANCELLED);
        return OrderResponse.from(order);
    }

    @Transactional(readOnly = true)
    public PageResponse<OrderResponse> allOrders(OrderStatus status, int page, int size) {
        var pageable = pageRequest(page, size);
        Page<Order> orders = status == null
                ? orderRepository.findAllByOrderByCreatedAtDesc(pageable)
                : orderRepository.findByStatusOrderByCreatedAtDesc(status, pageable);
        return PageResponse.from(orders.map(OrderResponse::from));
    }

    @Transactional
    public OrderResponse updateStatus(Long orderId, OrderStatus next) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));
        changeStatus(order, next);
        return OrderResponse.from(order);
    }

    private void changeStatus(Order order, OrderStatus next) {
        if (!order.getStatus().canMoveTo(next)) {
            throw new BusinessException(HttpStatus.CONFLICT,
                    "An order that is " + order.getStatus() + " cannot be moved to " + next);
        }
        if (next == OrderStatus.CANCELLED) {
            restock(order);
        }
        order.setStatus(next);
        order.setUpdatedAt(Instant.now());
    }

    private void restock(Order order) {
        for (OrderItem item : order.getItems()) {
            if (item.getProduct() != null) {
                productRepository.findByIdForUpdate(item.getProduct().getId())
                        .ifPresent(p -> p.setStock(p.getStock() + item.getQuantity()));
            }
        }
    }

    private Order findOwned(Long userId, Long orderId) {
        return orderRepository.findByIdAndUserId(orderId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));
    }

    private static PageRequest pageRequest(int page, int size) {
        return PageRequest.of(Math.max(page, 0), Math.clamp(size, 1, 50));
    }
}
