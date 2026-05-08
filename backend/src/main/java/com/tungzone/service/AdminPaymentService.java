package com.tungzone.service;

import com.tungzone.dto.payment.PaymentAdminResponse;
import com.tungzone.dto.payment.PaymentCreateRequest;
import com.tungzone.dto.payment.PaymentUpdateRequest;
import com.tungzone.entity.Order;
import com.tungzone.entity.Payment;
import com.tungzone.entity.PaymentStatus;
import com.tungzone.repository.OrderRepository;
import com.tungzone.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminPaymentService {
    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final MailNotificationService mailNotificationService;

    public List<PaymentAdminResponse> getAllPayments() {
        return paymentRepository.findAllByOrderByIdDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public PaymentAdminResponse createPayment(PaymentCreateRequest request) {
        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new RuntimeException("Khong tim thay don hang"));

        Double amount = request.getAmount();
        if (amount == null) {
            amount = order.getTotalAmount();
        }

        Payment payment = Payment.builder()
                .order(order)
                .amount(amount)
                .method(request.getMethod() != null ? request.getMethod() : "COD")
                .status(request.getStatus() != null
                        ? PaymentStatus.valueOf(request.getStatus().toUpperCase())
                        : PaymentStatus.PENDING)
                .transactionRef(request.getTransactionRef())
                .paymentUrl(request.getPaymentUrl())
                .build();

        paymentRepository.save(payment);
        notifyPaymentStatusChanged(payment, null);
        return toResponse(payment);
    }

    @Transactional
    public PaymentAdminResponse updatePayment(Long id, PaymentUpdateRequest request) {
        Payment payment = paymentRepository.findByIdWithOrderAndUser(id)
                .orElseThrow(() -> new RuntimeException("Khong tim thay giao dich"));
        PaymentStatus previousStatus = payment.getStatus();

        if (request.getOrderId() != null) {
            Order order = orderRepository.findById(request.getOrderId())
                    .orElseThrow(() -> new RuntimeException("Khong tim thay don hang"));
            payment.setOrder(order);
        }

        if (request.getAmount() != null) {
            payment.setAmount(request.getAmount());
        }
        if (request.getMethod() != null) {
            payment.setMethod(request.getMethod());
        }
        if (request.getStatus() != null) {
            payment.setStatus(PaymentStatus.valueOf(request.getStatus().toUpperCase()));
        }
        if (request.getTransactionRef() != null) {
            payment.setTransactionRef(request.getTransactionRef());
        }
        if (request.getPaymentUrl() != null) {
            payment.setPaymentUrl(request.getPaymentUrl());
        }

        paymentRepository.save(payment);
        notifyPaymentStatusChanged(payment, previousStatus);
        return toResponse(payment);
    }

    @Transactional
    public void deletePayment(Long id) {
        paymentRepository.deleteById(id);
    }

    private PaymentAdminResponse toResponse(Payment p) {
        Order order = p.getOrder();
        String customerName = null;
        String customerEmail = null;
        if (order != null && order.getUser() != null) {
            customerName = order.getUser().getFullName();
            customerEmail = order.getUser().getEmail();
        }

        return PaymentAdminResponse.builder()
                .id(p.getId())
                .orderId(order != null ? order.getId() : null)
                .amount(p.getAmount())
                .method(p.getMethod())
                .status(p.getStatus().name())
                .transactionRef(p.getTransactionRef())
                .paymentUrl(p.getPaymentUrl())
                .createdAt(p.getCreatedAt())
                .customerName(customerName)
                .customerEmail(customerEmail)
                .build();
    }

    private void notifyPaymentStatusChanged(Payment payment, PaymentStatus previousStatus) {
        if (payment == null || payment.getOrder() == null || payment.getStatus() == null) {
            return;
        }
        if (previousStatus == payment.getStatus()) {
            return;
        }
        Order order = payment.getOrder();
        String email = order.getUser() != null ? order.getUser().getEmail() : null;
        if (email == null || email.isBlank()) {
            return;
        }
        if (payment.getStatus() == PaymentStatus.COMPLETED) {
            mailNotificationService.sendPaymentConfirmed(email, order);
        } else if (payment.getStatus() == PaymentStatus.FAILED || payment.getStatus() == PaymentStatus.CANCELLED) {
            mailNotificationService.sendPaymentFailed(email, order, "Trang thai thanh toan: " + payment.getStatus());
        }
    }
}
