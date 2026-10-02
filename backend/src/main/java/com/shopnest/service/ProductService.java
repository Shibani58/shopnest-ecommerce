package com.shopnest.service;

import com.shopnest.dto.CatalogDtos.ProductRequest;
import com.shopnest.dto.CatalogDtos.ProductResponse;
import com.shopnest.dto.PageResponse;
import com.shopnest.entity.Category;
import com.shopnest.entity.Product;
import com.shopnest.exception.ResourceNotFoundException;
import com.shopnest.repository.CartItemRepository;
import com.shopnest.repository.CategoryRepository;
import com.shopnest.repository.ProductRepository;
import com.shopnest.repository.WishlistItemRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final CartItemRepository cartItemRepository;
    private final WishlistItemRepository wishlistItemRepository;

    /**
     * @param includeInactive true only for the admin catalogue; shoppers never see hidden products.
     */
    @Transactional(readOnly = true)
    public PageResponse<ProductResponse> search(ProductQuery query, boolean includeInactive) {
        var pageable = PageRequest.of(query.safePage(), query.safeSize(), query.toSort());
        var page = productRepository.findAll(buildSpec(query, includeInactive), pageable).map(ProductResponse::from);
        return PageResponse.from(page);
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> newArrivals() {
        return productRepository.findTop8ByActiveTrueOrderByCreatedAtDesc().stream()
                .map(ProductResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public ProductResponse findById(Long id, boolean includeInactive) {
        Product product = productRepository.findById(id)
                .filter(p -> includeInactive || p.isActive())
                .orElseThrow(() -> new ResourceNotFoundException("Product", id));
        return ProductResponse.from(product);
    }

    @Transactional
    public ProductResponse create(ProductRequest req) {
        Product product = new Product();
        apply(product, req);
        return ProductResponse.from(productRepository.save(product));
    }

    @Transactional
    public ProductResponse update(Long id, ProductRequest req) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", id));
        apply(product, req);
        if (!product.isActive()) {
            removeFromCartsAndWishlists(id);
        }
        return ProductResponse.from(product);
    }

    /**
     * Products are hidden rather than deleted so that past orders and reviews keep pointing at them.
     */
    @Transactional
    public void delete(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", id));
        product.setActive(false);
        removeFromCartsAndWishlists(id);
    }

    private void removeFromCartsAndWishlists(Long productId) {
        cartItemRepository.deleteByProductId(productId);
        wishlistItemRepository.deleteByProductId(productId);
    }

    private void apply(Product product, ProductRequest req) {
        Category category = categoryRepository.findById(req.categoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category", req.categoryId()));
        product.setName(req.name().trim());
        product.setDescription(req.description());
        product.setPrice(req.price());
        product.setDiscountPercent(req.discountPercent());
        product.setStock(req.stock());
        product.setImageUrl(StringUtils.hasText(req.imageUrl()) ? req.imageUrl().trim() : null);
        product.setCategory(category);
        if (req.active() != null) {
            product.setActive(req.active());
        }
        product.syncSalePrice();
    }

    private static Specification<Product> buildSpec(ProductQuery q, boolean includeInactive) {
        return (root, cq, cb) -> {
            var predicates = new ArrayList<Predicate>();
            if (!includeInactive) {
                predicates.add(cb.isTrue(root.get("active")));
            }
            if (StringUtils.hasText(q.q())) {
                String like = "%" + q.q().trim().toLowerCase(Locale.ROOT) + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("name")), like),
                        cb.like(cb.lower(root.get("description")), like),
                        cb.like(cb.lower(root.get("category").get("name")), like)));
            }
            if (q.categoryId() != null) {
                predicates.add(cb.equal(root.get("category").get("id"), q.categoryId()));
            }
            if (q.minPrice() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("salePrice"), q.minPrice()));
            }
            if (q.maxPrice() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("salePrice"), q.maxPrice()));
            }
            if (q.inStockOnly()) {
                predicates.add(cb.greaterThan(root.get("stock"), 0));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }
}
