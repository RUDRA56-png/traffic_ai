package com.traffic.jwt;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.List;

@Component
public class JwtFilter extends GenericFilter {

    @Autowired
    private JwtUtil jwtUtil;

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest req = (HttpServletRequest) request;

        String authHeader = req.getHeader("Authorization");

        // 🔐 Check token exists and starts with Bearer
        if (authHeader != null && authHeader.startsWith("Bearer ")) {

            String token = authHeader.substring(7);

            try {
                String username = jwtUtil.extractUsername(token);
                String role = jwtUtil.extractRole(token); // e.g. ROLE_ADMIN

                // ✅ IMPORTANT: role already has ROLE_ prefix
                List<SimpleGrantedAuthority> authorities =
                        List.of(new SimpleGrantedAuthority(role));

                UsernamePasswordAuthenticationToken auth =
                        new UsernamePasswordAuthenticationToken(
                                username,
                                null,
                                authorities
                        );

                // 🔐 Set authentication in context
                SecurityContextHolder.getContext().setAuthentication(auth);

            } catch (Exception e) {
                // 🔥 Prevent crash on invalid token
                System.out.println("JWT ERROR: " + e.getMessage());
            }
        }

        // Continue filter chain
        chain.doFilter(request, response);
    }
}