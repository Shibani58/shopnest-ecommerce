package com.shopnest.service;

import java.math.BigDecimal;

/** Shipping rules shared by the cart preview and checkout so both always agree. */
public final class Pricing {

    public static final BigDecimal FREE_SHIPPING_THRESHOLD = new BigDecimal("999.00");
    public static final BigDecimal FLAT_SHIPPING_FEE = new BigDecimal("49.00");

    private Pricing() {
    }

    public static BigDecimal shippingFor(BigDecimal subtotal) {
        if (subtotal.signum() == 0 || subtotal.compareTo(FREE_SHIPPING_THRESHOLD) >= 0) {
            return BigDecimal.ZERO.setScale(2);
        }
        return FLAT_SHIPPING_FEE;
    }
}
