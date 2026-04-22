package com.meetingrooms.dto;

import com.meetingrooms.entity.Reservation;
import java.time.LocalDateTime;

public class ReservationDto {
    private Integer id;
    private Integer roomId;
    private Integer userId;
    private String title;
    private String description;
    private String date;
    private String startTime;
    private String endTime;
    private Integer attendees;
    private String roomName;
    private String userName;
    private LocalDateTime createdAt;

    public ReservationDto() {}

    public static ReservationDto from(Reservation r, String roomName, String userName) {
        ReservationDto dto = new ReservationDto();
        dto.id = r.getId();
        dto.roomId = r.getRoomId();
        dto.userId = r.getUserId();
        dto.title = r.getTitle();
        dto.description = r.getDescription();
        dto.date = r.getDate();
        dto.startTime = r.getStartTime();
        dto.endTime = r.getEndTime();
        dto.attendees = r.getAttendees();
        dto.roomName = roomName;
        dto.userName = userName;
        dto.createdAt = r.getCreatedAt();
        return dto;
    }

    public Integer getId() { return id; }
    public Integer getRoomId() { return roomId; }
    public Integer getUserId() { return userId; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public String getDate() { return date; }
    public String getStartTime() { return startTime; }
    public String getEndTime() { return endTime; }
    public Integer getAttendees() { return attendees; }
    public String getRoomName() { return roomName; }
    public String getUserName() { return userName; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
