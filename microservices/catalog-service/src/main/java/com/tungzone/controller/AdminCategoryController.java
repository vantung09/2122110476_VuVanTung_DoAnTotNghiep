package com.tungzone.controller;

import com.tungzone.dto.category.CategoryRequest;
import com.tungzone.dto.category.CategoryResponse;
import com.tungzone.dto.common.ApiMessageResponse;
import com.tungzone.service.CategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/categories")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminCategoryController {
    private final CategoryService categoryService;

    @GetMapping
    public List<CategoryResponse> getAllCategories() {
        return categoryService.getAllForAdmin();
    }

    @PostMapping
    public CategoryResponse createCategory(@Valid @RequestBody CategoryRequest request) {
        return categoryService.create(request);
    }

    @PutMapping("/{id}")
    public CategoryResponse updateCategory(@PathVariable Long id, @Valid @RequestBody CategoryRequest request) {
        return categoryService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ApiMessageResponse deleteCategory(@PathVariable Long id) {
        categoryService.delete(id);
        return new ApiMessageResponse("Xóa danh mục thành công");
    }
}
