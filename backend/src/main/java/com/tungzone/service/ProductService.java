package com.tungzone.service;

import com.tungzone.dto.product.ProductRequest;
import com.tungzone.dto.product.ProductResponse;
import com.tungzone.entity.Category;
import com.tungzone.entity.Product;
import com.tungzone.repository.CategoryRepository;
import com.tungzone.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductService {
    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    @Transactional(readOnly = true)
    public List<ProductResponse> getPublicProducts() {
        return productRepository.findByActiveTrueOrderByIdDesc().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> getPublicFlashSaleProducts() {
        return productRepository.findByActiveTrueOrderByIdDesc().stream()
                .map(this::toResponse)
                .filter(product -> Boolean.TRUE.equals(product.getFlashSaleActive()))
                .toList();
    }

    @Transactional(readOnly = true)
    public Page<ProductResponse> getPublicProductsPaginated(
            String categoryName, String search, int page, int size, String sortBy, String sortDir) {
        Sort sort;
        if ("priceAsc".equals(sortBy)) {
            sort = Sort.by(Sort.Direction.ASC, "price");
        } else if ("priceDesc".equals(sortBy)) {
            sort = Sort.by(Sort.Direction.DESC, "price");
        } else if ("newest".equals(sortBy)) {
            sort = Sort.by(Sort.Direction.DESC, "id");
        } else if ("discount".equals(sortBy)) {
            sort = Sort.by(Sort.Direction.DESC, "id");
        } else {
            sort = Sort.by(Sort.Direction.DESC, "id");
        }
        Pageable pageable = PageRequest.of(page, size, sort);
        return productRepository.findByFilters(categoryName, search, true, pageable)
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public ProductResponse getProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm"));
        return toResponse(product);
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> getAllProductsForAdmin() {
        return productRepository.findAllByOrderByIdDesc().stream().map(this::toResponse).toList();
    }

    @Transactional
    public ProductResponse create(ProductRequest request) {
        Category category = resolveCategory(request.getCategoryName());

        Product product = Product.builder()
                .name(request.getName())
                .brand(request.getBrand())
                .price(request.getPrice())
                .originalPrice(request.getOriginalPrice())
                .stock(request.getStock())
                .imageUrl(normalizeImageUrl(request.getImageUrl()))
                .flashSale(Boolean.TRUE.equals(request.getFlashSale()))
                .flashSaleStartAt(request.getFlashSaleStartAt())
                .flashSaleEndAt(request.getFlashSaleEndAt())
                .flashSaleQuantity(normalizeNonNegative(request.getFlashSaleQuantity()))
                .flashSaleSold(normalizeNonNegative(request.getFlashSaleSold()))
                .description(request.getDescription())
                .category(category)
                .active(request.getActive() == null ? true : request.getActive())
                .build();
        return toResponse(productRepository.save(product));
    }

    @Transactional
    public ProductResponse update(Long id, ProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm"));

        Category category = resolveCategory(request.getCategoryName());

        product.setName(request.getName());
        product.setBrand(request.getBrand());
        product.setPrice(request.getPrice());
        product.setOriginalPrice(request.getOriginalPrice());
        product.setStock(request.getStock());
        product.setImageUrl(normalizeImageUrl(request.getImageUrl()));
        product.setFlashSale(Boolean.TRUE.equals(request.getFlashSale()));
        product.setFlashSaleStartAt(request.getFlashSaleStartAt());
        product.setFlashSaleEndAt(request.getFlashSaleEndAt());
        product.setFlashSaleQuantity(normalizeNonNegative(request.getFlashSaleQuantity()));
        product.setFlashSaleSold(normalizeNonNegative(request.getFlashSaleSold()));
        product.setDescription(request.getDescription());
        product.setCategory(category);
        product.setActive(request.getActive() == null ? true : request.getActive());

        return toResponse(productRepository.save(product));
    }

    @Transactional
    public void delete(Long id) {
        if (!productRepository.existsById(id)) {
            throw new RuntimeException("Không tìm thấy sản phẩm");
        }
        productRepository.deleteById(id);
    }

    private Category resolveCategory(String categoryName) {
        if (categoryName == null || categoryName.trim().isEmpty()) {
            return null;
        }
        String normalizedName = categoryName.trim().replaceAll("\\s+", " ");
        return categoryRepository.findByNameIgnoreCase(normalizedName)
                .orElseGet(() -> {
                    Category newCat = Category.builder()
                            .name(normalizedName)
                            .description("")
                            .active(true)
                            .build();
                    return categoryRepository.save(newCat);
                });
    }

    private ProductResponse toResponse(Product product) {
        LocalDateTime now = LocalDateTime.now();
        boolean flashSale = Boolean.TRUE.equals(product.getFlashSale());
        LocalDateTime startAt = product.getFlashSaleStartAt();
        LocalDateTime endAt = product.getFlashSaleEndAt();
        boolean started = startAt == null || !startAt.isAfter(now);
        boolean expired = endAt != null && endAt.isBefore(now);
        boolean upcoming = flashSale && startAt != null && startAt.isAfter(now);
        int remaining = calculateFlashSaleRemaining(product);
        boolean activeFlashSale = flashSale && started && !expired && remaining > 0 && hasDiscount(product);

        return ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .brand(product.getBrand())
                .price(product.getPrice())
                .originalPrice(product.getOriginalPrice())
                .stock(product.getStock())
                .imageUrl(product.getImageUrl())
                .flashSale(flashSale)
                .flashSaleStartAt(startAt)
                .flashSaleEndAt(endAt)
                .flashSaleQuantity(product.getFlashSaleQuantity())
                .flashSaleSold(normalizeNonNegative(product.getFlashSaleSold()))
                .flashSaleActive(activeFlashSale)
                .flashSaleUpcoming(upcoming)
                .flashSaleExpired(flashSale && expired)
                .flashSaleRemaining(remaining)
                .discountPercent(calculateDiscountPercent(product))
                .description(product.getDescription())
                .categoryId(product.getCategory() != null ? product.getCategory().getId() : null)
                .categoryName(product.getCategory() != null ? product.getCategory().getName() : null)
                .active(product.getActive())
                .build();
    }

    private String normalizeImageUrl(String value) {
        if (value == null) {
            return null;
        }
        String cleaned = value.trim();
        return cleaned.isEmpty() ? null : cleaned;
    }

    private Integer normalizeNonNegative(Integer value) {
        if (value == null) {
            return 0;
        }
        return Math.max(0, value);
    }

    private int calculateFlashSaleRemaining(Product product) {
        int stock = normalizeNonNegative(product.getStock());
        Integer quantity = product.getFlashSaleQuantity();
        if (quantity == null || quantity <= 0) {
            return stock;
        }
        int sold = normalizeNonNegative(product.getFlashSaleSold());
        return Math.max(0, Math.min(stock, quantity - sold));
    }

    private boolean hasDiscount(Product product) {
        Double price = product.getPrice();
        Double originalPrice = product.getOriginalPrice();
        return price != null && originalPrice != null && originalPrice > price && price >= 0;
    }

    private int calculateDiscountPercent(Product product) {
        if (!hasDiscount(product)) {
            return 0;
        }
        return (int) Math.round(((product.getOriginalPrice() - product.getPrice()) / product.getOriginalPrice()) * 100);
    }
}
