package com.shopnest.dto;

import com.shopnest.dto.CatalogDtos.ProductResponse;
import com.shopnest.dto.OrderDtos.OrderResponse;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record DashboardResponse(
        BigDecimal totalRevenue,
        long totalOrders,
        long activeProducts,
        long customers,
        Map<String, Long> ordersByStatus,
        Map<String, Long> productsByCategory,
        List<OrderResponse> recentOrders,
        List<ProductResponse> lowStockProducts) {
}
