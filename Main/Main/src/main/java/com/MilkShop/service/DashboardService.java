package com.MilkShop.service;

import com.MilkShop.dto.DashboardResponse;
import com.MilkShop.entity.Inventory;
import com.MilkShop.entity.Product;
import com.MilkShop.entity.Sale;
import com.MilkShop.repository.InventoryRepository;
import com.MilkShop.repository.SaleRepository;
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

        List<Sale> todaySales = saleRepository.findBySaleDate(today);

        int totalQuantitySold = todaySales.stream()
                .mapToInt(Sale::getQuantity)
                .sum();

        int totalSalesCount = todaySales.size();

        String bestSellingProduct = todaySales.stream()
                .collect(Collectors.groupingBy(
                        sale -> sale.getProduct().getName(),
                        Collectors.summingInt(Sale::getQuantity)
                ))
                .entrySet()
                .stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("No sales today");

        List<Product> lowStockProducts =
                inventoryRepository.findByBusinessDate(today)
                        .stream()
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
}