package com.tungzone.controller;

import com.tungzone.dto.user.UserProfileResponse;
import com.tungzone.dto.user.UserProfileUpdateRequest;
import com.tungzone.service.UserProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users/me")
@RequiredArgsConstructor
public class UserProfileController {
    private final UserProfileService userProfileService;

    @GetMapping
    public UserProfileResponse getMyProfile(Authentication authentication) {
        return userProfileService.getProfile(authentication.getName());
    }

    @PutMapping
    public UserProfileResponse updateMyProfile(Authentication authentication,
                                               @Valid @RequestBody UserProfileUpdateRequest request) {
        return userProfileService.updateProfile(authentication.getName(), request);
    }
}
