package com.tungzone.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tungzone.dto.ai.AiAdvisorRequest;
import com.tungzone.dto.ai.AiAdvisorResponse;
import com.tungzone.dto.ai.AiConversationMessage;
import com.tungzone.dto.ai.AiProductSuggestion;
import com.tungzone.dto.product.ProductResponse;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;

import java.text.NumberFormat;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AiAdvisorService {
    private static final int MAX_CATALOG_ITEMS_FOR_AI = 35;
    private static final int MAX_SUGGESTED_PRODUCTS = 4;
    private static final Locale VIETNAM = Locale.forLanguageTag("vi-VN");
    private static final Pattern NON_WORD_PATTERN = Pattern.compile("[^a-z0-9]+");
    private static final Set<String> STOP_WORDS = Set.of(
            "toi", "minh", "ban", "can", "muon", "tim", "mua", "cho", "voi", "va", "la", "co",
            "nao", "cai", "con", "hang", "san", "pham", "gia", "tam", "khoang", "tu", "den",
            "duoi", "tren", "hon", "nhat", "nen", "chon", "loai", "dong", "may"
    );

    private final ProductService productService;
    private final ObjectMapper objectMapper;

    @Value("${app.openai.api-key:}")
    private String openAiApiKey;

    @Value("${app.openai.model:gpt-5.5}")
    private String openAiModel;

    @Value("${app.openai.base-url:https://api.openai.com/v1}")
    private String openAiBaseUrl;

    @Value("${app.openai.timeout-seconds:20}")
    private int openAiTimeoutSeconds;

    public AiAdvisorResponse advise(AiAdvisorRequest request) {
        String message = clean(request.getMessage());
        List<ProductResponse> catalog = productService.getPublicProducts();
        List<ProductResponse> candidates = selectCandidates(message, catalog, MAX_CATALOG_ITEMS_FOR_AI);

        if (!StringUtils.hasText(openAiApiKey)) {
            return fallbackResponse(message, catalog, candidates, "local");
        }

        try {
            ModelAdvisorAnswer answer = callOpenAi(message, request.getHistory(), candidates);
            List<AiProductSuggestion> products = suggestionsFromAnswer(answer, catalog, candidates, message);
            return AiAdvisorResponse.builder()
                    .text(limitText(firstText(answer.getText(), fallbackText(message, products)), 1200))
                    .products(products)
                    .followups(normalizeFollowups(answer.getFollowups(), message))
                    .aiPowered(true)
                    .model(openAiModel)
                    .build();
        } catch (Exception exception) {
            return fallbackResponse(message, catalog, candidates, "local-fallback");
        }
    }

    private ModelAdvisorAnswer callOpenAi(
            String message,
            List<AiConversationMessage> history,
            List<ProductResponse> candidates
    ) throws JsonProcessingException {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", openAiModel);
        body.put("instructions", buildSystemPrompt());
        body.put("input", buildUserInput(message, history, candidates));
        body.put("max_output_tokens", 900);

        Object rawResponse = openAiClient()
                .post()
                .uri("/responses")
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .body(Object.class);

        JsonNode responseJson = objectMapper.valueToTree(rawResponse);
        String outputText = extractOutputText(responseJson);
        return parseModelAnswer(outputText);
    }

    private RestClient openAiClient() {
        int timeoutMillis = Math.max(5, openAiTimeoutSeconds) * 1000;
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(timeoutMillis);
        requestFactory.setReadTimeout(timeoutMillis);

        return RestClient.builder()
                .baseUrl(trimTrailingSlash(openAiBaseUrl))
                .requestFactory(requestFactory)
                .defaultHeader("Authorization", "Bearer " + openAiApiKey)
                .build();
    }

    private String buildSystemPrompt() {
        return """
                Ban la AI tu van mua hang cua TungZone, mot website ban thiet bi Apple va phu kien cong nghe.
                Hay tra loi bang tieng Viet tu nhien, ngan gon, tu van nhu nhan vien ban hang gioi.
                Chi dua vao CATALOG duoc cung cap; khong bia san pham, gia, ton kho, khuyen mai hoac thong so khong co.
                Uu tien san pham con hang, dung ngan sach, dung nhu cau va dang co gia tot.
                Neu cau hoi thieu thong tin, hoi lai 1-2 y nhung van goi y cac lua chon gan nhat neu co.
                Tra ve duy nhat JSON hop le, khong markdown, theo dang:
                {"text":"cau tra loi 3-6 cau","productIds":[1,2,3],"followups":["goi y 1","goi y 2","goi y 3"]}
                productIds toi da 4 id va chi duoc chon id co trong CATALOG.
                """;
    }

    private String buildUserInput(
            String message,
            List<AiConversationMessage> history,
            List<ProductResponse> candidates
    ) throws JsonProcessingException {
        Map<String, Object> input = new LinkedHashMap<>();
        input.put("question", message);
        input.put("recentHistory", summarizeHistory(history));
        input.put("catalog", candidates.stream().map(this::catalogItem).toList());
        return objectMapper.writeValueAsString(input);
    }

    private List<Map<String, Object>> summarizeHistory(List<AiConversationMessage> history) {
        if (history == null || history.isEmpty()) {
            return List.of();
        }

        return history.stream()
                .filter(Objects::nonNull)
                .skip(Math.max(0, history.size() - 6))
                .map(item -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    String role = "assistant".equalsIgnoreCase(item.getRole()) ? "assistant" : "user";
                    row.put("role", role);
                    row.put("text", limitText(clean(item.getText()), 500));
                    return row;
                })
                .toList();
    }

    private Map<String, Object> catalogItem(ProductResponse product) {
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("id", product.getId());
        item.put("name", product.getName());
        item.put("brand", product.getBrand());
        item.put("category", product.getCategoryName());
        item.put("price", product.getPrice());
        item.put("originalPrice", product.getOriginalPrice());
        item.put("stock", normalizeNumber(product.getStock()));
        item.put("discountPercent", normalizeNumber(product.getDiscountPercent()));
        item.put("flashSaleActive", Boolean.TRUE.equals(product.getFlashSaleActive()));
        item.put("description", limitText(clean(product.getDescription()), 260));
        return item;
    }

    private AiAdvisorResponse fallbackResponse(
            String message,
            List<ProductResponse> catalog,
            List<ProductResponse> candidates,
            String model
    ) {
        List<ProductResponse> localProducts = candidates.stream()
                .limit(MAX_SUGGESTED_PRODUCTS)
                .toList();
        List<AiProductSuggestion> products = localProducts.stream()
                .map(product -> AiProductSuggestion.from(product, buildReasons(product, message)))
                .toList();
        return AiAdvisorResponse.builder()
                .text(fallbackText(message, products))
                .products(products)
                .followups(defaultFollowups(message))
                .aiPowered(false)
                .model(model)
                .build();
    }

    private String fallbackText(String message, List<AiProductSuggestion> products) {
        if (products.isEmpty()) {
            return "Minh chua thay san pham phu hop trong catalog. Ban noi them ngan sach, nhu cau chinh hoac dong may mong muon de minh loc chinh xac hon.";
        }

        String scope = detectScope(message);
        String prefix = StringUtils.hasText(scope)
                ? "Minh da loc cac lua chon hop voi " + scope + ". "
                : "Minh da loc cac lua chon dang chu y trong catalog TungZone. ";
        return prefix + "Uu tien cua minh la san pham con hang, gia tot va gan voi nhu cau ban vua noi. Ban co the bam vao tung san pham de xem chi tiet hoac hoi tiep de minh tu van ky hon.";
    }

    private List<AiProductSuggestion> suggestionsFromAnswer(
            ModelAdvisorAnswer answer,
            List<ProductResponse> catalog,
            List<ProductResponse> candidates,
            String message
    ) {
        Map<Long, ProductResponse> byId = catalog.stream()
                .filter(product -> product.getId() != null)
                .collect(Collectors.toMap(ProductResponse::getId, product -> product, (a, b) -> a, LinkedHashMap::new));
        List<AiProductSuggestion> selected = new ArrayList<>();
        Set<Long> seen = new LinkedHashSet<>();

        if (answer.getProductIds() != null) {
            for (Long id : answer.getProductIds()) {
                if (id == null || seen.contains(id) || selected.size() >= MAX_SUGGESTED_PRODUCTS) {
                    continue;
                }
                ProductResponse product = byId.get(id);
                if (product != null && isVisibleProduct(product)) {
                    selected.add(AiProductSuggestion.from(product, buildReasons(product, message)));
                    seen.add(id);
                }
            }
        }

        if (selected.isEmpty()) {
            candidates.stream()
                    .limit(MAX_SUGGESTED_PRODUCTS)
                    .forEach(product -> selected.add(AiProductSuggestion.from(product, buildReasons(product, message))));
        }

        return selected;
    }

    private List<ProductResponse> selectCandidates(String message, List<ProductResponse> catalog, int limit) {
        List<ScoredProduct> scored = catalog.stream()
                .filter(this::isVisibleProduct)
                .map(product -> new ScoredProduct(product, scoreProduct(product, message)))
                .sorted(Comparator
                        .comparingInt(ScoredProduct::score).reversed()
                        .thenComparing(item -> normalizeNumber(item.product().getDiscountPercent()), Comparator.reverseOrder())
                        .thenComparing(item -> normalizeNumber(item.product().getStock()), Comparator.reverseOrder())
                        .thenComparing(item -> normalizeNumber(item.product().getPrice())))
                .toList();

        List<ProductResponse> positiveMatches = scored.stream()
                .filter(item -> item.score() > 0)
                .map(ScoredProduct::product)
                .limit(limit)
                .toList();

        if (!positiveMatches.isEmpty()) {
            return positiveMatches;
        }

        return scored.stream()
                .map(ScoredProduct::product)
                .limit(limit)
                .toList();
    }

    private int scoreProduct(ProductResponse product, String message) {
        String text = normalizeText(message);
        String haystack = normalizeText(product.getName() + " " + product.getBrand() + " "
                + product.getCategoryName() + " " + product.getDescription());
        MoneyBudget budget = detectBudget(text);
        int score = 0;
        boolean wantsPhone = hasAny(text, "iphone", "dien thoai", "phone");
        boolean wantsAccessory = hasAny(text, "phu kien", "sac", "cap", "op lung", "mieng dan", "pencil", "bao da", "combo");
        boolean accessoryProduct = hasAny(haystack, "op lung", "mieng dan", "sac", "cap", "adapter", "bao da", "pin du phong", "pencil", "tui chong soc");

        for (String token : tokenize(text)) {
            if (haystack.contains(token)) {
                score += token.length() >= 5 ? 5 : 3;
            }
        }

        if (wantsPhone && haystack.contains("iphone")) score += 18;
        if (wantsPhone && !haystack.contains("iphone")) score -= 30;
        if (wantsPhone && !wantsAccessory && accessoryProduct) score -= 35;
        if (hasAny(text, "mac", "macbook", "laptop") && hasAny(haystack, "mac", "macbook")) score += 18;
        if (hasAny(text, "ipad", "tablet", "may tinh bang") && haystack.contains("ipad")) score += 18;
        if (hasAny(text, "watch", "dong ho") && haystack.contains("watch")) score += 18;
        if (hasAny(text, "airpods", "tai nghe", "loa", "am thanh")
                && hasAny(haystack, "airpods", "tai nghe", "loa", "jbl", "sony", "marshall")) score += 18;
        if (hasAny(text, "phu kien", "sac", "cap", "op lung", "mieng dan", "pencil", "bao da")
                && hasAny(haystack, "sac", "cap", "op lung", "mieng dan", "pencil", "bao da", "adapter", "pin")) score += 18;

        double price = normalizeNumber(product.getPrice());
        if (budget.max() > 0) {
            score += price <= budget.max() ? 14 : -Math.min(22, (int) Math.ceil((price - budget.max()) / 1_000_000D) * 2);
        }
        if (budget.min() > 0) {
            score += price >= budget.min() ? 8 : -6;
        }

        int stock = normalizeNumber(product.getStock());
        int discount = normalizeNumber(product.getDiscountPercent());
        if (stock > 0) score += 5;
        if (hasAny(text, "sale", "flash sale", "flashsale", "giam", "khuyen mai", "uu dai")) {
            score += Boolean.TRUE.equals(product.getFlashSaleActive()) ? 16 : 0;
            score += discount > 0 ? 8 + Math.min(discount, 25) / 3 : -4;
        } else if (discount > 0) {
            score += 3;
        }
        if (hasAny(text, "cao cap", "manh", "tot nhat", "xin", "pro", "max", "ultra")
                && hasAny(haystack, "pro", "max", "ultra", "m5", "m4", "512", "1tb")) {
            score += 10;
        }
        if (hasAny(text, "hoc", "sinh vien", "van phong", "lam viec")
                && hasAny(haystack, "mac", "macbook", "ipad", "air")) {
            score += 12;
        }
        if (hasAny(text, "camera", "chup anh", "quay video", "tiktok")
                && hasAny(haystack, "iphone", "pro", "promax", "pro max")) {
            score += 12;
        }
        if (hasAny(text, "qua", "qua tang", "tang")
                && hasAny(haystack, "airpods", "watch", "ipad", "loa", "iphone")) {
            score += 8;
        }

        return score;
    }

    private List<String> buildReasons(ProductResponse product, String message) {
        List<String> reasons = new ArrayList<>();
        String text = normalizeText(message);
        MoneyBudget budget = detectBudget(text);
        double price = normalizeNumber(product.getPrice());
        int stock = normalizeNumber(product.getStock());
        int discount = normalizeNumber(product.getDiscountPercent());

        if (budget.max() > 0 && price <= budget.max()) {
            reasons.add("trong ngan sach " + formatPrice(budget.max()));
        }
        if (budget.min() > 0 && price >= budget.min()) {
            reasons.add("dung khoang tu " + formatPrice(budget.min()));
        }
        if (stock > 0) {
            reasons.add(stock <= 5 ? "con " + stock + " san pham" : "con hang");
        } else {
            reasons.add("tam het hang");
        }
        if (Boolean.TRUE.equals(product.getFlashSaleActive())) {
            reasons.add("dang flash sale");
        }
        if (discount > 0) {
            reasons.add("giam " + discount + "%");
        }
        if (reasons.size() < 3 && StringUtils.hasText(product.getBrand())) {
            reasons.add("thuong hieu " + product.getBrand());
        }

        return reasons.stream().limit(4).toList();
    }

    private List<String> normalizeFollowups(List<String> requestedFollowups, String message) {
        List<String> cleaned = requestedFollowups == null ? new ArrayList<>() : requestedFollowups.stream()
                .filter(StringUtils::hasText)
                .map(this::clean)
                .map(text -> limitText(text, 80))
                .distinct()
                .limit(3)
                .collect(Collectors.toCollection(ArrayList::new));

        if (cleaned.size() < 3) {
            for (String fallback : defaultFollowups(message)) {
                if (cleaned.size() >= 3) break;
                if (!cleaned.contains(fallback)) cleaned.add(fallback);
            }
        }

        return cleaned;
    }

    private List<String> defaultFollowups(String message) {
        String text = normalizeText(message);
        if (hasAny(text, "iphone", "camera", "dien thoai")) {
            return List.of("So sanh cac mau nay", "Uu tien camera", "Tim mau re hon");
        }
        if (hasAny(text, "mac", "ipad", "hoc", "sinh vien")) {
            return List.of("Chon cho sinh vien", "Uu tien pin va man hinh", "Tim lua chon re hon");
        }
        if (hasAny(text, "sale", "khuyen mai", "giam")) {
            return List.of("San pham sale dang mua", "Loc hang con san", "Tim combo phu kien");
        }
        return List.of("So sanh cac mau nay", "Tim san pham re hon", "Chon mau dang tien nhat");
    }

    private String detectScope(String message) {
        String text = normalizeText(message);
        if (hasAny(text, "iphone", "dien thoai")) return "nhu cau mua iPhone";
        if (hasAny(text, "mac", "macbook", "laptop")) return "nhu cau laptop/MacBook";
        if (hasAny(text, "ipad", "tablet")) return "nhu cau iPad";
        if (hasAny(text, "tai nghe", "airpods", "loa")) return "nhu cau am thanh";
        if (hasAny(text, "phu kien", "sac", "cap", "op lung")) return "nhu cau phu kien";
        MoneyBudget budget = detectBudget(text);
        if (budget.max() > 0) return "ngan sach toi da " + formatPrice(budget.max());
        return "";
    }

    private String extractOutputText(JsonNode root) {
        if (root == null || root.isMissingNode() || root.isNull()) {
            return "";
        }
        JsonNode outputText = root.get("output_text");
        if (outputText != null && outputText.isTextual()) {
            return outputText.asText();
        }

        StringBuilder builder = new StringBuilder();
        collectOutputText(root, builder);
        return builder.toString().trim();
    }

    private void collectOutputText(JsonNode node, StringBuilder builder) {
        if (node == null || node.isNull()) {
            return;
        }
        if (node.isObject()) {
            String type = node.path("type").asText("");
            JsonNode text = node.get("text");
            if (text != null && text.isTextual() && ("output_text".equals(type) || "text".equals(type))) {
                if (builder.length() > 0) {
                    builder.append('\n');
                }
                builder.append(text.asText());
                return;
            }
            node.fields().forEachRemaining(entry -> collectOutputText(entry.getValue(), builder));
            return;
        }
        if (node.isArray()) {
            node.forEach(child -> collectOutputText(child, builder));
        }
    }

    private ModelAdvisorAnswer parseModelAnswer(String rawOutput) throws JsonProcessingException {
        String text = clean(rawOutput);
        if (text.startsWith("```")) {
            text = text.replaceFirst("^```(?:json)?\\s*", "").replaceFirst("\\s*```$", "").trim();
        }
        int start = text.indexOf('{');
        int end = text.lastIndexOf('}');
        if (start >= 0 && end > start) {
            text = text.substring(start, end + 1);
        }
        return objectMapper.readValue(text, ModelAdvisorAnswer.class);
    }

    private boolean isVisibleProduct(ProductResponse product) {
        if (product == null || product.getId() == null || Boolean.FALSE.equals(product.getActive())) {
            return false;
        }
        return !"banner".equals(normalizeText(product.getCategoryName()));
    }

    private List<String> tokenize(String text) {
        if (!StringUtils.hasText(text)) {
            return List.of();
        }
        return Arrays.stream(text.split(" "))
                .filter(word -> word.length() >= 2 && !STOP_WORDS.contains(word))
                .distinct()
                .toList();
    }

    private MoneyBudget detectBudget(String normalizedText) {
        if (!StringUtils.hasText(normalizedText)) {
            return new MoneyBudget(0, 0);
        }

        java.util.regex.Matcher matcher = Pattern
                .compile("(\\d+(?:[\\.,]\\d+)?)\\s*(trieu|tr|cu|k|nghin|ngan)?")
                .matcher(normalizedText.replace(',', '.'));
        if (!matcher.find()) {
            return new MoneyBudget(0, 0);
        }

        double amount = parseMoney(matcher.group(1), matcher.group(2));
        String before = normalizedText.substring(0, matcher.start());
        if (hasTokenAny(before, "tren", "hon", "tu")) {
            return new MoneyBudget(amount, 0);
        }
        return new MoneyBudget(0, amount);
    }

    private double parseMoney(String value, String unit) {
        double number;
        try {
            number = Double.parseDouble(value.replace(',', '.'));
        } catch (NumberFormatException exception) {
            return 0;
        }
        String normalizedUnit = normalizeText(unit);
        if (Set.of("k", "nghin", "ngan").contains(normalizedUnit)) {
            return number * 1_000;
        }
        if (Set.of("trieu", "tr", "cu").contains(normalizedUnit) || number < 1_000) {
            return number * 1_000_000;
        }
        return number;
    }

    private String normalizeText(String value) {
        String text = clean(value).toLowerCase(Locale.ROOT);
        text = Normalizer.normalize(text, Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "")
                .replace("đ", "d")
                .replace("Đ", "D");
        return NON_WORD_PATTERN.matcher(text).replaceAll(" ").trim();
    }

    private boolean hasAny(String text, String... words) {
        if (!StringUtils.hasText(text)) {
            return false;
        }
        for (String word : words) {
            if (text.contains(normalizeText(word))) {
                return true;
            }
        }
        return false;
    }

    private boolean hasTokenAny(String text, String... words) {
        if (!StringUtils.hasText(text)) {
            return false;
        }
        Set<String> tokens = Arrays.stream(text.trim().split("\\s+"))
                .filter(StringUtils::hasText)
                .collect(Collectors.toSet());
        for (String word : words) {
            if (tokens.contains(normalizeText(word))) {
                return true;
            }
        }
        return false;
    }

    private String firstText(String value, String fallback) {
        return StringUtils.hasText(value) ? clean(value) : fallback;
    }

    private String clean(String value) {
        return value == null ? "" : value.trim().replaceAll("\\s+", " ");
    }

    private String limitText(String value, int maxLength) {
        String cleaned = clean(value);
        if (cleaned.length() <= maxLength) {
            return cleaned;
        }
        return cleaned.substring(0, Math.max(0, maxLength - 1)).trim() + "...";
    }

    private int normalizeNumber(Integer value) {
        return value == null ? 0 : value;
    }

    private double normalizeNumber(Double value) {
        return value == null ? 0D : value;
    }

    private String formatPrice(double value) {
        return NumberFormat.getInstance(VIETNAM).format(Math.round(value)) + " d";
    }

    private String trimTrailingSlash(String value) {
        String text = StringUtils.hasText(value) ? value.trim() : "https://api.openai.com/v1";
        return text.replaceAll("/+$", "");
    }

    private record MoneyBudget(double min, double max) {
    }

    private record ScoredProduct(ProductResponse product, int score) {
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    private static class ModelAdvisorAnswer {
        private String text;
        private List<Long> productIds = new ArrayList<>();
        private List<String> followups = new ArrayList<>();
    }
}
