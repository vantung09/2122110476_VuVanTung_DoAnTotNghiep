package com.tungzone.config;

public record ProductSeed(
        String name,
        String brand,
        Double price,
        Double originalPrice,
        Integer stock,
        String imageUrl,
        String description,
        String category,
        Boolean active
) {
}
