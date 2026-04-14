package com.tungzone.service;

import com.tungzone.dto.auth.AuthResponse;
import com.tungzone.dto.auth.GoogleLoginRequest;
import com.tungzone.dto.auth.GoogleTokenInfo;
import com.tungzone.dto.auth.LoginRequest;
import com.tungzone.dto.auth.RegisterRequest;
import com.tungzone.entity.Role;
import com.tungzone.entity.User;
import com.tungzone.repository.UserRepository;
import com.tungzone.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    @Value("${app.google.client-id:}")
    private String googleClientId;

    public AuthResponse register(RegisterRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email đã tồn tại");
        }

        User user = User.builder()
                .fullName(request.getFullName())
                .email(email)
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.USER)
                .build();

        userRepository.save(user);
        return toResponse(user);
    }

    public AuthResponse login(LoginRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(email, request.getPassword()));

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        return toResponse(user);
    }

    public AuthResponse loginWithGoogle(GoogleLoginRequest request) {
        if (googleClientId == null || googleClientId.isBlank()) {
            throw new RuntimeException("Google client ID chưa được cấu hình");
        }

        GoogleTokenInfo tokenInfo = verifyGoogleToken(request.getCredential());
        if (tokenInfo == null || tokenInfo.getEmail() == null) {
            throw new RuntimeException("Không thể xác thực tài khoản Google");
        }
        if (!googleClientId.equals(tokenInfo.getAud())) {
            throw new RuntimeException("Token Google không hợp lệ");
        }
        if (!"true".equalsIgnoreCase(tokenInfo.getEmailVerified())) {
            throw new RuntimeException("Email Google chưa được xác minh");
        }

        String email = tokenInfo.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmail(email)
                .orElseGet(() -> createGoogleUser(tokenInfo, email));

        return toResponse(user);
    }

    private GoogleTokenInfo verifyGoogleToken(String credential) {
        RestTemplate restTemplate = new RestTemplate();
        String url = "https://oauth2.googleapis.com/tokeninfo?id_token=" + credential;
        return restTemplate.getForObject(url, GoogleTokenInfo.class);
    }

    private User createGoogleUser(GoogleTokenInfo tokenInfo, String email) {
        String fullName = tokenInfo.getName() != null ? tokenInfo.getName() : email;
        User user = User.builder()
                .fullName(fullName)
                .email(email)
                .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                .role(Role.USER)
                .build();
        return userRepository.save(user);
    }

    private AuthResponse toResponse(User user) {
        String token = jwtService.generateToken(user.getEmail(), user.getRole().name(), user.getId(), user.getFullName());
        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .build();
    }
}
