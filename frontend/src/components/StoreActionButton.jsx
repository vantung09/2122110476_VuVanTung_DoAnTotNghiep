function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function StoreBagIcon({ className = "store-action-icon-svg" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.9">
      <path d="M6 8h12l-1 11H7L6 8z" />
      <path d="M9 9V7a3 3 0 116 0v2" />
    </svg>
  );
}

export function StoreHeartIcon({ filled = false, className = "store-action-icon-svg" }) {
  return filled ? (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 21s-6.7-4.35-9.17-8.06C.91 10.03 1.4 5.9 5.03 4.3c2.18-.97 4.38-.34 5.87 1.36C12.39 3.96 14.59 3.33 16.77 4.3c3.63 1.6 4.12 5.73 2.2 8.64C18.7 16.65 12 21 12 21z" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.9">
      <path d="M12 21s-6.7-4.35-9.17-8.06C.91 10.03 1.4 5.9 5.03 4.3c2.18-.97 4.38-.34 5.87 1.36C12.39 3.96 14.59 3.33 16.77 4.3c3.63 1.6 4.12 5.73 2.2 8.64C18.7 16.65 12 21 12 21z" />
    </svg>
  );
}

export function StoreCheckIcon({ className = "store-action-icon-svg" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.1">
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}

export default function StoreActionButton({
  variant = "cart",
  active = false,
  animated = false,
  onClick,
  children,
  icon,
}) {
  const isCart = variant === "cart";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "store-action-btn",
        isCart ? "store-action-btn-cart" : "store-action-btn-favorite",
        active && isCart ? "is-active-cart" : "",
        active && !isCart ? "is-active-favorite" : "",
        animated && isCart ? "store-action-cart-pop" : "",
        animated && !isCart ? "store-action-favorite-pop" : ""
      )}
    >
      <span
        className={cn(
          "store-action-overlay",
          isCart
            ? active
              ? "store-action-overlay-cart-active"
              : "store-action-overlay-cart"
            : active
              ? "store-action-overlay-favorite-active"
              : "store-action-overlay-favorite"
        )}
      />

      {animated && isCart ? <span className="store-action-cart-ripple" /> : null}
      {animated && !isCart ? <span className="store-action-favorite-ring" /> : null}

      <span className="store-action-content">
        <span
          className={cn(
            "store-action-icon-shell",
            isCart
              ? active
                ? "store-action-icon-shell-cart-active"
                : "store-action-icon-shell-cart"
              : active
                ? "store-action-icon-shell-favorite-active"
                : "store-action-icon-shell-favorite"
          )}
        >
          {icon}
        </span>
        <span>{children}</span>
      </span>
    </button>
  );
}
