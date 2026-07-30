package com.MilkShop.controller;
import com.MilkShop.dto.RestockRequest;
import com.MilkShop.entity.Inventory;
import com.MilkShop.service.InventoryService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inventory")
@CrossOrigin(origins = "*")
public class InventoryController {

    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @GetMapping
    public List<Inventory> getInventory() {
        return inventoryService.getAllInventory();
    }

    @PostMapping("/{productId}")
    public Inventory createInventory(@PathVariable Long productId) {
        return inventoryService.createInventory(productId);
    }

    @PutMapping("/{inventoryId}")
    public Inventory updateStock(@PathVariable Long inventoryId,
                                 @RequestParam Integer stock) {

        return inventoryService.updateStock(inventoryId, stock);
    }
    @PutMapping("/{id}/restock")
    public Inventory restock(
            @PathVariable Long id,
            @RequestBody RestockRequest request
    ) {
        return inventoryService.restock(id, request.quantity());
    }
    @PostMapping("/prepare-next-day")
    public List<Inventory> prepareNextDay() {
        return inventoryService.prepareNextDay();
    }
}