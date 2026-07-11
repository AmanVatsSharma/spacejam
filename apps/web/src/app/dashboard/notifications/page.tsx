"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  useNotifications,
  useNotificationStats,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
  useSendNotification,
  type NotificationItem,
  type NotificationTypeT,
} from "@/hooks/use-notifications";

// ── Icons ────────────────────────────────────────────────
const Icons = {
  search: (
    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  chevronDown: (
    <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  ),
  bell: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  ),
  check: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ),
  trash: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
    </svg>
  ),
};

const TYPE_META: Record<NotificationTypeT, { label: string; dot: string }> = {
  BOOKING: { label: "Booking", dot: "bg-blue-500" },
  PAYMENT: { label: "Payment", dot: "bg-emerald-500" },
  DEPOSIT: { label: "Deposit", dot: "bg-amber-500" },
  LEAD: { label: "Lead", dot: "bg-violet-500" },
  REQUEST: { label: "Request", dot: "bg-cyan-500" },
  EVENT: { label: "Event", dot: "bg-pink-500" },
  SYSTEM: { label: "System", dot: "bg-gray-400" },
};

const TYPE_OPTIONS: { value: "" | NotificationTypeT; label: string }[] = [
  { value: "", label: "All Types" },
  { value: "BOOKING", label: "Booking" },
  { value: "PAYMENT", label: "Payment" },
  { value: "DEPOSIT", label: "Deposit" },
  { value: "LEAD", label: "Lead" },
  { value: "REQUEST", label: "Request" },
  { value: "EVENT", label: "Event" },
  { value: "SYSTEM", label: "System" },
];

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"" | NotificationTypeT>("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);

  const filters = useMemo(
    () => ({
      userId: user?.id,
      type: typeFilter || undefined,
      unreadOnly: unreadOnly || undefined,
      limit: 100,
    }),
    [user?.id, typeFilter, unreadOnly],
  );

  const { notifications, loading, refetch } = useNotifications(filters);
  const { stats } = useNotificationStats(user?.id);
  const { markRead } = useMarkNotificationRead();
  const { markAllRead, updating: markingAll } = useMarkAllNotificationsRead();
  const { deleteNotification } = useDeleteNotification();

  // Client-side search layered on top of server filters.
  const visible = useMemo(() => {
    if (!searchQuery.trim()) return notifications;
    const q = searchQuery.toLowerCase();
    return notifications.filter(
      (n: NotificationItem) =>
        n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q),
    );
  }, [notifications, searchQuery]);

  async function handleMarkAll() {
    const n = await markAllRead(user?.id);
    toast.success(n > 0 ? `Marked ${n} notification${n === 1 ? "" : "s"} as read` : "Nothing to mark as read");
  }

  async function handleRowClick(n: NotificationItem) {
    if (!n.read) {
      await markRead(n.id, true);
    }
    if (n.actionUrl) router.push(n.actionUrl);
  }

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    const ok = await deleteNotification(id);
    if (ok) toast.success("Notification deleted");
    else toast.error("Could not delete notification");
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1000px] mx-auto pb-10 px-4 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 bg-white p-4 sm:p-6 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100">
        <div>
          <h1 className="text-[24px] sm:text-[28px] font-bold text-[#101828] leading-tight">Notifications</h1>
          <p className="text-xs sm:text-sm text-[#667085] mt-1">
            Track leads, bookings, occupancy, maintenance tasks, billing, and daily center operations in real time.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => setShowSendDialog(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#FF6A2F] text-white rounded-lg text-sm font-semibold hover:bg-[#E55A20] transition-colors shadow-sm w-full sm:w-auto"
          >
            {Icons.bell} Send Notification
          </button>
          <button
            onClick={handleMarkAll}
            disabled={markingAll || stats.unread === 0}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-[#344054] rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors shadow-sm w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {Icons.check} Mark all as read{stats.unread > 0 ? ` (${stats.unread})` : ""}
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex items-center gap-3 flex-wrap bg-white p-4 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100">
        <div className="relative flex-1 min-w-full sm:min-w-[200px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2">{Icons.search}</span>
          <input
            type="text"
            placeholder="Search title or message"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 sm:py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#FF6A2F] focus:border-transparent bg-white"
          />
        </div>

        <div className="flex flex-wrap gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-auto">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as "" | NotificationTypeT)}
              className="appearance-none w-full pl-3 pr-8 py-2.5 sm:py-2 border border-gray-200 rounded-lg text-[13px] text-[#344054] font-medium bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#FF6A2F] cursor-pointer"
            >
              {TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">{Icons.chevronDown}</span>
          </div>
          <button
            onClick={() => setUnreadOnly((v) => !v)}
            className={`px-4 py-2.5 rounded-lg text-[13px] font-medium border transition-colors ${
              unreadOnly
                ? "bg-[#FF6A2F] text-white border-[#FF6A2F]"
                : "bg-white text-[#344054] border-gray-200 hover:bg-gray-50"
            }`}
          >
            {unreadOnly ? "Showing unread" : "Unread only"}
          </button>
          <button
            onClick={() => { setSearchQuery(""); setTypeFilter(""); setUnreadOnly(false); refetch(); }}
            className="px-4 py-2.5 bg-white text-[#344054] border border-gray-200 rounded-lg text-[13px] font-medium hover:bg-gray-50 transition-colors"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Summary card */}
      <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#FFF2EA] flex items-center justify-center text-[#FF6A2F] shrink-0">
            {Icons.bell}
          </div>
          <div>
            <p className="text-[14px] font-semibold text-[#101828]">
              {stats.unread} unread / {stats.total} total
            </p>
            <p className="text-[12px] sm:text-[13px] text-[#667085]">
              {stats.unread > 0 ? "You have items requiring attention." : "You are all caught up."}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-[12px]">
          {(["BOOKING", "PAYMENT", "DEPOSIT", "LEAD", "REQUEST", "EVENT"] as NotificationTypeT[]).map((t) => (
            <span key={t} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 rounded-md text-[#475467]">
              <span className={`w-1.5 h-1.5 rounded-full ${TYPE_META[t].dot}`} />
              {TYPE_META[t].label}: {(stats as any)[t.toLowerCase()] ?? 0}
            </span>
          ))}
        </div>
      </div>

      {/* Feed / states */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 flex items-center justify-center text-[#667085] text-sm">
          Loading notifications…
        </div>
      ) : visible.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100 p-10 sm:p-16 flex flex-col items-center justify-center text-center gap-3">
          <div className="w-14 h-14 rounded-full bg-[#FFF2EA] flex items-center justify-center text-[#FF6A2F]">
            {Icons.bell}
          </div>
          <h3 className="text-[16px] sm:text-[18px] font-semibold text-[#101828]">
            {unreadOnly || typeFilter || searchQuery ? "No matching notifications" : "No notifications yet"}
          </h3>
          <p className="text-[13px] sm:text-[14px] text-[#667085] max-w-[420px]">
            {unreadOnly || typeFilter || searchQuery
              ? "Try adjusting your filters or clearing the search."
              : "Notifications about bookings, payments, deposits, leads and events will appear here."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {visible.map((n: NotificationItem) => {
            const meta = TYPE_META[n.type] ?? TYPE_META.SYSTEM;
            return (
              <button
                key={n.id}
                onClick={() => handleRowClick(n)}
                className={`text-left bg-white rounded-xl border p-4 flex items-start gap-3 transition-colors hover:bg-gray-50/60 ${
                  n.read ? "border-gray-100" : "border-[#FF6A2F]/30 bg-[#FFF8F4]"
                }`}
              >
                <div className="w-9 h-9 rounded-full bg-[#FFF2EA] flex items-center justify-center text-[#FF6A2F] shrink-0">
                  {Icons.bell}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                    <span className="text-[11px] uppercase tracking-wide text-[#667085] font-semibold">{meta.label}</span>
                    {!n.read && (
                      <span className="text-[10px] font-bold text-white bg-[#FF6A2F] rounded px-1.5 py-0.5">NEW</span>
                    )}
                    <span className="text-[11px] text-[#98A2B3] ml-auto">{timeAgo(n.createdAt)}</span>
                  </div>
                  <p className="text-[14px] font-semibold text-[#101828] mt-1 truncate">{n.title}</p>
                  <p className="text-[13px] text-[#475467] mt-0.5 line-clamp-2">{n.message}</p>
                </div>
                <button
                  onClick={(e) => handleDelete(e, n.id)}
                  title="Delete"
                  className="text-gray-300 hover:text-red-500 transition-colors p-1 shrink-0"
                >
                  {Icons.trash}
                </button>
              </button>
            );
          })}
        </div>
      )}

      <SendNotificationDialog open={showSendDialog} onClose={() => setShowSendDialog(false)} />
    </div>
  );
}

/* ----- Send Notification Dialog (wired to sendNotification mutation) ----- */
function SendNotificationDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { send, sending } = useSendNotification();

  const [sendTo, setSendTo] = useState("Selective Customer");
  const [template, setTemplate] = useState("Booking Confirmation");
  const [title, setTitle] = useState("Booking Confirmation");
  const [message, setMessage] = useState(
    "Hi {{name}},\n\nGreat news! Your booking at {{center_name}} has been confirmed.\n\nBooking Details:\n• Booking ID: {{booking_id}}\n• Date: {{date}}"
  );

  const variables = ["{{name}}", "{{date}}", "{{time}}", "{{center_name}}", "{{booking_id}}", "{{amount}}"];

  if (!open) return null;

  async function handleSend() {
    if (!message.trim() || !title.trim()) {
      toast.error("Title and message are required");
      return;
    }
    try {
      const n = await send({
        sendTo,
        title,
        message,
        type: "SYSTEM",
        priority: "MEDIUM",
        template,
      });
      if (n > 0) {
        toast.success(`Notification sent to ${n} recipient${n === 1 ? "" : "s"}`);
        onClose();
      } else {
        toast.error("No recipients matched. Provide a customer or center to broadcast to.");
      }
    } catch {
      toast.error("Failed to send notification");
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-[600px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="send-notification-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#FF6A2F] flex items-center justify-center text-white shadow-sm shrink-0">
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <div className="flex flex-col">
              <h2 id="send-notification-title" className="text-[16px] sm:text-[18px] font-bold text-gray-900 leading-tight">
                Notification
              </h2>
              <p className="text-[12px] sm:text-[14px] text-gray-500 mt-0.5">Send Custom Notification to Client, Center etc</p>
            </div>
          </div>
          <button
            type="button"
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 self-start"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        {/* Body */}
        <div className="p-4 sm:p-6 flex flex-col gap-5 sm:gap-6 max-h-[70vh] overflow-y-auto">
          <div className="flex flex-col gap-2">
            <label className="text-[13px] sm:text-[14px] font-semibold text-gray-700">Send To</label>
            <input
              type="text"
              value={sendTo}
              onChange={(e) => setSendTo(e.target.value)}
              className="w-full px-4 py-2.5 sm:py-3 bg-white border border-gray-200 rounded-xl text-[13px] sm:text-[14px] text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#FF6A2F] focus:border-transparent transition-all"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[13px] sm:text-[14px] font-semibold text-gray-700">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Notification title"
              className="w-full px-4 py-2.5 sm:py-3 bg-white border border-gray-200 rounded-xl text-[13px] sm:text-[14px] text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#FF6A2F] focus:border-transparent transition-all"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[13px] sm:text-[14px] font-semibold text-gray-700">Template Name</label>
            <input
              type="text"
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              className="w-full px-4 py-2.5 sm:py-3 bg-white border border-gray-200 rounded-xl text-[13px] sm:text-[14px] text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#FF6A2F] focus:border-transparent transition-all"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[13px] sm:text-[14px] font-semibold text-gray-700">Message Body</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              className="w-full px-4 py-3 bg-[#F9FAFB] border border-gray-200 rounded-xl text-[13px] sm:text-[14px] text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#FF6A2F] focus:border-transparent transition-all resize-none"
            />
            <div className="mt-2 flex flex-col gap-2">
              <span className="text-[12px] sm:text-[13px] text-gray-500">Insert variables:</span>
              <div className="flex flex-wrap gap-2">
                {variables.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setMessage((prev) => prev + v)}
                    className="px-2.5 sm:px-3 py-1.5 bg-[#FFF2EA] text-[#FF6A2F] rounded-lg text-[12px] sm:text-[13px] font-mono hover:bg-[#FFE4D6] transition-colors"
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="px-4 sm:px-6 py-4 sm:py-5 border-t border-gray-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-3 text-[14px] font-semibold text-[#344054] rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={sending}
            className="flex justify-center items-center gap-2 px-6 py-3 bg-[#FF6A2F] text-white text-[14px] sm:text-[15px] font-semibold rounded-xl hover:bg-[#E55A20] transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            {sending ? "Sending…" : "Send Notification"}
          </button>
        </footer>
      </div>
    </div>
  );
}
