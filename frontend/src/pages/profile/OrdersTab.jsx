import { useState } from "react";
import axiosClient from "../../api/axiosClient";
import { getProductImageUrl, handleProductImageError } from "../../utils/productImage";

const LOYALTY_POINT_RATE = 1_000;

const statusLabelMap = {
  PENDING: "Chờ xử lý",
  CONFIRMED: "Đã xác nhận",
  SHIPPING: "Đang giao",
  COMPLETED: "Hoàn tất",
  CANCELLED: "Đã hủy",
};

const ORDER_TRACKING_STEPS = [
  { key: "PENDING", label: "Đặt hàng", hint: "Đơn đã được tạo trên hệ thống" },
  { key: "CONFIRMED", label: "Xác nhận", hint: "TungZone đã tiếp nhận và chuẩn bị xử lý" },
  { key: "SHIPPING", label: "Vận chuyển", hint: "Đơn đang được giao đến bạn" },
  { key: "COMPLETED", label: "Hoàn tất", hint: "Đơn hàng đã giao thành công" },
];

const ORDER_STEP_INDEX = ORDER_TRACKING_STEPS.reduce((acc, step, index) => {
  acc[step.key] = index;
  return acc;
}, {});

function formatCurrency(value) {
  return `${Number(value || 0).toLocaleString("vi-VN")} đ`;
}

function formatPoints(value) {
  return `${Number(value || 0).toLocaleString("vi-VN")} điểm`;
}

function formatDate(value) {
  if (!value) return "--";
  return new Date(value).toLocaleString("vi-VN");
}

function getOrderTrackingMessage(status) {
  switch (status) {
    case "PENDING": return "Đơn đang chờ xác nhận. TungZone sẽ kiểm tra và cập nhật sớm cho bạn.";
    case "CONFIRMED": return "Đơn đã được xác nhận và đang được chuẩn bị để bàn giao cho đơn vị vận chuyển.";
    case "SHIPPING": return "Đơn đang trên đường giao tới bạn. Hãy giữ điện thoại để tiện nhận hàng.";
    case "COMPLETED": return "Đơn đã hoàn tất. Cảm ơn bạn đã mua sắm tại TungZone.";
    case "CANCELLED": return "Đơn đã hủy và sẽ không tiếp tục xử lý. Bạn có thể đặt lại bất kỳ lúc nào.";
    default: return "Trạng thái đơn hàng sẽ tiếp tục được cập nhật khi có thay đổi mới.";
  }
}

function buildOrderTrackingSteps(status) {
  if (status === "CANCELLED") {
    return [
      { key: "PENDING", label: "Đặt hàng", hint: "Đơn đã được tạo trên hệ thống", state: "complete" },
      { key: "CANCELLED", label: "Đã hủy", hint: "Đơn đã dừng xử lý theo trạng thái hiện tại", state: "current" },
    ];
  }
  const currentIndex = ORDER_STEP_INDEX[status] ?? 0;
  return ORDER_TRACKING_STEPS.map((step, index) => ({
    ...step,
    state: index < currentIndex ? "complete" : index === currentIndex ? "current" : "upcoming",
  }));
}

export default function OrdersTab({ orders }) {
  const [orderDetailsMap, setOrderDetailsMap] = useState({});
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [loadingOrderId, setLoadingOrderId] = useState(null);
  const [pageError, setPageError] = useState("");

  const completedOrdersCount = orders.filter((o) => o.status === "COMPLETED").length;
  const activeOrdersCount = orders.filter((o) => ["PENDING", "CONFIRMED", "SHIPPING"].includes(o.status)).length;
  const loyaltyPoints = Math.floor(
    orders
      .filter((o) => o.status === "COMPLETED")
      .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0) / LOYALTY_POINT_RATE
  );

  const handleToggleOrderDetail = async (orderId) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
      return;
    }
    setExpandedOrderId(orderId);
    if (orderDetailsMap[orderId]) return;

    try {
      setLoadingOrderId(orderId);
      const response = await axiosClient.get(`/orders/my/${orderId}`);
      setOrderDetailsMap((prev) => ({ ...prev, [orderId]: response.data }));
    } catch {
      setPageError("Không tải được chi tiết đơn hàng.");
    } finally {
      setLoadingOrderId(null);
    }
  };

  return (
    <section className="account-profile-content-stack">
      {pageError && <div className="error-box">{pageError}</div>}

      <div className="account-order-overview">
        <article className="account-order-overview-card">
          <span>Đơn đang xử lý</span>
          <strong>{activeOrdersCount}</strong>
          <p>Các đơn đang chờ xác nhận hoặc vận chuyển.</p>
        </article>
        <article className="account-order-overview-card">
          <span>Đơn hoàn tất</span>
          <strong>{completedOrdersCount}</strong>
          <p>Đơn đã giao thành công và được ghi nhận lịch sử mua hàng.</p>
        </article>
        <article className="account-order-overview-card">
          <span>Điểm tích lũy</span>
          <strong>{formatPoints(loyaltyPoints)}</strong>
          <p>Tự động cộng từ chi tiêu của các đơn hoàn tất.</p>
        </article>
      </div>

      <div className="order-list">
        {orders.length === 0 ? (
          <div className="admin-empty-state">Bạn chưa có đơn hàng nào.</div>
        ) : (
          orders.map((order) => {
            const detail = orderDetailsMap[order.id] || order;
            const isExpanded = expandedOrderId === order.id;
            const orderItems = detail.items || order.items || [];
            const itemCount = orderItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
            const earnedPoints =
              order.status === "COMPLETED"
                ? Math.floor(Number(order.totalAmount || 0) / LOYALTY_POINT_RATE)
                : 0;
            const trackingSteps = buildOrderTrackingSteps(order.status);

            return (
              <div key={order.id} className="card p-lg order-card">
                <div className="order-top">
                  <div className="account-order-main">
                    <h3>Đơn hàng #{order.id}</h3>
                    <p>Ngày tạo: {formatDate(order.createdAt)}</p>
                  </div>
                  <div className="order-right">
                    <strong>{formatCurrency(order.totalAmount)}</strong>
                    <span className={`admin-status-pill is-${String(order.status || "").toLowerCase()}`}>
                      {statusLabelMap[order.status] || order.status}
                    </span>
                    <button
                      className="btn btn-secondary btn-sm"
                      type="button"
                      onClick={() => handleToggleOrderDetail(order.id)}
                    >
                      {isExpanded ? "Ẩn chi tiết" : "Xem chi tiết"}
                    </button>
                  </div>
                </div>

                <div className="account-order-meta-row">
                  <span className="account-order-meta">{itemCount} sản phẩm</span>
                  {earnedPoints > 0 ? (
                    <span className="account-order-meta is-points">+{formatPoints(earnedPoints)}</span>
                  ) : null}
                </div>

                <div className={`account-order-timeline ${trackingSteps.length <= 2 ? "is-compact" : ""}`}>
                  {trackingSteps.map((step, index) => (
                    <div key={`${order.id}-${step.key}`} className={`account-order-step is-${step.state}`}>
                      <span className="account-order-step-marker" aria-hidden="true">
                        {step.state === "complete" ? "✓" : step.state === "current" ? index + 1 : ""}
                      </span>
                      {index < trackingSteps.length - 1 ? (
                        <span className="account-order-step-connector" aria-hidden="true" />
                      ) : null}
                      <div className="account-order-step-copy">
                        <strong>{step.label}</strong>
                        <span>{step.hint}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className={`account-order-status-note ${order.status === "CANCELLED" ? "is-cancelled" : ""}`}>
                  {getOrderTrackingMessage(order.status)}
                </div>

                {isExpanded ? (
                  <div className="order-items">
                    {loadingOrderId === order.id ? (
                      <div className="admin-empty-state">Đang tải chi tiết...</div>
                    ) : detail.items?.length ? (
                      detail.items.map((item, index) => (
                        <div key={`${order.id}-${index}`} className="order-item-row">
                          <img
                            src={getProductImageUrl({ imageUrl: item.imageUrl, name: item.productName })}
                            alt={item.productName}
                            onError={(event) => handleProductImageError(event, { name: item.productName })}
                          />
                          <div>
                            <p><strong>{item.productName}</strong></p>
                            <p>Số lượng: {item.quantity}</p>
                            <p>Đơn giá: {formatCurrency(item.price)}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="admin-empty-state">Đơn hàng chưa có sản phẩm.</div>
                    )}
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
