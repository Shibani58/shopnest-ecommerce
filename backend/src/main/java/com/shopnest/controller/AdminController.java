package com.shopnest.controller;

import com.shopnest.dto.CatalogDtos.ProductResponse;
import com.shopnest.dto.DashboardResponse;
import com.shopnest.dto.OrderDtos.OrderResponse;
import com.shopnest.dto.OrderDtos.StatusUpdateRequest;
import com.shopnest.dto.PageResponse;
import com.shopnest.entity.OrderStatus;
import com.shopnest.service.DashboardService;
import com.shopnest.service.OrderService;
import com.shopnest.service.ProductQuery;
import com.shopnest.service.ProductService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/** Everything under /api/admin needs the ADMIN role (see SecurityConfig). */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Tag(name = "Admin")
public class AdminController {

    private final DashboardService dashboardService;
    private final ProductService productService;
    private final OrderService orderService;

    @GetMapping("/dashboard")
    public DashboardResponse dashboard() {
        return dashboardService.summary();
    }

    /** Same search as the shop, but hidden products are included. */
    @GetMapping("/products")
    public PageResponse<ProductResponse> products(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(defaultValue = "newest") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        var query = new ProductQuery(q, categoryId, null, null, false, sort, page, size);
        return productService.search(query, true);
    }

    @GetMapping("/products/{id}")
    public ProductResponse product(@PathVariable Long id) {
        return productService.findById(id, true);
    }

    @GetMapping("/orders")
    public PageResponse<OrderResponse> orders(@RequestParam(required = false) OrderStatus status,
                                              @RequestParam(defaultValue = "0") int page,
                                              @RequestParam(defaultValue = "20") int size) {
        return orderService.allOrders(status, page, size);
    }

    @PatchMapping("/orders/{id}/status")
    public OrderResponse updateStatus(@PathVariable Long id, @Valid @RequestBody StatusUpdateRequest req) {
        return orderService.updateStatus(id, req.status());
    }
}
