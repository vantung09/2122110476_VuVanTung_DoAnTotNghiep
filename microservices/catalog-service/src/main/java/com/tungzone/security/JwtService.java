package com.tungzone.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;
import java.util.function.Function;

@Service
public class JwtService {
    @Value("${app.jwt.secret}")
    private String jwtSecret;

    public String extractUsername(String token) { return extractClaim(token, Claims::getSubject); }
    public String extractRole(String token) { return extractClaim(token, claims -> String.valueOf(claims.get("role"))); }
    public boolean isTokenValid(String token) { return extractClaim(token, Claims::getExpiration).after(new Date()); }
    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        Claims claims = Jwts.parserBuilder().setSigningKey(getSigningKey()).build().parseClaimsJws(token).getBody();
        return claimsResolver.apply(claims);
    }
    private Key getSigningKey() { return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8)); }
}