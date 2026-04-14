package com.tungzone.dto.payment;

public record MomoCreateResponse(
        String partnerCode,
        String requestId,
        String orderId,
        Long amount,
        Long responseTime,
        String message,
        Integer resultCode,
        String payUrl,
        String deeplink,
        String qrCodeUrl,
        String signature
) {
}
