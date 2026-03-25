import { ArrowUpRight } from "lucide-react";

export default function StatCard({ label, value, trend, color = "indigo" }) {
  const colors = {
    indigo: "from-indigo-500 to-indigo-600 shadow-indigo-500/20 text-indigo-500",
    orange: "from-orange-500 to-amber-500 shadow-orange-500/20 text-orange-500",
    rose: "from-rose-500 to-pink-500 shadow-rose-500/20 text-rose-500",
    emerald: "from-emerald-500 to-teal-500 shadow-emerald-500/20 text-emerald-500"
  };

  const selectedColor = colors[color] || colors.indigo;

  return (
    <article className="premium-card p-10 group hover:-translate-y-1 transition-all duration-500 bg-white border border-slate-200/60 shadow-sm rounded-[40px] overflow-hidden flex flex-col justify-between">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
           <span className="text-[10px] whitespace-nowrap font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-slate-600 transition-colors">{label}</span>
           {trend && (
             <div className={`px-2 py-1 rounded-lg bg-slate-50 text-[9px] font-black uppercase tracking-tighter flex items-center gap-1 group-hover:bg-white transition-colors`}>
               <ArrowUpRight size={10} className={selectedColor.split(' ').pop()} />
               <span className="text-slate-400">{trend}</span>
             </div>
           )}
        </div>
        <div className="flex items-baseline gap-2">
           <strong className="text-4xl font-black text-slate-900 tracking-tighter">{value}</strong>
        </div>
      </div>
      <div className={`h-1.5 w-12 bg-slate-100 rounded-full mt-10 group-hover:w-20 bg-gradient-to-r ${selectedColor.split(' ').slice(0, 2).join(' ')} transition-all duration-700 shadow-md`}></div>
    </article>
  );
}
