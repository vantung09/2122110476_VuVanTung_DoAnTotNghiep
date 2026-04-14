package com.tungzone.dto.payment;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class PaymentAdminRequest {
    @NotNull
    private Long orderId;

    private Double amount;

    @NotBlank
    private String method;

    @NotBlank
    private String status;

    private String transactionRef;

    private String paymentUrl;
}
