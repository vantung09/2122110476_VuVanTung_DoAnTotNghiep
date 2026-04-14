package com.tungzone.dto.auth;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class GoogleTokenInfo {
    private String aud;
    private String email;
    @JsonProperty("email_verified")
    private String emailVerified;
    private String name;
    private String picture;
    private String sub;
}
