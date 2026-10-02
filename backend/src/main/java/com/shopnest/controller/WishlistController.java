package com.shopnest.controller;

import com.shopnest.dto.CatalogDtos.ProductResponse;
import com.shopnest.security.AppUserPrincipal;
import com.shopnest.service.WishlistService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/wishlist")
@RequiredArgsConstructor
@Tag(name = "Wishlist")
public class WishlistController {

    private final WishlistService wishlistService;

    @GetMapping
    public List<ProductResponse> list(@AuthenticationPrincipal AppUserPrincipal me) {
        return wishlistService.list(me.id());
    }

    @PutMapping("/{productId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void add(@PathVariable Long productId, @AuthenticationPrincipal AppUserPrincipal me) {
        wishlistService.add(me.id(), productId);
    }

    @DeleteMapping("/{productId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remove(@PathVariable Long productId, @AuthenticationPrincipal AppUserPrincipal me) {
        wishlistService.remove(me.id(), productId);
    }
}
