package com.tungzone.dto.user;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UserRoleUpdateRequest {
    @NotBlank
    private String role;
}
