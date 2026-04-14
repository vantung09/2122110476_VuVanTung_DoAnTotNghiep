package com.tungzone.service;

import com.tungzone.dto.product.ProductRequest;
import com.tungzone.dto.product.ProductResponse;
import com.tungzone.entity.Product;
import com.tungzone.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductService {
    private final ProductRepository productRepository;
    private final CategoryService categoryService;

    public List<ProductResponse> getPublicProducts() {
        return productRepository.findByActiveTrueOrderByIdDesc().stream().map(this::toResponse).toList();
    }

    public ProductResponse getProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm"));
        return toResponse(product);
    }

    public List<ProductResponse> getAllProductsForAdmin() {
        return productRepository.findAllByOrderByIdDesc().stream().map(this::toResponse).toList();
    }

    public ProductResponse create(ProductRequest request) {
        String categoryName = normalizeCategory(request.getCategory());
        categoryService.ensureCategoryExists(categoryName);

        Product product = Product.builder()
                .name(request.getName())
                .brand(request.getBrand())
                .price(request.getPrice())
                .originalPrice(request.getOriginalPrice())
                .stock(request.getStock())
                .imageUrl(request.getImageUrl())
                .description(request.getDescription())
                .category(categoryName)
                .active(request.getActive() == null ? true : request.getActive())
                .build();
        return toResponse(productRepository.save(product));
    }

    public ProductResponse update(Long id, ProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm"));

        product.setName(request.getName());
        product.setBrand(request.getBrand());
        product.setPrice(request.getPrice());
        product.setOriginalPrice(request.getOriginalPrice());
        product.setStock(request.getStock());
        product.setImageUrl(request.getImageUrl());
        product.setDescription(request.getDescription());
        String categoryName = normalizeCategory(request.getCategory());
        categoryService.ensureCategoryExists(categoryName);
        product.setCategory(categoryName);
        product.setActive(request.getActive() == null ? true : request.getActive());

        return toResponse(productRepository.save(product));
    }

    public void delete(Long id) {
        if (!productRepository.existsById(id)) {
            throw new RuntimeException("Không tìm thấy sản phẩm");
        }
        productRepository.deleteById(id);
    }

    private ProductResponse toResponse(Product product) {
        return ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .brand(product.getBrand())
                .price(product.getPrice())
                .originalPrice(product.getOriginalPrice())
                .stock(product.getStock())
                .imageUrl(product.getImageUrl())
                .description(product.getDescription())
                .category(product.getCategory())
                .active(product.getActive())
                .build();
    }

    private String normalizeCategory(String value) {
        return value == null ? "" : value.trim().replaceAll("\\s+", " ");
    }
}
