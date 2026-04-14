package com.tungzone.controller;

import com.tungzone.dto.user.UserProfileResponse;
import com.tungzone.dto.user.UserProfileUpdateRequest;
import com.tungzone.service.UserProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserProfileController {
    private final UserProfileService userProfileService;

    @GetMapping("/me")
    public UserProfileResponse getCurrentUserProfile(Authentication authentication) {
        return userProfileService.getCurrentUserProfile(authentication.getName());
    }

    @PutMapping("/me")
    public UserProfileResponse updateCurrentUserProfile(Authentication authentication,
                                                        @Valid @RequestBody UserProfileUpdateRequest request) {
        return userProfileService.updateCurrentUserProfile(authentication.getName(), request);
    }
}
