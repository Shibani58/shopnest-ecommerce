package com.shopnest.repository;

import com.shopnest.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {

    @Override
    @EntityGraph(attributePaths = "category")
    Page<Product> findAll(Specification<Product> spec, Pageable pageable);

    @EntityGraph(attributePaths = "category")
    List<Product> findTop8ByActiveTrueOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = "category")
    List<Product> findTop5ByActiveTrueAndStockLessThanOrderByStockAsc(int stock);

    /** Row lock used at checkout so two buyers cannot both take the last unit. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Product p where p.id = :id")
    Optional<Product> findByIdForUpdate(Long id);

    long countByActiveTrue();

    boolean existsByCategoryId(Long categoryId);

    @Query("select p.category.name, count(p) from Product p where p.active = true group by p.category.name order by p.category.name")
    List<Object[]> countActiveByCategory();
}
