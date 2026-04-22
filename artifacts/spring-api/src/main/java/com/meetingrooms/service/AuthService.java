package com.meetingrooms.service;

import com.meetingrooms.dto.UserDto;
import com.meetingrooms.entity.User;
import com.meetingrooms.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public Optional<UserDto> login(String email, String password) {
        return userRepository.findByEmail(email)
                .filter(user -> checkPassword(password, user.getPassword()))
                .map(UserDto::from);
    }

    private boolean checkPassword(String rawPassword, String stored) {
        if (stored == null) return false;
        if (stored.startsWith("$2b$") || stored.startsWith("$2a$") || stored.startsWith("$2y$")) {
            return passwordEncoder.matches(rawPassword, stored);
        }
        return rawPassword.equals(stored);
    }

    public Optional<UserDto> getUserById(Integer id) {
        return userRepository.findById(id).map(UserDto::from);
    }
}
