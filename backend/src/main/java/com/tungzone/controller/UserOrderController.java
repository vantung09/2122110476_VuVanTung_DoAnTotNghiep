package com.tungzone.controller;

import com.tungzone.dto.order.OrderAdminResponse;
import com.tungzone.service.UserOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class UserOrderController {
    private final UserOrderService userOrderService;

    @GetMapping("/my")
    public List<OrderAdminResponse> getMyOrders(Authentication authentication) {
        return userOrderService.getCurrentUserOrders(authentication.getName());
    }

    @GetMapping("/my/{id}")
    public OrderAdminResponse getMyOrderDetail(@PathVariable Long id, Authentication authentication) {
        return userOrderService.getCurrentUserOrderDetail(authentication.getName(), id);
    }
}
