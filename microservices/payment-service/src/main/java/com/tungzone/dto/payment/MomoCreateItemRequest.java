package com.tungzone.dto.payment;

public record MomoCreateItemRequest(
        Long productId,
        Integer quantity
) {
}
