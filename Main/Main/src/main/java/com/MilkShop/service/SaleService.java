package com.MilkShop.service;

import com.MilkShop.entity.Inventory;
import com.MilkShop.entity.Product;
import com.MilkShop.entity.Sale;
import com.MilkShop.repository.InventoryRepository;
import com.MilkShop.repository.ProductRepository;
import com.MilkShop.repository.SaleRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class SaleService {

    private final SaleRepository saleRepository;
    private final ProductRepository productRepository;
    private final InventoryRepository inventoryRepository;

    public SaleService(SaleRepository saleRepository,
                       ProductRepository productRepository,
                       InventoryRepository inventoryRepository) {
        this.saleRepository = saleRepository;
        this.productRepository = productRepository;
        this.inventoryRepository = inventoryRepository;
    }

    public Sale recordSale(Long productId, Integer quantity) {
        if (productId == null) {
            throw new RuntimeException("productId is required");
        }
        if (quantity == null || quantity <= 0) {
            throw new RuntimeException("quantity must be greater than 0");
        }

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        LocalDate today = LocalDate.now();

        Inventory inventory = inventoryRepository
                .findByProductAndBusinessDate(product, today)
                .orElseGet(() -> Inventory.builder()
                        .product(product)
                        .currentStock(product.getDefaultStock())
                        .unitsSold(0)
                        .businessDate(today)
                        .build());

        if (quantity > inventory.getCurrentStock()) {
            throw new RuntimeException("Not enough stock available");
        }

        inventory.setCurrentStock(inventory.getCurrentStock() - quantity);
        inventory.setUnitsSold(inventory.getUnitsSold() + quantity);
        inventoryRepository.save(inventory);

        Sale sale = Sale.builder()
                .product(product)
                .quantity(quantity)
                .saleTime(LocalDateTime.now())
                .saleDate(today)
                .build();

        return saleRepository.save(sale);
    }

    public List<Sale> getAllSales() {
        return saleRepository.findAll();
    }

    public List<Sale> getTodaySales() {
        return saleRepository.findBySaleDate(LocalDate.now());
    }
}