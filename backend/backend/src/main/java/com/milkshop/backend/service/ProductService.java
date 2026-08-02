package com.milkshop.backend.service;

import com.milkshop.backend.entity.Category;
import com.milkshop.backend.entity.Product;
import com.milkshop.backend.repository.CategoryRepository;
import com.milkshop.backend.repository.ProductRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    public ProductService(
            ProductRepository productRepository,
            CategoryRepository categoryRepository
    ) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
    }

    public Product addProduct(Product product) {
        Category category = getValidCategory(product);
        product.setCategory(category);

        return productRepository.save(product);
    }

    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    public Product getProductById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));
    }

    public Product updateProduct(Long id, Product updatedProduct) {
        Product product = getProductById(id);
        Category category = getValidCategory(updatedProduct);

        product.setName(updatedProduct.getName());
        product.setCategory(category);
        product.setDefaultStock(updatedProduct.getDefaultStock());
        product.setLowStockAlert(updatedProduct.getLowStockAlert());
        product.setUnit(updatedProduct.getUnit());

        return productRepository.save(product);
    }

    public void deleteProduct(Long id) {
        Product product = getProductById(id);
        productRepository.delete(product);
    }

    private Category getValidCategory(Product product) {
        if (product.getCategory() == null ||
                product.getCategory().getId() == null) {
            throw new RuntimeException("Category id is required");
        }

        return categoryRepository.findById(product.getCategory().getId())
                .orElseThrow(() -> new RuntimeException("Category not found"));
    }
}