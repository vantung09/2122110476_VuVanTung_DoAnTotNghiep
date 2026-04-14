package com.tungzone.dto.product;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ImageUploadResponse {
    private String fileName;
    private String url;
}
