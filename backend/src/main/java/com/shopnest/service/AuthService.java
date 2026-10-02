package com.shopnest.service;

import com.shopnest.dto.AuthDtos.*;
import com.shopnest.entity.Role;
import com.shopnest.entity.User;
import com.shopnest.exception.BusinessException;
import com.shopnest.exception.ResourceNotFoundException;
import com.shopnest.repository.UserRepository;
import com.shopnest.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        String email = normalise(req.email());
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new BusinessException(HttpStatus.CONFLICT, "An account with this email already exists");
        }
        User user = userRepository.save(
                new User(req.fullName().trim(), email, passwordEncoder.encode(req.password()), Role.CUSTOMER));
        return toAuthResponse(user);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByEmailIgnoreCase(normalise(req.email()))
                .filter(u -> passwordEncoder.matches(req.password(), u.getPassword()))
                .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));
        return toAuthResponse(user);
    }

    @Transactional(readOnly = true)
    public UserResponse me(Long userId) {
        return userRepository.findById(userId)
                .map(UserResponse::from)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
    }

    private AuthResponse toAuthResponse(User user) {
        return new AuthResponse(jwtService.generateToken(user), jwtService.getExpirationMs(), UserResponse.from(user));
    }

    private static String normalise(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
