package com.shopnest.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Lets DB_URL be given the way hosting providers print it ("postgresql://user:pass@host/db?sslmode=require")
 * instead of JDBC form. The URL is rewritten to "jdbc:postgresql://host/db?..." and the user and password are
 * taken from it, so a Neon / Render / Supabase connection string can be pasted unchanged.
 */
public class DatabaseUrlPostProcessor implements EnvironmentPostProcessor {

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment env, SpringApplication app) {
        String raw = env.getProperty("DB_URL");
        if (raw == null || !(raw.startsWith("postgres://") || raw.startsWith("postgresql://"))) {
            return;
        }
        URI uri = URI.create(raw.trim());
        String query = uri.getRawQuery() == null ? "" : Arrays.stream(uri.getRawQuery().split("&"))
                // pgjdbc does not understand libpq's channel_binding option.
                .filter(p -> !p.startsWith("channel_binding="))
                .collect(Collectors.joining("&"));
        String port = uri.getPort() > 0 ? ":" + uri.getPort() : "";
        String jdbcUrl = "jdbc:postgresql://" + uri.getHost() + port + uri.getRawPath() + (query.isEmpty() ? "" : "?" + query);

        Map<String, Object> props = new HashMap<>();
        props.put("spring.datasource.url", jdbcUrl);
        String userInfo = uri.getRawUserInfo();
        if (userInfo != null) {
            String[] parts = userInfo.split(":", 2);
            props.put("spring.datasource.username", decode(parts[0]));
            if (parts.length > 1) {
                props.put("spring.datasource.password", decode(parts[1]));
            }
        }
        env.getPropertySources().addFirst(new MapPropertySource("databaseUrl", props));
    }

    private static String decode(String value) {
        return URLDecoder.decode(value, StandardCharsets.UTF_8);
    }
}
