"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Bot, Send, Loader2, Lightbulb, RefreshCw, User, Sparkles, TrendingUp, Shield } from "lucide-react";

interface Message {
  role: "USER" | "ASSISTANT";
  content: string;
}

const QUICK_QUESTIONS = [
  "Quel est mon solde actuel ?",
  "Comment améliorer mon score ?",
  "Combien puis-je emprunter ?",
  "Donnez-moi des conseils d'épargne",
  "Quelles sont mes cotisations en retard ?",
  "Comment atteindre le niveau Leader ?",
];

function MarkdownText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <span>
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i}>{part.slice(2, -2)}</strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}

export default function ConseilsPage() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [advice, setAdvice] = useState<string[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/ai/advice")
      .then((r) => r.json())
      .then((data) => {
        setAdvice(data.advice || []);
        setMessages([
          {
            role: "ASSISTANT",
            content: `Bonjour ${session?.user?.name?.split(" ")[0] || ""} 👋 Je suis votre conseiller financier Tchoua. Je peux vous aider à comprendre votre situation dans vos tontines, améliorer votre score, planifier votre épargne, et bien plus.\n\nPosez-moi une question ou choisissez un sujet ci-dessous !`,
          },
        ]);
      });
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput("");
    const newMessages: Message[] = [...messages, { role: "USER", content: msg }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch("/api/ai/advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, conversationId }),
      });
      const data = await res.json();
      setMessages([...newMessages, { role: "ASSISTANT", content: data.reply }]);
      if (data.conversationId) setConversationId(data.conversationId);
      if (data.advice) setAdvice(data.advice);
    } catch {
      setMessages([...newMessages, { role: "ASSISTANT", content: "Désolé, une erreur s'est produite. Réessayez." }]);
    }
    setLoading(false);
  };

  const resetConversation = () => {
    setMessages([{
      role: "ASSISTANT",
      content: "Nouvelle conversation démarrée. Comment puis-je vous aider ?",
    }]);
    setConversationId(null);
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat */}
          <div className="lg:col-span-2 flex flex-col h-[calc(100vh-8rem)]">
            {/* Header */}
            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-t-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-white font-semibold">Conseiller Financier Tchoua</div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-violet-200 text-xs">IA locale · Données privées</span>
                  </div>
                </div>
              </div>
              <button onClick={resetConversation} className="text-white/70 hover:text-white transition-colors">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto bg-cream p-4 space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === "USER" ? "flex-row-reverse" : ""}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.role === "ASSISTANT" ? "bg-violet-600" : "bg-gray-300"
                  }`}>
                    {msg.role === "ASSISTANT" ? (
                      <Bot className="w-4 h-4 text-white" />
                    ) : (
                      <User className="w-4 h-4 text-gray-600" />
                    )}
                  </div>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                    msg.role === "USER"
                      ? "bg-violet-600 text-white rounded-tr-sm"
                      : "bg-warm-white shadow-sm border border-stone text-gray-800 rounded-tl-sm"
                  }`}>
                    {msg.content.split("\n").map((line, j) => (
                      <div key={j} className={j > 0 ? "mt-1" : ""}>
                        {line.startsWith("•") ? (
                          <div className="flex gap-2">
                            <span>{line[0]}</span>
                            <MarkdownText text={line.slice(1).trim()} />
                          </div>
                        ) : (
                          <MarkdownText text={line} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-warm-white shadow-sm border border-stone rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Quick questions */}
            <div className="bg-cream border-t border-gray-200 px-4 py-2 flex gap-2 overflow-x-auto">
              {QUICK_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="whitespace-nowrap text-xs bg-warm-white border border-gray-200 rounded-full px-3 py-1.5 text-gray-600 hover:border-violet-400 hover:text-violet-600 transition-colors flex-shrink-0"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="bg-warm-white rounded-b-2xl border-t border-gray-200 p-3">
              <div className="flex items-end gap-2">
                <div className="flex-1 bg-gray-100 rounded-2xl px-4 py-2.5">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    placeholder="Posez votre question financière..."
                    className="w-full bg-transparent text-sm text-gray-900 placeholder-gray-400 resize-none outline-none max-h-24"
                    rows={1}
                  />
                </div>
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || loading}
                  className="w-10 h-10 bg-violet-600 hover:bg-violet-700 text-white rounded-full flex items-center justify-center disabled:opacity-50 transition-colors flex-shrink-0"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar: Advice cards */}
          <div className="space-y-4">
            <div>
              <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-gold" /> Conseils personnalisés
              </h2>
              {advice.length === 0 ? (
                <div className="bg-warm-white rounded-xl p-4 border border-stone text-sm text-ash">
                  Chargement des conseils...
                </div>
              ) : (
                <div className="space-y-3">
                  {advice.map((tip, i) => (
                    <div key={i} className="bg-warm-white rounded-xl p-4 shadow-sm border border-stone">
                      <p className="text-sm text-gray-700 leading-relaxed">{tip}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Features */}
            <div className="bg-gradient-to-br from-violet-50 to-indigo-50 rounded-xl p-4 border border-violet-100">
              <h3 className="font-semibold text-gray-900 mb-3 text-sm">Ce que je peux faire</h3>
              <div className="space-y-2">
                {[
                  { icon: TrendingUp, text: "Analyser votre scoring et progression" },
                  { icon: Lightbulb, text: "Conseils épargne personnalisés" },
                  { icon: Shield, text: "Alertes sur vos risques financiers" },
                  { icon: Bot, text: "Simuler des scénarios de prêts" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-2 text-xs text-gray-600">
                    <Icon className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" />
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-green-50 rounded-xl p-4 border border-green-100">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-green-600" />
                <span className="text-sm font-semibold text-green-800">Vie privée garantie</span>
              </div>
              <p className="text-xs text-green-700">
                Vos données financières ne quittent jamais le serveur Tchoua. L'IA fonctionne localement, sans envoi vers des services tiers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
