package com.tungzone.service;

import com.tungzone.dto.order.OrderAdminCreateRequest;
import com.tungzone.dto.order.OrderAdminResponse;
import com.tungzone.dto.order.OrderItemCreateRequest;
import com.tungzone.dto.order.OrderItemResponse;
import com.tungzone.entity.Order;
import com.tungzone.entity.OrderItem;
import com.tungzone.entity.OrderStatus;
import com.tungzone.entity.Product;
import com.tungzone.entity.User;
import com.tungzone.repository.OrderRepository;
import com.tungzone.repository.ProductRepository;
import com.tungzone.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminOrderService {
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    public List<OrderAdminResponse> getAllOrders() {
        return orderRepository.findAllByOrderByIdDesc().stream().map(this::toResponse).toList();
    }

    public OrderAdminResponse createOrder(OrderAdminCreateRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("Khong tim thay nguoi dung"));

        Order order = new Order();
        order.setUser(user);
        order.setStatus(parseStatusOrDefault(request.getStatus()));

        List<OrderItem> items = new ArrayList<>();
        double total = 0;

        for (OrderItemCreateRequest itemRequest : request.getItems()) {
            Product product = productRepository.findById(itemRequest.getProductId())
                    .orElseThrow(() -> new RuntimeException("Khong tim thay san pham"));

            int quantity = itemRequest.getQuantity();
            double price = product.getPrice() != null ? product.getPrice() : 0;
            total += price * quantity;

            OrderItem item = new OrderItem();
            item.setOrder(order);
            item.setProduct(product);
            item.setQuantity(quantity);
            item.setPrice(price);
            items.add(item);
        }

        if (items.isEmpty()) {
            throw new RuntimeException("Danh sach san pham trong");
        }

        order.setItems(items);
        order.setTotalAmount(total);
        Order saved = orderRepository.save(order);
        return toResponse(orderRepository.findDetailedById(saved.getId())
                .orElseThrow(() -> new RuntimeException("Khong tim thay don hang")));
    }

    public OrderAdminResponse updateStatus(Long id, String statusValue) {
        Order order = orderRepository.findDetailedById(id)
                .orElseThrow(() -> new RuntimeException("Khong tim thay don hang"));
        order.setStatus(OrderStatus.valueOf(statusValue.trim().toUpperCase()));
        orderRepository.save(order);
        return toResponse(orderRepository.findDetailedById(id)
                .orElseThrow(() -> new RuntimeException("Khong tim thay don hang")));
    }

    public void deleteOrder(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Khong tim thay don hang"));
        orderRepository.delete(order);
    }

    private OrderStatus parseStatusOrDefault(String statusValue) {
        if (statusValue == null || statusValue.trim().isEmpty()) {
            return OrderStatus.PENDING;
        }
        return OrderStatus.valueOf(statusValue.trim().toUpperCase());
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
