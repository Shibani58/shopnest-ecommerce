package com.shopnest.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

@ConfigurationProperties(prefix = "app")
public record AppProperties(Jwt jwt, Cors cors, Seed seed) {

    public record Jwt(String secret, long expirationMs) {
    }

    public record Cors(List<String> allowedOrigins) {
    }

    public record Seed(boolean enabled, String adminEmail, String adminPassword) {
    }
}
