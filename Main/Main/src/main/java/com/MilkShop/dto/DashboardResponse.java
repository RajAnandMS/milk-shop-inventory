package com.MilkShop.dto;

import com.MilkShop.entity.Product;

import java.util.List;

public record DashboardResponse(
        int totalQuantitySold,
        int totalSalesCount,
        String bestSellingProduct,
        List<Product> lowStockProducts
) {
}