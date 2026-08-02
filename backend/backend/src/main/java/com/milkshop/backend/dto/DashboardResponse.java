package com.milkshop.backend.dto;

import com.milkshop.backend.entity.Product;

import java.util.List;

public record DashboardResponse(
        int totalQuantitySold,
        long totalSalesCount,
        String bestSellingProduct,
        List<Product> lowStockProducts
) {
}