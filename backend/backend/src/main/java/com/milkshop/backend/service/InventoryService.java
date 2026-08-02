package com.milkshop.backend.service;

import com.milkshop.backend.entity.Inventory;
import com.milkshop.backend.entity.Product;
import com.milkshop.backend.repository.InventoryRepository;
import com.milkshop.backend.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class InventoryService {

    private final InventoryRepository inventoryRepository;
    private final ProductRepository productRepository;

    public InventoryService(
            InventoryRepository inventoryRepository,
            ProductRepository productRepository
    ) {
        this.inventoryRepository = inventoryRepository;
        this.productRepository = productRepository;
    }

    public List<Inventory> getTodayInventory() {
        return inventoryRepository.findByBusinessDate(LocalDate.now());
    }

    public Inventory getTodayInventoryByProduct(Long productId) {
        return inventoryRepository
                .findByProductIdAndBusinessDate(
                        productId,
                        LocalDate.now()
                )
                .orElseThrow(() ->
                        new RuntimeException(
                                "Inventory not found for today"
                        )
                );
    }

    @Transactional
    public Inventory createInventory(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() ->
                        new RuntimeException("Product not found")
                );

        LocalDate today = LocalDate.now();

        return inventoryRepository
                .findByProductIdAndBusinessDate(productId, today)
                .orElseGet(() -> {
                    Inventory inventory = new Inventory();

                    inventory.setProduct(product);
                    inventory.setCurrentStock(product.getDefaultStock());
                    inventory.setUnitsSold(0);
                    inventory.setBusinessDate(today);

                    return inventoryRepository.save(inventory);
                });
    }

    @Transactional
    public Inventory restock(Long inventoryId, Integer quantity) {
        Inventory inventory = inventoryRepository.findById(inventoryId)
                .orElseThrow(() ->
                        new RuntimeException("Inventory not found")
                );

        inventory.setCurrentStock(
                inventory.getCurrentStock() + quantity
        );

        return inventoryRepository.save(inventory);
    }

    @Transactional
    public List<Inventory> prepareNextDay() {
        LocalDate tomorrow = LocalDate.now().plusDays(1);

        List<Product> products = productRepository.findAll();

        for (Product product : products) {
            boolean exists = inventoryRepository
                    .findByProductIdAndBusinessDate(
                            product.getId(),
                            tomorrow
                    )
                    .isPresent();

            if (!exists) {
                Inventory inventory = new Inventory();

                inventory.setProduct(product);
                inventory.setCurrentStock(
                        product.getDefaultStock()
                );
                inventory.setUnitsSold(0);
                inventory.setBusinessDate(tomorrow);

                inventoryRepository.save(inventory);
            }
        }

        return inventoryRepository.findByBusinessDate(tomorrow);
    }
}