package com.tungzone.service;

import com.tungzone.dto.order.OrderAdminResponse;
import com.tungzone.dto.order.OrderCreateRequest;
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
import org.springframework.transaction.annotation.Transactional;

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

    @Transactional
    public OrderAdminResponse createOrder(OrderCreateRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("Khong tim thay nguoi dung"));

        Order order = new Order();
        order.setUser(user);
        order.setStatus(request.getStatus() != null
                ? OrderStatus.valueOf(request.getStatus().toUpperCase())
                : OrderStatus.PENDING);

        List<OrderItem> orderItems = new ArrayList<>();
        double total = 0;

        if (request.getItems() != null) {
            for (OrderCreateRequest.OrderItemCreateRequest itemReq : request.getItems()) {
                if (itemReq.getProductId() == null || itemReq.getQuantity() == null || itemReq.getQuantity() <= 0) {
                    continue;
                }
                Product product = productRepository.findById(itemReq.getProductId())
                        .orElseThrow(() -> new RuntimeException("Khong tim thay san pham: " + itemReq.getProductId()));

                double price = product.getPrice() != null ? product.getPrice() : 0;
                total += price * itemReq.getQuantity();

                OrderItem item = new OrderItem();
                item.setOrder(order);
                item.setProduct(product);
                item.setQuantity(itemReq.getQuantity());
                item.setPrice(price);
                orderItems.add(item);
            }
        }

        order.setItems(orderItems);
        order.setTotalAmount(total);

        orderRepository.save(order);
        return toResponse(orderRepository.findDetailedById(order.getId())
                .orElseThrow(() -> new RuntimeException("Loi khi tao don hang")));
    }

    public OrderAdminResponse updateStatus(Long id, String statusValue) {
        Order order = orderRepository.findDetailedById(id)
                .orElseThrow(() -> new RuntimeException("Khong tim thay don hang"));
        order.setStatus(OrderStatus.valueOf(statusValue.toUpperCase()));
        orderRepository.save(order);
        return toResponse(orderRepository.findDetailedById(id)
                .orElseThrow(() -> new RuntimeException("Khong tim thay don hang")));
    }

    @Transactional
    public void deleteOrder(Long id) {
        orderRepository.deleteById(id);
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
