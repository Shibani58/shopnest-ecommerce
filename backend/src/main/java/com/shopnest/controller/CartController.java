package com.shopnest.controller;

import com.shopnest.dto.CartDtos.AddToCartRequest;
import com.shopnest.dto.CartDtos.CartResponse;
import com.shopnest.dto.CartDtos.UpdateQuantityRequest;
import com.shopnest.security.AppUserPrincipal;
import com.shopnest.service.CartService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
@Tag(name = "Cart")
public class CartController {

    private final CartService cartService;

    @GetMapping
    public CartResponse get(@AuthenticationPrincipal AppUserPrincipal me) {
        return cartService.getCart(me.id());
    }

    @PostMapping("/items")
    public CartResponse add(@Valid @RequestBody AddToCartRequest req, @AuthenticationPrincipal AppUserPrincipal me) {
        return cartService.addItem(me.id(), req.productId(), req.quantity());
    }

    @PutMapping("/items/{productId}")
    public CartResponse update(@PathVariable Long productId, @Valid @RequestBody UpdateQuantityRequest req,
                               @AuthenticationPrincipal AppUserPrincipal me) {
        return cartService.updateQuantity(me.id(), productId, req.quantity());
    }

    @DeleteMapping("/items/{productId}")
    public CartResponse remove(@PathVariable Long productId, @AuthenticationPrincipal AppUserPrincipal me) {
        return cartService.removeItem(me.id(), productId);
    }

    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void clear(@AuthenticationPrincipal AppUserPrincipal me) {
        cartService.clear(me.id());
    }
}
