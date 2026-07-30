package com.MilkShop.config;

import com.MilkShop.entity.Category;
import com.MilkShop.repository.CategoryRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initCategories(CategoryRepository repository) {

        return args -> {

            if (repository.count() == 0) {

                repository.save(Category.builder()
                        .name("Milk")
                        .displayOrder(1)
                        .build());

                repository.save(Category.builder()
                        .name("Curd")
                        .displayOrder(2)
                        .build());

                repository.save(Category.builder()
                        .name("Ice Cream")
                        .displayOrder(3)
                        .build());

                repository.save(Category.builder()
                        .name("Butter")
                        .displayOrder(4)
                        .build());

                repository.save(Category.builder()
                        .name("Ghee")
                        .displayOrder(5)
                        .build());

                repository.save(Category.builder()
                        .name("Paneer")
                        .displayOrder(6)
                        .build());

                System.out.println("Default Categories Added.");
            }
        };
    }
}