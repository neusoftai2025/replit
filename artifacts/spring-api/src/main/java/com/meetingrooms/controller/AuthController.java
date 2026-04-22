package com.meetingrooms.controller;

import com.meetingrooms.dto.UserDto;
import com.meetingrooms.service.AuthService;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body, HttpSession session) {
        String email = body.get("email");
        String password = body.get("password");

        if (email == null || password == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "メールアドレスとパスワードを入力してください"));
        }

        Optional<UserDto> user = authService.login(email, password);
        if (user.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("error", "メールアドレスまたはパスワードが正しくありません"));
        }

        session.setAttribute("userId", user.get().getId());
        return ResponseEntity.ok(user.get());
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(HttpSession session) {
        Integer userId = (Integer) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(401).body(Map.of("error", "認証が必要です"));
        }

        return authService.getUserById(userId)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(401).body(Map.of("error", "ユーザーが見つかりません")));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpSession session) {
        session.invalidate();
        return ResponseEntity.ok(Map.of("success", true));
    }
}
