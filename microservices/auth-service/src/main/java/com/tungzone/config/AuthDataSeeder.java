package com.tungzone.config;

import com.tungzone.entity.Role;
import com.tungzone.entity.User;
import com.tungzone.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AuthDataSeeder implements CommandLineRunner {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        seedUser("System Admin", "admin@tungzone.com", "admin123", Role.ADMIN);
        seedUser("Demo User", "user@tungzone.com", "user123", Role.USER);
    }

    private void seedUser(String fullName, String email, String rawPassword, Role role) {
        userRepository.findByEmail(email).orElseGet(() ->
                userRepository.save(User.builder()
                        .fullName(fullName)
                        .email(email)
                        .password(passwordEncoder.encode(rawPassword))
                        .role(role)
                        .build())
        );
    }
}