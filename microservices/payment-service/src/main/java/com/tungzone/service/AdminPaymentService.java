package com.tungzone.service;

import com.tungzone.dto.payment.PaymentAdminRequest;
import com.tungzone.dto.payment.PaymentAdminResponse;
import com.tungzone.entity.Order;
import com.tungzone.entity.Payment;
import com.tungzone.entity.PaymentStatus;
import com.tungzone.repository.OrderRepository;
import com.tungzone.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminPaymentService {
    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;

    public List<PaymentAdminResponse> getAll() {
        return paymentRepository.findAllByOrderByIdDesc().stream().map(this::toResponse).toList();
    }

    public PaymentAdminResponse create(PaymentAdminRequest request) {
        Order order = orderRepository.findDetailedById(request.getOrderId())
                .orElseThrow(() -> new RuntimeException("Khong tim thay don hang"));

        Payment payment = Payment.builder()
                .order(order)
                .amount(request.getAmount() != null ? request.getAmount() : order.getTotalAmount())
                .method(normalizeMethod(request.getMethod()))
                .status(parseStatus(request.getStatus()))
                .transactionRef(trimToNull(request.getTransactionRef()))
                .paymentUrl(trimToNull(request.getPaymentUrl()))
                .build();

        return toResponse(paymentRepository.save(payment));
    }

    public PaymentAdminResponse update(Long id, PaymentAdminRequest request) {
        Payment payment = paymentRepository.findDetailedById(id)
                .orElseThrow(() -> new RuntimeException("Khong tim thay giao dich thanh toan"));

        Order order = orderRepository.findDetailedById(request.getOrderId())
                .orElseThrow(() -> new RuntimeException("Khong tim thay don hang"));

        payment.setOrder(order);
        payment.setAmount(request.getAmount() != null ? request.getAmount() : order.getTotalAmount());
        payment.setMethod(normalizeMethod(request.getMethod()));
        payment.setStatus(parseStatus(request.getStatus()));
        payment.setTransactionRef(trimToNull(request.getTransactionRef()));
        payment.setPaymentUrl(trimToNull(request.getPaymentUrl()));

        return toResponse(paymentRepository.save(payment));
    }

    public void delete(Long id) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Khong tim thay giao dich thanh toan"));
        paymentRepository.delete(payment);
    }

    private String normalizeMethod(String method) {
        return method == null ? "OTHER" : method.trim().toUpperCase();
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private PaymentStatus parseStatus(String statusValue) {
        if (statusValue == null || statusValue.trim().isEmpty()) {
            return PaymentStatus.PENDING;
        }
        return PaymentStatus.valueOf(statusValue.trim().toUpperCase());
    }

    private PaymentAdminResponse toResponse(Payment payment) {
        return PaymentAdminResponse.builder()
                .id(payment.getId())
                .orderId(payment.getOrder().getId())
                .userId(payment.getOrder().getUser().getId())
                .customerName(payment.getOrder().getUser().getFullName())
                .customerEmail(payment.getOrder().getUser().getEmail())
                .amount(payment.getAmount())
                .method(payment.getMethod())
                .status(payment.getStatus().name())
                .transactionRef(payment.getTransactionRef())
                .paymentUrl(payment.getPaymentUrl())
                .createdAt(payment.getCreatedAt())
                .updatedAt(payment.getUpdatedAt())
                .build();
    }
}
