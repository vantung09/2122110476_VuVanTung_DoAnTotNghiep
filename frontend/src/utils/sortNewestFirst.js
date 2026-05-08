const DATE_KEYS = ["createdAt", "createdDate", "created_at", "updatedAt", "updatedDate", "updated_at"];

function getNewestTimestamp(item) {
  for (const key of DATE_KEYS) {
    const value = item?.[key];
    if (!value) continue;
    const timestamp = Date.parse(value);
    if (Number.isFinite(timestamp)) return timestamp;
  }
  return 0;
}

export function sortNewestFirst(list) {
  return [...(list || [])].sort((left, right) => {
    const dateDiff = getNewestTimestamp(right) - getNewestTimestamp(left);
    if (dateDiff !== 0) return dateDiff;
    return Number(right?.id || 0) - Number(left?.id || 0);
  });
}
