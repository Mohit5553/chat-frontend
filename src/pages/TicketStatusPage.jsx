import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { API_BASE } from "../api/client.js";

const STATUS_STEPS = ["open", "pending", "resolved", "closed"];

const STATUS_CONFIG = {
  open:     { label: "Open",     desc: "Your ticket has been received and is awaiting assignment.",   color: "#6366f1", bg: "#eef2ff" },
  pending:  { label: "Pending",  desc: "An agent is reviewing your request and will update you soon.", color: "#f59e0b", bg: "#fffbeb" },
  resolved: { label: "Resolved", desc: "Your issue has been resolved. Please let us know if you need more help.", color: "#10b981", bg: "#ecfdf5" },
  closed:   { label: "Closed",   desc: "This ticket has been closed. Thank you for reaching out!", color: "#64748b", bg: "#f8fafc" }
};

const PRIORITY_COLORS = { low: "#94a3b8", medium: "#6366f1", high: "#f97316", urgent: "#ef4444" };

export default function TicketStatusPage() {
  const { ticketId } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ticketId) return;
    fetch(`${API_BASE}/api/tickets/public/${ticketId}`)
      .then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(e.message)))
      .then(data => { setTicket(data); setLoading(false); })
      .catch(err => { setError(typeof err === "string" ? err : "Ticket not found."); setLoading(false); });
  }, [ticketId]);

  const currentStepIndex = ticket ? STATUS_STEPS.indexOf(ticket.status) : -1;
  const primaryColor = ticket?.website?.primaryColor || "#6366f1";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 flex items-center justify-center p-6">
      <div className="w-full max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Branding Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center shadow-xl" style={{ backgroundColor: primaryColor }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          {ticket?.website?.name && (
            <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{ticket.website.name}</p>
          )}
          <h1 className="text-2xl font-black text-slate-900 mt-1">Ticket Status</h1>
        </div>

        {loading && (
          <div className="bg-white rounded-3xl border border-slate-200/60 shadow-xl p-16 text-center">
            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Fetching your ticket...</p>
          </div>
        )}

        {error && (
          <div className="bg-white rounded-3xl border border-red-100 shadow-xl p-16 text-center space-y-4">
            <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <p className="text-sm font-black text-slate-700">Ticket Not Found</p>
            <p className="text-xs text-slate-400 font-bold">{error}</p>
            <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">Check that you have the correct Ticket ID</p>
          </div>
        )}

        {ticket && (
          <div className="space-y-5">
            {/* Main Card */}
            <div className="bg-white rounded-3xl border border-slate-200/60 shadow-xl overflow-hidden">
              
              {/* Status Banner */}
              <div className="p-8 border-b border-slate-50" style={{ background: `linear-gradient(135deg, ${STATUS_CONFIG[ticket.status]?.bg} 0%, white 60%)` }}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Ticket Reference</p>
                    <h2 className="text-xl font-black text-slate-900 mb-1">{ticket.ticketId}</h2>
                    <p className="text-sm text-slate-600 font-bold leading-relaxed max-w-sm">{ticket.subject}</p>
                  </div>
                  <div className="text-right">
                    <div
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest"
                      style={{ backgroundColor: STATUS_CONFIG[ticket.status]?.bg, color: STATUS_CONFIG[ticket.status]?.color }}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_CONFIG[ticket.status]?.color }} />
                      {STATUS_CONFIG[ticket.status]?.label}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-500 font-bold mt-4 leading-relaxed">{STATUS_CONFIG[ticket.status]?.desc}</p>
              </div>

              {/* Progress Track */}
              <div className="px-8 py-7 border-b border-slate-50">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Resolution Progress</p>
                <div className="relative">
                  {/* Track line */}
                  <div className="absolute top-3.5 left-0 right-0 h-0.5 bg-slate-100" />
                  <div
                    className="absolute top-3.5 left-0 h-0.5 transition-all duration-700"
                    style={{
                      width: `${(currentStepIndex / (STATUS_STEPS.length - 1)) * 100}%`,
                      backgroundColor: primaryColor
                    }}
                  />
                  <div className="relative flex justify-between">
                    {STATUS_STEPS.map((step, i) => (
                      <div key={step} className="flex flex-col items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${i <= currentStepIndex ? 'shadow-md' : 'bg-white border-slate-200'}`}
                          style={i <= currentStepIndex ? { backgroundColor: primaryColor, borderColor: primaryColor } : {}}
                        >
                          {i <= currentStepIndex ? (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                          ) : (
                            <div className="w-2 h-2 rounded-full bg-slate-200" />
                          )}
                        </div>
                        <span className={`text-[9px] font-black uppercase tracking-wider ${i <= currentStepIndex ? 'text-slate-700' : 'text-slate-300'}`}>
                          {STATUS_CONFIG[step]?.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="px-8 py-6 border-b border-slate-50 grid grid-cols-3 gap-6">
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Priority</p>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PRIORITY_COLORS[ticket.priority] || "#94a3b8" }} />
                    <span className="text-xs font-black text-slate-700 capitalize">{ticket.priority}</span>
                  </div>
                </div>
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Channel</p>
                  <span className="text-xs font-black text-slate-700 capitalize">{ticket.channel || "Web"}</span>
                </div>
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Assigned To</p>
                  <span className="text-xs font-black text-slate-700">{ticket.agent?.name || "Awaiting Assignment"}</span>
                </div>
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Opened On</p>
                  <span className="text-xs font-black text-slate-700">{new Date(ticket.createdAt).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" })}</span>
                </div>
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Last Updated</p>
                  <span className="text-xs font-black text-slate-700">{new Date(ticket.updatedAt).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" })}</span>
                </div>
              </div>

              {/* Public Notes / Updates */}
              {ticket.notes?.length > 0 && (
                <div className="px-8 py-6">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-4">Updates from Support Team</p>
                  <div className="space-y-3">
                    {ticket.notes.map((note, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: primaryColor }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        </div>
                        <div className="flex-1 bg-slate-50 rounded-2xl px-5 py-4">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Support Agent · {new Date(note.createdAt).toLocaleString()}</p>
                          <p className="text-xs font-bold text-slate-700">{note.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer note */}
            <p className="text-center text-[10px] text-slate-400 font-bold">
              Bookmark this page to track your support ticket in real-time.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
