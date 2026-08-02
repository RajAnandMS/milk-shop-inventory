package com.milkshop.backend.controller;

import com.milkshop.backend.dto.RestockRequest;
import com.milkshop.backend.entity.Inventory;
import com.milkshop.backend.service.InventoryService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inventory")
@CrossOrigin(origins = "http://localhost:5173")
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