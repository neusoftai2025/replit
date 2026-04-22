package com.meetingrooms.controller;

import com.meetingrooms.service.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/summary")
    public ResponseEntity<?> summary() {
        return ResponseEntity.ok(dashboardService.getSummary());
    }

    @GetMapping("/today")
    public ResponseEntity<?> today() {
        return ResponseEntity.ok(dashboardService.getTodayReservations());
    }

    @GetMapping("/room-usage")
    public ResponseEntity<?> roomUsage() {
        return ResponseEntity.ok(dashboardService.getRoomUsage());
    }
}
