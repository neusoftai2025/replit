package com.meetingrooms.dto;

import com.meetingrooms.entity.User;
import java.time.LocalDateTime;

public class UserDto {
    private Integer id;
    private String name;
    private String email;
    private String role;
    private String department;
    private LocalDateTime createdAt;

    public UserDto() {}

    public static UserDto from(User user) {
        UserDto dto = new UserDto();
        dto.id = user.getId();
        dto.name = user.getName();
        dto.email = user.getEmail();
        dto.role = user.getRole();
        dto.department = user.getDepartment();
        dto.createdAt = user.getCreatedAt();
        return dto;
    }

    public Integer getId() { return id; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public String getRole() { return role; }
    public String getDepartment() { return department; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
