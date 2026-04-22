package com.meetingrooms.dto;

import com.meetingrooms.entity.Room;
import java.time.LocalDateTime;
import java.util.List;

public class RoomDto {
    private Integer id;
    private String name;
    private Integer floor;
    private Integer capacity;
    private List<String> equipment;
    private Boolean available;
    private LocalDateTime createdAt;

    public RoomDto() {}

    public static RoomDto from(Room room) {
        RoomDto dto = new RoomDto();
        dto.id = room.getId();
        dto.name = room.getName();
        dto.floor = room.getFloor();
        dto.capacity = room.getCapacity();
        dto.equipment = room.getEquipmentList();
        dto.available = room.getAvailable();
        dto.createdAt = room.getCreatedAt();
        return dto;
    }

    public Integer getId() { return id; }
    public String getName() { return name; }
    public Integer getFloor() { return floor; }
    public Integer getCapacity() { return capacity; }
    public List<String> getEquipment() { return equipment; }
    public Boolean getAvailable() { return available; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
