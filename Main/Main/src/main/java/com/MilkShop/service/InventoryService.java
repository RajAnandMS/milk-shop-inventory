package com.MilkShop.service;

import com.MilkShop.entity.Inventory;
import com.MilkShop.entity.Product;
import com.MilkShop.repository.InventoryRepository;
import com.MilkShop.repository.ProductRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class InventoryService {

    private final InventoryRepository inventoryRepository;
    private final ProductRepository productRepository;

    public InventoryService(InventoryRepository inventoryRepository,
                            ProductRepository productRepository) {
        this.inventoryRepository = inventoryRepository;
        this.productRepository = productRepository;
    }

    // Get all inventory
    public List<Inventory> getAllInventory() {
        return inventoryRepository.findAll();
    }

    // Create inventory for a product
    public Inventory createInventory(Long productId) {

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        Inventory inventory = Inventory.builder()
                .product(product)
                .currentStock(product.getDefaultStock())
                .unitsSold(0)
                .businessDate(LocalDate.now())
                .build();

        return inventoryRepository.save(inventory);
    }

    // Update Stock
    public Inventory updateStock(Long inventoryId, Integer stock) {

        Inventory inventory = inventoryRepository.findById(inventoryId)
                .orElseThrow(() -> new RuntimeException("Inventory not found"));

        inventory.setCurrentStock(stock);

        return inventoryRepository.save(inventory);
    }
    public Inventory restock(Long inventoryId, Integer quantity) {

        if (quantity == null || quantity <= 0) {
            throw new RuntimeException("Restock quantity must be greater than 0");
        }

        Inventory inventory = inventoryRepository.findById(inventoryId)
                .orElseThrow(() -> new RuntimeException("Inventory not found"));

        inventory.setCurrentStock(
                inventory.getCurrentStock() + quantity
        );

        return inventoryRepository.save(inventory);
    }
    public List<Inventory> prepareNextDay() {

        LocalDate tomorrow = LocalDate.now().plusDays(1);

        List<Product> products = productRepository.findAll();

        return products.stream()
                .map(product -> inventoryRepository
                        .findByProductAndBusinessDate(product, tomorrow)
                        .orElseGet(() -> {

                            Inventory inventory = Inventory.builder()
                                    .product(product)
                                    .currentStock(product.getDefaultStock())
                                    .unitsSold(0)
                                    .businessDate(tomorrow)
                                    .build();

                            return inventoryRepository.save(inventory);
                        }))
                .toList();
    }

}