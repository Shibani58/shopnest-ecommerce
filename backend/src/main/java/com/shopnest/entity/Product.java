package com.shopnest.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;

@Entity
@Table(name = "products")
@Getter
@Setter
@NoArgsConstructor
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(length = 2000)
    private String description;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    /** 0-90. The selling price is derived from price and discount. */
    @Column(nullable = false)
    private int discountPercent;

    /** Copy of getSellingPrice() kept in a column so the catalogue can filter and sort by it. */
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal salePrice;

    @Column(nullable = false)
    private int stock;

    @Column(length = 500)
    private String imageUrl;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id")
    private Category category;

    /** Stored on the product so listings can sort and show ratings without aggregating reviews. */
    @Column(nullable = false)
    private double averageRating;

    @Column(nullable = false)
    private int reviewCount;

    /** Inactive products are hidden from the shop but kept for order history. */
    @Column(nullable = false)
    private boolean active = true;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @PrePersist
    @PreUpdate
    public void syncSalePrice() {
        this.salePrice = getSellingPrice();
    }

    public BigDecimal getSellingPrice() {
        BigDecimal factor = BigDecimal.valueOf(100 - discountPercent).movePointLeft(2);
        return price.multiply(factor).setScale(2, RoundingMode.HALF_UP);
    }
}
