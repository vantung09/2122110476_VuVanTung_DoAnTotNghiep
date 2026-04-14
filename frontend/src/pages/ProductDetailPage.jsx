import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import StoreActionButton, {
  StoreBagIcon,
  StoreCheckIcon,
  StoreHeartIcon,
} from "../components/StoreActionButton";
import { useCart } from "../contexts/CartContext";
import { useFavorites } from "../contexts/FavoriteContext";
import { getFallbackImage, getProductImageUrl, handleProductImageError } from "../utils/productImage";

const CATEGORY_VARIANTS = {
  iphone: ["128GB", "256GB", "512GB"],
  mac: ["256GB", "512GB", "1TB"],
  ipad: ["128GB", "256GB", "512GB"],
  watch: ["GPS", "GPS + Cellular", "Thép"],
  audio: ["Tiêu chuẩn", "Chống ồn chủ động", "Cao cấp"],
  accessory: ["Tiêu chuẩn", "MagSafe", "Cao cấp"],
};

const CATEGORY_VARIANT_PRICE_RULES = {
  iphone: { "128GB": 0, "256GB": 3_000_000, "512GB": 8_000_000, "1TB": 16_000_000 },
  ipad: { "128GB": 0, "256GB": 2_500_000, "512GB": 7_000_000, "1TB": 14_000_000 },
  mac: { "128GB": 0, "256GB": 0, "512GB": 6_000_000, "1TB": 14_000_000 },
};

const CATEGORY_COLORS = {
  iphone: [
    { id: "black", name: "Đen", hex: "#2b2c30" },
    { id: "blue", name: "Xanh dương", hex: "#89a4c1" },
    { id: "green", name: "Xanh lá", hex: "#b9d1bf" },
    { id: "pink", name: "Hồng", hex: "#f0d5dc" },
  ],
  mac: [
    { id: "silver", name: "Bạc", hex: "#d7d9dd" },
    { id: "gray", name: "Xám không gian", hex: "#62666f" },
    { id: "starlight", name: "Ánh sao", hex: "#d7cfbb" },
    { id: "midnight", name: "Đêm xanh", hex: "#2d3646" },
  ],
  ipad: [
    { id: "gray", name: "Xám", hex: "#6a6d77" },
    { id: "blue", name: "Xanh dương", hex: "#7e92c8" },
    { id: "purple", name: "Tím", hex: "#948dc4" },
    { id: "pink", name: "Hồng", hex: "#dfb6c3" },
  ],
  watch: [
    { id: "midnight", name: "Midnight", hex: "#1f2430" },
    { id: "starlight", name: "Starlight", hex: "#ddd6c8" },
    { id: "silver", name: "Bạc", hex: "#e6e7ea" },
    { id: "red", name: "Đỏ", hex: "#a43644" },
  ],
  audio: [
    { id: "white", name: "Trắng", hex: "#f1f1f1" },
    { id: "black", name: "Đen", hex: "#2b2d31" },
    { id: "navy", name: "Xanh đậm", hex: "#304057" },
  ],
  accessory: [
    { id: "black", name: "Đen", hex: "#25262b" },
    { id: "gray", name: "Xám", hex: "#7a7f89" },
    { id: "sand", name: "Cát", hex: "#c8b99c" },
  ],
};

const CATEGORY_BENEFITS = {
  iphone: [
    {
      title: "Giao nhanh nội thành",
      desc: "Ưu tiên xử lý đơn trong ngày với sản phẩm còn hàng tại cửa hàng gần bạn.",
    },
    {
      title: "Thu cũ lên đời",
      desc: "Hỗ trợ kiểm tra máy và tư vấn phương án đổi thiết bị phù hợp hơn.",
    },
    {
      title: "Trả góp linh hoạt",
      desc: "Có thể chia nhỏ chi phí theo kỳ hạn để dễ chốt phiên bản mong muốn.",
    },
  ],
  mac: [
    {
      title: "Tư vấn đúng cấu hình",
      desc: "Gợi ý phiên bản phù hợp cho học tập, văn phòng hoặc sáng tạo nội dung.",
    },
    {
      title: "Mua kèm phụ kiện",
      desc: "Dễ ghép cùng hub, chuột, bàn phím hay balo bảo vệ để dùng trọn bộ.",
    },
    {
      title: "Cài đặt ban đầu",
      desc: "Hỗ trợ kiểm tra máy và thiết lập nhanh trước khi bàn giao cho bạn.",
    },
  ],
  ipad: [
    {
      title: "Học tập và giải trí",
      desc: "Phù hợp cho ghi chú, học online, xem phim và xử lý việc nhẹ mỗi ngày.",
    },
    {
      title: "Phụ kiện đồng bộ",
      desc: "Dễ chọn thêm bút, bàn phím hoặc bao da đúng kích thước máy.",
    },
    {
      title: "Thanh toán linh hoạt",
      desc: "Nhiều phương án thanh toán để chốt máy nhanh mà vẫn tối ưu ngân sách.",
    },
  ],
  watch: [
    {
      title: "Ghép đôi nhanh",
      desc: "Kết nối và đồng bộ với iPhone thuận tiện ngay khi nhận hàng.",
    },
    {
      title: "Nhiều dây đeo",
      desc: "Dễ thay đổi phong cách giữa công việc, thể thao và sử dụng hằng ngày.",
    },
    {
      title: "Bảo hành rõ ràng",
      desc: "Tiếp nhận hỗ trợ nhanh theo chính sách chính hãng của từng dòng sản phẩm.",
    },
  ],
  audio: [
    {
      title: "Nghe thử tại chỗ",
      desc: "Dễ so sánh cảm giác đeo, chất âm và độ phù hợp trước khi quyết định.",
    },
    {
      title: "Kết nối ổn định",
      desc: "Hoạt động tốt với iPhone, iPad, Mac và các tình huống dùng hằng ngày.",
    },
    {
      title: "Mua kèm tiết kiệm",
      desc: "Thường phù hợp để ghép cùng điện thoại hoặc máy tính bảng trong cùng đơn.",
    },
  ],
  accessory: [
    {
      title: "Phụ kiện chính hãng",
      desc: "Ưu tiên lựa chọn có độ hoàn thiện tốt và tương thích ổn định với thiết bị Apple.",
    },
    {
      title: "Tư vấn đúng nhu cầu",
      desc: "Gợi ý nhanh loại sạc, cáp, hub hay ốp phù hợp với cách bạn đang dùng máy.",
    },
    {
      title: "Kiểm tra tương thích",
      desc: "Có thể test nhanh tại cửa hàng để tránh mua sai chuẩn kết nối hoặc kích thước.",
    },
  ],
};

const CATEGORY_FALLBACK_HIGHLIGHTS = {
  iphone: [
    "Thiết kế cao cấp, cảm giác cầm nắm gọn gàng và phù hợp dùng lâu dài.",
    "Hiệu năng ổn định cho chụp ảnh, giải trí, liên lạc và làm việc hằng ngày.",
    "Màn hình và camera được tối ưu cho nhu cầu sử dụng phổ biến trong hệ sinh thái Apple.",
    "Dễ kết hợp cùng nhiều phụ kiện chính hãng để hoàn thiện trải nghiệm sử dụng.",
  ],
  mac: [
    "Hiệu năng ổn định cho học tập, làm việc văn phòng và chỉnh sửa nội dung cơ bản.",
    "Thiết kế mỏng nhẹ, phù hợp mang theo trong nhiều tình huống di chuyển.",
    "Màn hình đẹp, bàn phím và trackpad cho trải nghiệm sử dụng liền mạch.",
    "Kết nối tốt với iPhone, iPad và các phụ kiện Apple quen thuộc.",
  ],
  ipad: [
    "Thiết kế gọn nhẹ, phù hợp học tập, giải trí và ghi chú hằng ngày.",
    "Màn hình đẹp và thao tác cảm ứng mượt cho các nhu cầu di động phổ biến.",
    "Dễ kết hợp với bút và bàn phím khi cần mở rộng cách sử dụng.",
    "Phù hợp với người dùng muốn một thiết bị nằm giữa điện thoại và laptop.",
  ],
  watch: [
    "Thiết kế tinh gọn, tiện theo dõi thông báo và hoạt động sức khỏe mỗi ngày.",
    "Kết nối liền mạch với iPhone trong hệ sinh thái Apple.",
    "Nhiều phiên bản để chọn theo phong cách và nhu cầu sử dụng.",
    "Phù hợp cho cả công việc, vận động và theo dõi nhịp sinh hoạt cá nhân.",
  ],
  audio: [
    "Chất âm rõ ràng, phù hợp nghe nhạc, gọi thoại và giải trí hằng ngày.",
    "Thiết kế gọn nhẹ, dễ mang theo và dùng linh hoạt trong nhiều bối cảnh.",
    "Kết nối nhanh với các thiết bị Apple cho trải nghiệm ổn định hơn.",
    "Là lựa chọn hợp lý nếu bạn cần nâng cấp trải nghiệm âm thanh cá nhân.",
  ],
  accessory: [
    "Hoàn thiện tốt, thiên về tính thực dụng và độ bền khi sử dụng lâu dài.",
    "Dễ kết hợp với điện thoại, máy tính bảng hoặc laptop trong hệ sinh thái Apple.",
    "Thiết kế gọn gàng, phù hợp cả khi mang theo đi làm lẫn dùng cố định.",
    "Giúp hoàn thiện bộ thiết bị cá nhân theo đúng nhu cầu sử dụng thực tế.",
  ],
};

const CATEGORY_STORY_COPY = {
  iphone: {
    experience: "thiết kế gọn gàng, màn hình lớn và cảm giác sử dụng liền mạch mỗi ngày",
    workflow: "liên lạc, chụp ảnh, giải trí và làm việc nhanh trong hệ sinh thái Apple",
    audience: "người muốn một chiếc điện thoại ổn định, đẹp mắt và dễ dùng lâu dài",
  },
  mac: {
    experience: "thiết kế mỏng nhẹ, cảm giác dùng cao cấp và không gian làm việc gọn gàng",
    workflow: "học tập, văn phòng, sáng tạo nội dung và đa nhiệm ổn định",
    audience: "người cần laptop bền bỉ, pin tốt và đồng bộ sâu với iPhone hoặc iPad",
  },
  ipad: {
    experience: "tính cơ động cao, màn hình đẹp và cách sử dụng linh hoạt ở nhiều tư thế",
    workflow: "ghi chú, học online, xem nội dung và xử lý tác vụ nhẹ gọn",
    audience: "người cần một thiết bị nằm giữa điện thoại và laptop để mang theo hằng ngày",
  },
  watch: {
    experience: "thiết kế đeo nhẹ tay, thao tác nhanh và theo dõi thông tin ngay trên cổ tay",
    workflow: "theo dõi sức khỏe, xem thông báo và giữ kết nối khi di chuyển",
    audience: "người dùng iPhone muốn mở rộng trải nghiệm cá nhân và theo dõi vận động tốt hơn",
  },
  audio: {
    experience: "đeo gọn, kết nối nhanh và dễ dùng trong nhiều hoàn cảnh thường ngày",
    workflow: "nghe nhạc, gọi thoại, học tập và giải trí cá nhân",
    audience: "người muốn nâng cấp trải nghiệm âm thanh mà vẫn ưu tiên sự tiện dụng",
  },
  accessory: {
    experience: "thiết kế thực dụng, hoàn thiện tốt và tương thích ổn định với thiết bị đang dùng",
    workflow: "bảo vệ máy, mở rộng kết nối hoặc sạc pin thuận tiện hơn",
    audience: "người muốn hoàn thiện bộ thiết bị Apple theo đúng nhu cầu thực tế",
  },
};

const TAB_ITEMS = [
  { id: "overview", label: "Đặc điểm nổi bật" },
  { id: "specs", label: "Thông số kỹ thuật" },
  { id: "article", label: "Chi tiết sản phẩm" },
  { id: "policy", label: "Ưu đãi & chính sách" },
];

function detectCategoryKey(product) {
  const categoryText = `${product?.category || ""} ${product?.name || ""}`.toLowerCase();

  if (categoryText.includes("iphone")) return "iphone";
  if (categoryText.includes("mac")) return "mac";
  if (categoryText.includes("ipad")) return "ipad";
  if (categoryText.includes("watch")) return "watch";
  if (
    categoryText.includes("tai nghe") ||
    categoryText.includes("airpods") ||
    categoryText.includes("loa")
  ) {
    return "audio";
  }

  return "accessory";
}

function buildGalleryImages(product, relatedProducts) {
  const mainImage = getProductImageUrl(product);
  const relatedImages = relatedProducts
    .map((item) => getProductImageUrl(item))
    .filter(Boolean);

  return [...new Set([mainImage, ...relatedImages, getFallbackImage(product)])].slice(0, 5);
}

function buildHighlights(product, categoryKey) {
  const descriptionParts = (product?.description || "")
    .split(/[\n.!?]+/)
    .map((item) => item.trim())
    .filter(Boolean);

  const fallback = CATEGORY_FALLBACK_HIGHLIGHTS[categoryKey] || CATEGORY_FALLBACK_HIGHLIGHTS.accessory;

  return [...new Set([...descriptionParts, ...fallback])].slice(0, 6);
}

function buildSpecs(product, categoryKey, selectedVariant, selectedColor) {
  const baseSpecs = [
    ["Thương hiệu", product.brand || "Apple"],
    ["Danh mục", product.category || "Đang cập nhật"],
    [categoryKey === "watch" ? "Phiên bản" : "Dung lượng", selectedVariant || "Đang cập nhật"],
    ["Màu sắc", selectedColor?.name || "Đang cập nhật"],
    ["Tình trạng", product.active ? "Đang mở bán" : "Tạm ẩn"],
    ["Tồn kho", `${product.stock ?? 0} sản phẩm`],
  ];

  if (Number(product.originalPrice || 0) > Number(product.price || 0)) {
    baseSpecs.splice(4, 0, [
      "Giá niêm yết",
      `${Number(product.originalPrice || 0).toLocaleString("vi-VN")} đ`,
    ]);
  }

  return baseSpecs;
}

function buildStorySections(product, categoryKey, selectedVariant, selectedColor, highlights) {
  const copy = CATEGORY_STORY_COPY[categoryKey] || CATEGORY_STORY_COPY.accessory;
  const name = product?.name || "Sản phẩm";
  const colorName = selectedColor?.name || "màu đang chọn";
  const lead = highlights[0] || `${name} mang lại trải nghiệm sử dụng gọn gàng và ổn định.`;

  return [
    {
      title: "Thiết kế và trải nghiệm",
      paragraphs: [
        `${name} hướng đến ${copy.experience}.`,
        `${lead} Với lựa chọn ${selectedVariant || "phiên bản đang chọn"} và màu ${colorName}, tổng thể sản phẩm tạo cảm giác hiện đại, dễ dùng và đồng bộ với nhiều phụ kiện Apple.`,
      ],
    },
    {
      title: "Hiệu năng và tính tiện dụng",
      paragraphs: [
        `${name} được định vị cho nhu cầu ${copy.workflow}.`,
        `Nếu bạn cần một cấu hình cân bằng giữa chi phí, khả năng lưu trữ và sự ổn định khi dùng lâu dài, lựa chọn ${selectedVariant || "này"} là mức rất dễ tiếp cận.`,
      ],
    },
    {
      title: "Phù hợp với ai?",
      paragraphs: [
        `${name} đặc biệt phù hợp với ${copy.audience}.`,
        `Tại TungZone, bạn có thể xem nhanh các màu sắc, phiên bản và sản phẩm cùng nhóm để chốt đúng cấu hình trước khi đặt mua.`,
      ],
    },
  ];
}

function buildFaqs(product, categoryKey, selectedVariant, selectedColor) {
  const name = product?.name || "Sản phẩm";
  const colorName = selectedColor?.name || "màu đang chọn";
  const answers = {
    iphone: [
      {
        question: `${name} phù hợp với ai?`,
        answer:
          "Phù hợp với người cần điện thoại màn hình đẹp, thao tác ổn định, chụp ảnh tốt và ưu tiên trải nghiệm liền mạch trong hệ sinh thái Apple.",
      },
      {
        question: "Nên chọn dung lượng nào?",
        answer: `Nếu nhu cầu chủ yếu là dùng hằng ngày, chụp ảnh và cài ứng dụng phổ biến thì ${selectedVariant || "phiên bản hiện tại"} là lựa chọn cân bằng khá tốt.`,
      },
      {
        question: `Màu ${colorName} có dễ phối phụ kiện không?`,
        answer:
          "Các tông màu hiện tại đều khá dễ phối với ốp lưng, ví da và phụ kiện MagSafe, đặc biệt nếu bạn muốn giữ tổng thể gọn và hiện đại.",
      },
    ],
    mac: [
      {
        question: "Mac này hợp nhu cầu nào?",
        answer:
          "Phù hợp cho học tập, văn phòng, họp online và xử lý nội dung ở mức từ cơ bản đến khá, đặc biệt nếu bạn đang dùng thêm iPhone hoặc iPad.",
      },
      {
        question: "Có nên chọn cấu hình cao hơn không?",
        answer:
          "Nếu bạn thường xuyên lưu file nặng, chạy nhiều ứng dụng cùng lúc hoặc muốn dùng máy lâu dài hơn, nên cân nhắc các phiên bản dung lượng cao hơn.",
      },
      {
        question: "Mua tại cửa hàng được hỗ trợ gì?",
        answer:
          "Bạn có thể được kiểm tra máy, tư vấn phụ kiện phù hợp và thiết lập ban đầu để sẵn sàng sử dụng ngay sau khi nhận hàng.",
      },
    ],
    ipad: [
      {
        question: "iPad này hợp học tập hay giải trí hơn?",
        answer:
          "Thiết bị cân bằng khá tốt cho cả hai nhu cầu, đặc biệt mạnh ở việc ghi chú, xem nội dung, họp online và dùng di động mỗi ngày.",
      },
      {
        question: "Có cần mua thêm phụ kiện không?",
        answer:
          "Nếu bạn ghi chú nhiều hoặc muốn thay thế một phần laptop, nên cân nhắc thêm bút hoặc bàn phím để mở rộng cách sử dụng.",
      },
      {
        question: `Màu ${colorName} có phải lựa chọn an toàn không?`,
        answer:
          "Đây là nhóm màu dễ dùng lâu dài, ít lỗi mốt và phù hợp nhiều phong cách từ học tập tới công việc.",
      },
    ],
    watch: [
      {
        question: "Apple Watch này hợp với ai?",
        answer:
          "Phù hợp với người dùng iPhone muốn theo dõi thông báo, vận động, sức khỏe và giữ kết nối thuận tiện hơn trong ngày.",
      },
      {
        question: `Phiên bản ${selectedVariant || "đang chọn"} khác gì?`,
        answer:
          "Tùy phiên bản sẽ khác ở khả năng kết nối, chất liệu hoặc cách dùng độc lập với điện thoại. Bạn nên chọn theo thói quen di chuyển thực tế.",
      },
      {
        question: "Có dễ đổi dây đeo không?",
        answer:
          "Các dòng Apple Watch nhìn chung rất dễ thay dây, nên bạn có thể linh hoạt đổi phong cách giữa đi làm, tập luyện và đi chơi.",
      },
    ],
    audio: [
      {
        question: "Thiết bị âm thanh này phù hợp nhu cầu nào?",
        answer:
          "Hợp cho nghe nhạc, gọi thoại, học online, làm việc tập trung và sử dụng di động hằng ngày trong hệ sinh thái Apple.",
      },
      {
        question: "Có nên lên bản cao hơn không?",
        answer:
          "Nếu bạn ưu tiên chống ồn, thời lượng pin hoặc trải nghiệm âm thanh cao cấp hơn, các phiên bản nâng cấp sẽ đáng cân nhắc.",
      },
      {
        question: "Mua kèm với iPhone có hợp lý không?",
        answer:
          "Rất hợp lý nếu bạn muốn đồng bộ nhanh giữa các thiết bị và có trải nghiệm dùng liền mạch hơn mỗi ngày.",
      },
    ],
    accessory: [
      {
        question: "Phụ kiện này phù hợp cho trường hợp nào?",
        answer:
          "Phù hợp khi bạn muốn hoàn thiện trải nghiệm sử dụng thiết bị hiện tại, từ bảo vệ máy tới mở rộng khả năng kết nối hay sạc pin.",
      },
      {
        question: "Có cần kiểm tra tương thích trước khi mua không?",
        answer:
          "Nên có, nhất là với hub, cáp, sạc và phụ kiện theo chuẩn kết nối để tránh mua sai chuẩn hoặc sai công suất.",
      },
      {
        question: "Có nên mua thêm phụ kiện cùng nhóm không?",
        answer:
          "Nếu bạn đang hoàn thiện trọn bộ thiết bị, việc mua cùng lúc giúp dễ đồng bộ hơn về màu sắc, tính năng và cách sử dụng.",
      },
    ],
  };

  return answers[categoryKey] || answers.accessory;
}

function extractCapacityFromText(value) {
  const text = String(value || "").toUpperCase();
  if (text.includes("1TB")) return "1TB";
  if (text.includes("512GB")) return "512GB";
  if (text.includes("256GB")) return "256GB";
  if (text.includes("128GB")) return "128GB";
  return "";
}

function buildCapacityBasedPrice(basePrice, baseOriginalPrice, categoryKey, selectedVariant, productName) {
  const rules = CATEGORY_VARIANT_PRICE_RULES[categoryKey];
  if (!rules) {
    return { mainPrice: Number(basePrice || 0), oldPrice: Number(baseOriginalPrice || 0) };
  }

  const baseCapacity = extractCapacityFromText(productName) || Object.keys(rules)[0];
  const selectedCapacity = extractCapacityFromText(selectedVariant) || baseCapacity;
  const baseDelta = rules[baseCapacity] ?? 0;
  const selectedDelta = rules[selectedCapacity] ?? baseDelta;
  const diff = selectedDelta - baseDelta;

  return {
    mainPrice: Math.max(0, Math.round(Number(basePrice || 0) + diff)),
    oldPrice: Math.max(0, Math.round(Number(baseOriginalPrice || 0) + diff)),
  };
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState("");
  const [selectedColorId, setSelectedColorId] = useState("");
  const [selectedImage, setSelectedImage] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [openFaq, setOpenFaq] = useState(0);
  const [cartAnimated, setCartAnimated] = useState(false);
  const [favoriteAnimated, setFavoriteAnimated] = useState(false);
  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      try {
        const productResponse = await axiosClient.get(`/products/${id}`);
        if (cancelled) return;

        const currentProduct = productResponse.data;
        setProduct(currentProduct);

        try {
          const listResponse = await axiosClient.get("/products");
          if (cancelled) return;

          const currentId = Number(id);
          const currentCategory = (currentProduct.category || "").toLowerCase();
          const currentBrand = (currentProduct.brand || "").toLowerCase();

          const related = Array.isArray(listResponse.data)
            ? listResponse.data
                .filter((item) => item.id !== currentId)
                .filter((item) => {
                  const itemCategory = (item.category || "").toLowerCase();
                  const itemBrand = (item.brand || "").toLowerCase();
                  return itemCategory === currentCategory || itemBrand === currentBrand;
                })
                .slice(0, 4)
            : [];

          setRelatedProducts(related);
        } catch (relatedError) {
          console.error(relatedError);
          setRelatedProducts([]);
        }
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          setProduct(null);
          setRelatedProducts([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const categoryKey = detectCategoryKey(product);
  const colorOptions = CATEGORY_COLORS[categoryKey] || CATEGORY_COLORS.accessory;
  const variantOptions = CATEGORY_VARIANTS[categoryKey] || CATEGORY_VARIANTS.accessory;
  const selectedColor = colorOptions.find((item) => item.id === selectedColorId) || colorOptions[0];

  const galleryImages = useMemo(
    () => (product ? buildGalleryImages(product, relatedProducts) : []),
    [product, relatedProducts]
  );

  const highlights = useMemo(
    () => (product ? buildHighlights(product, categoryKey) : []),
    [product, categoryKey]
  );

  const specs = useMemo(
    () => (product ? buildSpecs(product, categoryKey, selectedVariant, selectedColor) : []),
    [product, categoryKey, selectedVariant, selectedColor]
  );

  const storySections = useMemo(
    () =>
      product
        ? buildStorySections(product, categoryKey, selectedVariant, selectedColor, highlights)
        : [],
    [product, categoryKey, selectedVariant, selectedColor, highlights]
  );

  const faqItems = useMemo(
    () => (product ? buildFaqs(product, categoryKey, selectedVariant, selectedColor) : []),
    [product, categoryKey, selectedVariant, selectedColor]
  );

  useEffect(() => {
    if (!product) return;

    setSelectedVariant((current) => (current && variantOptions.includes(current) ? current : variantOptions[0]));
    setSelectedColorId((current) =>
      current && colorOptions.some((item) => item.id === current) ? current : colorOptions[0]?.id || ""
    );
    setActiveTab("overview");
    setOpenFaq(0);
  }, [product, variantOptions, colorOptions]);

  useEffect(() => {
    if (!galleryImages.length) return;

    setSelectedImage((current) => (current && galleryImages.includes(current) ? current : galleryImages[0]));
  }, [galleryImages]);

  const { mainPrice, oldPrice } = buildCapacityBasedPrice(
    product?.price,
    product?.originalPrice,
    categoryKey,
    selectedVariant,
    product?.name
  );

  if (loading) {
    return <div className="card p-lg">Đang tải sản phẩm...</div>;
  }

  if (!product) {
    return <div className="card p-lg">Không tìm thấy sản phẩm.</div>;
  }

  const favorite = isFavorite(product.id);
  const saveAmount = oldPrice > mainPrice ? oldPrice - mainPrice : 0;
  const salePercent = oldPrice > mainPrice ? Math.round((saveAmount / oldPrice) * 100) : 0;
  const monthlyPrice = Math.max(0, Math.round(mainPrice / 12));
  const stockCount = Number(product.stock || 0);
  const availabilityLabel = product.active
    ? stockCount > 0
      ? `Còn ${stockCount} sản phẩm`
      : "Sắp về hàng"
    : "Tạm ẩn";
  const shortDescription =
    product.description ||
    "Thiết kế tối ưu, trải nghiệm mượt mà và phù hợp cho nhu cầu sử dụng hằng ngày trong hệ sinh thái Apple.";
  const benefits = CATEGORY_BENEFITS[categoryKey] || CATEGORY_BENEFITS.accessory;
  const compactSpecs = specs.slice(0, 5);
  const heroImage = selectedImage || getProductImageUrl(product);

  const promoOffers = [
    "Hỗ trợ trả góp linh hoạt theo chính sách áp dụng tại cửa hàng.",
    "Kiểm tra máy, tư vấn thiết lập ban đầu và gợi ý phụ kiện phù hợp.",
    "Ưu tiên xử lý giao nhanh với sản phẩm còn hàng trong khu vực hỗ trợ.",
    "Tiếp nhận bảo hành và hỗ trợ sau bán theo từng nhóm sản phẩm.",
  ];

  const supportFacts = [
    {
      title: "Giao nhận",
      value: product.active ? "Có thể nhận tại cửa hàng hoặc giao tận nơi." : "Liên hệ để giữ hàng sớm khi có đợt mới.",
    },
    {
      title: "Thu cũ đổi mới",
      value: "Hỗ trợ kiểm tra nhanh thiết bị đang dùng để tư vấn phương án nâng cấp.",
    },
    {
      title: "Bảo hành",
      value: "Áp dụng theo chính sách chính hãng của từng ngành hàng và cửa hàng.",
    },
  ];

  const triggerCartAnimation = () => {
    setCartAnimated(true);
    window.setTimeout(() => setCartAnimated(false), 650);
  };

  const triggerFavoriteAnimation = () => {
    setFavoriteAnimated(true);
    window.setTimeout(() => setFavoriteAnimated(false), 650);
  };

  const handleAddToCart = () => {
    addToCart(product, 1);
    triggerCartAnimation();
  };

  const handleToggleFavorite = () => {
    toggleFavorite(product);
    triggerFavoriteAnimation();
  };

  return (
    <div className="detail-page-shell tzdetail-shell">
      <div className="detail-page-card tzdetail-page-card">
        <div className="detail-page-breadcrumb tzdetail-breadcrumb">
          <Link to="/">Trang chủ</Link>
          <span>/</span>
          <span>{product.category || "Sản phẩm"}</span>
          <span>/</span>
          <strong>{product.name}</strong>
        </div>

        <div className="tzdetail-top">
          <section className="tzdetail-gallery-card">
            <div className="tzdetail-badge-row">
              <span className="tzdetail-badge">Chính hãng</span>
              <span className="tzdetail-badge">{availabilityLabel}</span>
              {salePercent > 0 ? <span className="tzdetail-badge">Giảm {salePercent}%</span> : null}
            </div>

            <div className="tzdetail-main-visual">
              <div
                className="tzdetail-main-glow"
                style={{
                  background: `radial-gradient(circle at 50% 10%, ${selectedColor?.hex || "#ffffff"}55, transparent 55%)`,
                }}
              />
              <img
                src={heroImage}
                alt={product.name}
                onError={(event) => handleProductImageError(event, product)}
              />
            </div>

            <div className="tzdetail-thumb-row">
              {galleryImages.map((image) => (
                <button
                  key={image}
                  type="button"
                  className={`tzdetail-thumb ${selectedImage === image ? "active" : ""}`}
                  onClick={() => setSelectedImage(image)}
                >
                  <img
                    src={image}
                    alt={product.name}
                    onError={(event) => handleProductImageError(event, product)}
                  />
                </button>
              ))}
            </div>

            <div className="tzdetail-support-grid">
              {supportFacts.map((item) => (
                <div key={item.title} className="tzdetail-support-card">
                  <strong>{item.title}</strong>
                  <p>{item.value}</p>
                </div>
              ))}
            </div>

            <div className="tzdetail-benefit-grid">
              {benefits.map((item, index) => (
                <article key={item.title} className="tzdetail-benefit-card">
                  <span className="tzdetail-benefit-index">{String(index + 1).padStart(2, "0")}</span>
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                </article>
              ))}
            </div>
          </section>

          <aside className="tzdetail-summary-card">
            <div className="tzdetail-summary-head">
              <span className="tzdetail-category-pill">{product.category || "Sản phẩm"}</span>
              <h1 className="tzdetail-title">{product.name}</h1>
              <p className="tzdetail-description">{shortDescription}</p>
            </div>

            <div className="tzdetail-price-box">
              <div>
                <div className="tzdetail-price-line">
                  <strong className="tzdetail-price">{mainPrice.toLocaleString("vi-VN")} đ</strong>
                  {saveAmount > 0 ? (
                    <span className="tzdetail-save-chip">Tiết kiệm {saveAmount.toLocaleString("vi-VN")} đ</span>
                  ) : null}
                </div>
                {oldPrice > mainPrice ? (
                  <p className="tzdetail-old-price">{oldPrice.toLocaleString("vi-VN")} đ</p>
                ) : null}
              </div>
              <div className="tzdetail-installment-box">
                <span>Trả góp dự kiến</span>
                <strong>{monthlyPrice.toLocaleString("vi-VN")} đ/tháng</strong>
              </div>
            </div>

            <div className="tzdetail-meta-row">
              <span>Thương hiệu {product.brand || "Apple"}</span>
              <span>{availabilityLabel}</span>
              <span>{selectedVariant || "Đang chọn cấu hình"}</span>
            </div>

            <div className="tzdetail-option-block">
              <div className="tzdetail-option-head">
                <p>Màu sắc</p>
                <span>{selectedColor?.name || "Đang cập nhật"}</span>
              </div>
              <div className="tzdetail-color-grid">
                {colorOptions.map((color) => (
                  <button
                    key={color.id}
                    type="button"
                    className={`tzdetail-color-card ${selectedColorId === color.id ? "active" : ""}`}
                    onClick={() => setSelectedColorId(color.id)}
                  >
                    <span className="tzdetail-color-swatch" style={{ backgroundColor: color.hex }} />
                    <span>{color.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="tzdetail-option-block">
              <div className="tzdetail-option-head">
                <p>{categoryKey === "watch" ? "Phiên bản" : "Dung lượng"}</p>
                <span>{selectedVariant || "Đang cập nhật"}</span>
              </div>
              <div className="tzdetail-variant-grid">
                {variantOptions.map((variant) => (
                  <button
                    key={variant}
                    type="button"
                    className={`tzdetail-variant-card ${selectedVariant === variant ? "active" : ""}`}
                    onClick={() => setSelectedVariant(variant)}
                  >
                    {variant}
                  </button>
                ))}
              </div>
            </div>

            <div className="tzdetail-offer-box">
              <h2>Ưu đãi và hỗ trợ</h2>
              <ul>
                {promoOffers.map((offer) => (
                  <li key={offer}>{offer}</li>
                ))}
              </ul>
            </div>

            <div className="tzdetail-actions">
              <StoreActionButton
                variant="cart"
                active={cartAnimated}
                animated={cartAnimated}
                onClick={handleAddToCart}
                icon={cartAnimated ? <StoreCheckIcon /> : <StoreBagIcon />}
              >
                {cartAnimated ? "Đã thêm giỏ" : "Thêm vào giỏ"}
              </StoreActionButton>

              <StoreActionButton
                variant="favorite"
                active={favorite}
                animated={favoriteAnimated}
                onClick={handleToggleFavorite}
                icon={<StoreHeartIcon filled={favorite} />}
              >
                {favorite ? "Đã yêu thích" : "Yêu thích"}
              </StoreActionButton>
            </div>
          </aside>
        </div>
      </div>

      <section className="tzdetail-tabs-shell">
        <div className="tzdetail-tabbar">
          {TAB_ITEMS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`tzdetail-tab ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="tzdetail-main-grid">
          <div className="tzdetail-content-card">
            {activeTab === "overview" ? (
              <>
                <section className="tzdetail-highlight-panel">
                  <span className="tzdetail-section-kicker">Tổng quan</span>
                  <h2>Đặc điểm nổi bật {product.name}</h2>
                  <ul className="tzdetail-highlight-list">
                    {highlights.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </section>

                <div className="tzdetail-story-list">
                  {storySections.map((section) => (
                    <article key={section.title} className="tzdetail-story-block">
                      <h3>{section.title}</h3>
                      {section.paragraphs.map((paragraph) => (
                        <p key={paragraph}>{paragraph}</p>
                      ))}
                    </article>
                  ))}
                </div>

                <section className="tzdetail-faq-section">
                  <h3>Câu hỏi thường gặp</h3>
                  <div className="tzdetail-faq-list">
                    {faqItems.map((item, index) => (
                      <article key={item.question} className={`tzdetail-faq-item ${openFaq === index ? "open" : ""}`}>
                        <button
                          type="button"
                          className="tzdetail-faq-trigger"
                          onClick={() => setOpenFaq((current) => (current === index ? -1 : index))}
                        >
                          <span>{item.question}</span>
                          <span>{openFaq === index ? "−" : "+"}</span>
                        </button>
                        {openFaq === index ? <p className="tzdetail-faq-answer">{item.answer}</p> : null}
                      </article>
                    ))}
                  </div>
                </section>
              </>
            ) : null}

            {activeTab === "specs" ? (
              <>
                <section className="tzdetail-spec-section">
                  <span className="tzdetail-section-kicker">Thông tin cấu hình</span>
                  <h2>Thông số kỹ thuật</h2>
                  <div className="tzdetail-spec-table">
                    {specs.map(([label, value]) => (
                      <div key={label} className="tzdetail-spec-row">
                        <span>{label}</span>
                        <strong>{value}</strong>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="tzdetail-note-surface">
                  <h3>Phiên bản đang chọn</h3>
                  <p>
                    Bạn đang xem cấu hình <strong>{selectedVariant || "đang cập nhật"}</strong> với màu{" "}
                    <strong>{selectedColor?.name || "đang cập nhật"}</strong>.
                  </p>
                </section>
              </>
            ) : null}

            {activeTab === "article" ? (
              <>
                <section className="tzdetail-article-section">
                  <span className="tzdetail-section-kicker">Chi tiết sản phẩm</span>
                  <h2>{product.name}</h2>
                  <p className="tzdetail-article-lead">{shortDescription}</p>

                  <div className="tzdetail-article-media">
                    {galleryImages.slice(0, 3).map((image) => (
                      <div key={image} className="tzdetail-media-card">
                        <img
                          src={image}
                          alt={product.name}
                          onError={(event) => handleProductImageError(event, product)}
                        />
                      </div>
                    ))}
                  </div>

                  {storySections.map((section) => (
                    <article key={section.title} className="tzdetail-story-block">
                      <h3>{section.title}</h3>
                      {section.paragraphs.map((paragraph) => (
                        <p key={paragraph}>{paragraph}</p>
                      ))}
                    </article>
                  ))}
                </section>
              </>
            ) : null}

            {activeTab === "policy" ? (
              <>
                <section className="tzdetail-policy-section">
                  <span className="tzdetail-section-kicker">Mua tại TungZone</span>
                  <h2>Ưu đãi và chính sách</h2>
                  <div className="tzdetail-policy-grid">
                    <article className="tzdetail-policy-card">
                      <h3>Quyền lợi khi mua</h3>
                      <ul>
                        {promoOffers.map((offer) => (
                          <li key={offer}>{offer}</li>
                        ))}
                      </ul>
                    </article>

                    <article className="tzdetail-policy-card">
                      <h3>Hỗ trợ sau bán</h3>
                      <ul>
                        {supportFacts.map((item) => (
                          <li key={item.title}>
                            <strong>{item.title}: </strong>
                            {item.value}
                          </li>
                        ))}
                      </ul>
                    </article>
                  </div>
                </section>
              </>
            ) : null}
          </div>

          <aside className="tzdetail-side-column">
            <div className="tzdetail-side-card">
              <h3>Thông số nhanh</h3>
              <div className="tzdetail-side-spec-list">
                {compactSpecs.map(([label, value]) => (
                  <div key={label} className="tzdetail-side-spec-row">
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="tzdetail-side-card">
              <h3>Dịch vụ cửa hàng</h3>
              <ul className="tzdetail-side-list">
                {benefits.map((item) => (
                  <li key={item.title}>
                    <strong>{item.title}</strong>
                    <p>{item.desc}</p>
                  </li>
                ))}
              </ul>
            </div>

            {relatedProducts.length > 0 ? (
              <div className="tzdetail-side-card">
                <h3>Sản phẩm cùng nhóm</h3>
                <div className="tzdetail-related-list">
                  {relatedProducts.map((item) => (
                    <Link key={item.id} to={`/products/${item.id}`} className="tzdetail-related-card">
                      <div className="tzdetail-related-image">
                        <img
                          src={getProductImageUrl(item)}
                          alt={item.name}
                          onError={(event) => handleProductImageError(event, item)}
                        />
                      </div>
                      <div className="tzdetail-related-body">
                        <h4>{item.name}</h4>
                        <p>{item.category || "Sản phẩm"}</p>
                        <strong>{Number(item.price || 0).toLocaleString("vi-VN")} đ</strong>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </aside>
        </div>
      </section>
    </div>
  );
}
