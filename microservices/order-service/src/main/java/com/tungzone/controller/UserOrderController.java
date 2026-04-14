package com.tungzone.controller;

import com.tungzone.dto.order.OrderAdminResponse;
import com.tungzone.service.UserOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders/my")
@RequiredArgsConstructor
public class UserOrderController {
    private final UserOrderService userOrderService;

    @GetMapping
    public List<OrderAdminResponse> getMyOrders(Authentication authentication) {
        return userOrderService.getMyOrders(authentication.getName());
    }

    @GetMapping("/{id}")
    public OrderAdminResponse getMyOrderDetail(@PathVariable Long id, Authentication authentication) {
        return userOrderService.getMyOrderDetail(id, authentication.getName());
    }
}
