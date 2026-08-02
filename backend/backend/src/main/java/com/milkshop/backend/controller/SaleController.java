package com.milkshop.backend.controller;

import java.util.List;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.milkshop.backend.dto.SaleRequest;
import com.milkshop.backend.entity.Sale;
import com.milkshop.backend.service.SaleService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/sales")
@CrossOrigin(origins = {
        "http://localhost:5173",
        "https://milk-shop-inventory.vercel.app"
})
public class SaleController {

    private final SaleService saleService;

    public SaleController(SaleService saleService) {
        this.saleService = saleService;
    }

    @PostMapping
    public Sale recordSale(
            @Valid @RequestBody SaleRequest request
    ) {
        return saleService.recordSale(
                request.productId(),
                request.quantity()
        );
    }

    @GetMapping
    public List<Sale> getAllSales() {
        return saleService.getAllSales();
    }

    @GetMapping("/today")
    public List<Sale> getTodaySales() {
        return saleService.getTodaySales();
    }
}