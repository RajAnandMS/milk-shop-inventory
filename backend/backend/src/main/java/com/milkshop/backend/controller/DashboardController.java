package com.milkshop.backend.controller;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.milkshop.backend.dto.DashboardResponse;
import com.milkshop.backend.service.DashboardService;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = {
        "http://localhost:5173",
        "https://milk-shop-inventory.vercel.app"
})
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