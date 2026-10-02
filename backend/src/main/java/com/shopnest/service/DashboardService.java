package com.shopnest.service;

import com.shopnest.dto.CatalogDtos.ProductResponse;
import com.shopnest.dto.DashboardResponse;
import com.shopnest.dto.OrderDtos.OrderResponse;
import com.shopnest.entity.OrderStatus;
import com.shopnest.entity.Role;
import com.shopnest.repository.OrderRepository;
import com.shopnest.repository.ProductRepository;
import com.shopnest.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class DashboardService {

    static final int LOW_STOCK_THRESHOLD = 5;

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public DashboardResponse summary() {
        Map<String, Long> byStatus = new LinkedHashMap<>();
        for (OrderStatus s : OrderStatus.values()) {
            byStatus.put(s.name(), orderRepository.countByStatus(s));
        }

        Map<String, Long> byCategory = new LinkedHashMap<>();
        for (Object[] row : productRepository.countActiveByCategory()) {
            byCategory.put((String) row[0], (Long) row[1]);
        }

        return new DashboardResponse(
                Objects.requireNonNullElse(orderRepository.totalRevenue(), BigDecimal.ZERO),
                orderRepository.count(),
                productRepository.countByActiveTrue(),
                userRepository.countByRole(Role.CUSTOMER),
                byStatus,
                byCategory,
                orderRepository.findTop5ByOrderByCreatedAtDesc().stream().map(OrderResponse::from).toList(),
                productRepository.findTop5ByActiveTrueAndStockLessThanOrderByStockAsc(LOW_STOCK_THRESHOLD).stream()
                        .map(ProductResponse::from).toList());
    }
}
