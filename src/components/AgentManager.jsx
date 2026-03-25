import { useState, useEffect } from "react";
import { UserPlus, Mail, Shield, Activity, Search, Trash2, Settings } from "lucide-react";
import { api } from "../api/client.js";

export default function AgentManager() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  });

  const fetchAgents = async () => {
    try {
      const data = await api("/api/users/agents");
      setAgents(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({ name: "", email: "", password: "" });
  };

  const handleEdit = (agent) => {
    setEditingId(agent._id);
    setFormData({
      name: agent.name || "",
      email: agent.email || "",
      password: ""
    });
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to completely revoke this agent's clearance and delete them?")) return;
    try {
      await api(`/api/users/agents/${id}`, { method: "DELETE" });
      fetchAgents();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      if (!payload.password) delete payload.password; // Don't send empty password strings when updating
      
      if (editingId) {
        await api(`/api/users/agents/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(payload)
        });
      } else {
        await api("/api/users/agents", {
          method: "POST",
          body: JSON.stringify(payload)
        });
      }
      handleCancel();
      fetchAgents();
    } catch (err) {
      setError(err.message);
    }
  };

  const filteredAgents = agents.filter(agent => 
    agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="text-center py-20 animate-pulse text-slate-400 font-black uppercase text-[10px] tracking-widest">Synchronizing Force...</div>;

  return (
    <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
         <div className="space-y-1">
            <h3 className="heading-md">Agent Command</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Manage security cleared support personnel.</p>
         </div>
         <div className="flex gap-4">
            <div className="relative">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
               <input 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter agents..."
                  className="bg-white border border-slate-200 rounded-2xl pl-10 pr-6 py-3.5 text-xs font-bold focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all w-64 shadow-sm"
               />
            </div>
            <button 
               onClick={() => isAdding ? handleCancel() : setIsAdding(true)}
               className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl shadow-indigo-100 flex items-center gap-3"
            >
               <UserPlus size={16} />
               {isAdding ? "Cancel" : "Add Agent"}
            </button>
         </div>
      </div>

      {isAdding && (
         <form onSubmit={handleSubmit} className="premium-card p-10 animate-in zoom-in-95 duration-500 bg-white space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               <div className="space-y-1.5">
                  <label className="small-label text-slate-400 flex justify-between">
                     Identity Name <span className="text-[9px] text-indigo-400 font-bold uppercase">Required</span>
                  </label>
                  <input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-xs font-bold focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all placeholder-slate-300"
                    placeholder="John Doe"
                    required
                  />
               </div>
               <div className="space-y-1.5">
                  <label className="small-label text-slate-400 flex justify-between">
                     Secure Email <span className="text-[9px] text-indigo-400 font-bold uppercase">Required</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-xs font-bold focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all placeholder-slate-300"
                    placeholder="agent@example.com"
                    required
                  />
               </div>
               <div className="space-y-1.5">
                  <label className="small-label text-slate-400 flex justify-between">
                     Access Password <span className="text-[9px] text-slate-300 font-bold uppercase">{editingId ? 'Optional' : 'Required'}</span>
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-xs font-bold focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all placeholder-slate-300"
                    placeholder={editingId ? "Leave blank to keep current" : "••••••••"}
                    required={!editingId}
                  />
               </div>
            </div>
            <div className="pt-8 border-t border-slate-100 flex justify-end">
               <button type="submit" className="bg-slate-900 hover:bg-black text-white font-black text-[10px] uppercase tracking-[0.2em] px-10 py-4 rounded-2xl shadow-xl shadow-slate-200 transition-all flex items-center justify-center min-w-[200px] hover:scale-105 active:scale-95">
                  {editingId ? "Update Identity" : "Confirm Clearance"}
               </button>
            </div>
         </form>
      )}

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 px-6 py-4 rounded-2xl text-[11px] font-bold">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredAgents.map((agent) => (
          <div key={agent._id} className="premium-card p-8 group hover:shadow-2xl hover:shadow-indigo-500/5 transition-all relative">
             <div className="flex items-start justify-between mb-8">
                <div className={`w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center text-white text-xl font-black shadow-xl group-hover:bg-indigo-600 transition-all`}>
                   {agent.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div className="relative h-10 flex items-center justify-end w-[100px]">
                   <div className={`absolute right-0 px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm transition-all duration-300 pointer-events-none group-hover:opacity-0 group-hover:translate-x-4 ${agent.isOnline ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400'}`}>
                      {agent.isOnline ? 'Active' : 'Offline'}
                   </div>
                   <div className="absolute right-0 opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 flex gap-1">
                      <button onClick={() => handleEdit(agent)} className="p-2.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-xl transition-all">
                         <Settings size={15} />
                      </button>
                      <button onClick={() => handleDelete(agent._id)} className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                         <Trash2 size={15} />
                      </button>
                   </div>
                </div>
             </div>
             
             <div className="space-y-4">
                <div className="space-y-1">
                   <h4 className="text-sm font-black text-slate-900 tracking-tight uppercase">{agent.name}</h4>
                   <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400 font-bold">
                      <div className="flex items-center gap-1.5 truncate">
                         <Mail size={12} />
                         {agent.email}
                      </div>
                      {agent.managerId?.name && (
                         <>
                            <span className="w-1 h-1 rounded-full bg-slate-200 hidden sm:block"></span>
                            <span className="text-indigo-400 font-black px-2 py-1 bg-indigo-50 rounded-md truncate max-w-[140px]" title={agent.managerId.name}>
                              Org: {agent.managerId.name}
                            </span>
                         </>
                      )}
                   </div>
                </div>

                <div className="pt-6 border-t border-slate-100 grid grid-cols-2 gap-4">
                   <div className="space-y-1">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Protocol</span>
                      <p className="text-[10px] font-black text-slate-950 flex items-center gap-1.5 lowercase">
                         <Shield size={10} className="text-indigo-400" />
                         {agent.role}
                      </p>
                   </div>
                   <div className="space-y-1 text-right">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Availability</span>
                      <div className="flex items-center justify-end gap-1.5">
                         <span className={`w-1.5 h-1.5 rounded-full ${agent.isAvailable ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`}></span>
                         <span className="text-[10px] font-black text-slate-950 uppercase">{agent.isAvailable ? 'Ready' : 'Standby'}</span>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        ))}

        {filteredAgents.length === 0 && !isAdding && (
          <div className="col-span-full p-24 border-2 border-dashed border-slate-100 rounded-[40px] text-center space-y-4">
             <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto text-slate-300">
                <Activity size={32} />
             </div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">No agents found in the current directive.</p>
          </div>
        )}
      </div>
    </div>
  );
}
