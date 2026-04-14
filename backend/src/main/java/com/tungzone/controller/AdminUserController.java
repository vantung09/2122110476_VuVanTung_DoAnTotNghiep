package com.tungzone.controller;

import com.tungzone.dto.common.ApiMessageResponse;
import com.tungzone.dto.user.UserAdminResponse;
import com.tungzone.dto.user.UserCreateRequest;
import com.tungzone.dto.user.UserRoleUpdateRequest;
import com.tungzone.service.AdminUserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {
    private final AdminUserService adminUserService;

    @GetMapping
    public List<UserAdminResponse> getAllUsers() {
        return adminUserService.getAllUsers();
    }

    @PostMapping
    public UserAdminResponse createUser(@Valid @RequestBody UserCreateRequest request) {
        return adminUserService.createUser(request);
    }

    @PutMapping("/{id}/role")
    public UserAdminResponse updateRole(@PathVariable Long id, @Valid @RequestBody UserRoleUpdateRequest request) {
        return adminUserService.updateRole(id, request.getRole());
    }

    @DeleteMapping("/{id}")
    public ApiMessageResponse deleteUser(@PathVariable Long id) {
        adminUserService.deleteUser(id);
        return new ApiMessageResponse("Xóa người dùng thành công");
    }
}
