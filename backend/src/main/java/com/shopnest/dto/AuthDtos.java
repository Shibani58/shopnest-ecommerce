package com.shopnest.dto;

import com.shopnest.entity.Role;
import com.shopnest.entity.User;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class AuthDtos {

    private AuthDtos() {
    }

    public record RegisterRequest(
            @NotBlank @Size(max = 80) String fullName,
            @NotBlank @Email @Size(max = 120) String email,
            @NotBlank @Size(min = 8, max = 64, message = "must be 8-64 characters") String password) {
    }

    public record LoginRequest(
            @NotBlank @Email String email,
            @NotBlank String password) {
    }

    public record UserResponse(Long id, String fullName, String email, Role role) {

        public static UserResponse from(User user) {
            return new UserResponse(user.getId(), user.getFullName(), user.getEmail(), user.getRole());
        }
    }

    public record AuthResponse(String token, long expiresInMs, UserResponse user) {
    }
}
