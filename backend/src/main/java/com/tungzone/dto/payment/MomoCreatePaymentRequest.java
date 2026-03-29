package com.tungzone.dto.payment;

import java.util.List;

public record MomoCreatePaymentRequest(
        List<MomoCreateItemRequest> items,
        String orderInfo
) {
}
