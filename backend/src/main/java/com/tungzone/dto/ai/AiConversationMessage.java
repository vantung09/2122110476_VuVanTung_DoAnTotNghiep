package com.tungzone.dto.ai;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AiConversationMessage {
    @Size(max = 20)
    private String role;

    @Size(max = 1200)
    private String text;
}
