import { useEffect, useMemo, useState } from "react";
import axiosClient from "../../api/axiosClient";
import { getProductImageUrl, handleProductImageError } from "../../utils/productImage";

function formatCurrency(value) {
  return `${Number(value || 0).toLocaleString("vi-VN")} đ`;
}

function formatDate(value) {
  if (!value) return "--";
  return new Date(value).toLocaleString("vi-VN");
}

export default function PurchasedTab({ orders }) {
  const [orderDetailsMap, setOrderDetailsMap] = useState({});
  const [purchasedLoading, setPurchasedLoading] = useState(false);
  const [pageError, setPageError] = useState("");

  useEffect(() => {
    const completedOrders = orders.filter((order) => order.status === "COMPLETED");
    const missingOrderIds = completedOrders
      .map((order) => order.id)
      .filter((orderId) => !orderDetailsMap[orderId]);

    if (!missingOrderIds.length) return;

    let mounted = true;

    const loadCompletedOrderDetails = async () => {
      try {
        setPurchasedLoading(true);
        const responses = await Promise.all(
          missingOrderIds.map(async (orderId) => {
            const response = await axiosClient.get(`/orders/my/${orderId}`);
            return { orderId, detail: response.data };
          })
        );

        if (!mounted) return;

        setOrderDetailsMap((prev) => {
          const next = { ...prev };
          responses.forEach(({ orderId, detail }) => {
            next[orderId] = detail;
          });
          return next;
        });
      } catch {
        if (!mounted) return;
        setPageError("Không tải được danh sách sản phẩm đã mua.");
      } finally {
        if (mounted) setPurchasedLoading(false);
      }
    };

    loadCompletedOrderDetails();
    return () => { mounted = false; };
  }, [orders, orderDetailsMap]);

  const purchasedItems = useMemo(() => {
    const itemMap = new Map();

    orders
      .filter((order) => order.status === "COMPLETED")
      .forEach((order) => {
        const detail = orderDetailsMap[order.id];
        if (!detail?.items?.length) return;

        detail.items.forEach((item, index) => {
          const key = `${item.productName || "Sản phẩm"}-${Number(item.price || 0)}`;

          if (!itemMap.has(key)) {
            itemMap.set(key, {
              id: `${order.id}-${index}`,
              productName: item.productName || "Sản phẩm",
              imageUrl: item.imageUrl || "",
              unitPrice: Number(item.price || 0),
              totalQuantity: Number(item.quantity || 0),
              totalSpent: Number(item.price || 0) * Number(item.quantity || 0),
              lastPurchasedAt: order.createdAt,
            });
            return;
          }

          const current = itemMap.get(key);
          current.totalQuantity += Number(item.quantity || 0);
          current.totalSpent += Number(item.price || 0) * Number(item.quantity || 0);

          if (new Date(order.createdAt).getTime() > new Date(current.lastPurchasedAt).getTime()) {
            current.lastPurchasedAt = order.createdAt;
          }
        });
      });

    return Array.from(itemMap.values()).sort(
      (a, b) => new Date(b.lastPurchasedAt).getTime() - new Date(a.lastPurchasedAt).getTime()
    );
  }, [orders, orderDetailsMap]);

  return (
    <section className="account-profile-content-stack">
      {pageError && <div className="error-box">{pageError}</div>}

      {purchasedLoading ? (
        <div className="admin-empty-state">Đang tải danh sách sản phẩm đã mua...</div>
      ) : purchasedItems.length ? (
        <div className="purchased-grid">
          {purchasedItems.map((item) => (
            <article key={item.id} className="card p-lg purchased-card">
              <img
                src={getProductImageUrl({ imageUrl: item.imageUrl, name: item.productName })}
                alt={item.productName}
                onError={(event) => handleProductImageError(event, { name: item.productName })}
              />
              <div className="purchased-body">
                <h3>{item.productName}</h3>
                <p><strong>Đơn giá:</strong> {formatCurrency(item.unitPrice)}</p>
                <p><strong>Tổng số lượng đã mua:</strong> {item.totalQuantity}</p>
                <p><strong>Tổng tiền đã chi:</strong> {formatCurrency(item.totalSpent)}</p>
                <p><strong>Lần mua gần nhất:</strong> {formatDate(item.lastPurchasedAt)}</p>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="admin-empty-state">Bạn chưa có sản phẩm nào đã hoàn tất mua.</div>
      )}
    </section>
  );
}
