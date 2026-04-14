package com.tungzone.dto.product;

import lombok.Builder;
import lombok.Data;

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
    private String description;
    private String category;
    private Boolean active;
}
