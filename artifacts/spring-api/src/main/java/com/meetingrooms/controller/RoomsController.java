package com.meetingrooms.controller;

import com.meetingrooms.service.RoomService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/rooms")
public class RoomsController {

    private final RoomService roomService;

    public RoomsController(RoomService roomService) {
        this.roomService = roomService;
    }

    @GetMapping
    public ResponseEntity<?> listRooms(
            @RequestParam(required = false) Integer floor,
            @RequestParam(required = false) Integer capacity) {
        return ResponseEntity.ok(roomService.listRooms(floor, capacity));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getRoom(@PathVariable Integer id) {
        return roomService.getRoom(id)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(404).body(Map.of("error", "会議室が見つかりません")));
    }

    @PostMapping
    public ResponseEntity<?> createRoom(@RequestBody Map<String, Object> body) {
        try {
            String name = (String) body.get("name");
            Integer floor = body.get("floor") != null ? ((Number) body.get("floor")).intValue() : null;
            Integer capacity = body.get("capacity") != null ? ((Number) body.get("capacity")).intValue() : null;
            Object equipObj = body.get("equipment");
            List<String> equipment = null;
            if (equipObj instanceof List<?> list) {
                equipment = list.stream().map(Object::toString).toList();
            }
            Boolean available = body.get("available") != null ? (Boolean) body.get("available") : true;

            if (name == null || floor == null || capacity == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "name, floor, capacity は必須です"));
            }

            var req = new RoomService.RoomRequest(name, floor, capacity, equipment, available);
            return ResponseEntity.ok(roomService.createRoom(req));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/{id}")
    public ResponseEntity<?> updateRoom(@PathVariable Integer id, @RequestBody Map<String, Object> body) {
        try {
            String name = (String) body.get("name");
            Integer floor = body.get("floor") != null ? ((Number) body.get("floor")).intValue() : null;
            Integer capacity = body.get("capacity") != null ? ((Number) body.get("capacity")).intValue() : null;
            Object equipObj = body.get("equipment");
            List<String> equipment = null;
            if (equipObj instanceof List<?> list) {
                equipment = list.stream().map(Object::toString).toList();
            }
            Boolean available = body.get("available") != null ? (Boolean) body.get("available") : null;

            var req = new RoomService.RoomRequest(name, floor, capacity, equipment, available);
            return roomService.updateRoom(id, req)
                    .<ResponseEntity<?>>map(ResponseEntity::ok)
                    .orElse(ResponseEntity.status(404).body(Map.of("error", "会議室が見つかりません")));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteRoom(@PathVariable Integer id) {
        if (roomService.deleteRoom(id)) {
            return ResponseEntity.ok(Map.of("success", true));
        }
        return ResponseEntity.status(404).body(Map.of("error", "会議室が見つかりません"));
    }
}
