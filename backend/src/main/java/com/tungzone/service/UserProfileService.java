package com.tungzone.service;

import com.tungzone.dto.user.UserProfileResponse;
import com.tungzone.dto.user.UserProfileUpdateRequest;
import com.tungzone.entity.User;
import com.tungzone.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserProfileService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserProfileResponse getCurrentUserProfile(String currentEmail) {
        User user = findByEmail(currentEmail);
        return toResponse(user);
    }

    public UserProfileResponse updateCurrentUserProfile(String currentEmail, UserProfileUpdateRequest request) {
        User user = findByEmail(currentEmail);

        String nextEmail = request.getEmail().trim().toLowerCase();
        String nextFullName = request.getFullName().trim();

        if (!nextEmail.equals(user.getEmail()) && userRepository.existsByEmail(nextEmail)) {
            throw new RuntimeException("Email da ton tai");
        }

        user.setFullName(nextFullName);
        user.setEmail(nextEmail);

        if (request.getPhoneNumber() != null) {
            user.setPhoneNumber(normalizeOptional(request.getPhoneNumber()));
        }

        if (request.getAddress() != null) {
            user.setAddress(normalizeOptional(request.getAddress()));
        }

        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            String nextPassword = request.getPassword().trim();
            String currentPassword = request.getCurrentPassword();

            if (currentPassword == null || currentPassword.isBlank()) {
                throw new RuntimeException("Vui long nhap mat khau cu");
            }

            if (!passwordEncoder.matches(currentPassword.trim(), user.getPassword())) {
                throw new RuntimeException("Mat khau cu khong dung");
            }

            if (nextPassword.length() < 6) {
                throw new RuntimeException("Mat khau toi thieu 6 ky tu");
            }
            user.setPassword(passwordEncoder.encode(nextPassword));
        }

        userRepository.save(user);
        return toResponse(user);
    }

    private User findByEmail(String email) {
        String normalizedEmail = email == null ? "" : email.trim().toLowerCase();
        return userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new RuntimeException("Khong tim thay nguoi dung"));
    }

    private String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private UserProfileResponse toResponse(User user) {
        return UserProfileResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .address(user.getAddress())
                .role(user.getRole().name())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
