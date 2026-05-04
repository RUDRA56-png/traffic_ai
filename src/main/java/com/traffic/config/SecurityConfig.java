package com.traffic.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)

                .authorizeHttpRequests(auth -> auth

                        // ✅ Allow preflight requests (VERY IMPORTANT for browser)
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // ✅ Public APIs
                        .requestMatchers("/api/auth/**").permitAll()

                        // ✅ Swagger access
                        .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()

                        // ✅ TEMP: allow all APIs (later we secure with JWT)
                        .anyRequest().permitAll()
                );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // 🔥 Allow your frontend (local + Vercel)
        config.setAllowedOrigins(List.of(
                "http://localhost:5173",
                "http://127.0.0.1:5173",
                "https://trafficai24-git-main-rudra56-pngs-projects.vercel.app"
        ));

        // Allowed HTTP methods
        config.setAllowedMethods(List.of(
                "GET", "POST", "PUT", "DELETE", "OPTIONS"
        ));

        // Allow all headers
        config.setAllowedHeaders(List.of("*"));

        // Expose Authorization header (useful later for JWT)
        config.setExposedHeaders(List.of("Authorization"));

        // ❗ IMPORTANT: must be false (we are not using cookies)
        config.setAllowCredentials(false);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);

        return source;
    }

    // 🔐 Required for password hashing
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}