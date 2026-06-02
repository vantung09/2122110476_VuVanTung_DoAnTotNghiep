package com.tungzone.controller;

import com.tungzone.dto.ai.AiAdvisorRequest;
import com.tungzone.dto.ai.AiAdvisorResponse;
import com.tungzone.service.AiAdvisorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiAdvisorController {
    private final AiAdvisorService aiAdvisorService;

    @PostMapping("/advisor")
    public AiAdvisorResponse advise(@Valid @RequestBody AiAdvisorRequest request) {
        return aiAdvisorService.advise(request);
    }
}
