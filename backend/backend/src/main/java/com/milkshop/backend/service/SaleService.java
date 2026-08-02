package com.milkshop.backend.service;

import com.milkshop.backend.entity.Inventory;
import com.milkshop.backend.entity.Product;
import com.milkshop.backend.entity.Sale;
import com.milkshop.backend.repository.InventoryRepository;
import com.milkshop.backend.repository.ProductRepository;
import com.milkshop.backend.repository.SaleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class SaleService {

    private final SaleRepository saleRepository;
    private final ProductRepository productRepository;
    private final InventoryRepository inventoryRepository;

    public SaleService(
            SaleRepository saleRepository,
            ProductRepository productRepository,
            InventoryRepository inventoryRepository
    ) {
        this.saleRepository = saleRepository;
        this.productRepository = productRepository;
        this.inventoryRepository = inventoryRepository;
    }

    @Transactional
    public Sale recordSale(Long productId, Integer quantity) {

        Product product = productRepository.findById(productId)
                .orElseThrow(() ->
                        new RuntimeException("Product not found")
                );

        LocalDate today = LocalDate.now();

        Inventory inventory = inventoryRepository
                .findByProductIdAndBusinessDate(productId, today)
                .orElseGet(() -> {
                    Inventory newInventory = new Inventory();

                    newInventory.setProduct(product);
                    newInventory.setCurrentStock(product.getDefaultStock());
                    newInventory.setUnitsSold(0);
                    newInventory.setBusinessDate(today);

                    return inventoryRepository.save(newInventory);
                });

        if (inventory.getCurrentStock() < quantity) {
            throw new RuntimeException("Insufficient stock");
        }

        inventory.setCurrentStock(
                inventory.getCurrentStock() - quantity
        );

        inventory.setUnitsSold(
                inventory.getUnitsSold() + quantity
        );

        inventoryRepository.save(inventory);

        Sale sale = new Sale();

        sale.setProduct(product);
        sale.setQuantity(quantity);
        sale.setSaleTime(LocalDateTime.now());
        sale.setSaleDate(today);

        return saleRepository.save(sale);
    }

    public List<Sale> getAllSales() {
        return saleRepository.findAll();
    }

    public List<Sale> getTodaySales() {
        return saleRepository.findBySaleDate(LocalDate.now());
    }
}