package com.milkshop.backend.controller;

import com.milkshop.backend.dto.SaleRequest;
import com.milkshop.backend.entity.Sale;
import com.milkshop.backend.service.SaleService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sales")
@CrossOrigin(origins = "http://localhost:5173")
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