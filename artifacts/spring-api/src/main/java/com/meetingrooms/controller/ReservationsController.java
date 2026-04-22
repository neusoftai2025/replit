package com.meetingrooms.controller;

import com.meetingrooms.service.ReservationService;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/reservations")
public class ReservationsController {

    private final ReservationService reservationService;

    public ReservationsController(ReservationService reservationService) {
        this.reservationService = reservationService;
    }

    @GetMapping
    public ResponseEntity<?> listReservations(
            @RequestParam(required = false) Integer roomId,
            @RequestParam(required = false) String date,
            @RequestParam(required = false) Integer userId) {
        return ResponseEntity.ok(reservationService.listReservations(roomId, date, userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getReservation(@PathVariable Integer id) {
        return reservationService.getReservation(id)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(404).body(Map.of("error", "予約が見つかりません")));
    }

    @PostMapping
    public ResponseEntity<?> createReservation(@RequestBody Map<String, Object> body, HttpSession session) {
        Integer userId = (Integer) session.getAttribute("userId");
        if (userId == null) userId = 1;

        try {
            Integer roomId = body.get("roomId") != null ? ((Number) body.get("roomId")).intValue() : null;
            String title = (String) body.get("title");
            String description = (String) body.get("description");
            String date = (String) body.get("date");
            String startTime = (String) body.get("startTime");
            String endTime = (String) body.get("endTime");
            Integer attendees = body.get("attendees") != null ? ((Number) body.get("attendees")).intValue() : null;

            if (roomId == null || title == null || date == null || startTime == null || endTime == null || attendees == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "必須項目が不足しています"));
            }

            var req = new ReservationService.ReservationRequest(roomId, title, description, date, startTime, endTime, attendees);
            return ResponseEntity.ok(reservationService.createReservation(req, userId));
        } catch (ReservationService.ConflictException e) {
            return ResponseEntity.status(409).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/{id}")
    public ResponseEntity<?> updateReservation(@PathVariable Integer id, @RequestBody Map<String, Object> body) {
        try {
            Integer roomId = body.get("roomId") != null ? ((Number) body.get("roomId")).intValue() : null;
            String title = (String) body.get("title");
            String description = (String) body.get("description");
            String date = (String) body.get("date");
            String startTime = (String) body.get("startTime");
            String endTime = (String) body.get("endTime");
            Integer attendees = body.get("attendees") != null ? ((Number) body.get("attendees")).intValue() : null;

            var req = new ReservationService.ReservationRequest(roomId, title, description, date, startTime, endTime, attendees);
            return reservationService.updateReservation(id, req)
                    .<ResponseEntity<?>>map(ResponseEntity::ok)
                    .orElse(ResponseEntity.status(404).body(Map.of("error", "予約が見つかりません")));
        } catch (ReservationService.ConflictException e) {
            return ResponseEntity.status(409).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteReservation(@PathVariable Integer id) {
        if (reservationService.deleteReservation(id)) {
            return ResponseEntity.ok(Map.of("success", true));
        }
        return ResponseEntity.status(404).body(Map.of("error", "予約が見つかりません"));
    }
}
