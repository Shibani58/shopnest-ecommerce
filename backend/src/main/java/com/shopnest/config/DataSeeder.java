package com.shopnest.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopnest.entity.Category;
import com.shopnest.entity.Product;
import com.shopnest.entity.Role;
import com.shopnest.entity.User;
import com.shopnest.repository.CategoryRepository;
import com.shopnest.repository.ProductRepository;
import com.shopnest.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Fills an empty database with a demo catalogue and two accounts so the app is usable straight after
 * deployment. It only ever inserts what is missing, so restarts are safe. Disable with SEED_DATA=false.
 */
@Component
public class DataSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);
    static final String DEMO_CUSTOMER_EMAIL = "customer@shopnest.dev";
    static final String DEMO_CUSTOMER_PASSWORD = "Customer@123";

    private final AppProperties props;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper;

    public DataSeeder(AppProperties props, UserRepository userRepository, CategoryRepository categoryRepository,
                      ProductRepository productRepository, PasswordEncoder passwordEncoder, ObjectMapper objectMapper) {
        this.props = props;
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
        this.passwordEncoder = passwordEncoder;
        this.objectMapper = objectMapper;
    }

    record SeedCategory(String name, String description) {
    }

    record SeedProduct(String name, String description, BigDecimal price, int discountPercent, int stock,
                       String imageUrl, String category) {
    }

    record SeedFile(List<SeedCategory> categories, List<SeedProduct> products) {
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) throws IOException {
        if (!props.seed().enabled()) {
            return;
        }
        createUserIfMissing("Store Admin", props.seed().adminEmail(), props.seed().adminPassword(), Role.ADMIN);
        createUserIfMissing("Demo Customer", DEMO_CUSTOMER_EMAIL, DEMO_CUSTOMER_PASSWORD, Role.CUSTOMER);

        if (categoryRepository.count() == 0) {
            seedCatalogue();
        }
    }

    private void createUserIfMissing(String name, String email, String password, Role role) {
        if (!userRepository.existsByEmailIgnoreCase(email)) {
            userRepository.save(new User(name, email.toLowerCase(), passwordEncoder.encode(password), role));
            log.info("Seeded {} account {}", role, email);
        }
    }

    private void seedCatalogue() throws IOException {
        SeedFile seed;
        try (InputStream in = new ClassPathResource("seed-data.json").getInputStream()) {
            seed = objectMapper.readValue(in, SeedFile.class);
        }

        Map<String, Category> categories = categoryRepository.saveAll(
                        seed.categories().stream().map(c -> new Category(c.name(), c.description())).toList())
                .stream().collect(Collectors.toMap(Category::getName, Function.identity()));

        // Stagger creation times so "newest first" has a stable, meaningful order.
        Instant base = Instant.now().minusSeconds(seed.products().size() * 3600L);
        List<Product> products = seed.products().stream().map(sp -> {
            Product p = new Product();
            p.setName(sp.name());
            p.setDescription(sp.description());
            p.setPrice(sp.price());
            p.setDiscountPercent(sp.discountPercent());
            p.setStock(sp.stock());
            p.setImageUrl(sp.imageUrl());
            p.setCategory(categories.get(sp.category()));
            p.setCreatedAt(base.plusSeconds(seed.products().indexOf(sp) * 3600L));
            p.syncSalePrice();
            return p;
        }).toList();
        productRepository.saveAll(products);
        log.info("Seeded {} categories and {} products", categories.size(), products.size());
    }
}
