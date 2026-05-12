"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, Check, Loader2 } from "lucide-react";

interface AssociationNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
}

interface NotificationsBellProps {
  associationId: string;
}

const TYPE_COLORS: Record<string, string> = {
  INFO: "bg-blue-50 text-blue-700 border-blue-200",
  WARNING: "bg-yellow-50 text-yellow-700 border-yellow-200",
  ACTION_REQUIRED: "bg-orange-50 text-orange-700 border-orange-200",
  SUCCESS: "bg-green-50 text-green-700 border-green-200",
  ERROR: "bg-red-50 text-red-700 border-red-200",
};

export default function NotificationsBell({ associationId }: NotificationsBellProps) {
  const [notifications, setNotifications] = useState<AssociationNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [marking, setMarking] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [associationId]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function fetchNotifications() {
    try {
      const res = await fetch(`/api/associations/${associationId}/notifications?limit=5`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {
      // silent
    }
  }

  async function markAllAsRead() {
    const unreadIds = notifications.filter((n) => !n.isRead).map((n) => n.id);
    if (unreadIds.length === 0) return;

    setMarking(true);
    try {
      const res = await fetch(`/api/associations/${associationId}/notifications`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: unreadIds }),
      });
      if (res.ok) {
        fetchNotifications();
      }
    } catch {
      // silent
    } finally {
      setMarking(false);
    }
  }

  const latest = notifications.slice(0, 5);

  return (
    <div className="relative" ref={dropdownRef} data-testid="notifications-bell">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative inline-flex items-center justify-center w-10 h-10 rounded-full hover:bg-[#0d3d28]/10 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-[#0d3d28]" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-[#e68a00] rounded-full">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-lg border border-gray-100 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="text-sm font-semibold text-[#0d3d28]">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                disabled={marking}
                className="inline-flex items-center gap-1 text-xs font-medium text-[#0d3d28] hover:underline disabled:opacity-50"
              >
                {marking ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                Tout marquer comme lu
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {latest.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-400 text-sm">
                Aucune notification
              </div>
            ) : (
              latest.map((notif) => (
                <div
                  key={notif.id}
                  className={`px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-[#faf9f6] transition-colors ${
                    !notif.isRead ? "bg-[#faf9f6]/50" : ""
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span
                      className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${
                        !notif.isRead ? "bg-[#e68a00]" : "bg-gray-200"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 leading-tight">{notif.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium border ${
                            TYPE_COLORS[notif.type] || TYPE_COLORS.INFO
                          }`}
                        >
                          {notif.type}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {new Date(notif.createdAt).toLocaleDateString("fr-FR", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      {notif.link && (
                        <a
                          href={notif.link}
                          className="text-xs text-[#0d3d28] hover:underline mt-1 inline-block"
                        >
                          Voir plus
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
