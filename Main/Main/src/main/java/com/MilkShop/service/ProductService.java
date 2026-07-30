package com.MilkShop.service;

import com.MilkShop.entity.Product;
import com.MilkShop.repository.ProductRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProductService {

    private final ProductRepository productRepository;

    // Constructor Injection
    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    // Add Product
    public Product addProduct(Product product) {
        return productRepository.save(product);
    }

    // Get All Products
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    // Get Product By Id
    public Product getProductById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));
    }

    // Update Product
    public Product updateProduct(Long id, Product updatedProduct) {

        Product product = getProductById(id);

        product.setName(updatedProduct.getName());
        product.setCategory(updatedProduct.getCategory());
        product.setDefaultStock(updatedProduct.getDefaultStock());
        product.setLowStockAlert(updatedProduct.getLowStockAlert());
        product.setUnit(updatedProduct.getUnit());

        return productRepository.save(product);
    }

    // Delete Product
    public void deleteProduct(Long id) {

        Product product = getProductById(id);

        productRepository.delete(product);
    }
}