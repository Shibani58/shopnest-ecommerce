package com.shopnest.repository;

import com.shopnest.entity.Order;
import com.shopnest.entity.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {

    Page<Order> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    Optional<Order> findByIdAndUserId(Long id, Long userId);

    @EntityGraph(attributePaths = "user")
    Page<Order> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @EntityGraph(attributePaths = "user")
    Page<Order> findByStatusOrderByCreatedAtDesc(OrderStatus status, Pageable pageable);

    @EntityGraph(attributePaths = "user")
    List<Order> findTop5ByOrderByCreatedAtDesc();

    long countByStatus(OrderStatus status);

    @Query("select count(i) > 0 from OrderItem i where i.product.id = :productId and i.order.user.id = :userId"
            + " and i.order.status <> com.shopnest.entity.OrderStatus.CANCELLED")
    boolean hasPurchased(Long userId, Long productId);

    /** Null when there are no orders yet. */
    @Query("select sum(o.total) from Order o where o.status <> com.shopnest.entity.OrderStatus.CANCELLED")
    BigDecimal totalRevenue();
}
