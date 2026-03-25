import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useState } from "react";
import { 
  LayoutDashboard, Users, Globe, Headphones, 
  MessageSquare, BarChart, ChevronLeft, ChevronRight, LogOut 
} from "lucide-react";

function getInitials(name = "") {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "?";
}

function getAvatarColor(name = "") {
  const colors = [
    "from-indigo-500 to-violet-500",
    "from-pink-500 to-rose-500",
    "from-orange-500 to-amber-500",
    "from-teal-500 to-cyan-500",
    "from-blue-500 to-indigo-500",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

const iconMap = {
  "Dashboard": LayoutDashboard,
  "Clients": Users,
  "Websites": Globe,
  "Agents": Headphones,
  "Shortcuts": MessageSquare,
  "Chats": MessageSquare,
  "Assigned Chats": MessageSquare,
  "Analytics": BarChart
};

export default function Layout({ title, subtitle, children, menuItems = [] }) {
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const role = user?.role;
  const isOwner = role === "client" || role === "admin";
  
  const fallbackMenuItems = role === "admin"
    ? [
        { label: "Dashboard", href: "/admin" },
        { label: "Clients", href: "/admin?tab=clients" },
        { label: "Websites", href: "/admin?tab=websites" },
        { label: "Agents", href: "/admin?tab=agents" },
        { label: "Chats", href: "/admin?tab=chats" },
        { label: "Analytics", href: "/admin?tab=analytics" }
      ]
    : isOwner
      ? [
          { label: "Dashboard", href: "/client" },
          { label: "Websites", href: "/client?tab=websites" },
          { label: "Agents", href: "/client?tab=agents" },
          { label: "Chats", href: "/client?tab=chats" },
          { label: "Analytics", href: "/client?tab=analytics" }
        ]
      : [
          { label: "Dashboard", href: "/agent" },
          { label: "Assigned Chats", href: "/agent?tab=chats" }
        ];

  const links = menuItems.length ? menuItems : fallbackMenuItems;

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900 overflow-hidden">
      {/* Sidebar */}
      <aside className={`bg-[#050505] text-slate-400 flex flex-col border-r border-slate-800/40 shadow-2xl flex-shrink-0 relative z-50 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'}`}>
        
        {/* Toggle Button */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-6 bg-[#050505] border border-slate-800 text-slate-400 hover:text-white rounded-full p-1 shadow-lg z-50 transition-colors"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Top Header */}
        <div className={`p-6 pb-4 flex items-center ${isCollapsed ? 'justify-center px-0' : ''}`}>
          {isCollapsed ? (
            <div className="w-8 h-8 bg-indigo-500 rounded-xl shadow-[0_0_12px_rgba(99,102,241,0.6)] flex items-center justify-center font-black text-white text-xs">JTS</div>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-indigo-500 rounded-full shadow-[0_0_12px_rgba(99,102,241,0.6)]" />
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Platform</span>
              </div>
              <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                JTS <span className="text-indigo-500 italic">Chat</span>
              </h1>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 min-h-0 px-3 space-y-2 overflow-y-auto mt-4 custom-scrollbar pb-4" aria-label="Sidebar">
          {links.map((item) => {
            const Icon = iconMap[item.label] || LayoutDashboard;
            return (
              <NavLink
                key={item.label}
                to={item.href}
                title={isCollapsed ? item.label : ""}
                className={({ isActive }) =>
                  `relative flex items-center ${isCollapsed ? 'justify-center px-0 py-3' : 'px-4 py-2.5'} text-[11px] font-black uppercase tracking-[0.1em] rounded-xl transition-all duration-300 group ${
                    isActive
                      ? "bg-indigo-600/10 text-indigo-400"
                      : "hover:bg-slate-800/40 hover:text-slate-200 text-slate-500"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && <div className="absolute left-0 w-1 h-1/2 bg-indigo-500 rounded-r-full" />}
                    <Icon size={isCollapsed ? 20 : 16} className={`${isCollapsed ? '' : 'mr-3'} ${isActive ? 'text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]' : ''}`} />
                    {!isCollapsed && <span className="z-10">{item.label}</span>}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom User Area */}
        <div className={`mx-3 mb-4 mt-auto shrink-0 transition-all ${isCollapsed ? 'p-2' : 'p-4'} bg-slate-900/40 rounded-2xl border border-slate-800/50`}>
          {isCollapsed ? (
            <div className="flex flex-col items-center gap-4">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getAvatarColor(user?.name || "")} flex items-center justify-center text-white font-black text-xs shadow-lg select-none shrink-0 cursor-help`} title={user?.name}>
                {getInitials(user?.name || "")}
              </div>
              <button
                onClick={logout}
                title="Sign Out"
                className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-all"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${getAvatarColor(user?.name || "")} flex items-center justify-center text-white font-black text-xs shadow-lg select-none shrink-0`}>
                  {getInitials(user?.name || "")}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] font-black text-white truncate block">{user?.name}</span>
                  <span className="text-[9px] text-slate-500 font-bold truncate block">{role === "admin" ? "Global Admin" : role}</span>
                </div>
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 py-2 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-white bg-[#050505] border border-slate-800 hover:border-slate-600 hover:bg-slate-800 rounded-xl transition-all"
              >
                <LogOut size={12} />
                <span>Sign Out</span>
              </button>
            </>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#f8fafc]">
        <header className="h-16 flex items-center justify-between px-10 bg-white border-b border-slate-200/60 sticky top-0 z-40 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <div className="min-w-0">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 mb-0.5">{title}</div>
            <h2 className="text-base font-black text-slate-900 tracking-tight truncate">{subtitle}</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${getAvatarColor(user?.name || "")} flex items-center justify-center text-white font-black text-xs shadow-lg select-none`}>
              {getInitials(user?.name || "")}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
          {children}
        </div>
      </main>
    </div>
  );
}
