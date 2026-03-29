package com.tungzone.controller;

import com.tungzone.dto.payment.MomoIpnRequest;
import com.tungzone.entity.Order;
import com.tungzone.entity.OrderStatus;
import com.tungzone.repository.OrderRepository;
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

        if (request.resultCode() != null && (request.resultCode() == 0 || request.resultCode() == 9000)) {
            updateOrderIfMatched(request);
        }

        return ResponseEntity.noContent().build();
    }

    private void updateOrderIfMatched(MomoIpnRequest request) {
        Long orderId = parseOrderId(request.orderId());
        if (orderId == null) {
            return;
        }
        Optional<Order> orderOptional = orderRepository.findById(orderId);
        if (orderOptional.isEmpty()) {
            return;
        }
        Order order = orderOptional.get();
        if (request.amount() != null) {
            long orderAmount = Math.round(order.getTotalAmount());
            if (orderAmount != request.amount()) {
                return;
            }
        }
        if (order.getStatus() == OrderStatus.COMPLETED || order.getStatus() == OrderStatus.CANCELLED) {
            return;
        }
        order.setStatus(OrderStatus.CONFIRMED);
        orderRepository.save(order);
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
