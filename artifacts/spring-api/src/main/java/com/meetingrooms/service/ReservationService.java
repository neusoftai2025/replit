package com.meetingrooms.service;

import com.meetingrooms.dto.ReservationDto;
import com.meetingrooms.entity.Reservation;
import com.meetingrooms.repository.ReservationRepository;
import com.meetingrooms.repository.RoomRepository;
import com.meetingrooms.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final RoomRepository roomRepository;
    private final UserRepository userRepository;

    public ReservationService(ReservationRepository reservationRepository,
                              RoomRepository roomRepository,
                              UserRepository userRepository) {
        this.reservationRepository = reservationRepository;
        this.roomRepository = roomRepository;
        this.userRepository = userRepository;
    }

    private ReservationDto enrich(Reservation r) {
        String roomName = roomRepository.findById(r.getRoomId())
                .map(room -> room.getName()).orElse("");
        String userName = userRepository.findById(r.getUserId())
                .map(user -> user.getName()).orElse("");
        return ReservationDto.from(r, roomName, userName);
    }

    public List<ReservationDto> listReservations(Integer roomId, String date, Integer userId) {
        return reservationRepository.findByFilters(roomId, date, userId)
                .stream()
                .map(this::enrich)
                .toList();
    }

    public Optional<ReservationDto> getReservation(Integer id) {
        return reservationRepository.findById(id).map(this::enrich);
    }

    public ReservationDto createReservation(ReservationRequest req, Integer userId) {
        List<Reservation> conflicts = reservationRepository.findConflicting(
                req.roomId(), req.date(), req.startTime(), req.endTime());
        if (!conflicts.isEmpty()) {
            throw new ConflictException("この時間帯は既に予約されています");
        }

        Reservation r = new Reservation();
        r.setRoomId(req.roomId());
        r.setUserId(userId);
        r.setTitle(req.title());
        r.setDescription(req.description());
        r.setDate(req.date());
        r.setStartTime(req.startTime());
        r.setEndTime(req.endTime());
        r.setAttendees(req.attendees());
        return enrich(reservationRepository.save(r));
    }

    public Optional<ReservationDto> updateReservation(Integer id, ReservationRequest req) {
        return reservationRepository.findById(id).map(r -> {
            if (req.roomId() != null) r.setRoomId(req.roomId());
            if (req.title() != null) r.setTitle(req.title());
            if (req.description() != null) r.setDescription(req.description());
            if (req.date() != null) r.setDate(req.date());
            if (req.startTime() != null) r.setStartTime(req.startTime());
            if (req.endTime() != null) r.setEndTime(req.endTime());
            if (req.attendees() != null) r.setAttendees(req.attendees());

            String roomId = req.roomId() != null ? req.roomId().toString() : r.getRoomId().toString();
            String date = req.date() != null ? req.date() : r.getDate();
            String startTime = req.startTime() != null ? req.startTime() : r.getStartTime();
            String endTime = req.endTime() != null ? req.endTime() : r.getEndTime();

            List<Reservation> conflicts = reservationRepository.findConflictingExcluding(
                    r.getRoomId(), r.getDate(), r.getStartTime(), r.getEndTime(), id);
            if (!conflicts.isEmpty()) {
                throw new ConflictException("この時間帯は既に予約されています");
            }

            return enrich(reservationRepository.save(r));
        });
    }

    public boolean deleteReservation(Integer id) {
        if (!reservationRepository.existsById(id)) return false;
        reservationRepository.deleteById(id);
        return true;
    }

    public List<Reservation> getTodayReservations(String today) {
        return reservationRepository.findByDate(today);
    }

    public List<Object[]> getRoomUsageStats() {
        return reservationRepository.findRoomUsageStats();
    }

    public static class ConflictException extends RuntimeException {
        public ConflictException(String message) { super(message); }
    }

    public record ReservationRequest(
            Integer roomId,
            String title,
            String description,
            String date,
            String startTime,
            String endTime,
            Integer attendees
    ) {}
}
