import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import supabase from "../api/supabaseClient";

export default function ProductReviews({ productId }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ rating: 5, title: "", comment: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchReviews = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from("product_reviews")
        .select("*")
        .eq("product_id", productId)
        .order("created_at", { ascending: false });
      if (!fetchError) setReviews(data || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setError("Vui lòng đăng nhập để đánh giá.");
      return;
    }
    setSubmitting(true);
    setError("");
    setSuccess("");

    const userId = user.userId || user.email;
    const userName = user.fullName || user.email || "Khach";

    const { error: insertError } = await supabase.from("product_reviews").insert({
      product_id: productId,
      user_id: userId,
      user_name: userName,
      rating: form.rating,
      title: form.title.trim(),
      comment: form.comment.trim(),
    });

    if (insertError) {
      setError("Không thể gửi đánh giá. Bạn có thể đã đánh giá sản phẩm này rồi.");
    } else {
      setSuccess("Đánh giá đã được gửi!");
      setForm({ rating: 5, title: "", comment: "" });
      setShowForm(false);
      fetchReviews();
    }
    setSubmitting(false);
  };

  const renderStars = (rating, interactive = false) => {
    return [1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        className={`review-star ${star <= rating ? "filled" : ""}`}
        onClick={() => interactive && setForm((prev) => ({ ...prev, rating: star }))}
        disabled={!interactive}
      >
        ★
      </button>
    ));
  };

  return (
    <div className="product-reviews">
      <div className="reviews-header">
        <h3>Đánh giá sản phẩm</h3>
        <div className="reviews-summary">
          <span className="reviews-avg">{averageRating}</span>
          <span className="reviews-stars">{renderStars(Math.round(averageRating))}</span>
          <span className="reviews-count">({reviews.length} đánh giá)</span>
        </div>
        {user ? (
          <button
            className="btn btn-primary btn-sm"
            type="button"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? "Hủy" : "Viết đánh giá"}
          </button>
        ) : null}
      </div>

      {showForm ? (
        <form className="review-form card" onSubmit={handleSubmit}>
          <div className="review-form-rating">
            <label>Đánh giá:</label>
            <div className="review-stars-input">{renderStars(form.rating, true)}</div>
          </div>
          <input
            className="input"
            placeholder="Tiêu đề đánh giá (không bắt buộc)"
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
          />
          <textarea
            className="input textarea"
            placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm..."
            rows={3}
            value={form.comment}
            onChange={(e) => setForm((prev) => ({ ...prev, comment: e.target.value }))}
          />
          {error ? <div className="error-box">{error}</div> : null}
          {success ? <div className="success-box">{success}</div> : null}
          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? "Đang gửi..." : "Gửi đánh giá"}
          </button>
        </form>
      ) : null}

      {loading ? (
        <p className="muted">Đang tải đánh giá...</p>
      ) : reviews.length > 0 ? (
        <div className="reviews-list">
          {reviews.map((review) => (
            <article key={review.id} className="review-item card">
              <div className="review-item-header">
                <strong className="review-author">{review.user_name}</strong>
                <span className="review-stars">{renderStars(review.rating)}</span>
                <span className="muted review-date">
                  {new Date(review.created_at).toLocaleDateString("vi-VN")}
                </span>
              </div>
              {review.title ? <h4 className="review-title">{review.title}</h4> : null}
              {review.comment ? <p className="review-comment">{review.comment}</p> : null}
            </article>
          ))}
        </div>
      ) : (
        <p className="muted">Chưa có đánh giá nào. Hãy là người đầu tiên đánh giá sản phẩm này.</p>
      )}
    </div>
  );
}
