import { useState, useEffect } from "react";
import { Globe, Plus, Trash2, Copy, Check, Settings, Code } from "lucide-react";
import { api } from "../api/client.js";

const COLOR_PRESETS = [
  { primary: "#6366f1", accent: "#4f46e5", name: "Indigo" },
  { primary: "#3b82f6", accent: "#2563eb", name: "Blue" },
  { primary: "#10b981", accent: "#059669", name: "Emerald" },
  { primary: "#f59e0b", accent: "#d97706", name: "Amber" },
  { primary: "#ef4444", accent: "#dc2828", name: "Rose" },
  { primary: "#8b5cf6", accent: "#7c3aed", name: "Purple" },
  { primary: "#ec4899", accent: "#db2777", name: "Pink" },
  { primary: "#0f172a", accent: "#020617", name: "Slate" }
];

export default function WebsiteManager() {
  const [websites, setWebsites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    websiteName: "",
    domain: "",
    primaryColor: "#6366f1",
    accentColor: "#f59e0b",
    launcherIcon: "💬",
    awayMessage: "Hello! We're currently offline, but if you leave a message, we'll get back to you shortly.",
    isActive: true
  });

  const fetchWebsites = async () => {
    try {
      const data = await api("/api/websites");
      setWebsites(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWebsites();
  }, []);

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({
      websiteName: "",
      domain: "",
      primaryColor: "#6366f1",
      accentColor: "#f59e0b",
      accentColor: "#f59e0b",
      launcherIcon: "💬",
      awayMessage: "Hello! We're currently offline, but if you leave a message, we'll get back to you shortly.",
      isActive: true
    });
  };

  const handleEdit = (website) => {
    setEditingId(website._id);
    setFormData({
      websiteName: website.websiteName || "",
      domain: website.domain || "",
      primaryColor: website.primaryColor || "#6366f1",
      accentColor: website.accentColor || "#f59e0b",
      accentColor: website.accentColor || "#f59e0b",
      launcherIcon: website.launcherIcon || "💬",
      awayMessage: website.awayMessage || "Hello! We're currently offline, but if you leave a message, we'll get back to you shortly.",
      isActive: website.isActive !== false
    });
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api(`/api/websites/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(formData)
        });
      } else {
        await api("/api/websites", {
          method: "POST",
          body: JSON.stringify(formData)
        });
      }
      handleCancel();
      fetchWebsites();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return (
     <div className="space-y-10 animate-pulse">
        <div className="flex items-center justify-between">
           <div className="space-y-3">
              <div className="h-8 w-64 bg-slate-200 rounded-xl"></div>
              <div className="h-4 w-96 bg-slate-100 rounded-lg"></div>
           </div>
           <div className="h-12 w-48 bg-indigo-50 rounded-2xl"></div>
        </div>
        <div className="grid grid-cols-1 gap-6">
           {[1, 2, 3].map(i => (
              <div key={i} className="h-48 w-full bg-slate-50 rounded-[32px] border border-slate-100"></div>
           ))}
        </div>
     </div>
  );

  const PreviewWidget = ({ data }) => (
    <div className="hidden lg:flex flex-col h-full w-full bg-slate-100 border border-slate-200/60 rounded-3xl relative overflow-hidden pt-6 px-6 drop-shadow-sm">
      <div className="space-y-2 mb-4">
        <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] text-center">Live Preview</h4>
      </div>
      <div className="flex-1 w-full bg-white rounded-t-2xl shadow-sm border border-slate-200 relative overflow-hidden flex flex-col">
         {/* Browser Chrome */}
         <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2 shrink-0">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400 shadow-inner"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-inner"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-inner"></div>
            <div className="ml-4 bg-white px-4 py-1.5 rounded-md text-[8px] font-bold text-slate-400 border border-slate-200 w-1/2 flex items-center gap-2">
               <Globe size={10} className="text-slate-300"/> {data.domain || 'yourdomain.com'}
            </div>
         </div>
         {/* Page Content Ghost */}
         <div className="p-8 space-y-4 opacity-50 flex-1">
            <div className="h-4 w-1/3 bg-slate-200 rounded-md"></div>
            <div className="h-2 w-full bg-slate-100 rounded-md"></div>
            <div className="h-2 w-5/6 bg-slate-100 rounded-md"></div>
            <div className="h-2 w-4/6 bg-slate-100 rounded-md"></div>
         </div>
         
         {/* Live Chat Widget */}
         <div className="absolute bottom-4 right-4 flex flex-col items-end gap-3 z-10 w-[240px] pointer-events-none transition-all duration-300" style={{ filter: data.isActive ? 'none' : 'grayscale(1) opacity(0.6)' }}>
            <div className="w-full bg-white shadow-2xl rounded-2xl overflow-hidden border border-slate-100 flex flex-col transform transition-all hover:-translate-y-1 origin-bottom-right">
               {/* Widget Header */}
               <div className="p-4 transition-colors" style={{ backgroundColor: data.primaryColor }}>
                  <h5 className="text-white text-[12px] font-bold drop-shadow-sm">{data.websiteName || 'Your Awesome Brand'}</h5>
                  <p className="text-white/80 text-[9px] mt-0.5 font-medium">We typically reply in minutes</p>
               </div>
               {/* Widget Messages */}
               <div className="p-3 bg-[#f8fafc] space-y-3 min-h-[140px] border-b border-indigo-50/50">
                  <div className="flex items-start gap-2 animate-in slide-in-from-bottom-2 fade-in duration-500">
                     <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] text-white shadow-md transition-colors shrink-0" style={{ backgroundColor: data.primaryColor }}>
                        {data.launcherIcon}
                     </div>
                     <div className="bg-white border border-slate-200 p-2.5 rounded-xl rounded-tl-sm text-[10px] text-slate-600 shadow-sm leading-relaxed shrink min-w-[50px]">
                        {data.awayMessage || 'Hello! How can we help?'}
                     </div>
                  </div>
               </div>
               {/* Widget Input Mock */}
               <div className="p-3 bg-white flex gap-2 items-center">
                  <div className="flex-1 bg-slate-50 rounded-lg p-2 text-[9px] text-slate-400 border border-slate-100">Type a message...</div>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-sm transition-colors" style={{ backgroundColor: data.primaryColor }}>
                     <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                  </div>
               </div>
            </div>

            {/* Launcher Button */}
            <div className="w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-xl text-white transition-all hover:scale-110 hover:shadow-xl" style={{ backgroundColor: data.primaryColor }}>
               <span className="drop-shadow-sm">{data.launcherIcon}</span>
            </div>
         </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
         <div className="space-y-1">
            <h3 className="heading-md">Website Ecosystem</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Securely manage registered domains and widget credentials.</p>
         </div>
         <button 
           onClick={() => isAdding ? handleCancel() : setIsAdding(true)}
           className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl shadow-indigo-100 flex items-center gap-3"
         >
           <Plus size={16} />
           {isAdding ? "Cancel" : "Register Website"}
         </button>
      </div>

      {isAdding && (
         <form onSubmit={handleSubmit} className="premium-card p-10 animate-in zoom-in-95 duration-500 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-14">
               {/* Left Segment: Form Inputs */}
               <div className="lg:col-span-2 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-5">
                        <div className="space-y-1.5 pt-1">
                           <label className="small-label flex justify-between">
                              Website Name <span className="text-[9px] text-indigo-400 font-bold uppercase">Required</span>
                           </label>
                           <input
                             value={formData.websiteName}
                             onChange={(e) => setFormData({ ...formData, websiteName: e.target.value })}
                             className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-xs font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder-slate-300"
                             placeholder="My Store"
                             required
                           />
                        </div>
                        <div className="space-y-1.5 pt-1">
                           <label className="small-label">Root Domain</label>
                           <input
                             value={formData.domain}
                             onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                             className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-xs font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder-slate-300"
                             placeholder="mystore.com"
                             required
                           />
                        </div>
                        <div className="space-y-1.5 pt-1">
                           <label className="small-label">Auto-Responder / Away Message</label>
                           <textarea
                             value={formData.awayMessage}
                             onChange={(e) => setFormData({ ...formData, awayMessage: e.target.value })}
                             className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-xs font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all h-28 resize-none text-slate-600"
                             required
                           />
                        </div>
                     </div>
                     <div className="space-y-5">
                        <div className="space-y-3 pt-1">
                           <label className="small-label">Brand Color Pattern</label>
                           <div className="flex flex-wrap gap-2.5">
                              {COLOR_PRESETS.map((preset) => (
                                 <button
                                    key={preset.name}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, primaryColor: preset.primary, accentColor: preset.accent })}
                                    className={`w-[42px] h-[42px] rounded-2xl border-[3px] transition-all hover:scale-110 ${formData.primaryColor === preset.primary ? 'border-slate-900 scale-110 shadow-lg' : 'border-transparent shadow-sm'}`}
                                    style={{ backgroundColor: preset.primary }}
                                    title={preset.name}
                                 />
                              ))}
                           </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-1.5 pt-1">
                              <label className="small-label">Launcher Icon</label>
                              <input
                                 value={formData.launcherIcon}
                                 onChange={(e) => setFormData({ ...formData, launcherIcon: e.target.value })}
                                 className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-black focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-center"
                                 placeholder="💬"
                                 maxLength={4}
                              />
                           </div>
                           <div className="space-y-1.5 pt-1">
                              <label className="small-label">System Status</label>
                              <button
                                 type="button"
                                 onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                                 className={`w-full py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-sm ${
                                    formData.isActive 
                                       ? "bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100"
                                       : "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                                 }`}
                              >
                                 {formData.isActive ? "🟢 Active Engine" : "🔴 Offline"}
                              </button>
                           </div>
                        </div>
                     </div>
                  </div>
                  
                  <div className="pt-2 border-t border-slate-100">
                     <button type="submit" className="w-full hover:scale-[1.01] active:scale-[0.99] bg-slate-900 hover:bg-black text-white font-black text-[11px] uppercase tracking-[0.2em] py-5 rounded-2xl shadow-xl shadow-slate-200 transition-all mt-4 flex items-center justify-center gap-3">
                        <Check size={16} /> 
                        {editingId ? "Update Ecosystem Details" : "Launch Registration Sequence"}
                     </button>
                  </div>
               </div>
               
               {/* Right Segment: Live Preview */}
               <PreviewWidget data={formData} />
            </div>
         </form>
      )}

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 px-6 py-4 rounded-2xl text-[11px] font-bold">
          Error: {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-8">
        {websites.map((website) => (
          <div key={website._id} className={`premium-card p-0 overflow-hidden group hover:shadow-[0_20px_40px_-15px_rgba(99,102,241,0.1)] transition-all duration-500 border-2 ${website.isActive !== false ? 'border-transparent hover:border-indigo-50/50' : 'border-slate-100 opacity-80 grayscale hover:grayscale-0'}`}>
             <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6 relative">
                {website.isActive === false && <div className="absolute inset-0 bg-slate-50/50 z-0"></div>}
                
                <div className="flex items-center gap-6 relative z-10">
                   <div 
                     className="w-[72px] h-[72px] rounded-[24px] flex items-center justify-center text-3xl shadow-inner shrink-0"
                     style={{ backgroundColor: website.primaryColor + '15', color: website.primaryColor }}
                   >
                      <Globe size={32} />
                   </div>
                   <div className="space-y-2">
                      <div className="flex items-center gap-3">
                         <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">{website.websiteName}</h4>
                         <span className={`px-2.5 py-1 text-[8px] font-black uppercase tracking-widest rounded-md shadow-sm ${website.isActive !== false ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                            {website.isActive !== false ? 'Live Connection' : 'Offline'}
                         </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                         {website.domain}
                         {website.managerId?.name && (
                            <>
                               <span className="w-1.5 h-1.5 rounded-full bg-slate-200"></span>
                               <span className="text-indigo-400 font-black px-2 py-0.5 bg-indigo-50 rounded-md truncate max-w-[120px]" title={website.managerId.name}>
                                 Client: {website.managerId.name}
                               </span>
                            </>
                         )}
                      </p>
                   </div>
                </div>
                <div className="flex gap-3 relative z-10 shrink-0">
                   <button 
                     onClick={() => handleEdit(website)}
                     className="px-6 py-3.5 rounded-2xl bg-white text-slate-600 font-bold text-[10px] uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all shadow-sm border border-slate-200 flex items-center gap-2 hover:scale-105"
                   >
                      <Settings size={14} /> Configure
                   </button>
                </div>
             </div>
             
             <div className="p-8 bg-slate-50/30 grid grid-cols-1 xl:grid-cols-3 gap-8 items-start relative z-10">
                 <div className="xl:col-span-2 space-y-4">
                     <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Deployment Snippet</span>
                     <div className="relative group/copy">
                        <div className="bg-[#0b0f19] border border-slate-800 rounded-3xl p-6 font-mono text-[11px] leading-relaxed flex items-start gap-5 pr-16 shadow-2xl relative overflow-hidden transition-colors">
                           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-60"></div>
                           <div className="text-slate-700 select-none hidden sm:block text-right pt-[1px]">1<br/>2<br/>3<br/>4<br/>5<br/>6<br/>7<br/>8</div>
                           <div className="text-emerald-100/90 whitespace-pre-wrap break-all w-full overflow-x-auto selection:bg-indigo-500/30">
                              {website.embedScript}
                           </div>
                        </div>
                        <button 
                           onClick={() => handleCopy(website.embedScript, website._id)}
                           className="absolute right-4 top-1/2 -translate-y-1/2 p-3.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl backdrop-blur-md shadow-xl hover:scale-110 active:scale-95 transition-all outline-none border border-white/5 disabled:opacity-50"
                        >
                           {copiedId === website._id ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                        </button>
                     </div>
                 </div>

                 <div className="xl:col-span-1 grid grid-cols-2 xl:grid-cols-1 gap-5">
                     <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm shadow-slate-200/50 space-y-3 hover:-translate-y-1 transition-transform xl:aspect-auto aspect-square flex flex-col justify-center">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                           <div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div> Auth Hash
                        </span>
                        <p className="text-[11px] font-black text-slate-900 font-mono truncate bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100">{website.apiKey.substring(0, 15)}...</p>
                     </div>
                     <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm shadow-slate-200/50 space-y-4 hover:-translate-y-1 transition-transform xl:aspect-auto aspect-square flex flex-col justify-center">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                           <div className="w-1.5 h-1.5 rounded-full bg-pink-400"></div> Launcher 
                        </span>
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 rounded-2xl shadow-lg flex items-center justify-center text-xl hover:scale-110 transition-transform" style={{ backgroundColor: website.primaryColor, color: '#fff' }}>
                              <span className="drop-shadow-sm">{website.launcherIcon}</span>
                           </div>
                           <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-tight">Live<br/>Preview</span>
                        </div>
                     </div>
                 </div>
             </div>
          </div>
        ))}
        {websites.length === 0 && !isAdding && (
          <div className="p-32 border-2 border-dashed border-slate-200/60 rounded-[48px] text-center space-y-6 bg-slate-50/30">
             <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 bg-indigo-100 rounded-full animate-ping opacity-20"></div>
                <div className="absolute inset-2 bg-indigo-50 rounded-full animate-pulse"></div>
                <Globe size={40} className="text-indigo-400 relative z-10" />
             </div>
             <div className="space-y-2">
                <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase">Ready for Deployment</h3>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">Add your first domain to generate widget credentials.</p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
