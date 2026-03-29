package com.tungzone.dto.payment;

public record MomoIpnRequest(
        String orderType,
        Long amount,
        String partnerCode,
        String orderId,
        String extraData,
        String signature,
        Long transId,
        Long responseTime,
        Integer resultCode,
        String message,
        String payType,
        String requestId,
        String orderInfo
) {
}
