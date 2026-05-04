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

    // 🔐 LOGIN
    @PostMapping("/login")
    public Map<String, String> login(@RequestBody LoginRequest request) {

        User user = userRepo.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // ✅ Correct password check (bcrypt)
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }

        // 🔐 Generate JWT
        String token = jwtUtil.generateToken(user.getUsername(), user.getRole());

        return Map.of(
                "token", token,
                "role", user.getRole(),
                "username", user.getUsername()
        );
    }

    // 🆕 REGISTER (USER only)
    @PostMapping("/register")
    public Map<String, String> register(@RequestBody RegisterRequest request) {

        if (userRepo.findByUsername(request.getUsername()).isPresent()) {
            throw new RuntimeException("User already exists");
        }

        User user = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword())) // 🔥 bcrypt
                .role("ROLE_USER") // 🔥 IMPORTANT
                .build();

        userRepo.save(user);

        return Map.of(
                "message", "User registered successfully"
        );
    }

    // 🔥 OPTIONAL: CREATE ADMIN (for testing)
    @PostMapping("/create-admin")
    public Map<String, String> createAdmin(@RequestBody RegisterRequest request) {

        if (userRepo.findByUsername(request.getUsername()).isPresent()) {
            throw new RuntimeException("Admin already exists");
        }

        User admin = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .role("ROLE_ADMIN") // 🔥 ADMIN ROLE
                .build();

        userRepo.save(admin);

        return Map.of(
                "message", "Admin created successfully"
        );
    }
}