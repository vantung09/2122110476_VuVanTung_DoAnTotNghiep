package com.tungzone.dto.payment;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class PaymentAdminResponse {
    private Long id;
    private Long orderId;
    private Double amount;
    private String method;
    private String status;
    private String transactionRef;
    private String paymentUrl;
    private LocalDateTime createdAt;
    private String customerName;
    private String customerEmail;
}
