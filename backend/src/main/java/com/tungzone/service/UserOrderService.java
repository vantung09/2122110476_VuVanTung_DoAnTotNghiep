package com.tungzone.service;

import com.tungzone.dto.order.OrderAdminResponse;
import com.tungzone.dto.order.OrderItemResponse;
import com.tungzone.entity.Order;
import com.tungzone.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserOrderService {
    private final OrderRepository orderRepository;

    public List<OrderAdminResponse> getCurrentUserOrders(String currentEmail) {
        String email = normalizeEmail(currentEmail);
        return orderRepository.findAllByUser_EmailOrderByIdDesc(email)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public OrderAdminResponse getCurrentUserOrderDetail(String currentEmail, Long orderId) {
        String email = normalizeEmail(currentEmail);
        Order order = orderRepository.findDetailedByIdAndUser_Email(orderId, email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));
        return toResponse(order);
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    private OrderAdminResponse toResponse(Order order) {
        return OrderAdminResponse.builder()
                .id(order.getId())
                .userId(order.getUser().getId())
                .customerName(order.getUser().getFullName())
                .customerEmail(order.getUser().getEmail())
                .totalAmount(order.getTotalAmount())
                .status(order.getStatus().name())
                .createdAt(order.getCreatedAt())
                .items(order.getItems().stream().map(item -> OrderItemResponse.builder()
                        .productId(item.getProduct().getId())
                        .productName(item.getProduct().getName())
                        .imageUrl(item.getProduct().getImageUrl())
                        .quantity(item.getQuantity())
                        .price(item.getPrice())
                        .build()).toList())
                .build();
    }
}
