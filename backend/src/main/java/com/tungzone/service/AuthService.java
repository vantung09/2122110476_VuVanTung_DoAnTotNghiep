package com.tungzone.service;

import com.tungzone.dto.auth.AuthResponse;
import com.tungzone.dto.auth.ForgotPasswordRequest;
import com.tungzone.dto.auth.GoogleLoginRequest;
import com.tungzone.dto.auth.GoogleTokenInfo;
import com.tungzone.dto.auth.LoginRequest;
import com.tungzone.dto.auth.RegisterRequest;
import com.tungzone.dto.auth.ResetPasswordRequest;
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

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final MailNotificationService mailNotificationService;

    @Value("${app.google.client-id:}")
    private String googleClientId;

    @Value("${app.jwt.expiration:86400000}")
    private long jwtExpiration;

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
        return toResponse(user, false);
    }

    public AuthResponse login(LoginRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(email, request.getPassword()));

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        return toResponse(user, request.getRemember());
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

        return toResponse(user, false);
    }

    public String requestPasswordReset(ForgotPasswordRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        String defaultMessage = "Neu email ton tai, he thong da gui ma xac thuc dat lai mat khau.";
        String[] message = {defaultMessage};

        userRepository.findByEmail(email).ifPresent(user -> {
            String token = generateResetToken();
            user.setPasswordResetToken(passwordEncoder.encode(token));
            user.setPasswordResetExpiresAt(LocalDateTime.now().plusMinutes(30));
            boolean emailSent = mailNotificationService.sendPasswordReset(email, token);
            userRepository.save(user);
            if (!emailSent) {
                message[0] = "Chua cau hinh SMTP nen he thong dang chay che do local. Ma xac thuc cua ban la: " + token;
            }
        });

        return message[0];
    }

    public void resetPassword(ResetPasswordRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Ma xac thuc hoac email khong hop le"));

        if (user.getPasswordResetToken() == null
                || user.getPasswordResetExpiresAt() == null
                || user.getPasswordResetExpiresAt().isBefore(LocalDateTime.now())
                || !passwordEncoder.matches(request.getToken().trim(), user.getPasswordResetToken())) {
            throw new RuntimeException("Ma xac thuc da het han hoac khong hop le");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setPasswordResetToken(null);
        user.setPasswordResetExpiresAt(null);
        userRepository.save(user);
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

    private String generateResetToken() {
        return String.format("%06d", SECURE_RANDOM.nextInt(1_000_000));
    }

    private AuthResponse toResponse(User user, Boolean remember) {
        long expiration = Boolean.TRUE.equals(remember) ? jwtExpiration * 7 : jwtExpiration;
        String token = jwtService.generateToken(user.getEmail(), user.getRole().name(), user.getId(), user.getFullName(), expiration);
        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .build();
    }
}
