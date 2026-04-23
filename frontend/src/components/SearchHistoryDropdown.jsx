import { useSearchHistory } from "../contexts/SearchHistoryContext";

export default function SearchHistoryDropdown({ onSelect, visible }) {
  const { history, deleteItem, clearHistory } = useSearchHistory();

  if (!visible || history.length === 0) return null;

  return (
    <div className="search-history-dropdown">
      <div className="search-history-header">
        <span>Tìm kiếm gần đây</span>
        <button type="button" className="search-history-clear" onClick={clearHistory}>
          Xóa tất cả
        </button>
      </div>
      <div className="search-history-list">
        {history.map((item) => (
          <div key={item.id} className="search-history-item">
            <button
              type="button"
              className="search-history-query"
              onClick={() => onSelect(item.query)}
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" opacity={0.4}>
                <path d="M11 4a7 7 0 1 0 4.48 12.38l3.07 3.07 1.41-1.41-3.07-3.07A7 7 0 0 0 11 4Zm0 2a5 5 0 1 1 0 10 5 5 0 0 1 0-10Z" />
              </svg>
              {item.query}
            </button>
            <button
              type="button"
              className="search-history-delete"
              onClick={(e) => {
                e.stopPropagation();
                deleteItem(item.id);
              }}
              aria-label="Xóa"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
