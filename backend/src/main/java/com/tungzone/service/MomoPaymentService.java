package com.tungzone.service;

import com.tungzone.dto.payment.MomoCreateItemRequest;
import com.tungzone.dto.payment.MomoCreatePaymentRequest;
import com.tungzone.dto.payment.MomoCreatePaymentResponse;
import com.tungzone.dto.payment.MomoCreateResponse;
import com.tungzone.entity.Order;
import com.tungzone.entity.OrderItem;
import com.tungzone.entity.OrderStatus;
import com.tungzone.entity.Product;
import com.tungzone.entity.User;
import com.tungzone.repository.OrderRepository;
import com.tungzone.repository.ProductRepository;
import com.tungzone.repository.UserRepository;
import com.tungzone.util.MomoSignatureUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MomoPaymentService {
    private static final long MOMO_MAX_AMOUNT_VND = 50_000_000L;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;

    @Value("${app.momo.partner-code:}")
    private String partnerCode;

    @Value("${app.momo.access-key:}")
    private String accessKey;

    @Value("${app.momo.secret-key:}")
    private String secretKey;

    @Value("${app.momo.endpoint:https://test-payment.momo.vn/v2/gateway/api/create}")
    private String endpoint;

    @Value("${app.momo.ipn-url:}")
    private String ipnUrl;

    @Value("${app.momo.redirect-url:http://localhost:5173/cart}")
    private String redirectUrl;

    public MomoCreatePaymentResponse createPayment(MomoCreatePaymentRequest request, String email) {
        if (request == null || request.items() == null || request.items().isEmpty()) {
            throw new IllegalArgumentException("Danh sÃ¡ch sáº£n pháº©m trá»‘ng.");
        }
        if (isBlank(partnerCode) || isBlank(accessKey) || isBlank(secretKey)) {
            throw new IllegalStateException("Thiáº¿u cáº¥u hÃ¬nh MoMo.");
        }
        if (isBlank(ipnUrl)) {
            throw new IllegalStateException("Thiáº¿u cáº¥u hÃ¬nh ipnUrl MoMo.");
        }

        String normalizedEmail = email != null ? email.trim().toLowerCase() : null;
        if (isBlank(normalizedEmail)) {
            throw new IllegalArgumentException("Khong tim thay nguoi dung.");
        }

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay nguoi dung."));

        Order order = buildOrder(user, request.items());
        long amount = Math.round(order.getTotalAmount());
        if (amount <= 0) {
            throw new IllegalArgumentException("So tien thanh toan khong hop le.");
        }
        if (amount > MOMO_MAX_AMOUNT_VND) {
            throw new IllegalArgumentException("Han muc MoMo toi da 50.000.000 VND moi giao dich.");
        }

        orderRepository.save(order);
        String orderId = order.getId().toString();
        String requestId = "REQ_" + UUID.randomUUID();
        String orderInfo = isBlank(request.orderInfo())
                ? "Thanh toan don hang #" + orderId
                : request.orderInfo();
        String requestType = "captureWallet";
        String extraData = "";

        String rawSignature = "accessKey=" + accessKey
                + "&amount=" + amount
                + "&extraData=" + extraData
                + "&ipnUrl=" + ipnUrl
                + "&orderId=" + orderId
                + "&orderInfo=" + orderInfo
                + "&partnerCode=" + partnerCode
                + "&redirectUrl=" + redirectUrl
                + "&requestId=" + requestId
                + "&requestType=" + requestType;

        String signature = MomoSignatureUtils.hmacSha256(rawSignature, secretKey);

        Map<String, Object> payload = new HashMap<>();
        payload.put("partnerCode", partnerCode);
        payload.put("requestId", requestId);
        payload.put("amount", amount);
        payload.put("orderId", orderId);
        payload.put("orderInfo", orderInfo);
        payload.put("redirectUrl", redirectUrl);
        payload.put("ipnUrl", ipnUrl);
        payload.put("requestType", requestType);
        payload.put("extraData", extraData);
        payload.put("lang", "vi");
        payload.put("signature", signature);

        RestTemplate restTemplate = new RestTemplate();
        MomoCreateResponse response;
        try {
            response = restTemplate.postForObject(endpoint, payload, MomoCreateResponse.class);
        } catch (HttpStatusCodeException exception) {
            throw new IllegalStateException(extractMomoMessage(exception.getResponseBodyAsString()));
        }
        if (response == null || response.resultCode() == null || response.resultCode() != 0) {
            String message = response != null ? response.message() : "KhÃ´ng táº¡o Ä‘Æ°á»£c thanh toÃ¡n MoMo.";
            throw new IllegalStateException(message);
        }

        return new MomoCreatePaymentResponse(orderId, amount, response.payUrl(), response.qrCodeUrl(), response.deeplink());
    }

    private Order buildOrder(User user, List<MomoCreateItemRequest> items) {
        Order order = new Order();
        order.setUser(user);
        order.setStatus(OrderStatus.PENDING);
        List<OrderItem> orderItems = new ArrayList<>();
        double total = 0;

        for (MomoCreateItemRequest item : items) {
            if (item == null || item.productId() == null || item.quantity() == null || item.quantity() <= 0) {
                continue;
            }
            Product product = productRepository.findById(item.productId())
                    .orElseThrow(() -> new IllegalArgumentException("KhÃ´ng tÃ¬m tháº¥y sáº£n pháº©m."));
            double price = product.getPrice() != null ? product.getPrice() : 0;
            total += price * item.quantity();

            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setProduct(product);
            orderItem.setQuantity(item.quantity());
            orderItem.setPrice(price);
            orderItems.add(orderItem);
        }

        if (orderItems.isEmpty()) {
            throw new IllegalArgumentException("Danh sÃ¡ch sáº£n pháº©m trá»‘ng.");
        }

        order.setItems(orderItems);
        order.setTotalAmount(total);
        return order;
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private String extractMomoMessage(String rawBody) {
        if (isBlank(rawBody)) {
            return "Khong tao duoc thanh toan MoMo.";
        }
        String marker = "\"message\":\"";
        int start = rawBody.indexOf(marker);
        if (start < 0) {
            return rawBody;
        }
        int from = start + marker.length();
        int end = rawBody.indexOf("\"", from);
        if (end <= from) {
            return rawBody;
        }
        return rawBody.substring(from, end);
    }
}

