package com.tungzone.dto.product;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ProductRequest {
    @NotBlank(message = "Tên sản phẩm không được để trống")
    private String name;

    private String brand;

    @NotNull(message = "Giá không được để trống")
    @DecimalMin(value = "0.0", message = "Giá phải lớn hơn hoặc bằng 0")
    private Double price;

    @DecimalMin(value = "0.0", message = "Giá gốc phải lớn hơn hoặc bằng 0")
    private Double originalPrice;

    @NotNull(message = "Tồn kho không được để trống")
    @Min(value = 0, message = "Tồn kho phải lớn hơn hoặc bằng 0")
    private Integer stock;

    private String imageUrl;
    private Boolean flashSale;
    private LocalDateTime flashSaleStartAt;
    private LocalDateTime flashSaleEndAt;

    @Min(value = 0, message = "So luong flash sale phai lon hon hoac bang 0")
    private Integer flashSaleQuantity;

    @Min(value = 0, message = "So luong da ban phai lon hon hoac bang 0")
    private Integer flashSaleSold;

    private String description;

    @NotBlank(message = "Danh mục không được để trống")
    private String categoryName;

    private Boolean active;
}
