package com.tungzone.dto.payment;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PaymentUpdateRequest {
    private Long orderId;
    private Double amount;
    private String method;
    private String status;
    private String transactionRef;
    private String paymentUrl;
}
