package com.tungzone.dto.order;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class OrderItemCreateRequest {
    @NotNull
    private Long productId;

    @NotNull
    @Min(1)
    private Integer quantity;
}
