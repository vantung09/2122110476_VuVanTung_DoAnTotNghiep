package com.tungzone.dto.payment;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class PaymentAdminResponse {
    private Long id;
    private Long orderId;
    private Long userId;
    private String customerName;
    private String customerEmail;
    private Double amount;
    private String method;
    private String status;
    private String transactionRef;
    private String paymentUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
