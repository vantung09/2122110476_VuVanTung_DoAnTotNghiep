package com.tungzone.repository;

import com.tungzone.entity.Order;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {
    @EntityGraph(attributePaths = {"user", "items", "items.product"})
    List<Order> findAllByOrderByIdDesc();

    @EntityGraph(attributePaths = {"user", "items", "items.product"})
    java.util.Optional<Order> findDetailedById(Long id);

    @EntityGraph(attributePaths = {"user", "items", "items.product"})
    List<Order> findAllByUser_EmailOrderByIdDesc(String email);

    @EntityGraph(attributePaths = {"user", "items", "items.product"})
    java.util.Optional<Order> findDetailedByIdAndUser_Email(Long id, String email);
}
