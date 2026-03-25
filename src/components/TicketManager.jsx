import { useState, useEffect } from "react";
import { 
  Ticket, Plus, Search, Filter, ChevronDown, Check, 
  Clock, AlertTriangle, X, MessageSquare, Globe, User, 
  Link, Copy, CheckCheck, ChevronRight, Tag, Activity
} from "lucide-react";
import { api } from "../api/client.js";

const STATUS_CONFIG = {
  open:     { label: "Open",     color: "bg-blue-50 text-blue-600 border-blue-100",    dot: "bg-blue-500"    },
  pending:  { label: "Pending",  color: "bg-amber-50 text-amber-600 border-amber-100", dot: "bg-amber-500"   },
  resolved: { label: "Resolved", color: "bg-emerald-50 text-emerald-600 border-emerald-100", dot: "bg-emerald-500" },
  closed:   { label: "Closed",   color: "bg-slate-100 text-slate-500 border-slate-200", dot: "bg-slate-400"  }
};

const PRIORITY_CONFIG = {
  low:    { label: "Low",    color: "bg-slate-50 text-slate-500",   icon: "●" },
  medium: { label: "Medium", color: "bg-blue-50 text-blue-600",     icon: "▲" },
  high:   { label: "High",   color: "bg-orange-50 text-orange-600", icon: "▲▲" },
  urgent: { label: "Urgent", color: "bg-red-50 text-red-600",       icon: "⚡" }
};

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-700">
      {copied ? <CheckCheck size={14} className="text-emerald-500" /> : <Copy size={14} />}
    </button>
  );
}

function TicketDetailPanel({ ticket, onUpdate, onClose }) {
  const [status, setStatus] = useState(ticket.status);
  const [priority, setPriority] = useState(ticket.priority);
  const [note, setNote] = useState("");
  const [noteIsPublic, setNoteIsPublic] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const dashboardBase = window.location.origin;
  const publicStatusUrl = `${dashboardBase}/ticket-status/${ticket.ticketId}`;

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { status, priority };
      if (note.trim()) { payload.note = note; payload.noteIsPublic = noteIsPublic; }
      await api(`/api/tickets/${ticket._id}`, { method: "PATCH", body: JSON.stringify(payload) });
      onUpdate();
      setNote("");
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch(e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const statusLink = publicStatusUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end">
      <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl h-full bg-white shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-8 border-b border-slate-100 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-md">{ticket.ticketId}</span>
              <span className={`px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border ${STATUS_CONFIG[ticket.status]?.color}`}>
                {STATUS_CONFIG[ticket.status]?.label}
              </span>
            </div>
            <h3 className="text-base font-black text-slate-900 leading-snug">{ticket.subject}</h3>
          </div>
          <button onClick={onClose} className="p-2 text-slate-300 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Meta */}
        <div className="px-8 py-5 border-b border-slate-50 grid grid-cols-2 gap-4">
          <div className="space-y-0.5">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Visitor</span>
            <p className="text-xs font-bold text-slate-700">{ticket.visitorId?.name || "Anonymous"}</p>
            <p className="text-[10px] text-slate-400">{ticket.visitorId?.email || "—"}</p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Assigned Agent</span>
            <p className="text-xs font-bold text-slate-700">{ticket.assignedAgent?.name || "Unassigned"}</p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Website</span>
            <p className="text-xs font-bold text-slate-700">{ticket.websiteId?.websiteName || "—"}</p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Opened</span>
            <p className="text-xs font-bold text-slate-700">{new Date(ticket.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Visitor Status Link */}
        <div className="px-8 py-5 border-b border-slate-50">
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Share Status Link with Visitor</p>
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
            <Link size={12} className="text-indigo-400 shrink-0" />
            <span className="text-[10px] font-bold text-slate-600 flex-1 truncate">{statusLink}</span>
            <CopyButton text={statusLink} />
          </div>
        </div>

        {/* Actions */}
        <div className="px-8 py-5 border-b border-slate-50 space-y-4">
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Update Ticket</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Status</label>
              <select
                value={status} onChange={e => setStatus(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all"
              >
                {Object.entries(STATUS_CONFIG).map(([k,v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Priority</label>
              <select
                value={priority} onChange={e => setPriority(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all"
              >
                {Object.entries(PRIORITY_CONFIG).map(([k,v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="px-8 py-5 flex-1 overflow-y-auto space-y-4">
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Add Note / Update</label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Add an internal note or a public update for the visitor..."
              rows={3}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 placeholder-slate-300 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all resize-none"
            />
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={noteIsPublic} onChange={e => setNoteIsPublic(e.target.checked)} className="rounded" />
              <span className="text-[10px] font-bold text-slate-500">Visible to visitor on status page</span>
            </label>
          </div>

          {/* Existing notes */}
          {ticket.notes?.length > 0 && (
            <div className="space-y-3">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Activity Log</p>
              {ticket.notes.map((n, i) => (
                <div key={i} className={`p-3 rounded-xl text-xs font-bold ${n.isPublic ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-slate-50 text-slate-600 border border-slate-100'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] uppercase tracking-widest opacity-60">{n.isPublic ? 'Public Note' : 'Internal Note'}</span>
                    <span className="text-[9px] opacity-50">{new Date(n.createdAt).toLocaleString()}</span>
                  </div>
                  {n.content}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Save */}
        <div className="p-8 border-t border-slate-100">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-slate-900 hover:bg-black text-white font-black text-[10px] uppercase tracking-[0.2em] py-4 rounded-2xl shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            ) : savedSuccess ? (
              <><CheckCheck size={16} className="text-emerald-400" /> Saved!</>
            ) : (
              <><Check size={16} /> Save Changes</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TicketManager() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState(null);

  const fetchTickets = async () => {
    try {
      const data = await api("/api/tickets");
      setTickets(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTickets(); }, []);

  const filtered = tickets.filter(t => {
    const matchSearch = !searchTerm || 
      t.ticketId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.visitorId?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.visitorId?.email || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === "all" || t.status === filterStatus;
    const matchPriority = filterPriority === "all" || t.priority === filterPriority;
    return matchSearch && matchStatus && matchPriority;
  });

  const counts = { all: tickets.length, ...Object.fromEntries(Object.keys(STATUS_CONFIG).map(k => [k, tickets.filter(t => t.status === k).length])) };

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      {[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-slate-100 rounded-2xl" />)}
    </div>
  );

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h3 className="heading-md">Ticket Management</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Track, manage, and resolve visitor support tickets.</p>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search tickets..."
              className="bg-white border border-slate-200 rounded-2xl pl-10 pr-6 py-3.5 text-xs font-bold focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all w-56 shadow-sm"
            />
          </div>
          <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className="bg-white border border-slate-200 rounded-2xl px-4 py-3.5 text-xs font-bold text-slate-600 outline-none focus:border-indigo-500 shadow-sm">
            <option value="all">All Priorities</option>
            {Object.entries(PRIORITY_CONFIG).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 flex-wrap">
        {["all", "open", "pending", "resolved", "closed"].map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${filterStatus === s ? 'bg-slate-900 text-white shadow-lg' : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-400'}`}
          >
            {s !== "all" && <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[s]?.dot}`} />}
            {s === "all" ? "All Tickets" : STATUS_CONFIG[s]?.label}
            <span className={`px-1.5 py-0.5 rounded-md text-[8px] ${filterStatus === s ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>{counts[s] || 0}</span>
          </button>
        ))}
      </div>

      {error && <div className="bg-red-50 border border-red-100 text-red-600 px-6 py-4 rounded-2xl text-[11px] font-bold">{error}</div>}

      {/* Ticket Table */}
      <div className="premium-card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-50">
                <th className="p-6 small-label">Ticket ID</th>
                <th className="p-6 small-label">Subject</th>
                <th className="p-6 small-label">Visitor</th>
                <th className="p-6 small-label">Website</th>
                <th className="p-6 small-label text-center">Priority</th>
                <th className="p-6 small-label text-center">Status</th>
                <th className="p-6 small-label text-center">Created</th>
                <th className="p-6 small-label text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(ticket => (
                <tr key={ticket._id} className="border-t border-slate-50 hover:bg-slate-50/60 transition-colors cursor-pointer group" onClick={() => setSelectedTicket(ticket)}>
                  <td className="p-6">
                    <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">{ticket.ticketId}</span>
                  </td>
                  <td className="p-6 max-w-[200px]">
                    <p className="text-xs font-black text-slate-800 truncate">{ticket.subject}</p>
                    {ticket.lastMessagePreview && <p className="text-[10px] text-slate-400 truncate mt-0.5">{ticket.lastMessagePreview}</p>}
                  </td>
                  <td className="p-6">
                    <p className="text-xs font-bold text-slate-700">{ticket.visitorId?.name || "Anonymous"}</p>
                    <p className="text-[10px] text-slate-400">{ticket.visitorId?.email || "—"}</p>
                  </td>
                  <td className="p-6">
                    <p className="text-[10px] font-bold text-slate-500">{ticket.websiteId?.websiteName || "—"}</p>
                  </td>
                  <td className="p-6 text-center">
                    <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${PRIORITY_CONFIG[ticket.priority]?.color || ""}`}>
                      {PRIORITY_CONFIG[ticket.priority]?.label || ticket.priority}
                    </span>
                  </td>
                  <td className="p-6 text-center">
                    <span className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border flex items-center gap-1.5 w-fit mx-auto ${STATUS_CONFIG[ticket.status]?.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[ticket.status]?.dot}`} />
                      {STATUS_CONFIG[ticket.status]?.label}
                    </span>
                  </td>
                  <td className="p-6 text-center">
                    <span className="text-[10px] font-bold text-slate-400">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                  </td>
                  <td className="p-6 text-right">
                    <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-500 transition-colors ml-auto" />
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="8" className="p-16 text-center">
                    <div className="space-y-3">
                      <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto">
                        <Ticket size={24} className="text-slate-300" />
                      </div>
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No tickets found for the selected filters.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedTicket && (
        <TicketDetailPanel
          ticket={selectedTicket}
          onUpdate={() => { fetchTickets(); setSelectedTicket(null); }}
          onClose={() => setSelectedTicket(null)}
        />
      )}
    </div>
  );
}
