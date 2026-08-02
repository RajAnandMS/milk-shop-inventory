package com.milkshop.backend.controller;

import java.util.List;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.milkshop.backend.dto.RestockRequest;
import com.milkshop.backend.entity.Inventory;
import com.milkshop.backend.service.InventoryService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/inventory")
@CrossOrigin(origins = {
        "http://localhost:5173",
        "https://milk-shop-inventory.vercel.app"
})
public class InventoryController {

    private final InventoryService inventoryService;

    public InventoryController(
            InventoryService inventoryService
    ) {
        this.inventoryService = inventoryService;
    }

    @GetMapping
    public List<Inventory> getTodayInventory() {
        return inventoryService.getTodayInventory();
    }

    @PostMapping("/{productId}")
    public Inventory createInventory(
            @PathVariable Long productId
    ) {
        return inventoryService.createInventory(productId);
    }

    @PutMapping("/{inventoryId}/restock")
    public Inventory restock(
            @PathVariable Long inventoryId,
            @Valid @RequestBody RestockRequest request
    ) {
        return inventoryService.restock(
                inventoryId,
                request.quantity()
        );
    }

    @PostMapping("/prepare-next-day")
    public List<Inventory> prepareNextDay() {
        return inventoryService.prepareNextDay();
    }
}