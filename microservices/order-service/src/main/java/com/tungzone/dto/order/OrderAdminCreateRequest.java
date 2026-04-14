package com.tungzone.dto.order;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class OrderAdminCreateRequest {
    @NotNull
    private Long userId;

    @NotEmpty
    @Valid
    private List<OrderItemCreateRequest> items;

    private String status;
}
