package com.tungzone.repository;

import com.tungzone.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findAllByOrderByIdDesc();
    List<Product> findByActiveTrueOrderByIdDesc();
    Optional<Product> findByName(String name);

    @Query("SELECT p FROM Product p WHERE " +
           "(:categoryName IS NULL OR LOWER(p.category.name) = LOWER(:categoryName)) AND " +
           "(:search IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:active IS NULL OR p.active = :active)")
    Page<Product> findByFilters(
            @Param("categoryName") String categoryName,
            @Param("search") String search,
            @Param("active") Boolean active,
            Pageable pageable
    );
}
