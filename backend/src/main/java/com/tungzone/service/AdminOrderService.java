package com.tungzone.service;

import com.tungzone.dto.order.OrderAdminResponse;
import com.tungzone.dto.order.OrderItemResponse;
import com.tungzone.entity.Order;
import com.tungzone.entity.OrderStatus;
import com.tungzone.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminOrderService {
    private final OrderRepository orderRepository;

    public List<OrderAdminResponse> getAllOrders() {
        return orderRepository.findAllByOrderByIdDesc().stream().map(this::toResponse).toList();
    }

    public OrderAdminResponse updateStatus(Long id, String statusValue) {
        Order order = orderRepository.findDetailedById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));
        order.setStatus(OrderStatus.valueOf(statusValue.toUpperCase()));
        orderRepository.save(order);
        return toResponse(orderRepository.findDetailedById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng")));
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
