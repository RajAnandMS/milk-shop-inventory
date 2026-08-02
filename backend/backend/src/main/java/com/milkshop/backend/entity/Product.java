package com.milkshop.backend.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Entity
@Table(name = "products")
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Product name is required")
    @Column(nullable = false)
    private String name;

    @NotNull(message = "Category is required")
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @NotNull(message = "Default stock is required")
    @Min(value = 0, message = "Default stock cannot be negative")
    @Column(name = "default_stock", nullable = false)
    private Integer defaultStock;

    @NotNull(message = "Low stock alert is required")
    @Min(value = 0, message = "Low stock alert cannot be negative")
    @Column(name = "low_stock_alert", nullable = false)
    private Integer lowStockAlert;

    @NotBlank(message = "Unit is required")
    @Column(nullable = false)
    private String unit;

    public Product() {
    }

    public Product(
            Long id,
            String name,
            Category category,
            Integer defaultStock,
            Integer lowStockAlert,
            String unit
    ) {
        this.id = id;
        this.name = name;
        this.category = category;
        this.defaultStock = defaultStock;
        this.lowStockAlert = lowStockAlert;
        this.unit = unit;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Category getCategory() {
        return category;
    }

    public void setCategory(Category category) {
        this.category = category;
    }

    public Integer getDefaultStock() {
        return defaultStock;
    }

    public void setDefaultStock(Integer defaultStock) {
        this.defaultStock = defaultStock;
    }

    public Integer getLowStockAlert() {
        return lowStockAlert;
    }

    public void setLowStockAlert(Integer lowStockAlert) {
        this.lowStockAlert = lowStockAlert;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }
}