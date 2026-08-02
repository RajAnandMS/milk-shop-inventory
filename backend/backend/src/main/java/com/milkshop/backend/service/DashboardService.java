package com.milkshop.backend.service;

import com.milkshop.backend.dto.DashboardResponse;
import com.milkshop.backend.entity.Inventory;
import com.milkshop.backend.entity.Product;
import com.milkshop.backend.entity.Sale;
import com.milkshop.backend.repository.InventoryRepository;
import com.milkshop.backend.repository.SaleRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    private final SaleRepository saleRepository;
    private final InventoryRepository inventoryRepository;

    public DashboardService(
            SaleRepository saleRepository,
            InventoryRepository inventoryRepository
    ) {
        this.saleRepository = saleRepository;
        this.inventoryRepository = inventoryRepository;
    }

    public DashboardResponse getTodayDashboard() {

        LocalDate today = LocalDate.now();

        List<Sale> todaySales =
                saleRepository.findBySaleDate(today);

        List<Inventory> todayInventory =
                inventoryRepository.findByBusinessDate(today);

        int totalQuantitySold = todaySales.stream()
                .mapToInt(Sale::getQuantity)
                .sum();

        long totalSalesCount = todaySales.size();

        String bestSellingProduct = findBestSellingProduct(todaySales);

        List<Product> lowStockProducts = todayInventory.stream()
                .filter(inventory ->
                        inventory.getCurrentStock()
                                <= inventory.getProduct().getLowStockAlert()
                )
                .map(Inventory::getProduct)
                .toList();

        return new DashboardResponse(
                totalQuantitySold,
                totalSalesCount,
                bestSellingProduct,
                lowStockProducts
        );
    }

    private String findBestSellingProduct(List<Sale> sales) {

        if (sales.isEmpty()) {
            return "No sales today";
        }

        Map<String, Integer> quantitiesByProduct =
                sales.stream()
                        .collect(
                                Collectors.groupingBy(
                                        sale -> sale.getProduct().getName(),
                                        Collectors.summingInt(
                                                Sale::getQuantity
                                        )
                                )
                        );

        return quantitiesByProduct.entrySet()
                .stream()
                .max(
                        Map.Entry.comparingByValue()
                )
                .map(Map.Entry::getKey)
                .orElse("No sales today");
    }
}