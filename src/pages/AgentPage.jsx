import { useEffect, useMemo, useState, useRef } from "react";
import { io } from "socket.io-client";
import { useSearchParams } from "react-router-dom";
import { Ticket, Link, Copy, CheckCheck, X, History, AlertCircle } from "lucide-react";
import Layout from "../components/Layout.jsx";
import ChatPanel from "../components/ChatPanel.jsx";
import StatCard from "../components/StatCard.jsx";
import { api, API_BASE } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { NotificationService } from "../utils/notifications.js";

function dedupeMessages(messages) {
  const seen = new Set();
  return messages.filter((message) => {
    const key = message._id || `${message.createdAt}-${message.sender}-${message.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default function AgentPage() {
  const { user, setUser } = useAuth();
  const [searchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "dashboard";
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "info" });
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [sessionSearch, setSessionSearch] = useState("");
  const [typingSessions, setTypingSessions] = useState({});
  const [ticketModal, setTicketModal] = useState(false);
  const [ticketForm, setTicketForm] = useState({ subject: "", priority: "medium" });
  const [ticketResult, setTicketResult] = useState(null);
  const [ticketSaving, setTicketSaving] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  
  const [visitorHistory, setVisitorHistory] = useState(null);
  const [historyModal, setHistoryModal] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [sessionTab, setSessionTab] = useState("active");

  const selectedSession = useMemo(() => sessions.find((session) => session.sessionId === selectedSessionId) || null, [sessions, selectedSessionId]);
  const selectedSessionIdRef = useRef(selectedSessionId);

  useEffect(() => {
    selectedSessionIdRef.current = selectedSessionId;
  }, [selectedSessionId]);

  async function loadSessions() {
    try {
      const data = await api("/api/chat/agent/sessions");
      setSessions(data);
      if (!selectedSessionId && data[0]) {
        setSelectedSessionId(data[0].sessionId);
      }
    } catch (err) {
      setToast({ show: true, message: err.message, type: "error" });
    } finally {
      setLoadingSessions(false);
    }
  }

  useEffect(() => {
    loadSessions();
    NotificationService.requestPermission();
  }, []);

  const loadVisitorHistory = async (sessionId) => {
    setLoadingHistory(true);
    try {
      const data = await api(`/api/tickets/visitor-history/${sessionId}`);
      setVisitorHistory(data);
    } catch (err) {
      console.warn("Failed to load visitor history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (!selectedSessionId) {
      setVisitorHistory(null);
      return;
    }
    api(`/api/chat/sessions/${selectedSessionId}/messages`).then(setMessages).catch((err) => setToast({ show: true, message: err.message, type: "error" }));
    loadVisitorHistory(selectedSessionId);
  }, [selectedSessionId]);

  useEffect(() => {
    if (!user) return;

    const nextSocket = io(API_BASE, {
      auth: {
        type: "agent",
        userId: user._id || user.id
      },
      transports: ["websocket"]
    });

    nextSocket.on("connect_error", () => {
      setToast({ show: true, message: "Live connection interrupted. Auto-reconnecting...", type: "error" });
    });

    nextSocket.on("connect", () => {
      setToast({ show: false, message: "", type: "info" });
      setUser(prev => ({ ...prev, isOnline: true }));
    });

    nextSocket.on("chat:new-message", (payload) => {
      loadSessions();
      if (payload.sender === "visitor") {
        NotificationService.notify(`Message from ${payload.sessionId.substring(0, 8)}`, payload.message);
        
        // Mark as read if currently looking at this chat
        if (payload.sessionId === selectedSessionIdRef.current) {
          nextSocket.emit("chat:history:read", { sessionId: payload.sessionId });
        }
        
        // Subtle message sound
        try {
          const ctx = new (window.AudioContext || window.webkitAudioContext)();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = 660;
          gain.gain.setValueAtTime(0.1, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.2);
        } catch (_) {}
      }
      if (payload.sessionId === selectedSessionIdRef.current && payload.sender === "visitor") {
        setMessages((current) => dedupeMessages([...current, payload]));
      }
    });

    nextSocket.on("chat:message", (payload) => {
      if (payload.sessionId === selectedSessionIdRef.current) {
        setMessages((current) => dedupeMessages([...current, payload]));
      }
    });

    nextSocket.on("chat:typing", ({ sessionId, isTyping, sender }) => {
      if (sender === "visitor") {
        setTypingSessions(prev => ({ ...prev, [sessionId]: isTyping }));
      }
    });

    nextSocket.on("chat:read", ({ sessionId }) => {
      if (sessionId === selectedSessionIdRef.current) {
        setMessages(prev => prev.map(m => (!m.readAt ? { ...m, readAt: new Date() } : m)));
      }
    });

    nextSocket.on("chat:assigned", ({ sessionId }) => {
      loadSessions();
      if (!selectedSessionId) {
        setSelectedSessionId(sessionId);
      }
      // Sound notification ping
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
      } catch (_) {}
      NotificationService.notify("New Chat Assigned", "You have a new visitor waiting for support.");
    });

    setSocket(nextSocket);
    return () => nextSocket.close();
  }, [user?._id]);

  useEffect(() => {
    if (socket && selectedSessionId) {
      socket.emit("agent:join-session", { sessionId: selectedSessionId });
      socket.emit("chat:history:read", { sessionId: selectedSessionId });
    }
  }, [socket, selectedSessionId]);

  async function toggleAvailability() {
    const updated = await api("/api/users/availability", {
      method: "PATCH",
      body: JSON.stringify({
        isAvailable: !user.isAvailable
      })
    });

    setUser(updated);
  }

  const [profileForm, setProfileForm] = useState({ name: user?.name || "", email: user?.email || "", password: "" });
  async function updateProfile(event) {
    event.preventDefault();
    try {
      const updatedUser = await api("/api/users/profile", {
         method: "PATCH",
         body: JSON.stringify(profileForm)
      });
      setUser(updatedUser);
      setProfileForm({ ...profileForm, password: "" });
      setToast({ show: true, message: "Profile updated securely.", type: "info" });
    } catch (err) {
      setToast({ show: true, message: err.message, type: "error" });
    }
  }

  function sendMessage(payload) {
    if (!socket || !selectedSessionId) return;
    if (typeof payload === 'string') {
      socket.emit("agent:message", { sessionId: selectedSessionId, message: payload });
    } else {
      socket.emit("agent:message", { 
        sessionId: selectedSessionId, 
        message: payload.text || "Sent an attachment",
        attachmentUrl: payload.attachmentUrl,
        attachmentType: payload.attachmentType
      });
    }
  }

  function sendTyping(isTyping) {
    if (!socket || !selectedSessionId) return;
    socket.emit("agent:typing", { sessionId: selectedSessionId, isTyping });
  }

  function closeChat() {
    if (!socket || !selectedSessionId) return;
    socket.emit("agent:close-session", { sessionId: selectedSessionId });
    setSelectedSessionId("");
    loadSessions();
  }

  async function generateTicket(e) {
    e.preventDefault();
    if (!selectedSession) return;
    setTicketSaving(true);
    try {
      const result = await api("/api/tickets/convert", {
        method: "POST",
        body: JSON.stringify({
          sessionId: selectedSession._id,
          subject: ticketForm.subject || `Support – ${selectedSession.websiteId?.websiteName || 'Chat'}`,
          priority: ticketForm.priority
        })
      });
      setTicketResult(result);
      setTicketForm({ subject: "", priority: "medium" });
      loadSessions();
    } catch (err) {
      setToast({ show: true, message: err.message, type: "error" });
      setTicketModal(false);
    } finally {
      setTicketSaving(false);
    }
  }

  function copyTicketLink() {
    const url = `${window.location.origin}/ticket-status/${ticketResult?.ticketId}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }

  const menuItems = [
    { label: "Performance", href: "/agent" },
    { label: "Active Queue", href: "/agent?tab=chats" },
    { label: "Settings", href: "/agent?tab=settings" }
  ];

  const searchedSessions = sessionSearch
    ? sessions.filter(s =>
        s.websiteId?.websiteName?.toLowerCase().includes(sessionSearch.toLowerCase()) ||
        s.visitorId?.visitorId?.toLowerCase().includes(sessionSearch.toLowerCase())
      )
    : sessions;

  const activeSessions  = searchedSessions.filter(s => s.status === "active" || s.status === "queued");
  const closedSessions  = searchedSessions.filter(s => s.status === "closed");
  // "Trash" = closed sessions older than 7 days
  const trashSessions   = closedSessions.filter(s => new Date() - new Date(s.closedAt || s.updatedAt) > 7 * 86400000);

  const sessionTabMap = { active: activeSessions, closed: closedSessions, trash: trashSessions };
  const visibleSessions = sessionTabMap[sessionTab] ?? activeSessions;

  const SESSION_TABS = [
    { key: "active",  label: "Active",  count: activeSessions.length,  dot: "bg-emerald-500" },
    { key: "closed",  label: "Closed",  count: closedSessions.length,  dot: "bg-slate-400" },
    { key: "trash",   label: "Trash",   count: trashSessions.length,   dot: "bg-red-400" },
  ];

  const content = tab === "chats" ? (
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[700px] animate-in slide-in-from-bottom-4 duration-700">
      <div className="lg:col-span-4 premium-card overflow-hidden flex flex-col p-0 border-none shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <h3 className="heading-md">My Chats</h3>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{sessions.length} total sessions</span>
          </div>
          <button
            type="button"
            onClick={toggleAvailability}
            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] transition-all shadow ${
              user?.isAvailable
                ? "bg-slate-950 text-white hover:bg-black"
                : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200"
            }`}
          >
            {user?.isAvailable ? "Deactivate" : "Activate"}
          </button>
        </div>

        {/* Status Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50/40">
          {SESSION_TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setSessionTab(t.key)}
              className={`flex-1 py-3 flex flex-col items-center gap-0.5 text-[9px] font-black uppercase tracking-widest transition-all border-b-2 ${
                sessionTab === t.key
                  ? "border-indigo-600 text-indigo-600 bg-white"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${t.dot}`} />
                {t.label}
              </span>
              <span className={`text-base font-black leading-none ${ sessionTab === t.key ? "text-indigo-600" : "text-slate-500"}`}>{t.count}</span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="px-4 pt-3 pb-2">
          <input
            value={sessionSearch}
            onChange={e => setSessionSearch(e.target.value)}
            placeholder="Search by name or visitor ID…"
            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-[10px] font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-300 transition-all placeholder:text-slate-300"
          />
        </div>

        {/* Session List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50/30">
          {loadingSessions ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-5 rounded-2xl border border-slate-100 bg-white animate-pulse space-y-2">
                <div className="h-3 bg-slate-100 rounded-lg w-3/4" />
                <div className="h-2 bg-slate-100 rounded-lg w-1/2" />
              </div>
            ))
          ) : visibleSessions.map((session) => (
            <div
              key={session._id}
              onClick={() => setSelectedSessionId(session.sessionId)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                selectedSessionId === session.sessionId
                  ? "bg-white border-indigo-200 shadow-xl translate-x-1"
                  : "bg-white border-slate-100 hover:border-slate-200"
              }`}
            >
              {selectedSessionId === session.sessionId && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600 rounded-l-2xl" />}
              <div className="relative z-10 space-y-1 pl-1">
                <div className="flex items-center justify-between">
                  <strong className={`text-[10px] font-black tracking-wide block uppercase transition-colors ${ selectedSessionId === session.sessionId ? 'text-indigo-600' : 'text-slate-900'}`}>
                    {session.websiteId?.websiteName || "—"}
                  </strong>
                  <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                    session.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                    session.status === 'queued' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                    'bg-slate-50 text-slate-400 border-slate-100'
                  }`}>{session.status}</span>
                </div>
                <span className="text-[9px] text-slate-400 font-bold tracking-widest uppercase block truncate">
                  {session.visitorId?.visitorId}
                </span>
                {session.lastMessagePreview && (
                  <p className="text-[9px] text-slate-400 line-clamp-1 opacity-80">{session.lastMessagePreview}</p>
                )}
                {typingSessions[session.sessionId] && (
                  <p className="text-[9px] text-indigo-500 font-bold uppercase tracking-widest animate-pulse">typing...</p>
                )}
                {(session.status === 'closed') && session.closedAt && (
                  <p className="text-[8px] text-slate-300 font-bold">
                    Closed {new Date(session.closedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          ))}
          {!loadingSessions && visibleSessions.length === 0 && (
            <div className="text-center py-16 text-slate-400 font-black text-[10px] uppercase tracking-widest flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full border border-dashed border-slate-200 flex items-center justify-center text-lg">
                {sessionTab === 'active' ? '😴' : sessionTab === 'closed' ? '✅' : '🗑️'}
              </div>
              No {sessionTab} sessions.
            </div>
          )}
        </div>
      </div>

        <div className="lg:col-span-8 flex flex-col gap-8">
          <ChatPanel 
             session={selectedSession} 
             messages={messages} 
             onSend={sendMessage} 
             onTyping={sendTyping} 
             isTyping={typingSessions[selectedSession?.sessionId]} 
             disabled={!user?.isAvailable} 
          />
          
          {selectedSession && selectedSession.status !== "closed" && (
            <div className="premium-card p-8 flex items-center justify-between gap-6 animate-in zoom-in-95 duration-500">
              <div className="space-y-1">
                <h3 className="heading-md">Session Control</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Convert this chat to a ticket or close the session.</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setHistoryModal(true)}
                  className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-6 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-sm flex items-center gap-2 relative"
                >
                  <History size={14} /> Visitor Intel
                  {visitorHistory?.hasOpenTickets && (
                    <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-red-500 border-2 border-white rounded-full shadow-lg shadow-red-500/50 animate-pulse" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => { setTicketModal(true); setTicketResult(null); }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl shadow-indigo-200 flex items-center gap-2"
                >
                  <Ticket size={14} /> Generate Ticket
                </button>
                <button
                  type="button"
                  onClick={closeChat}
                  className="bg-slate-50 border border-slate-200 hover:bg-red-50 hover:text-red-700 hover:border-red-100 text-slate-500 px-6 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all"
                >
                  Close Session
                </button>
              </div>
            </div>
          )}
        </div>
    </section>
  ) : tab === "settings" ? (
      <section className="max-w-xl animate-in slide-in-from-bottom-4 duration-700">
        <form className="premium-card p-10 space-y-8" onSubmit={updateProfile}>
           <div className="flex flex-col gap-1">
              <h3 className="heading-md">Security Identity</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Manage your personal platform credentials.</p>
           </div>

           <div className="space-y-5">
              <div className="space-y-1.5">
                  <label className="small-label">Display Name</label>
                  <input
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-xs font-bold focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300"
                    placeholder="Your Name"
                    required
                  />
              </div>
              <div className="space-y-1.5">
                  <label className="small-label">Communication Access (Email)</label>
                  <input
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    type="email"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-xs font-bold focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300"
                    placeholder="name@example.com"
                    required
                  />
              </div>
              <div className="space-y-1.5 pt-4 border-t border-slate-100">
                  <label className="small-label text-slate-400">Update Encryption Key (Optional)</label>
                  <input
                    value={profileForm.password}
                    onChange={(e) => setProfileForm({ ...profileForm, password: e.target.value })}
                    type="password"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-xs font-bold focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300"
                    placeholder="Leave blank to keep unchanged"
                  />
                  <p className="text-[9px] font-black uppercase text-amber-500 tracking-widest mt-2 flex items-center gap-1.5">
                     <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                     Require immediate re-authentication after change
                  </p>
              </div>
           </div>

           <button type="submit" className="w-full bg-slate-950 hover:bg-black text-white font-black text-[10px] uppercase tracking-[0.2em] py-5 rounded-2xl shadow-xl shadow-slate-200 transition-all flex items-center justify-center">
              Synchronize Identity Profile
           </button>
        </form>
      </section>
  ) : (
    <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-700">
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <StatCard label="Assigned Load" value={sessions.length.toLocaleString()} />
            <StatCard label="Network Identity" value={user?.isOnline ? "Verified Online" : "Disconnected"} hint="Active Presence" />
            <StatCard label="Global Waiting" value={sessions.filter((session) => session.status === "queued").length.toLocaleString()} />
        </section>

        <section className="premium-card p-10 space-y-10">
             <div className="flex flex-col gap-1">
                <h3 className="heading-md">Health Monitoring</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Real-time status of your assigned ecosystem.</p>
             </div>
             <div className="grid grid-cols-1 gap-4">
                 {sessions.map(s => (
                     <div key={s._id} className="flex items-center justify-between p-6 bg-slate-50/50 rounded-2xl border border-slate-100 group hover:border-indigo-100 transition-all">
                         <div className="flex items-center gap-5">
                             <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-xl shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">🌐</div>
                             <div>
                                 <strong className="text-xs font-black text-slate-950 uppercase tracking-tight block">{s.websiteId?.websiteName}</strong>
                                 <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{s.visitorId?.visitorId}</span>
                             </div>
                         </div>
                         <div className="flex items-center gap-3">
                             <span className="small-label">{s.status}</span>
                             <div className={`w-2 h-2 rounded-full ${s.status === 'active' ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]' : 'bg-slate-300'}`}></div>
                         </div>
                     </div>
                 ))}
                 {!sessions.length && <div className="text-center py-12 text-slate-400 font-black text-[10px] uppercase tracking-widest">Queue is currently clear.</div>}
             </div>
        </section>
    </div>
  );

  return (
    <Layout title={tab === "chats" ? "Operation Room" : tab === "settings" ? "Agent Settings" : "Command Center"} subtitle={tab === "chats" ? "Manage and resolve active visitor streams" : tab === "settings" ? "Manage your system identity" : "High-level performance metrics"} menuItems={menuItems}>
      {toast.show && (
        <div className="fixed bottom-10 right-10 bg-slate-900 border border-slate-800 text-white shadow-2xl px-6 py-4 rounded-2xl text-[12px] font-bold flex items-center gap-4 animate-in slide-in-from-bottom-5 duration-500 z-50">
          <span className={`w-2.5 h-2.5 rounded-full ${toast.type === "error" ? "bg-red-500 animate-pulse" : "bg-indigo-500"} shadow-[0_0_10px_rgba(239,68,68,0.5)]`}></span>
          {toast.message}
          <button onClick={() => setToast({ show: false, message: "", type: "info" })} className="ml-4 text-slate-400 hover:text-white transition-colors">✕</button>
        </div>
      )}
      {content}

      {/* Generate Ticket Modal */}
      {ticketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={() => { setTicketModal(false); setTicketResult(null); }} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                  <Ticket size={18} className="text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Generate Support Ticket</h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Convert this chat session into a trackable ticket</p>
                </div>
              </div>
              <button onClick={() => { setTicketModal(false); setTicketResult(null); }} className="p-2 text-slate-300 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-all">
                <X size={16} />
              </button>
            </div>

            {ticketResult ? (
              // Success State
              <div className="p-8 space-y-6 text-center">
                <div className="w-16 h-16 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto">
                  <CheckCheck size={28} className="text-emerald-500" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Ticket Created</p>
                  <h4 className="text-xl font-black text-slate-900">{ticketResult.ticketId}</h4>
                  <p className="text-xs text-slate-500 font-bold mt-1">{ticketResult.subject}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Visitor Status Link</p>
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
                    <Link size={12} className="text-indigo-400 shrink-0" />
                    <span className="text-[10px] font-bold text-slate-600 flex-1 truncate">
                      {window.location.origin}/ticket-status/{ticketResult.ticketId}
                    </span>
                    <button onClick={copyTicketLink} className="p-1.5 rounded-lg hover:bg-slate-200 transition-colors text-slate-400">
                      {copiedLink ? <CheckCheck size={13} className="text-emerald-500" /> : <Copy size={13} />}
                    </button>
                  </div>
                  <p className="text-[9px] text-slate-400 font-bold">Share this link with the visitor to track their ticket status.</p>
                </div>
                <button
                  onClick={() => { setTicketModal(false); setTicketResult(null); }}
                  className="w-full bg-slate-900 hover:bg-black text-white font-black text-[10px] uppercase tracking-[0.2em] py-4 rounded-2xl transition-all"
                >
                  Done
                </button>
              </div>
            ) : (
              // Form State
              <form onSubmit={generateTicket} className="p-8 space-y-6">
                {selectedSession && (
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-xs font-black">💬</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black text-slate-700 uppercase tracking-wide">{selectedSession.websiteId?.websiteName}</p>
                      <p className="text-[9px] text-slate-400 font-bold truncate">{selectedSession.visitorId?.visitorId}</p>
                    </div>
                  </div>
                )}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Ticket Subject</label>
                  <input
                    value={ticketForm.subject}
                    onChange={e => setTicketForm(f => ({ ...f, subject: e.target.value }))}
                    placeholder={`Support – ${selectedSession?.websiteId?.websiteName || 'Chat Session'}`}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 placeholder-slate-300 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Priority Level</label>
                  <select
                    value={ticketForm.priority}
                    onChange={e => setTicketForm(f => ({ ...f, priority: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                  >
                    <option value="low">🟢 Low — General inquiry</option>
                    <option value="medium">🔵 Medium — Standard issue</option>
                    <option value="high">🟠 High — Needs attention</option>
                    <option value="urgent">🔴 Urgent — Critical problem</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setTicketModal(false)} className="flex-1 border border-slate-200 text-slate-500 font-black text-[10px] uppercase tracking-[0.2em] py-4 rounded-2xl hover:bg-slate-50 transition-all">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={ticketSaving}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-[0.2em] py-4 rounded-2xl shadow-xl shadow-indigo-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {ticketSaving ? <span className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full" /> : <Ticket size={13} />}
                    {ticketSaving ? "Generating..." : "Create Ticket"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Visitor History Modal */}
      {historyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={() => setHistoryModal(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl h-full max-h-[85vh] animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 flex flex-col overflow-hidden">
            
            <div className="p-8 border-b border-slate-50 flex items-center justify-between shrink-0 bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center shadow-sm">
                  <History size={20} className="text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight">Visitor Intelligence</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Historical interactions & tickets</p>
                </div>
              </div>
              <button onClick={() => setHistoryModal(false)} className="p-2 text-slate-300 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-white">
              {loadingHistory ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                  <span className="animate-spin w-8 h-8 border-4 border-indigo-100 border-t-indigo-500 rounded-full mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Compiling records...</p>
                </div>
              ) : visitorHistory ? (
                <>
                  {visitorHistory.hasOpenTickets && (
                    <div className="bg-red-50 border border-red-100 px-6 py-4 rounded-2xl flex items-center gap-4">
                      <AlertCircle className="text-red-500" size={20} />
                      <div>
                        <p className="text-xs font-black text-red-700 uppercase tracking-wide">Attention Required</p>
                        <p className="text-[10px] font-bold text-red-500 mt-0.5">This visitor currently has an unresolved support ticket open.</p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-5 border border-slate-100 rounded-2xl bg-slate-50">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Visitor</span>
                      <p className="text-sm font-black text-slate-800">{visitorHistory.visitor?.name || "Anonymous"}</p>
                      <p className="text-[10px] text-slate-500 font-bold truncate">{visitorHistory.visitor?.email || "No email"}</p>
                    </div>
                    <div className="p-5 border border-slate-100 rounded-2xl bg-slate-50">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Total Chat Sessions</span>
                      <p className="text-2xl font-black text-indigo-600 leading-none mt-1">{visitorHistory.pastSessions}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-2">Ticket History ({visitorHistory.tickets?.length || 0})</h4>
                    
                    {visitorHistory.tickets?.length > 0 ? (
                      <div className="space-y-3">
                        {visitorHistory.tickets.map(ticket => (
                          <div key={ticket._id} className="p-5 border border-slate-100 rounded-2xl hover:border-slate-200 transition-colors">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <span className="bg-indigo-50 text-indigo-700 text-[9px] font-black px-2 py-1 rounded tracking-widest">{ticket.ticketId}</span>
                                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded border ${ticket.status === 'open' || ticket.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                                  {ticket.status}
                                </span>
                              </div>
                              <span className="text-[9px] font-bold text-slate-400">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p className="text-xs font-black text-slate-800 mb-1">{ticket.subject}</p>
                            {ticket.lastMessagePreview && (
                              <p className="text-[10px] text-slate-500 font-medium italic mb-3 line-clamp-2">{ticket.lastMessagePreview}</p>
                            )}
                            <div className="flex items-center gap-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                              <span>Priority: <span className="text-slate-600">{ticket.priority}</span></span>
                              <span>Agent: <span className="text-slate-600">{ticket.assignedAgent?.name || "Unassigned"}</span></span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] font-bold text-slate-400 italic text-center py-6">No previous tickets found for this visitor.</p>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-20 text-slate-400 font-black text-[10px] uppercase tracking-widest">
                  Could not load visitor intel.
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-50 bg-slate-50/50 shrink-0">
               <button onClick={() => setHistoryModal(false)} className="w-full bg-slate-900 hover:bg-black text-white px-6 py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all">Close Intelligence Tool</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

