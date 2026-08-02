package com.milkshop.backend.repository;

import com.milkshop.backend.entity.Inventory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface InventoryRepository
        extends JpaRepository<Inventory, Long> {

    List<Inventory> findByBusinessDate(LocalDate businessDate);

    Optional<Inventory> findByProductIdAndBusinessDate(
            Long productId,
            LocalDate businessDate
    );
}