package com.tungzone.controller;

import com.tungzone.dto.product.ImageUploadResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/uploads")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUploadController {

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(".jpg", ".jpeg", ".png", ".webp", ".gif");

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @PostMapping(value = "/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ImageUploadResponse> uploadImage(@RequestParam("file") MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            throw new RuntimeException("Vui lòng chọn ảnh trước khi tải lên");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new RuntimeException("Chỉ chấp nhận tệp hình ảnh");
        }

        String originalName = StringUtils.cleanPath(file.getOriginalFilename() == null ? "" : file.getOriginalFilename());
        String extension = extractExtension(originalName);

        if (!ALLOWED_EXTENSIONS.contains(extension.toLowerCase())) {
            throw new RuntimeException("Định dạng ảnh chưa được hỗ trợ");
        }

        Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        Files.createDirectories(uploadPath);

        String fileName = UUID.randomUUID() + extension.toLowerCase();
        Path targetFile = uploadPath.resolve(fileName);

        Files.copy(file.getInputStream(), targetFile, StandardCopyOption.REPLACE_EXISTING);

        String url = ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/images/uploads/")
                .path(fileName)
                .toUriString();

        return ResponseEntity.ok(new ImageUploadResponse(fileName, url));
    }

    private String extractExtension(String fileName) {
        int lastDot = fileName.lastIndexOf('.');
        if (lastDot < 0) {
            throw new RuntimeException("Ảnh tải lên cần có phần mở rộng hợp lệ");
        }
        return fileName.substring(lastDot);
    }
}
