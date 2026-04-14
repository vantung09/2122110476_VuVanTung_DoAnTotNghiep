package com.tungzone.service;

import com.tungzone.dto.user.UserAdminResponse;
import com.tungzone.dto.user.UserCreateRequest;
import com.tungzone.dto.user.UserUpdateRequest;
import com.tungzone.entity.Role;
import com.tungzone.entity.User;
import com.tungzone.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminUserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public List<UserAdminResponse> getAllUsers() {
        return userRepository.findAll().stream().map(this::toResponse).toList();
    }

    public UserAdminResponse createUser(UserCreateRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email da ton tai");
        }

        User user = User.builder()
                .fullName(request.getFullName().trim())
                .email(email)
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.valueOf(request.getRole().trim().toUpperCase()))
                .build();

        return toResponse(userRepository.save(user));
    }

    public UserAdminResponse updateRole(Long id, String roleValue) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Khong tim thay nguoi dung"));
        user.setRole(Role.valueOf(roleValue.trim().toUpperCase()));
        return toResponse(userRepository.save(user));
    }

    public UserAdminResponse updateUser(Long id, UserUpdateRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Khong tim thay nguoi dung"));

        String email = request.getEmail().trim().toLowerCase();
        userRepository.findByEmail(email)
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> {
                    throw new RuntimeException("Email da ton tai");
                });

        user.setFullName(request.getFullName().trim());
        user.setEmail(email);
        user.setRole(Role.valueOf(request.getRole().trim().toUpperCase()));

        if (request.getPassword() != null && !request.getPassword().trim().isEmpty()) {
            user.setPassword(passwordEncoder.encode(request.getPassword().trim()));
        }

        return toResponse(userRepository.save(user));
    }

    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Khong tim thay nguoi dung"));

        if (user.getRole() == Role.ADMIN
                && userRepository.findAll().stream().filter(u -> u.getRole() == Role.ADMIN).count() <= 1) {
            throw new RuntimeException("Khong the xoa admin cuoi cung");
        }

        userRepository.delete(user);
    }

    private UserAdminResponse toResponse(User user) {
        return UserAdminResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
