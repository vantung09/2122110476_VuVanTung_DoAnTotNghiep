package com.tungzone.dto.ai;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class AiAdvisorRequest {
    @NotBlank(message = "Tin nhan khong duoc de trong.")
    @Size(max = 1200, message = "Tin nhan toi da 1200 ky tu.")
    private String message;

    @Valid
    @Size(max = 8)
    private List<AiConversationMessage> history = new ArrayList<>();
}
