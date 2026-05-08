package com.tungzone.service;

import com.tungzone.dto.category.CategoryRequest;
import com.tungzone.dto.category.CategoryResponse;
import com.tungzone.entity.Category;
import com.tungzone.entity.Product;
import com.tungzone.repository.CategoryRepository;
import com.tungzone.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryService {
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    @Transactional(readOnly = true)
    public List<CategoryResponse> getAllForAdmin() {
        Map<String, Long> productCounts = productRepository.findAll().stream()
                .filter(p -> p.getCategory() != null)
                .collect(Collectors.groupingBy(
                        p -> p.getCategory().getName().toLowerCase(Locale.ROOT),
                        Collectors.counting()));

        return categoryRepository.findAllByOrderByNameAsc().stream()
                .map(category -> {
                    long count = productCounts.getOrDefault(category.getName().toLowerCase(Locale.ROOT), 0L);
                    return toResponse(category, count);
                })
                .toList();
    }

    @Transactional
    public CategoryResponse create(CategoryRequest request) {
        String categoryName = normalizeDisplayName(request.getName());
        if (categoryRepository.existsByNameIgnoreCase(categoryName)) {
            throw new RuntimeException("Danh mục đã tồn tại");
        }

        Category category = Category.builder()
                .name(categoryName)
                .description(request.getDescription())
                .active(request.getActive() == null ? true : request.getActive())
                .build();

        return toResponse(categoryRepository.save(category), 0L);
    }

    @Transactional
    public CategoryResponse update(Long id, CategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy danh mục"));

        String nextName = normalizeDisplayName(request.getName());

        categoryRepository.findByNameIgnoreCase(nextName)
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> {
                    throw new RuntimeException("Tên danh mục đã tồn tại");
                });

        category.setName(nextName);
        category.setDescription(request.getDescription());
        category.setActive(request.getActive() == null ? true : request.getActive());

        long productCount = productRepository.findAll().stream()
                .filter(p -> p.getCategory() != null
                        && p.getCategory().getName().equalsIgnoreCase(nextName))
                .count();

        return toResponse(categoryRepository.save(category), productCount);
    }

    @Transactional
    public void delete(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy danh mục"));

        long linkedProducts = productRepository.findAll().stream()
                .filter(p -> p.getCategory() != null
                        && p.getCategory().getName().equalsIgnoreCase(category.getName()))
                .count();

        if (linkedProducts > 0) {
            throw new RuntimeException("Không thể xóa danh mục đang có sản phẩm sử dụng");
        }

        categoryRepository.delete(category);
    }

    private CategoryResponse toResponse(Category category, long productCount) {
        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .description(category.getDescription())
                .active(category.getActive())
                .productCount(productCount)
                .build();
    }

    private String normalizeDisplayName(String value) {
        return value == null ? "" : value.trim().replaceAll("\\s+", " ");
    }
}
