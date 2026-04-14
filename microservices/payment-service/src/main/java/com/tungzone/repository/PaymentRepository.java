package com.tungzone.repository;

import com.tungzone.entity.Payment;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    @EntityGraph(attributePaths = {"order", "order.user"})
    List<Payment> findAllByOrderByIdDesc();

    @EntityGraph(attributePaths = {"order", "order.user"})
    Optional<Payment> findDetailedById(Long id);

    @EntityGraph(attributePaths = {"order", "order.user"})
    Optional<Payment> findTopByOrderIdOrderByIdDesc(Long orderId);

    @EntityGraph(attributePaths = {"order", "order.user"})
    Optional<Payment> findByTransactionRef(String transactionRef);
}
