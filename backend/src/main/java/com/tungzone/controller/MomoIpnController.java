package com.tungzone.controller;

import com.tungzone.dto.payment.MomoIpnRequest;
import com.tungzone.entity.Order;
import com.tungzone.entity.OrderStatus;
import com.tungzone.entity.Payment;
import com.tungzone.entity.PaymentStatus;
import com.tungzone.repository.OrderRepository;
import com.tungzone.repository.PaymentRepository;
import com.tungzone.service.MailNotificationService;
import com.tungzone.util.MomoSignatureUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Optional;

@RestController
@RequestMapping("/api/payments/momo")
@RequiredArgsConstructor
public class MomoIpnController {
    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final MailNotificationService mailNotificationService;

    @Value("${app.momo.partner-code:}")
    private String partnerCode;

    @Value("${app.momo.access-key:}")
    private String accessKey;

    @Value("${app.momo.secret-key:}")
    private String secretKey;

    @PostMapping("/ipn")
    public ResponseEntity<Void> handleIpn(@RequestBody MomoIpnRequest request) {
        if (isBlank(accessKey) || isBlank(secretKey)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }

        if (!isBlank(partnerCode) && request.partnerCode() != null && !partnerCode.equals(request.partnerCode())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }

        String rawSignature = MomoSignatureUtils.buildIpnRawSignature(request, accessKey);
        String expectedSignature = MomoSignatureUtils.hmacSha256(rawSignature, secretKey);
        if (request.signature() == null || !expectedSignature.equalsIgnoreCase(request.signature())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }

        updateOrderAndPayment(request);

        return ResponseEntity.noContent().build();
    }

    private void updateOrderAndPayment(MomoIpnRequest request) {
        Long orderId = parseOrderId(request.orderId());
        if (orderId == null) {
            return;
        }
        Optional<Order> orderOptional = orderRepository.findDetailedById(orderId);
        if (orderOptional.isEmpty()) {
            return;
        }
        Order order = orderOptional.get();
        boolean success = request.resultCode() != null && (request.resultCode() == 0 || request.resultCode() == 9000);
        if (request.amount() != null) {
            long orderAmount = Math.round(order.getTotalAmount());
            if (orderAmount != request.amount()) {
                success = false;
            }
        }

        Payment payment = findOrCreatePayment(order, request);
        PaymentStatus previousPaymentStatus = payment.getStatus();
        PaymentStatus newPaymentStatus = success ? PaymentStatus.COMPLETED : PaymentStatus.FAILED;

        payment.setStatus(newPaymentStatus);
        if (!isBlank(request.requestId())) {
            payment.setTransactionRef(request.requestId());
        } else if (request.transId() != null) {
            payment.setTransactionRef(String.valueOf(request.transId()));
        }
        paymentRepository.save(payment);

        if (success) {
            if (order.getStatus() != OrderStatus.COMPLETED && order.getStatus() != OrderStatus.CANCELLED) {
                order.setStatus(OrderStatus.CONFIRMED);
            }
        } else if (order.getStatus() != OrderStatus.COMPLETED) {
            order.setStatus(OrderStatus.CANCELLED);
        }
        Order savedOrder = orderRepository.save(order);

        if (previousPaymentStatus == newPaymentStatus) {
            return;
        }

        String email = order.getUser() != null ? order.getUser().getEmail() : null;
        if (email != null && success) {
            mailNotificationService.sendPaymentConfirmed(email, savedOrder);
        } else if (email != null) {
            mailNotificationService.sendPaymentFailed(email, savedOrder, request.message());
        }
    }

    private Payment findOrCreatePayment(Order order, MomoIpnRequest request) {
        Optional<Payment> paymentOptional = Optional.empty();
        if (!isBlank(request.requestId())) {
            paymentOptional = paymentRepository.findByTransactionRef(request.requestId());
        }
        if (paymentOptional.isEmpty()) {
            paymentOptional = paymentRepository.findTopByOrderIdOrderByIdDesc(order.getId());
        }
        return paymentOptional.orElseGet(() -> Payment.builder()
                .order(order)
                .amount(request.amount() != null ? request.amount().doubleValue() : order.getTotalAmount())
                .method("MOMO")
                .status(PaymentStatus.PENDING)
                .transactionRef(!isBlank(request.requestId())
                        ? request.requestId()
                        : (request.transId() != null ? String.valueOf(request.transId()) : null))
                .build());
    }

    private Long parseOrderId(String orderId) {
        if (isBlank(orderId) || !orderId.matches("\\d+")) {
            return null;
        }
        try {
            return Long.parseLong(orderId);
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}
