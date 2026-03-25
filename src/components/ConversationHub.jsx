import { useState, useEffect, useMemo } from "react";
import { Search, MessageSquare, Clock, Globe, Shield } from "lucide-react";
import ChatPanel from "./ChatPanel.jsx";
import { api } from "../api/client.js";

export default function ConversationHub({ socket, initialSessions = [] }) {
  const [sessions, setSessions] = useState(initialSessions);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [messages, setMessages] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);

  const selectedSession = useMemo(() => 
    sessions.find(s => s.sessionId === selectedSessionId), 
    [sessions, selectedSessionId]
  );

  useEffect(() => {
    setSessions(initialSessions);
  }, [initialSessions]);

  useEffect(() => {
    if (!selectedSessionId) {
      setMessages([]);
      return;
    }

    setLoadingMessages(true);
    api(`/api/chat/sessions/${selectedSessionId}/messages`)
      .then(setMessages)
      .catch(console.error)
      .finally(() => setLoadingMessages(false));

    if (socket) {
      socket.emit("agent:join-session", { sessionId: selectedSessionId });
    }
  }, [selectedSessionId, socket]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (payload) => {
      if (payload.sessionId === selectedSessionId) {
        setMessages(prev => {
           // Basic deduplication
           const exists = prev.some(m => m._id === payload._id || (m.createdAt === payload.createdAt && m.message === payload.message));
           if (exists) return prev;
           return [...prev, payload];
        });
      }
      
      // Update session preview in the list
      setSessions(prev => prev.map(s => 
        s.sessionId === payload.sessionId 
          ? { ...s, lastMessagePreview: payload.message, updatedAt: new Date() }
          : s
      ));
    };

    socket.on("chat:message", handleNewMessage);
    socket.on("chat:new-message", handleNewMessage);

    return () => {
      socket.off("chat:message", handleNewMessage);
      socket.off("chat:new-message", handleNewMessage);
    };
  }, [socket, selectedSessionId]);

  const handleSend = (payload) => {
    if (!socket || !selectedSessionId) return;
    socket.emit("agent:message", { 
      sessionId: selectedSessionId, 
      message: payload.text,
      attachmentUrl: payload.attachmentUrl,
      attachmentType: payload.attachmentType
    });
  };

  const filteredSessions = sessions.filter(s => 
    s.websiteId?.websiteName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.visitorId?.visitorId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[700px] animate-in slide-in-from-bottom-4 duration-700">
      {/* Session Sidebar */}
      <div className="lg:col-span-4 premium-card p-0 flex flex-col border-none shadow-2xl bg-white overflow-hidden">
        <div className="p-8 border-b border-slate-50 space-y-4">
           <div className="flex flex-col gap-1">
              <h3 className="heading-md">Session Queue</h3>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{sessions.length} Active Streams</span>
           </div>
           <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 placeholder="Filter conversations..."
                 className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-4 py-3 text-[11px] font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-300 transition-all placeholder:text-slate-300"
              />
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30 custom-scrollbar">
           {filteredSessions.map(session => (
              <div 
                 key={session._id}
                 onClick={() => setSelectedSessionId(session.sessionId)}
                 className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                    selectedSessionId === session.sessionId
                      ? "bg-white border-indigo-200 shadow-xl translate-x-1"
                      : "bg-white border-slate-100 hover:border-slate-200"
                 }`}
              >
                 <div className="relative z-10 space-y-2">
                    <div className="flex items-center justify-between">
                       <strong className={`text-[10px] font-black tracking-widest block uppercase transition-colors ${selectedSessionId === session.sessionId ? 'text-indigo-600' : 'text-slate-900'}`}>
                          {session.websiteId?.websiteName || 'Global Direct'}
                       </strong>
                       <span className="text-[8px] font-bold text-slate-400 uppercase">{new Date(session.updatedAt || session.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase truncate max-w-[120px]">
                          {session.visitorId?.visitorId || 'Anonymous'}
                       </span>
                       <span className={`w-1 h-1 rounded-full ${session.status === 'active' ? 'bg-indigo-500' : 'bg-slate-300'}`}></span>
                    </div>
                    {session.lastMessagePreview && (
                       <p className="text-[10px] text-slate-400 line-clamp-1 opacity-80 italic">"{session.lastMessagePreview}"</p>
                    )}
                 </div>
                 {selectedSessionId === session.sessionId && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600" />}
              </div>
           ))}
           {filteredSessions.length === 0 && (
              <div className="text-center py-20 text-slate-300 flex flex-col items-center gap-4">
                 <MessageSquare size={32} strokeWidth={1} />
                 <p className="text-[10px] font-black uppercase tracking-widest">No active sessions.</p>
              </div>
           )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="lg:col-span-8">
         <ChatPanel 
           session={selectedSession} 
           messages={messages} 
           onSend={handleSend}
           onTyping={(isTyping) => socket?.emit("agent:typing", { sessionId: selectedSessionId, isTyping })}
         />
      </div>
    </section>
  );
}
