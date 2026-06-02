import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";

const SearchHistoryContext = createContext(null);

async function getSupabaseClient() {
  const { default: supabase } = await import("../api/supabaseClient");
  return supabase;
}

export function SearchHistoryProvider({ children }) {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);

  const fetchHistory = async () => {
    if (!user) {
      setHistory([]);
      return;
    }
    const supabase = await getSupabaseClient();
    if (!supabase) {
      setHistory([]);
      return;
    }
    try {
      const { data, error } = await supabase
        .from("search_history")
        .select("*")
        .eq("user_id", user.userId || user.email)
        .order("created_at", { ascending: false })
        .limit(20);
      if (!error) setHistory(data || []);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user]);

  const addSearch = async (query) => {
    if (!user || !query.trim()) return;
    const supabase = await getSupabaseClient();
    if (!supabase) return;
    const trimmed = query.trim();
    const userId = user.userId || user.email;

    const recent = history.filter(
      (h) => h.query.toLowerCase() === trimmed.toLowerCase()
    );
    if (recent.length > 0) return;

    const { error } = await supabase.from("search_history").insert({
      user_id: userId,
      query: trimmed,
    });
    if (!error) fetchHistory();
  };

  const clearHistory = async () => {
    if (!user) return;
    const supabase = await getSupabaseClient();
    if (!supabase) return;
    const userId = user.userId || user.email;
    await supabase.from("search_history").delete().eq("user_id", userId);
    setHistory([]);
  };

  const deleteItem = async (id) => {
    const supabase = await getSupabaseClient();
    if (!supabase) return;
    await supabase.from("search_history").delete().eq("id", id);
    setHistory((prev) => prev.filter((h) => h.id !== id));
  };

  const value = useMemo(
    () => ({ history, addSearch, clearHistory, deleteItem }),
    [history, user]
  );

  return (
    <SearchHistoryContext.Provider value={value}>
      {children}
    </SearchHistoryContext.Provider>
  );
}

export function useSearchHistory() {
  return useContext(SearchHistoryContext);
}
