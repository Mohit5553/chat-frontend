import { useState, useEffect } from "react";
import { UserPlus, Mail, Shield, Activity, Search, Trash2, Building2, Globe, Users } from "lucide-react";
import { api } from "../api/client.js";

export default function ClientManager() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  });

  const fetchClients = async () => {
    try {
      const data = await api("/api/users/clients");
      setClients(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api("/api/users/clients", {
        method: "POST",
        body: JSON.stringify(formData)
      });
      setIsAdding(false);
      setFormData({ name: "", email: "", password: "" });
      fetchClients();
    } catch (err) {
      setError(err.message);
    }
  };

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="text-center py-20 animate-pulse text-slate-400 font-black uppercase text-[10px] tracking-widest">Synchronizing Client Network...</div>;

  return (
    <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
         <div className="space-y-1">
            <h3 className="heading-md">Client Portal Management</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Manage high-level client accounts and their respective ecosystems.</p>
         </div>
         <div className="flex gap-4">
            <div className="relative">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
               <input 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search clients..."
                  className="bg-white border border-slate-200 rounded-2xl pl-10 pr-6 py-3.5 text-xs font-bold focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all w-64 shadow-sm"
               />
            </div>
            <button 
               onClick={() => setIsAdding(!isAdding)}
               className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl shadow-indigo-100 flex items-center gap-3"
            >
               <UserPlus size={16} />
               {isAdding ? "Cancel" : "Add Client"}
            </button>
         </div>
      </div>

      {isAdding && (
         <form onSubmit={handleSubmit} className="premium-card p-10 grid grid-cols-1 md:grid-cols-3 gap-8 animate-in zoom-in-95 duration-500 bg-white">
            <div className="space-y-1.5">
               <label className="small-label text-slate-400">Client Name</label>
               <input
                 value={formData.name}
                 onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                 className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-xs font-bold focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all"
                 placeholder="Acme Corp"
                 required
               />
            </div>
            <div className="space-y-1.5">
               <label className="small-label text-slate-400">Contact Email</label>
               <input
                 type="email"
                 value={formData.email}
                 onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                 className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-xs font-bold focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all"
                 placeholder="client@example.com"
                 required
               />
            </div>
            <div className="space-y-1.5 flex flex-col justify-end">
               <input
                 type="password"
                 value={formData.password}
                 onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                 className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-xs font-bold focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all"
                 placeholder="Client Password"
                 required
               />
               <button type="submit" className="bg-slate-900 hover:bg-black text-white font-black text-[10px] uppercase tracking-[0.2em] py-4 rounded-2xl shadow-xl shadow-slate-200 transition-all mt-4">
                  Finalize Client Creation
               </button>
            </div>
         </form>
      )}

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 px-6 py-4 rounded-2xl text-[11px] font-bold">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {filteredClients.map((client) => (
          <div key={client._id} className="premium-card p-8 group hover:shadow-2xl hover:shadow-indigo-500/5 transition-all flex items-center gap-8 relative">
             <div className="w-20 h-20 rounded-[28px] bg-slate-900 flex items-center justify-center text-white text-2xl font-black shadow-xl group-hover:bg-indigo-600 transition-all shrink-0">
                <Building2 size={32} />
             </div>
             
             <div className="flex-1 min-w-0 space-y-3">
                <div className="space-y-0.5">
                   <h4 className="text-base font-black text-slate-900 tracking-tight uppercase">{client.name}</h4>
                   <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold truncate">
                      <Mail size={12} />
                      {client.email}
                   </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                   <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg">
                      <Shield size={10} className="text-indigo-500" />
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{client.role}</span>
                   </div>
                   <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg">
                      <Globe size={10} className="text-emerald-500" />
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{client.websiteCount || 0} Websites</span>
                   </div>
                   <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg">
                      <Users size={10} className="text-amber-500" />
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{client.agentCount || 0} Agents</span>
                   </div>
                </div>
             </div>

             <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all">
                <button className="p-3 text-slate-300 hover:text-red-500 transition-colors">
                   <Trash2 size={16} />
                </button>
             </div>
          </div>
        ))}

        {filteredClients.length === 0 && !isAdding && (
          <div className="col-span-full p-24 border-2 border-dashed border-slate-100 rounded-[40px] text-center space-y-4">
             <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto text-slate-300">
                <Building2 size={32} />
             </div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">No client entities found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
