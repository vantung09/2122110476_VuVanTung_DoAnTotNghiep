package com.tungzone.dto.payment;

public record MomoCreatePaymentResponse(
        String orderId,
        long amount,
        String payUrl,
        String qrCodeUrl,
        String deeplink
) {
}
