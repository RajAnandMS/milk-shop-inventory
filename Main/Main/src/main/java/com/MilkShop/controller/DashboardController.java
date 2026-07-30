package com.MilkShop.controller;

import com.MilkShop.dto.DashboardResponse;
import com.MilkShop.service.DashboardService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "*")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/today")
    public DashboardResponse getTodayDashboard() {
        return dashboardService.getTodayDashboard();
    }
}