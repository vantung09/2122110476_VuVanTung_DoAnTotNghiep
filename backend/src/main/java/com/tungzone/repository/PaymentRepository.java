package com.tungzone.repository;

import com.tungzone.entity.Payment;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    @Query("SELECT p FROM Payment p JOIN FETCH p.order o JOIN FETCH o.user ORDER BY p.id DESC")
    List<Payment> findAllByOrderByIdDesc();

    @Query("SELECT p FROM Payment p JOIN FETCH p.order o JOIN FETCH o.user WHERE p.id = :id")
    Optional<Payment> findByIdWithOrderAndUser(@Param("id") Long id);

    @EntityGraph(attributePaths = {"order", "order.user"})
    Optional<Payment> findTopByOrderIdOrderByIdDesc(Long orderId);

    @EntityGraph(attributePaths = {"order", "order.user"})
    Optional<Payment> findByTransactionRef(String transactionRef);
}
