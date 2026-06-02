package com.tungzone;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.util.StringUtils;

@SpringBootApplication
public class TungzoneApplication {
    public static void main(String[] args) {
        SpringApplication.run(TungzoneApplication.class, args);
    }

    @Value("${app.jwt.secret:}")
    private String jwtSecret;

    @Value("${spring.jpa.hibernate.ddl-auto:update}")
    private String hibernateDdlAuto;

    @Value("${app.hibernate.allow-destructive-ddl:false}")
    private boolean allowDestructiveDdl;

    @PostConstruct
    public void validateEnvironment() {
        if (!StringUtils.hasText(jwtSecret)) {
            throw new IllegalStateException(
                "FATAL: app.jwt.secret is not set. " +
                "Set the JWT_SECRET environment variable (minimum 32 characters). " +
                "Generate with: openssl rand -base64 32"
            );
        }
        if (jwtSecret.length() < 32) {
            throw new IllegalStateException(
                "FATAL: app.jwt.secret must be at least 32 characters. " +
                "Current length: " + jwtSecret.length()
            );
        }

        String ddlAuto = hibernateDdlAuto == null
            ? ""
            : hibernateDdlAuto.trim().toLowerCase();
        if (!allowDestructiveDdl && ("create".equals(ddlAuto) || "create-drop".equals(ddlAuto))) {
            throw new IllegalStateException(
                "FATAL: spring.jpa.hibernate.ddl-auto=" + ddlAuto + " can destroy existing data. " +
                "Use update/validate for deployed databases, or set APP_ALLOW_DESTRUCTIVE_DDL=true only for disposable databases."
            );
        }
    }
}
