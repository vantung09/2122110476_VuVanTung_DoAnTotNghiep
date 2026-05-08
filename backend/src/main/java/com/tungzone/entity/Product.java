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
    private Boolean flashSale;
    private LocalDateTime flashSaleStartAt;
    private LocalDateTime flashSaleEndAt;
    private Integer flashSaleQuantity;
    private Integer flashSaleSold;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    private Boolean active;
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        if (this.active == null) {
            this.active = true;
        }
        if (this.flashSale == null) {
            this.flashSale = false;
        }
        if (this.flashSaleSold == null) {
            this.flashSaleSold = 0;
        }
    }
}
