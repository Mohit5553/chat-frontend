import { useEffect, useRef, useState } from "react";
import { api, API_BASE } from "../api/client.js";
import { Paperclip, FileText, Image as ImageIcon } from "lucide-react";

function getDeviceIcon(deviceInfo = "") {
  if (/mobile|android|iphone/i.test(deviceInfo)) return "📱";
  if (/tablet|ipad/i.test(deviceInfo)) return "📟";
  return "💻";
}

function getInitials(name = "") {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "?";
}

function getAvatarColor(name = "") {
  const colors = ["bg-indigo-500", "bg-violet-500", "bg-pink-500", "bg-rose-500", "bg-orange-500", "bg-amber-500", "bg-teal-500"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export default function ChatPanel({ session, messages, onSend, onTyping, isTyping, disabled }) {
  const [draft, setDraft] = useState("");
  const viewportRef = useRef(null);
  const fileInputRef = useRef(null);
  const [shortcuts, setShortcuts] = useState([]);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [shortcutQuery, setShortcutQuery] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!disabled) {
      api("/api/canned-responses").then(setShortcuts).catch(() => {});
    }
  }, [disabled]);

  if (!session) {
    return (
      <section className="bg-white rounded-3xl border border-dashed border-slate-200 flex flex-col items-center justify-center p-20 text-center space-y-4 min-h-[500px] animate-in fade-in zoom-in duration-500 shadow-inner">
        <div className="w-16 h-16 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center text-3xl shadow-sm grayscale opacity-50">💬</div>
        <div className="space-y-1">
          <h3 className="heading-md text-slate-400">No Session Selected</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Select a session from the queue to start.</p>
        </div>
      </section>
    );
  }

  function submit(event) {
    event.preventDefault();
    const value = draft.trim();
    if (!value) return;
    onSend({ text: value });
    setDraft("");
    setShowShortcuts(false);
    setShortcutQuery("");
  }
  
  async function handleFileUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("attachment", file);

    try {
      const token = localStorage.getItem("dashboard_token");
      const res = await fetch(`${API_BASE}/api/chat/upload`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });
      
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error("Server returned non-JSON response");
      }
      if (!res.ok) throw new Error(data.message || "Upload failed");
      
      onSend({ text: draft || "Sent an attachment", attachmentUrl: data.url, attachmentType: data.attachmentType });
      setDraft("");
    } catch (err) {
      alert("Failed to upload file: " + err.message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function useShortcut(content) {
    setDraft(content);
    setShowShortcuts(false);
    setShortcutQuery("");
    onTyping(true);
  }

  const filteredShortcuts = shortcutQuery
    ? shortcuts.filter(s =>
        s.shortcut.toLowerCase().includes(shortcutQuery.toLowerCase()) ||
        s.content.toLowerCase().includes(shortcutQuery.toLowerCase())
      )
    : shortcuts;

  const visitor = session.visitorId;
  const visitorName = visitor?.name || "Anonymous";
  const avatarColor = getAvatarColor(visitorName);

  return (
    <section className="bg-white flex flex-col h-[650px] rounded-3xl border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.05)] overflow-hidden relative animate-in fade-in slide-in-from-bottom-2 duration-500">

      {/* ── Header with Visitor Intelligence ── */}
      <div className="px-8 py-5 border-b border-slate-100 shrink-0 bg-white sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl ${avatarColor} flex items-center justify-center text-white font-black text-sm shadow-lg select-none`}>
              {getInitials(visitorName)}
            </div>
            <div>
              <strong className="text-xs font-black text-slate-950 tracking-tight block uppercase leading-none mb-0.5">
                {visitorName}
              </strong>
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                {session.websiteId?.websiteName || session.sessionId}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
              session.status === "queued"
                ? "bg-amber-50 text-amber-600 border border-amber-100"
                : "bg-emerald-50 text-emerald-600 border border-emerald-100"
            }`}>
              {session.status}
            </span>
            <div className={`w-2 h-2 rounded-full ${
              session.status === "queued"
                ? "bg-amber-400 animate-pulse"
                : "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]"
            }`} />
          </div>
        </div>

        {/* Visitor Intel Bar */}
        {(visitor?.city || visitor?.country || visitor?.deviceInfo || visitor?.email) && (
          <div className="flex flex-wrap items-center gap-4 mt-3 pt-3 border-t border-slate-50">
            {visitor?.country && (
              <span className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                🌍 {visitor.city ? `${visitor.city}, ` : ""}{visitor.country}
              </span>
            )}
            {visitor?.deviceInfo && (
              <span className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                {getDeviceIcon(visitor.deviceInfo)}{" "}
                {/mobile|android|iphone/i.test(visitor.deviceInfo) ? "Mobile" : /tablet|ipad/i.test(visitor.deviceInfo) ? "Tablet" : "Desktop"}
              </span>
            )}
            {visitor?.email && (
              <span className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate max-w-[180px]">
                ✉️ {visitor.email}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto p-8 space-y-4 bg-slate-50/20" ref={viewportRef}>
        {messages.map((message) => (
          <div
            key={message._id || `${message.createdAt}-${message.message}`}
            className={`flex flex-col ${message.sender === "agent" ? "items-end" : "items-start"}`}
          >
            {message.sender !== "agent" && (
              <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1 px-1">
                {message.senderName || "Visitor"}
              </span>
            )}
            <div className={`max-w-[75%] px-5 py-3 rounded-2xl text-[12px] font-medium leading-relaxed shadow-sm hover:shadow-md transition-shadow ${
              message.sender === "agent"
                ? "bg-slate-950 text-white rounded-br-sm border border-slate-800"
                : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm"
            }`}>
              
              {message.attachmentUrl && message.attachmentType === "image" && (
                <img src={message.attachmentUrl} alt="Attachment" className="max-w-full rounded-xl mb-3 border border-white/20" />
              )}
              {message.attachmentUrl && message.attachmentType !== "image" && (
                <a href={message.attachmentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-xl mb-3 hover:bg-white/20 transition-all font-black text-[10px] tracking-widest uppercase">
                  <FileText size={14} />
                  Download Attached File
                </a>
              )}
              
              {message.message}
            </div>
            <div className="flex items-center gap-1.5 mt-1 px-1">
              <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">
                {message.createdAt
                  ? new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                  : ""}
              </span>
              {message.sender === "agent" && (
                <span className={`text-[9px] font-black ${message.readAt ? 'text-emerald-500' : 'text-slate-200'}`}>
                  {message.readAt ? '✓✓' : '✓'}
                </span>
              )}
            </div>
          </div>
        ))}

        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full py-16 space-y-3 opacity-40">
            <div className="text-3xl">💬</div>
            <p className="small-label">No messages yet. Say hello!</p>
          </div>
        )}

        {isTyping && (
          <div className="flex items-center gap-2 px-1 animate-pulse">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce delay-0"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce delay-150"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce delay-300"></span>
            </div>
            <span className="text-[10px] font-black text-indigo-500/80 uppercase tracking-widest">Visitor is typing</span>
          </div>
        )}
      </div>

      {/* ── Canned Response Shortcut Menu ── */}
      {showShortcuts && (
        <div className="absolute bottom-24 left-6 right-6 bg-white border border-slate-200 rounded-2xl shadow-[0_32px_64px_rgba(0,0,0,0.15)] p-4 z-20 animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-50">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Canned Responses</span>
            <span className="text-[8px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded font-bold">Esc to close</span>
          </div>
          <input
            autoFocus
            value={shortcutQuery}
            onChange={e => setShortcutQuery(e.target.value)}
            onKeyDown={e => { if (e.key === "Escape") { setShowShortcuts(false); setShortcutQuery(""); } }}
            placeholder="Search shortcuts…"
            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-[11px] font-bold mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-300 transition-all"
          />
          <div className="max-h-48 overflow-y-auto space-y-1.5 custom-scrollbar">
            {filteredShortcuts.length > 0 ? filteredShortcuts.map(s => (
              <button
                key={s._id}
                type="button"
                onClick={() => useShortcut(s.content)}
                className="w-full text-left px-4 py-3 hover:bg-slate-50 rounded-xl transition-all group flex items-start gap-4 border border-transparent hover:border-slate-100"
              >
                <span className="text-[10px] font-black text-white bg-slate-950 px-2 py-1 rounded-lg shrink-0 group-hover:bg-indigo-600 transition-colors uppercase tracking-widest">
                  /{s.shortcut}
                </span>
                <span className="text-xs text-slate-600 truncate font-medium">{s.content}</span>
              </button>
            )) : (
              <p className="text-[10px] text-slate-400 text-center py-4 font-bold uppercase tracking-widest">No matches found</p>
            )}
          </div>
        </div>
      )}

      {/* ── Input Form ── */}
      <form
        className="p-6 bg-white border-t border-slate-100 flex gap-4 shrink-0 shadow-[0_-10px_30px_rgba(0,0,0,0.02)]"
        onSubmit={submit}
      >
        <div className="relative flex-1 flex gap-3">
          <button
            type="button"
            onClick={() => { setShowShortcuts(!showShortcuts); setShortcutQuery(""); }}
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 shrink-0 ${
              showShortcuts
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                : "bg-slate-50 text-slate-400 border border-slate-100 hover:bg-slate-100 hover:text-slate-600"
            }`}
            title="Canned Responses"
          >
            <span className="text-lg font-black italic">/</span>
          </button>
          
          <button
            type="button"
            className="w-12 h-12 rounded-xl flex items-center justify-center bg-slate-50 text-slate-400 border border-slate-100 hover:bg-slate-100 hover:text-slate-600 transition-all shrink-0 cursor-pointer relative"
            title="Attach file"
            disabled={disabled || isUploading}
          >
            {isUploading ? <span className="animate-spin text-lg">⏳</span> : <Paperclip size={18} />}
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileUpload} 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={disabled || isUploading}
              accept="image/*,application/pdf"
            />
          </button>

          <input
            value={draft}
            onChange={(event) => {
              const val = event.target.value;
              setDraft(val);
              onTyping(val.trim().length > 0);
              if (val.startsWith("/")) setShowShortcuts(true);
              else if (!val.startsWith("/")) setShowShortcuts(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") { setShowShortcuts(false); setShortcutQuery(""); }
            }}
            className="flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all placeholder:text-slate-300"
            placeholder={disabled ? "Access restricted…" : "Compose response… (/ for shortcuts)"}
            disabled={disabled || isUploading}
          />
        </div>
        <button
          type="submit"
          disabled={disabled || !draft.trim() || isUploading}
          className="bg-slate-950 hover:bg-black disabled:bg-slate-100 disabled:text-slate-300 text-white px-8 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl shadow-slate-200 disabled:shadow-none active:scale-95"
        >
          Send
        </button>
      </form>
    </section>
  );
}
