package com.MilkShop.repository;

import com.MilkShop.entity.Inventory;
import com.MilkShop.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface InventoryRepository extends JpaRepository<Inventory, Long> {
    Optional<Inventory> findByProductAndBusinessDate(Product product, LocalDate businessDate);
    List<Inventory> findByBusinessDate(LocalDate businessDate);
}