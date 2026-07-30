package com.MilkShop.controller;

import com.MilkShop.dto.SaleRequest;
import com.MilkShop.entity.Sale;
import com.MilkShop.service.SaleService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sales")
@CrossOrigin(origins = "*")
public class SaleController {

    private final SaleService saleService;

    public SaleController(SaleService saleService) {
        this.saleService = saleService;
    }

    @PostMapping
    public Sale recordSale(@RequestBody SaleRequest request) {

        System.out.println("==================================");
        System.out.println("Product Id : " + request.productId());
        System.out.println("Quantity   : " + request.quantity());
        System.out.println("==================================");

        return saleService.recordSale(request.productId(), request.quantity());
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