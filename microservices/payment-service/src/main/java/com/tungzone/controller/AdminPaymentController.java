package com.tungzone.controller;

import com.tungzone.dto.common.ApiMessageResponse;
import com.tungzone.dto.payment.PaymentAdminRequest;
import com.tungzone.dto.payment.PaymentAdminResponse;
import com.tungzone.service.AdminPaymentService;
import jakarta.validation.Valid;
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
    public List<PaymentAdminResponse> getAll() {
        return adminPaymentService.getAll();
    }

    @PostMapping
    public PaymentAdminResponse create(@Valid @RequestBody PaymentAdminRequest request) {
        return adminPaymentService.create(request);
    }

    @PutMapping("/{id}")
    public PaymentAdminResponse update(@PathVariable Long id, @Valid @RequestBody PaymentAdminRequest request) {
        return adminPaymentService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ApiMessageResponse delete(@PathVariable Long id) {
        adminPaymentService.delete(id);
        return new ApiMessageResponse("Xoa giao dich thanh toan thanh cong");
    }
}
