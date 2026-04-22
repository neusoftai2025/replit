package com.meetingrooms.service;

import com.meetingrooms.dto.RoomDto;
import com.meetingrooms.entity.Room;
import com.meetingrooms.repository.RoomRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class RoomService {

    private final RoomRepository roomRepository;

    public RoomService(RoomRepository roomRepository) {
        this.roomRepository = roomRepository;
    }

    public List<RoomDto> listRooms(Integer floor, Integer capacity) {
        return roomRepository.findByFilters(floor, capacity)
                .stream()
                .map(RoomDto::from)
                .toList();
    }

    public Optional<RoomDto> getRoom(Integer id) {
        return roomRepository.findById(id).map(RoomDto::from);
    }

    public RoomDto createRoom(RoomRequest req) {
        Room room = new Room();
        room.setName(req.name());
        room.setFloor(req.floor());
        room.setCapacity(req.capacity());
        room.setEquipment(req.equipment() != null ? req.equipment().toArray(new String[0]) : new String[0]);
        room.setAvailable(req.available() != null ? req.available() : true);
        return RoomDto.from(roomRepository.save(room));
    }

    public Optional<RoomDto> updateRoom(Integer id, RoomRequest req) {
        return roomRepository.findById(id).map(room -> {
            if (req.name() != null) room.setName(req.name());
            if (req.floor() != null) room.setFloor(req.floor());
            if (req.capacity() != null) room.setCapacity(req.capacity());
            if (req.equipment() != null) room.setEquipment(req.equipment().toArray(new String[0]));
            if (req.available() != null) room.setAvailable(req.available());
            return RoomDto.from(roomRepository.save(room));
        });
    }

    public boolean deleteRoom(Integer id) {
        if (!roomRepository.existsById(id)) return false;
        roomRepository.deleteById(id);
        return true;
    }

    public long countAvailable() {
        return roomRepository.countAvailable();
    }

    public long countAll() {
        return roomRepository.count();
    }

    public record RoomRequest(
            String name,
            Integer floor,
            Integer capacity,
            java.util.List<String> equipment,
            Boolean available
    ) {}
}
