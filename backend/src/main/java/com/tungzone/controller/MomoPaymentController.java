package com.tungzone.controller;

import com.tungzone.dto.payment.MomoCreatePaymentRequest;
import com.tungzone.dto.payment.MomoCreatePaymentResponse;
import com.tungzone.service.MomoPaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/payments/momo")
@RequiredArgsConstructor
public class MomoPaymentController {
    private final MomoPaymentService momoPaymentService;

    @PostMapping("/create")
    public MomoCreatePaymentResponse create(@RequestBody MomoCreatePaymentRequest request,
                                            Authentication authentication) {
        String email = authentication != null ? authentication.getName() : null;
        return momoPaymentService.createPayment(request, email);
    }
}
