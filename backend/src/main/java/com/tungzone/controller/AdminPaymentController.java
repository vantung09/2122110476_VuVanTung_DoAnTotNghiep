package com.tungzone.controller;

import com.tungzone.dto.common.ApiMessageResponse;
import com.tungzone.dto.payment.PaymentAdminResponse;
import com.tungzone.dto.payment.PaymentCreateRequest;
import com.tungzone.dto.payment.PaymentUpdateRequest;
import com.tungzone.service.AdminPaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/payments")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminPaymentController {
    private final AdminPaymentService adminPaymentService;

    @GetMapping
    public List<PaymentAdminResponse> getAllPayments() {
        return adminPaymentService.getAllPayments();
    }

    @PostMapping
    public PaymentAdminResponse createPayment(@RequestBody PaymentCreateRequest request) {
        return adminPaymentService.createPayment(request);
    }

    @PutMapping("/{id}")
    public PaymentAdminResponse updatePayment(@PathVariable Long id, @RequestBody PaymentUpdateRequest request) {
        return adminPaymentService.updatePayment(id, request);
    }

    @DeleteMapping("/{id}")
    public ApiMessageResponse deletePayment(@PathVariable Long id) {
        adminPaymentService.deletePayment(id);
        return new ApiMessageResponse("Xoa giao dich thanh cong");
    }
}
