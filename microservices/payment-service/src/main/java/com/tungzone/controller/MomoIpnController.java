package com.tungzone.controller;

import com.tungzone.dto.payment.MomoIpnRequest;
import com.tungzone.entity.Order;
import com.tungzone.entity.OrderStatus;
import com.tungzone.entity.Payment;
import com.tungzone.entity.PaymentStatus;
import com.tungzone.repository.OrderRepository;
import com.tungzone.repository.PaymentRepository;
import com.tungzone.util.MomoSignatureUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/payments/momo")
@RequiredArgsConstructor
public class MomoIpnController {
    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;

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

        Optional<Order> orderOptional = orderRepository.findById(orderId);
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

        if (success && order.getStatus() != OrderStatus.COMPLETED && order.getStatus() != OrderStatus.CANCELLED) {
            order.setStatus(OrderStatus.CONFIRMED);
            orderRepository.save(order);
        }

        Optional<Payment> paymentOptional = Optional.empty();
        if (!isBlank(request.requestId())) {
            paymentOptional = paymentRepository.findByTransactionRef(request.requestId());
        }
        if (paymentOptional.isEmpty()) {
            paymentOptional = paymentRepository.findTopByOrderIdOrderByIdDesc(orderId);
        }

        final boolean paymentSuccess = success;
        paymentOptional.ifPresent(payment -> {
            payment.setStatus(paymentSuccess ? PaymentStatus.COMPLETED : PaymentStatus.FAILED);
            if (!isBlank(request.requestId())) {
                payment.setTransactionRef(request.requestId());
            }
            paymentRepository.save(payment);
        });
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
