package com.traffic.controller;

import com.traffic.dto.LoginRequest;
import com.traffic.dto.RegisterRequest;
import com.traffic.model.User;
import com.traffic.repository.UserRepository;
import com.traffic.jwt.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import org.springframework.security.crypto.password.PasswordEncoder;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin
public class AuthController {

    private final JwtUtil jwtUtil;
    private final UserRepository userRepo;
    private final PasswordEncoder passwordEncoder;

    // 🔐 LOGIN (FIXED)
    @PostMapping("/login")
    public Map<String, String> login(@RequestBody LoginRequest request) {

        User user = userRepo.findByUsername(request.getUsername()).orElse(null);

        if (user == null || !passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }

        String token = jwtUtil.generateToken(user.getUsername(), user.getRole());

        return Map.of(
                "token", token,
                "role", user.getRole(),
                "username", user.getUsername()
        );
    }

    // 🆕 REGISTER
    @PostMapping("/register")
    public String register(@RequestBody RegisterRequest request) {

        if (userRepo.findByUsername(request.getUsername()).isPresent()) {
            return "User already exists";
        }

        User user = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .role("USER")
                .build();

        userRepo.save(user);

        return "User registered successfully";
    }
}