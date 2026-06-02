package com.tungzone.dto.ai;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class AiAdvisorResponse {
    private String text;
    private List<AiProductSuggestion> products;
    private List<String> followups;
    private Boolean aiPowered;
    private String model;
}
