import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import { Download, Users, TrendingUp, Award, Globe, MessageSquare } from "lucide-react";
import { API_BASE } from "../api/client.js";

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];

export default function DetailedAnalytics({ analytics }) {
  const leaderboard = analytics.leaderboard || [];
  const topCountries = analytics.topCountries || [];
  const feedback = analytics.feedback || { satisfactionRate: 0, satisfiedChats: 0, unsatisfiedChats: 0 };

  const pieData = [
    { name: 'Satisfied', value: feedback.satisfiedChats },
    { name: 'Unsatisfied', value: feedback.unsatisfiedChats }
  ].filter(d => d.value > 0);

  const handleExport = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/analytics/export/csv`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("dashboard_token")}`
        }
      });
      
      if (!response.ok) throw new Error("Failed to authenticate or generate report");
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `Intelligence_Report_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error(err);
      alert("Failed to generate and download intelligence report.");
    }
  };

  return (
    <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
         <div className="space-y-1">
            <h3 className="heading-md">Intelligence Reports</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Deep-dive into operational performance and user satisfaction.</p>
         </div>
         <button 
           onClick={handleExport}
           className="bg-slate-900 hover:bg-black text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl shadow-slate-200 flex items-center gap-3"
         >
           <Download size={16} />
           Export CSV Data
         </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Feedback Chart */}
         <div className="premium-card p-10 flex flex-col items-center justify-center space-y-6">
            <div className="text-center">
               <span className="small-label">Satisfaction Score</span>
               <h4 className="text-4xl font-black text-slate-900 mt-2">{feedback.satisfactionRate}%</h4>
            </div>
            <div className="h-[200px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                     <Pie
                        data={pieData.length ? pieData : [{ name: 'No Data', value: 1 }]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                     >
                        {pieData.length ? pieData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        )) : <Cell fill="#f1f5f9" />}
                     </Pie>
                     <Tooltip />
                  </PieChart>
               </ResponsiveContainer>
            </div>
            <div className="flex gap-6">
               <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Satisfied ({feedback.satisfiedChats})</span>
               </div>
               <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unsatisfied ({feedback.unsatisfiedChats})</span>
               </div>
            </div>
         </div>

         {/* Leaderboard */}
         <div className="lg:col-span-2 premium-card p-0 overflow-hidden flex flex-col">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <Award className="text-indigo-500" size={20} />
                  <h3 className="heading-md">Agent Leaderboard</h3>
               </div>
               <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Top Performers</span>
            </div>
            <div className="flex-1 overflow-x-auto">
               <table className="w-full text-left border-collapse">
                  <thead>
                     <tr className="bg-slate-50/50">
                        <th className="p-6 small-label">Agent Identity</th>
                        <th className="p-6 small-label text-center">Volume</th>
                        <th className="p-6 small-label text-center">Avg Handle</th>
                        <th className="p-6 small-label text-right">Performance</th>
                     </tr>
                  </thead>
                  <tbody>
                     {leaderboard.map((agent, i) => (
                        <tr key={agent._id} className="border-t border-slate-50 hover:bg-slate-50/30 transition-colors">
                           <td className="p-6">
                              <div className="flex items-center gap-4">
                                 <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-[10px] uppercase">
                                    {agent.name.split(" ").map(n => n[0]).join("")}
                                 </div>
                                 <div>
                                    <p className="text-xs font-black text-slate-900 uppercase truncate max-w-[120px]">{agent.name}</p>
                                    <p className="text-[9px] text-slate-400 font-bold truncate max-w-[120px]">{agent.email}</p>
                                 </div>
                              </div>
                           </td>
                           <td className="p-6 text-center">
                              <span className="text-xs font-black text-slate-900">{agent.chatsHandled}</span>
                           </td>
                           <td className="p-6 text-center">
                              <span className="text-xs font-black text-slate-400 font-mono italic">{Math.round(agent.avgHandleSeconds || 0)}s</span>
                           </td>
                           <td className="p-6 text-right">
                              <div className="flex items-center justify-end gap-1">
                                 {Array.from({ length: 5 }).map((_, star) => (
                                    <div key={star} className={`w-1.5 h-1.5 rounded-full ${star < 4 - i ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]' : 'bg-slate-200'}`}></div>
                                 ))}
                              </div>
                           </td>
                        </tr>
                     ))}
                     {leaderboard.length === 0 && (
                        <tr>
                           <td colSpan="4" className="p-12 text-center text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Insufficient data for ranking.</td>
                        </tr>
                     )}
                  </tbody>
               </table>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* Geography */}
         <div className="premium-card p-10 space-y-8">
            <div className="flex items-center justify-between">
               <div className="space-y-1">
                  <h3 className="heading-md">Global Footprint</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Traffic distribution by origin.</p>
               </div>
               <Globe className="text-slate-200" size={24} />
            </div>
            <div className="h-[300px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topCountries} layout="vertical">
                     <CartesianGrid strokeDasharray="5 5" horizontal={false} stroke="#f1f5f9" />
                     <XAxis type="number" hide />
                     <YAxis dataKey="country" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#64748b' }} width={80} />
                     <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: '900' }}
                     />
                     <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
                        {topCountries.map((_, index) => (
                           <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                     </Bar>
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* Trends */}
         <div className="premium-card p-10 space-y-8">
            <div className="flex items-center justify-between">
               <div className="space-y-1">
                  <h3 className="heading-md">Acquisition Momentum</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Monthly visitor growth.</p>
               </div>
               <TrendingUp className="text-slate-200" size={24} />
            </div>
            <div className="h-[300px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.trends?.monthlyVisitors || []}>
                     <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="#f1f5f9" />
                     <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#64748b' }} dy={10} />
                     <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: '900' }}
                     />
                     <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>
      </div>
    </div>
  );
}
