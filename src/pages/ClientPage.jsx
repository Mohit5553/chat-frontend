import { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useSearchParams } from "react-router-dom";
import { 
  BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area, Cell, LineChart, Line 
} from 'recharts';
import { 
  Users, Globe, Headphones, MessageSquare, LayoutDashboard, Search, Bell, Menu, X, Trash2, Send, Paperclip 
} from "lucide-react";
import Layout from "../components/Layout.jsx";
import ChatPanel from "../components/ChatPanel.jsx";
import StatCard from "../components/StatCard.jsx";
import WebsiteManager from "../components/WebsiteManager.jsx";
import AgentManager from "../components/AgentManager.jsx";
import ClientManager from "../components/ClientManager.jsx";
import DetailedAnalytics from "../components/DetailedAnalytics.jsx";
import ConversationHub from "../components/ConversationHub.jsx";
import TicketManager from "../components/TicketManager.jsx";
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

function TrafficChart({ data = [] }) {
  return (
    <div className="h-[280px] w-full min-w-0 overflow-hidden relative" style={{ minHeight: '280px' }}>
      <ResponsiveContainer width="100%" height="100%" minHeight={280} debounce={50}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} dy={10} stroke="#94a3b8" />
          <Tooltip 
            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: '900' }}
            cursor={{ stroke: '#6366f1', strokeWidth: 2, strokeDasharray: '5 5' }}
          />
          <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorTraffic)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function ActivityChart({ data = [] }) {
  return (
    <div className="h-[280px] w-full min-w-0 overflow-hidden relative" style={{ minHeight: '280px' }}>
      <ResponsiveContainer width="100%" height="100%" minHeight={280} debounce={50}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} dy={10} stroke="#94a3b8" />
          <Tooltip 
            cursor={{ fill: '#f8fafb' }}
            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: '900' }}
          />
          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
            {data.map((_, index) => (
              <Cell key={index} fill={index % 2 === 0 ? "#6366f1" : "#94a3b8"} fillOpacity={index % 2 === 0 ? 1 : 0.4} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function SnapshotChart({ data = [] }) {
  return (
    <div className="h-[320px] w-full min-w-0 mt-6 overflow-hidden relative" style={{ minHeight: '320px' }}>
       <ResponsiveContainer width="100%" height="100%" minHeight={320} debounce={50}>
          <LineChart data={data}>
             <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="#f1f5f9" />
             <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} dy={10} stroke="#94a3b8" />
             <Tooltip 
                contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: '900' }}
             />
             <Line type="monotone" dataKey="chats" stroke="#6366f1" strokeWidth={4} dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7, strokeWidth: 0 }} />
             <Line type="monotone" dataKey="visitors" stroke="#f59e0b" strokeWidth={4} dot={{ r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7, strokeWidth: 0 }} />
             <Line type="monotone" dataKey="resolutions" stroke="#10b981" strokeWidth={4} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7, strokeWidth: 0 }} />
          </LineChart>
       </ResponsiveContainer>
    </div>
  );
}

const ClientOverview = ({ analytics, queuedSessions }) => {
  const chartData = analytics.trends?.dailyChats || [];
  const snapshotData = analytics.trends?.hourly?.map(s => ({ 
     label: s.time, 
     visitors: s.visitors, 
     chats: s.chats, 
     resolutions: s.resolved 
  })) || [];

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Live Visitors" value={analytics.totals?.liveSessions || 0} trend="+12% from last hour" color="indigo" />
        <StatCard label="Total Today" value={analytics.totals?.dailyChats || 0} trend="Daily volume" color="orange" />
        <StatCard label="Queued" value={queuedSessions.length} trend="Waiting for agent" color="rose" />
        <StatCard label="Avg Wait" value={(analytics.sla?.avgWaitTimeSeconds || 0) + "s"} trend="Response SLA" color="emerald" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-white p-10 rounded-3xl border border-slate-200/60 shadow-sm space-y-8 min-w-0">
           <div className="flex items-center justify-between">
              <div>
                 <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-1">Traffic Evolution</h3>
                 <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">Real-time visitor counts</p>
              </div>
              <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest">Live Updates</div>
           </div>
           <TrafficChart data={chartData} />
        </div>
        <div className="bg-white p-10 rounded-3xl border border-slate-200/60 shadow-sm space-y-8 min-w-0">
           <div className="flex items-center justify-between">
              <div>
                 <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-1">Peak Volume Distribution</h3>
                 <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">Chat requests by hour</p>
              </div>
              <div className="px-3 py-1 bg-slate-50 text-slate-400 rounded-lg text-[10px] font-black uppercase tracking-widest">Static Mode</div>
           </div>
           <ActivityChart data={chartData} />
        </div>
      </div>

      <div className="bg-white p-12 rounded-[40px] border border-slate-200/60 shadow-sm overflow-hidden relative group min-w-0">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
            <div className="space-y-2">
               <h3 className="text-2xl font-black text-slate-900 tracking-tight">Command Center <span className="text-indigo-600 italic">Core Dynamics</span></h3>
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest max-w-md leading-relaxed">Cross-referencing visitors, active conversations, and resolution rates in 24-hour window.</p>
            </div>
            <div className="flex gap-4">
               <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]"></div><span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Chats</span></div>
               <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]"></div><span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Visitors</span></div>
               <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div><span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Solved</span></div>
            </div>
          </div>
          <SnapshotChart data={snapshotData} />
      </div>
    </div>
  );
};

export default function ClientPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "overview";
  
  const [analytics, setAnalytics] = useState({ activeVisitors: 0, activeChats: 0, trend: [], snapshots: [] });
  const [queuedSessions, setQueuedSessions] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [error, setError] = useState("");

  const socketRef = useRef(null);

  useEffect(() => {
    if (!user) return;

    let isMounted = true;

    const fetchInitial = async () => {
      try {
        const [anaRes, queRes, sesRes] = await Promise.all([
          api("/api/analytics"),
          api("/api/chat/queued"), // TODO: double-check endpoint if this ever moves under /api/dashboard
          api("/api/chat/sessions")
        ]);
        if (!isMounted) return;
        setAnalytics(anaRes);
        setQueuedSessions(queRes);
        setSessions(sesRes);
      } catch (err) {
        if (!isMounted) return;
        setError("Failed to synchronize with server.");
      }
    };
    fetchInitial();

    const socket = io(API_BASE, {
      auth: {
        type: "agent",
        userId: user._id || user?.id,
        role: user.role
      },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 10000
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[Socket] Connected to backend server");
    });

    socket.on("connect_error", (err) => {
      console.error("[Socket] Connection error:", err.message);
    });

    const handleSessionUpdate = () => fetchInitial();

    socket.on("sessionUpdate", handleSessionUpdate);
    socket.on("newSession", (session) => {
      setQueuedSessions(prev => [session, ...prev]);
      NotificationService.notify("New Visitor", `${session.visitorId?.name || 'A user'} is waiting for support.`);
    });

    return () => {
      isMounted = false;
      socket.off("connect");
      socket.off("connect_error");
      socket.off("sessionUpdate", handleSessionUpdate);
      socket.off("newSession");
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user]);
  const menuItems = user?.role === "admin"
    ? [
        { label: "Dashboard", href: "/admin" },
        { label: "Clients", href: "/admin?tab=clients" },
        { label: "Websites", href: "/admin?tab=websites" },
        { label: "Agents", href: "/admin?tab=agents" },
        { label: "Chats", href: "/admin?tab=chats" },
        { label: "Tickets", href: "/admin?tab=tickets" },
        { label: "Analytics", href: "/admin?tab=analytics" }
      ]
    : [
        { label: "Dashboard", href: "/client" },
        { label: "Websites", href: "/client?tab=websites" },
        { label: "Agents", href: "/client?tab=agents" },
        { label: "Chats", href: "/client?tab=chats" },
        { label: "Tickets", href: "/client?tab=tickets" },
        { label: "Analytics", href: "/client?tab=analytics" }
      ];

  let content = <ClientOverview analytics={analytics} queuedSessions={queuedSessions} />;
  let title = user?.role === "admin" ? "Admin Overview" : "Client Overview";
  let subtitle = user?.role === "admin" ? "System-wide metrics and status" : "Real-time performance metrics";

  if (tab === "chats") {
    title = "Conversation Hub";
    subtitle = "Manage real-time agent interactions";
    content = <ConversationHub socket={socketRef.current} initialSessions={sessions} />;
  }

  if (tab === "clients") {
    title = "Client Ecosystem Control";
    subtitle = "Manage high-level client entities";
    content = <ClientManager />;
  }

  if (tab === "websites") {
    title = "Ecosystem Control";
    subtitle = "Manage registered domains and widget credentials";
    content = <WebsiteManager />;
  }

  if (tab === "agents") {
    title = "Personnel Command";
    subtitle = "Manage security cleared support personnel";
    content = <AgentManager />;
  }

  if (tab === "tickets") {
    title = "Ticket Management";
    subtitle = "Track, manage, and resolve visitor support tickets";
    content = <TicketManager />;
  }

  if (tab === "analytics") {
    title = "Intelligence Center";
    subtitle = "Deep-dive operational metrics and trends";
    content = <DetailedAnalytics analytics={analytics} />;
  }

  // Handle other tabs generically for now
  if (tab !== "overview" && tab !== "chats" && tab !== "websites" && tab !== "agents" && tab !== "clients" && tab !== "analytics" && tab !== "tickets") {
    content = (
       <div className="bg-white p-24 rounded-[40px] border border-slate-200/60 shadow-sm text-center">
          <div className="max-w-xs mx-auto space-y-4">
             <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Globe className="text-slate-300" size={32} />
             </div>
             <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase">Feature Coming Soon</h3>
             <p className="text-xs font-bold text-slate-400 leading-relaxed">The {tab} interface is being optimized for the new analytics engine. Stay tuned!</p>
          </div>
       </div>
    );
  }

  return (
    <Layout title={title} subtitle={subtitle} menuItems={menuItems}>
      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 px-6 py-4 rounded-2xl text-[13px] font-bold mb-8">
          {error}
        </div>
      )}
      {content}
    </Layout>
  );
}




