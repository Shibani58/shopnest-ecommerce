package com.shopnest.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Copied onto each order so the shipping details stay as they were at checkout. */
@Embeddable
@Getter
@Setter
@NoArgsConstructor
public class ShippingAddress {

    @Column(name = "ship_name", length = 80)
    private String recipientName;

    @Column(name = "ship_phone", length = 20)
    private String phone;

    @Column(name = "ship_line1", length = 150)
    private String line1;

    @Column(name = "ship_line2", length = 150)
    private String line2;

    @Column(name = "ship_city", length = 60)
    private String city;

    @Column(name = "ship_state", length = 60)
    private String state;

    @Column(name = "ship_postal_code", length = 12)
    private String postalCode;

    @Column(name = "ship_country", length = 60)
    private String country;
}
