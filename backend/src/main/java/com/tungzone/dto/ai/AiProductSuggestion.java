package com.tungzone.dto.ai;

import com.tungzone.dto.product.ProductResponse;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class AiProductSuggestion {
    private Long id;
    private String name;
    private String brand;
    private Double price;
    private Double originalPrice;
    private Integer stock;
    private String imageUrl;
    private Boolean flashSale;
    private LocalDateTime flashSaleStartAt;
    private LocalDateTime flashSaleEndAt;
    private Integer flashSaleQuantity;
    private Integer flashSaleSold;
    private Boolean flashSaleActive;
    private Boolean flashSaleUpcoming;
    private Boolean flashSaleExpired;
    private Integer flashSaleRemaining;
    private Integer discountPercent;
    private String description;
    private Long categoryId;
    private String categoryName;
    private Boolean active;
    private List<String> assistantReasons;

    public static AiProductSuggestion from(ProductResponse product, List<String> reasons) {
        return AiProductSuggestion.builder()
                .id(product.getId())
                .name(product.getName())
                .brand(product.getBrand())
                .price(product.getPrice())
                .originalPrice(product.getOriginalPrice())
                .stock(product.getStock())
                .imageUrl(product.getImageUrl())
                .flashSale(product.getFlashSale())
                .flashSaleStartAt(product.getFlashSaleStartAt())
                .flashSaleEndAt(product.getFlashSaleEndAt())
                .flashSaleQuantity(product.getFlashSaleQuantity())
                .flashSaleSold(product.getFlashSaleSold())
                .flashSaleActive(product.getFlashSaleActive())
                .flashSaleUpcoming(product.getFlashSaleUpcoming())
                .flashSaleExpired(product.getFlashSaleExpired())
                .flashSaleRemaining(product.getFlashSaleRemaining())
                .discountPercent(product.getDiscountPercent())
                .description(product.getDescription())
                .categoryId(product.getCategoryId())
                .categoryName(product.getCategoryName())
                .active(product.getActive())
                .assistantReasons(reasons)
                .build();
    }
}
