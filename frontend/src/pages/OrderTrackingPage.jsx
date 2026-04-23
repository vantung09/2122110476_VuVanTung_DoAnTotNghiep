import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import supabase from "../api/supabaseClient";

const STATUS_STEPS = [
  { key: "PENDING", label: "Chờ xử lý", icon: "1" },
  { key: "CONFIRMED", label: "Đã xác nhận", icon: "2" },
  { key: "SHIPPING", label: "Đang giao hàng", icon: "3" },
  { key: "COMPLETED", label: "Hoàn tất", icon: "4" },
];

const HCMC_CENTER = { lat: 10.8231, lng: 106.6297 };

export default function OrderTrackingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId") || "";

  const [trackingSteps, setTrackingSteps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [inputOrderId, setInputOrderId] = useState(orderId);

  const fetchTracking = async (id) => {
    if (!id.trim()) {
      setError("Vui lòng nhập mã đơn hàng.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { data, error: fetchError } = await supabase
        .from("order_tracking")
        .select("*")
        .eq("order_id", id.trim())
        .order("created_at", { ascending: true });
      if (fetchError) throw fetchError;
      setTrackingSteps(data || []);
      if (!data || data.length === 0) {
        setError("Chưa có thông tin theo dõi cho đơn hàng này.");
      }
    } catch {
      setError("Không tải được thông tin theo dõi đơn hàng.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) fetchTracking(orderId);
  }, [orderId]);

  const currentStatus = trackingSteps.length > 0
    ? trackingSteps[trackingSteps.length - 1].status
    : "";

  const mapUrl = trackingSteps.length > 0 && trackingSteps[trackingSteps.length - 1].location_lat
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${Number(trackingSteps[trackingSteps.length - 1].location_lng) - 0.01},${Number(trackingSteps[trackingSteps.length - 1].location_lat) - 0.008},${Number(trackingSteps[trackingSteps.length - 1].location_lng) + 0.01},${Number(trackingSteps[trackingSteps.length - 1].location_lat) + 0.008}&layer=mapnik&marker=${trackingSteps[trackingSteps.length - 1].location_lat},${trackingSteps[trackingSteps.length - 1].location_lng}`
    : `https://www.openstreetmap.org/export/embed.html?bbox=${HCMC_CENTER.lng - 0.05},${HCMC_CENTER.lat - 0.04},${HCMC_CENTER.lng + 0.05},${HCMC_CENTER.lat + 0.04}&layer=mapnik`;

  return (
    <div className="storefront-stack">
      <section className="storefront-section-panel">
        <div className="storefront-heading-row">
          <div>
            <h1 className="storefront-panel-title">Theo dõi đơn hàng</h1>
          </div>
        </div>

        <div className="tracking-page">
          <div className="tracking-search card">
            <h3>Nhập mã đơn hàng</h3>
            <div className="tracking-search-row">
              <input
                className="input"
                placeholder="Ví dụ: 12345"
                value={inputOrderId}
                onChange={(e) => setInputOrderId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchTracking(inputOrderId)}
              />
              <button
                className="btn btn-primary"
                type="button"
                onClick={() => fetchTracking(inputOrderId)}
                disabled={loading}
              >
                {loading ? "Đang tìm..." : "Tra cứu"}
              </button>
            </div>
            {error ? <div className="error-box">{error}</div> : null}
          </div>

          {trackingSteps.length > 0 ? (
            <>
              <div className="tracking-map card">
                <h3>Vị trí giao hàng</h3>
                <div className="tracking-map-frame">
                  <iframe
                    src={mapUrl}
                    title="Bản đồ theo dõi"
                    width="100%"
                    height="300"
                    style={{ border: 0, borderRadius: 12 }}
                    loading="lazy"
                  />
                </div>
                {trackingSteps[trackingSteps.length - 1].location_name && (
                  <p className="tracking-location-name">
                    Vị trí: {trackingSteps[trackingSteps.length - 1].location_name}
                  </p>
                )}
              </div>

              <div className="tracking-timeline card">
                <h3>Trạng thái đơn hàng</h3>
                <div className="tracking-step-bar">
                  {STATUS_STEPS.map((step, index) => {
                    const stepIndex = STATUS_STEPS.findIndex((s) => s.key === currentStatus);
                    const isActive = index <= stepIndex;
                    const isCurrent = step.key === currentStatus;
                    return (
                      <div
                        key={step.key}
                        className={`tracking-step-item ${isActive ? "active" : ""} ${isCurrent ? "current" : ""}`}
                      >
                        <div className="tracking-step-dot">{step.icon}</div>
                        <span>{step.label}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="tracking-detail-list">
                  {trackingSteps.map((step, index) => (
                    <div key={step.id || index} className="tracking-detail-item">
                      <div className="tracking-detail-dot" />
                      <div className="tracking-detail-body">
                        <strong>{step.status}</strong>
                        <p>{step.description || "Cập nhật trạng thái"}</p>
                        <span className="muted">
                          {new Date(step.created_at).toLocaleString("vi-VN")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : !loading && !error ? (
            <div className="card" style={{ textAlign: "center", padding: 40 }}>
              <p className="muted">Nhập mã đơn hàng để xem thông tin theo dõi.</p>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
