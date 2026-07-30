package com.MilkShop.repository;

import com.MilkShop.entity.Sale;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface SaleRepository extends JpaRepository<Sale, Long> {

    List<Sale> findBySaleDate(LocalDate saleDate);
}