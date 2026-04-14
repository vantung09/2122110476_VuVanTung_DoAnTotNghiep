package com.tungzone.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "products")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String brand;
    private Double price;
    private Double originalPrice;
    private Integer stock;
    private String imageUrl;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String category;
    private Boolean active;
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        if (this.active == null) {
            this.active = true;
        }
    }
}
