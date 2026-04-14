package com.tungzone.dto.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UserProfileUpdateRequest {
    @NotBlank(message = "Ho ten khong duoc de trong")
    private String fullName;

    @Email(message = "Email khong hop le")
    @NotBlank(message = "Email khong duoc de trong")
    private String email;

    @Size(max = 20, message = "So dien thoai toi da 20 ky tu")
    private String phoneNumber;

    @Size(max = 255, message = "Dia chi toi da 255 ky tu")
    private String address;

    private String currentPassword;

    private String password;
}
