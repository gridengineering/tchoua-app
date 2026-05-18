"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { formatDate } from "@/lib/utils";
import {
  MessageCircle, Send, Plus, Hash, Users, ChevronDown,
  Smile, Reply, Trash2, Image, Loader2
} from "lucide-react";

interface Message {
  id: string;
  content: string;
  type: string;
  senderId: string;
  createdAt: string;
  isDeleted: boolean;
  sender: { id: string; name: string; avatar?: string; level: string };
  reactions: { emoji: string; userId: string; user: { name: string } }[];
  replyTo?: { id: string; content: string; sender: { name: string } } | null;
}

interface Channel {
  id: string;
  name: string;
  type: string;
  messages: Message[];
  _count: { messages: number };
}

interface Tontine {
  id: string;
  name: string;
  type: string;
}

const EMOJIS = ["👍", "❤️", "😂", "😮", "🙏", "🎉", "💰", "✅"];

const levelColors: Record<string, string> = {
  NOVICE: "text-graphite",
  ACTIF: "text-green-600",
  ENGAGE: "text-info",
  LEADER: "text-violet-600",
  LEGENDE: "text-yellow-600",
};

export default function ChatPage() {
  const { data: session } = useSession();
  const [tontines, setTontines] = useState<Tontine[]>([]);
  const [selectedTontine, setSelectedTontine] = useState<Tontine | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [sending, setSending] = useState(false);
  const [showEmoji, setShowEmoji] = useState<string | null>(null);
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageRef = useRef<string>("");

  useEffect(() => {
    fetch("/api/tontines?mine=true")
      .then((r) => r.json())
      .then((data) => {
        const list = data.tontines || [];
        setTontines(list);
        if (list.length > 0) setSelectedTontine(list[0]);
      });
  }, []);

  useEffect(() => {
    if (!selectedTontine) return;
    setMessages([]);
    setSelectedChannel(null);
    fetch(`/api/chat-channels?tontineId=${selectedTontine.id}`)
      .then((r) => r.json())
      .then(setChannels);
    loadMessages(selectedTontine.id, null);
  }, [selectedTontine]);

  const loadMessages = useCallback(async (tontineId: string, channelId: string | null) => {
    const params = new URLSearchParams({ tontineId, limit: "100" });
    if (channelId) params.set("channelId", channelId);
    const res = await fetch(`/api/messages?${params}`);
    const data = await res.json();
    if (Array.isArray(data)) {
      setMessages(data);
      if (data.length > 0) lastMessageRef.current = data[data.length - 1].createdAt;
    }
  }, []);

  // Polling every 3 seconds for new messages
  useEffect(() => {
    if (!selectedTontine) return;
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      if (!lastMessageRef.current) return;
      const params = new URLSearchParams({
        tontineId: selectedTontine.id,
        after: lastMessageRef.current,
        limit: "50",
      });
      if (selectedChannel) params.set("channelId", selectedChannel.id);
      const res = await fetch(`/api/messages?${params}`);
      const newMsgs = await res.json();
      if (Array.isArray(newMsgs) && newMsgs.length > 0) {
        setMessages((prev) => [...prev, ...newMsgs]);
        lastMessageRef.current = newMsgs[newMsgs.length - 1].createdAt;
      }
    }, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [selectedTontine, selectedChannel]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !selectedTontine || sending) return;
    setSending(true);
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tontineId: selectedTontine.id,
        channelId: selectedChannel?.id || null,
        content: input.trim(),
        replyToId: replyTo?.id || null,
      }),
    });
    if (res.ok) {
      const msg = await res.json();
      setMessages((prev) => [...prev, msg]);
      lastMessageRef.current = msg.createdAt;
      setInput("");
      setReplyTo(null);
    }
    setSending(false);
  };

  const react = async (messageId: string, emoji: string) => {
    await fetch("/api/messages/reactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId, emoji }),
    });
    if (selectedTontine) loadMessages(selectedTontine.id, selectedChannel?.id || null);
    setShowEmoji(null);
  };

  const deleteMessage = async (id: string) => {
    await fetch(`/api/messages?id=${id}`, { method: "DELETE" });
    setMessages((prev) => prev.map((m) => m.id === id ? { ...m, isDeleted: true, content: "Message supprimé" } : m));
  };

  const createChannel = async () => {
    if (!newChannelName.trim() || !selectedTontine) return;
    const res = await fetch("/api/chat-channels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tontineId: selectedTontine.id, name: newChannelName }),
    });
    if (res.ok) {
      const ch = await res.json();
      setChannels((prev) => [...prev, ch]);
      setNewChannelName("");
      setShowChannelModal(false);
    }
  };

  const switchChannel = (channel: Channel | null) => {
    setSelectedChannel(channel);
    setMessages([]);
    lastMessageRef.current = "";
    if (selectedTontine) loadMessages(selectedTontine.id, channel?.id || null);
  };

  const groupedReactions = (reactions: Message["reactions"]) => {
    const map: Record<string, number> = {};
    reactions.forEach((r) => { map[r.emoji] = (map[r.emoji] || 0) + 1; });
    return map;
  };

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-warm-white rounded-xl shadow-sm border border-gray-200">
        {/* Left: Tontines + Channels */}
        <div className="w-64 border-r border-gray-200 flex flex-col bg-cream">
          {/* Tontine selector */}
          <div className="p-3 border-b border-gray-200">
            <div className="text-xs font-semibold text-graphite uppercase mb-2">Mes Tontines</div>
            {Array.isArray(tontines) && tontines.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTontine(t)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm mb-1 transition-colors ${
                  selectedTontine?.id === t.id
                    ? "bg-violet-100 text-violet-700 font-medium"
                    : "text-gray-700 hover:bg-gray-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-violet-500 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
                    {t.name[0]}
                  </div>
                  <span className="truncate">{t.name}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Channels */}
          {selectedTontine && (
            <div className="flex-1 overflow-y-auto p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-semibold text-graphite uppercase">Canaux</div>
                <button
                  onClick={() => setShowChannelModal(true)}
                  className="text-ash hover:text-violet-600"
                  aria-label="Créer un canal"
                  title="Créer un canal"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <button
                onClick={() => switchChannel(null)}
                className={`w-full text-left px-2 py-1.5 rounded-lg text-sm mb-1 flex items-center gap-2 transition-colors ${
                  !selectedChannel ? "bg-violet-100 text-violet-700" : "text-gray-600 hover:bg-gray-200"
                }`}
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Général</span>
              </button>
              {channels.map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => switchChannel(ch)}
                  className={`w-full text-left px-2 py-1.5 rounded-lg text-sm mb-1 flex items-center gap-2 transition-colors ${
                    selectedChannel?.id === ch.id ? "bg-violet-100 text-violet-700" : "text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <Hash className="w-3.5 h-3.5" />
                  <span className="truncate">{ch.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Main chat area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="h-14 border-b border-gray-200 flex items-center px-4 gap-3">
            {selectedTontine ? (
              <>
                <div className="w-8 h-8 rounded-full bg-violet-500 text-white text-sm flex items-center justify-center font-bold">
                  {selectedTontine.name[0]}
                </div>
                <div>
                  <div className="font-semibold text-sm text-gray-900">{selectedTontine.name}</div>
                  <div className="text-xs text-graphite">
                    {selectedChannel ? `#${selectedChannel.name}` : "Général"}
                  </div>
                </div>
              </>
            ) : (
              <span className="text-graphite text-sm">Sélectionnez une tontine</span>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-1">
            {!selectedTontine ? (
              <div className="flex items-center justify-center h-full text-ash">
                <div className="text-center">
                  <MessageCircle className="w-12 h-12 mx-auto mb-3 text-ash/60" />
                  <p>Sélectionnez une tontine pour commencer à chatter</p>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-ash">
                <div className="text-center">
                  <MessageCircle className="w-12 h-12 mx-auto mb-3 text-ash/60" />
                  <p>Aucun message encore. Soyez le premier à écrire !</p>
                </div>
              </div>
            ) : (
              messages.map((msg, i) => {
                const isOwn = msg.senderId === session?.user?.id;
                const prevMsg = i > 0 ? messages[i - 1] : null;
                const showSender = !prevMsg || prevMsg.senderId !== msg.senderId;
                const reactions = groupedReactions(msg.reactions);

                return (
                  <div key={msg.id} className={`group flex gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
                    {/* Avatar */}
                    {showSender && !isOwn && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-1">
                        {msg.sender.name[0]}
                      </div>
                    )}
                    {!showSender && !isOwn && <div className="w-8 flex-shrink-0" />}

                    <div className={`max-w-[70%] ${isOwn ? "items-end" : "items-start"} flex flex-col`}>
                      {showSender && (
                        <div className={`flex items-center gap-2 mb-0.5 ${isOwn ? "flex-row-reverse" : ""}`}>
                          <span className="text-xs font-semibold text-gray-700">{msg.sender.name}</span>
                          <span className={`text-xs ${levelColors[msg.sender.level] || "text-ash"}`}>
                            {msg.sender.level}
                          </span>
                        </div>
                      )}

                      {/* Reply preview */}
                      {msg.replyTo && (
                        <div className={`text-xs bg-gray-100 border-l-2 border-violet-400 px-2 py-1 rounded mb-1 text-graphite ${isOwn ? "text-right" : ""}`}>
                          <span className="font-medium">{msg.replyTo.sender.name}</span>: {msg.replyTo.content.slice(0, 60)}
                        </div>
                      )}

                      {/* Bubble */}
                      <div className={`relative px-3 py-2 rounded-2xl text-sm shadow-sm ${
                        isOwn
                          ? "bg-violet-600 text-white rounded-tr-sm"
                          : "bg-warm-white border border-gray-200 text-gray-900 rounded-tl-sm"
                      } ${msg.isDeleted ? "opacity-50 italic" : ""}`}>
                        {msg.content}
                        <span className={`text-xs ml-2 ${isOwn ? "text-violet-200" : "text-ash"}`}>
                          {new Date(msg.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                        </span>

                        {/* Action buttons (hover) */}
                        {!msg.isDeleted && (
                          <div className={`absolute top-0 ${isOwn ? "right-full mr-1" : "left-full ml-1"} hidden group-hover:flex items-center gap-1`}>
                            <button
                              onClick={() => setShowEmoji(showEmoji === msg.id ? null : msg.id)}
                              className="p-1 bg-warm-white border border-gray-200 rounded-full shadow-sm hover:bg-cream"
                              aria-label="Réagir avec un emoji"
                              title="Réagir avec un emoji"
                            >
                              <Smile className="w-3 h-3 text-graphite" />
                            </button>
                            <button
                              onClick={() => setReplyTo(msg)}
                              className="p-1 bg-warm-white border border-gray-200 rounded-full shadow-sm hover:bg-cream"
                              aria-label="Répondre au message"
                              title="Répondre au message"
                            >
                              <Reply className="w-3 h-3 text-graphite" />
                            </button>
                            {isOwn && (
                              <button
                                onClick={() => deleteMessage(msg.id)}
                                className="p-1 bg-warm-white border border-gray-200 rounded-full shadow-sm hover:bg-error/10"
                                aria-label="Supprimer le message"
                                title="Supprimer le message"
                              >
                                <Trash2 className="w-3 h-3 text-red-400" />
                              </button>
                            )}
                          </div>
                        )}

                        {/* Emoji picker */}
                        {showEmoji === msg.id && (
                          <div className="absolute bottom-full mb-1 bg-warm-white border border-gray-200 rounded-xl shadow-lg p-2 flex gap-1 z-10">
                            {EMOJIS.map((e) => (
                              <button key={e} onClick={() => react(msg.id, e)} className="text-lg hover:scale-125 transition-transform">
                                {e}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Reactions */}
                      {Object.entries(reactions).length > 0 && (
                        <div className="flex gap-1 mt-0.5 flex-wrap">
                          {Object.entries(reactions).map(([emoji, count]) => (
                            <button
                              key={emoji}
                              onClick={() => react(msg.id, emoji)}
                              className="flex items-center gap-0.5 bg-warm-white border border-gray-200 rounded-full px-1.5 py-0.5 text-xs shadow-sm hover:bg-cream"
                            >
                              <span>{emoji}</span>
                              <span className="text-gray-600">{count}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input area */}
          {selectedTontine && (
            <div className="border-t border-gray-200 p-3">
              {replyTo && (
                <div className="flex items-center justify-between bg-violet-50 border border-violet-200 rounded-lg px-3 py-1.5 mb-2 text-sm">
                  <span className="text-violet-700">
                    Réponse à <strong>{replyTo.sender.name}</strong>: {replyTo.content.slice(0, 50)}
                  </span>
                  <button
                    onClick={() => setReplyTo(null)}
                    className="text-violet-400 hover:text-violet-600 ml-2"
                    aria-label="Annuler la réponse"
                    title="Annuler la réponse"
                  >
                    ✕
                  </button>
                </div>
              )}
              <div className="flex items-end gap-2">
                <div className="flex-1 bg-gray-100 rounded-2xl px-4 py-2.5">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    placeholder="Écrire un message..."
                    className="w-full bg-transparent text-sm text-gray-900 placeholder-gray-400 resize-none outline-none max-h-24"
                    rows={1}
                  />
                </div>
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || sending}
                  className="w-10 h-10 bg-violet-600 hover:bg-violet-700 text-white rounded-full flex items-center justify-center disabled:opacity-50 transition-colors flex-shrink-0"
                  aria-label="Envoyer le message"
                  title="Envoyer le message"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create channel modal */}
      {showChannelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-warm-white rounded-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Créer un canal</h3>
            <input
              type="text"
              value={newChannelName}
              onChange={(e) => setNewChannelName(e.target.value)}
              placeholder="Nom du canal (ex: Trésorerie)"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-4 outline-none focus:ring-2 focus:ring-violet-500"
            />
            <div className="flex gap-2">
              <button onClick={() => setShowChannelModal(false)} className="flex-1 border border-gray-300 rounded-lg py-2 text-sm hover:bg-cream">
                Annuler
              </button>
              <button onClick={createChannel} className="flex-1 bg-violet-600 text-white rounded-lg py-2 text-sm hover:bg-violet-700">
                Créer
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
