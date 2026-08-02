package com.milkshop.backend.controller;

import com.milkshop.backend.dto.DashboardResponse;
import com.milkshop.backend.service.DashboardService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "http://localhost:5173")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(
            DashboardService dashboardService
    ) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/today")
    public DashboardResponse getTodayDashboard() {
        return dashboardService.getTodayDashboard();
    }
}