package com.tungzone.dto.product;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ProductResponse {
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
}
