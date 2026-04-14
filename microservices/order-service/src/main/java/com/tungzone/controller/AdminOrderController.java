package com.tungzone.controller;

import com.tungzone.dto.common.ApiMessageResponse;
import com.tungzone.dto.order.OrderAdminCreateRequest;
import com.tungzone.dto.order.OrderAdminResponse;
import com.tungzone.dto.order.OrderStatusUpdateRequest;
import com.tungzone.service.AdminOrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/orders")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminOrderController {
    private final AdminOrderService adminOrderService;

    @GetMapping
    public List<OrderAdminResponse> getAllOrders() {
        return adminOrderService.getAllOrders();
    }

    @PostMapping
    public OrderAdminResponse createOrder(@Valid @RequestBody OrderAdminCreateRequest request) {
        return adminOrderService.createOrder(request);
    }

    @PutMapping("/{id}/status")
    public OrderAdminResponse updateStatus(@PathVariable Long id,
                                           @Valid @RequestBody OrderStatusUpdateRequest request) {
        return adminOrderService.updateStatus(id, request.getStatus());
    }

    @DeleteMapping("/{id}")
    public ApiMessageResponse deleteOrder(@PathVariable Long id) {
        adminOrderService.deleteOrder(id);
        return new ApiMessageResponse("Xoa don hang thanh cong");
    }
}
