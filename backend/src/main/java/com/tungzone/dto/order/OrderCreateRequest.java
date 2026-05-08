package com.tungzone.dto.order;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class OrderCreateRequest {
    private Long userId;
    private String status;
    private List<OrderItemCreateRequest> items;

    @Data
    @Builder
    public static class OrderItemCreateRequest {
        private Long productId;
        private Integer quantity;
    }
}
