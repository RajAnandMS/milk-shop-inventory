package com.MilkShop.service;

import com.MilkShop.entity.Category;
import com.MilkShop.repository.CategoryRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;

    // Constructor Injection
    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    // Add Category
    public Category addCategory(Category category) {

        categoryRepository.findByNameIgnoreCase(category.getName())
                .ifPresent(c -> {
                    throw new RuntimeException("Category already exists");
                });

        return categoryRepository.save(category);
    }

    // Get All Categories
    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    // Get Category By Id
    public Category getCategoryById(Long id) {

        return categoryRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Category not found"));
    }

    // Update Category
    public Category updateCategory(Long id, Category updatedCategory) {

        Category category = getCategoryById(id);

        category.setName(updatedCategory.getName());
        category.setDisplayOrder(updatedCategory.getDisplayOrder());

        return categoryRepository.save(category);
    }

    // Delete Category
    public void deleteCategory(Long id) {

        Category category = getCategoryById(id);

        categoryRepository.delete(category);
    }
}