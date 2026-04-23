import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";
import supabase from "../api/supabaseClient";

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const userId = user?.userId || user?.email;

  const fetchOrCreateSession = async () => {
    if (!userId) return;
    try {
      const { data: existing } = await supabase
        .from("chat_sessions")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "open")
        .order("last_message_at", { ascending: false })
        .maybeSingle();

      if (existing) {
        setSession(existing);
        const { data: msgs } = await supabase
          .from("chat_messages")
          .select("*")
          .eq("session_id", existing.id)
          .order("created_at", { ascending: true });
        setMessages(msgs || []);
        return;
      }

      const { data: newSession, error } = await supabase
        .from("chat_sessions")
        .insert({ user_id: userId, status: "open" })
        .select()
        .maybeSingle();

      if (!error && newSession) {
        setSession(newSession);
        setMessages([]);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (!userId) {
      setSession(null);
      setMessages([]);
      return;
    }
    fetchOrCreateSession();
  }, [userId]);

  const sendMessage = async (text) => {
    if (!text.trim() || !session || !userId) return;
    const userName = user?.fullName || user?.email || "Khach";

    const { data: msg, error } = await supabase
      .from("chat_messages")
      .insert({
        session_id: session.id,
        user_id: userId,
        user_name: userName,
        message: text.trim(),
        sender_type: "user",
      })
      .select()
      .maybeSingle();

    if (!error && msg) {
      setMessages((prev) => [...prev, msg]);
      await supabase
        .from("chat_sessions")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", session.id);
    }
  };

  const refreshMessages = async () => {
    if (!session) return;
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("session_id", session.id)
      .order("created_at", { ascending: true });
    setMessages(data || []);
  };

  const closeSession = async () => {
    if (!session) return;
    await supabase
      .from("chat_sessions")
      .update({ status: "closed" })
      .eq("id", session.id);
    setSession(null);
    setMessages([]);
  };

  const openChat = () => {
    setIsOpen(true);
    if (!session && userId) {
      fetchOrCreateSession();
    }
  };

  const closeChat = () => {
    setIsOpen(false);
  };

  const value = useMemo(
    () => ({
      isOpen,
      session,
      messages,
      loading,
      openChat,
      closeChat,
      sendMessage,
      refreshMessages,
      closeSession,
    }),
    [isOpen, session, messages, loading, userId]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  return useContext(ChatContext);
}
