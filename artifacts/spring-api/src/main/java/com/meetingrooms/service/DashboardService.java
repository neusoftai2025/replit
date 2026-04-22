package com.meetingrooms.service;

import com.meetingrooms.dto.ReservationDto;
import com.meetingrooms.entity.Reservation;
import com.meetingrooms.repository.ReservationRepository;
import com.meetingrooms.repository.RoomRepository;
import com.meetingrooms.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class DashboardService {

    private final ReservationRepository reservationRepository;
    private final RoomRepository roomRepository;
    private final UserRepository userRepository;

    public DashboardService(ReservationRepository reservationRepository,
                            RoomRepository roomRepository,
                            UserRepository userRepository) {
        this.reservationRepository = reservationRepository;
        this.roomRepository = roomRepository;
        this.userRepository = userRepository;
    }

    public Map<String, Object> getSummary() {
        String today = LocalDate.now().toString();
        long totalRooms = roomRepository.count();
        long availableNow = roomRepository.countAvailable();
        long todayCount = reservationRepository.findByDate(today).size();

        return Map.of(
                "totalRooms", totalRooms,
                "availableNow", availableNow,
                "todayCount", todayCount
        );
    }

    public List<ReservationDto> getTodayReservations() {
        String today = LocalDate.now().toString();
        return reservationRepository.findByDate(today).stream()
                .map(r -> {
                    String roomName = roomRepository.findById(r.getRoomId())
                            .map(room -> room.getName()).orElse("");
                    String userName = userRepository.findById(r.getUserId())
                            .map(user -> user.getName()).orElse("");
                    return ReservationDto.from(r, roomName, userName);
                })
                .toList();
    }

    public List<Map<String, Object>> getRoomUsage() {
        List<Object[]> stats = reservationRepository.findRoomUsageStats();
        List<Map<String, Object>> result = new ArrayList<>();
        for (Object[] row : stats) {
            Integer roomId = (Integer) row[0];
            Long count = (Long) row[1];
            String roomName = roomRepository.findById(roomId)
                    .map(room -> room.getName()).orElse("Unknown");
            result.add(Map.of(
                    "roomId", roomId,
                    "roomName", roomName,
                    "count", count
            ));
        }
        return result;
    }
}
