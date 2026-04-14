package com.tungzone.dto.user;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class UserProfileResponse {
    private Long id;
    private String fullName;
    private String email;
    private String phoneNumber;
    private String address;
    private String role;
    private LocalDateTime createdAt;
}
