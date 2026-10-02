package com.shopnest.controller;

import com.shopnest.dto.OrderDtos.CheckoutRequest;
import com.shopnest.dto.OrderDtos.OrderResponse;
import com.shopnest.dto.PageResponse;
import com.shopnest.security.AppUserPrincipal;
import com.shopnest.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@Tag(name = "Orders")
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Place an order from the current cart",
            description = "Demo payments: any valid test card such as 4242 4242 4242 4242 succeeds; a card ending in 0002 is declined.")
    public OrderResponse checkout(@Valid @RequestBody CheckoutRequest req, @AuthenticationPrincipal AppUserPrincipal me) {
        return orderService.checkout(me.id(), req);
    }

    @GetMapping
    public PageResponse<OrderResponse> myOrders(@RequestParam(defaultValue = "0") int page,
                                                @RequestParam(defaultValue = "10") int size,
                                                @AuthenticationPrincipal AppUserPrincipal me) {
        return orderService.myOrders(me.id(), page, size);
    }

    @GetMapping("/{id}")
    public OrderResponse myOrder(@PathVariable Long id, @AuthenticationPrincipal AppUserPrincipal me) {
        return orderService.myOrder(me.id(), id);
    }

    @PostMapping("/{id}/cancel")
    public OrderResponse cancel(@PathVariable Long id, @AuthenticationPrincipal AppUserPrincipal me) {
        return orderService.cancel(me.id(), id);
    }
}
