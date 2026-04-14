package com.tungzone.repository;

import com.tungzone.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByActiveTrueOrderByIdDesc();
    Optional<Product> findByName(String name);
}
