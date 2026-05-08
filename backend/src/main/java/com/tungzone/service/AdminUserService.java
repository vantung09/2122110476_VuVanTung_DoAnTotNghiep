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
            throw new RuntimeException("Email đã tồn tại");
        }

        User user = User.builder()
                .fullName(request.getFullName().trim())
                .email(email)
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.valueOf(request.getRole().trim().toUpperCase()))
                .build();

        return toResponse(userRepository.save(user));
    }

    public UserAdminResponse updateUser(Long id, UserUpdateRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            user.setFullName(request.getFullName().trim());
        }

        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            String newEmail = request.getEmail().trim().toLowerCase();
            if (!newEmail.equals(user.getEmail()) && userRepository.existsByEmail(newEmail)) {
                throw new RuntimeException("Email đã được sử dụng bởi tài khoản khác");
            }
            user.setEmail(newEmail);
        }

        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        if (request.getRole() != null && !request.getRole().isBlank()) {
            if (request.getRole().equalsIgnoreCase("ADMIN")) {
                long adminCount = userRepository.findAll().stream()
                        .filter(u -> u.getRole() == Role.ADMIN && !u.getId().equals(id))
                        .count();
                if (adminCount == 0) {
                    throw new RuntimeException("Không thể hạ cấp admin cuối cùng");
                }
            }
            user.setRole(Role.valueOf(request.getRole().trim().toUpperCase()));
        }

        return toResponse(userRepository.save(user));
    }

    public UserAdminResponse updateRole(Long id, String roleValue) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        user.setRole(Role.valueOf(roleValue.toUpperCase()));
        return toResponse(userRepository.save(user));
    }

    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        if (user.getRole() == Role.ADMIN && userRepository.findAll().stream().filter(u -> u.getRole() == Role.ADMIN).count() <= 1) {
            throw new RuntimeException("Không thể xóa admin cuối cùng");
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
