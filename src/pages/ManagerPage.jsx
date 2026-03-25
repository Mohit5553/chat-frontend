import { useEffect, useState } from "react";
import Layout from "../components/Layout.jsx";
import StatCard from "../components/StatCard.jsx";
import { api } from "../api/client.js";

export default function ManagerPage() {
  const [analytics, setAnalytics] = useState(null);
  const [websites, setWebsites] = useState([]);
  const [agents, setAgents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [form, setForm] = useState({ websiteName: "", domain: "" });
  const [agentForm, setAgentForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");

  async function load() {
    try {
      const [analyticsData, websiteData, agentData, sessionData] = await Promise.all([
        api("/api/analytics"),
        api("/api/websites"),
        api("/api/users/agents"),
        api("/api/chat/manager/sessions")
      ]);

      setAnalytics(analyticsData);
      setWebsites(websiteData);
      setAgents(agentData);
      setSessions(sessionData);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createWebsite(event) {
    event.preventDefault();
    await api("/api/websites", {
      method: "POST",
      body: JSON.stringify(form)
    });
    setForm({ websiteName: "", domain: "" });
    load();
  }

  async function createAgent(event) {
    event.preventDefault();
    await api("/api/users/agents", {
      method: "POST",
      body: JSON.stringify(agentForm)
    });
    setAgentForm({ name: "", email: "", password: "" });
    load();
  }

  return (
    <Layout title="Global Command" subtitle="Institutional oversight and network health" menuItems={[
        { label: "Overview", href: "/admin" },
        { label: "Systems", href: "/admin?tab=systems" }
    ]}>
      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 px-6 py-4 rounded-2xl text-[13px] font-bold flex items-center gap-3 animate-bounce mb-8">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
            {error}
        </div>
      )}

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-10">
        <StatCard label="Linked Repositories" value={analytics?.totals?.websites ?? 0} />
        <StatCard label="Active Personnel" value={analytics?.totals?.agents ?? 0} />
        <StatCard label="Concurrent Streams" value={analytics?.totals?.liveSessions ?? 0} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-10">
        <form className="premium-card p-10 space-y-8" onSubmit={createWebsite}>
          <div className="space-y-1">
            <h3 className="heading-md">Link Terminal</h3>
            <p className="small-label opacity-60">Authorize a new domain connection.</p>
          </div>
          <div className="space-y-4">
             <div className="space-y-1.5">
                <label className="small-label">System Alias</label>
                <input 
                    value={form.websiteName} 
                    onChange={(event) => setForm((current) => ({ ...current, websiteName: event.target.value }))} 
                    placeholder="e.g. Main Hub" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-xs font-bold focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all"
                />
             </div>
             <div className="space-y-1.5">
                <label className="small-label">Target Host</label>
                <input 
                    value={form.domain} 
                    onChange={(event) => setForm((current) => ({ ...current, domain: event.target.value }))} 
                    placeholder="https://host.local" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-xs font-bold focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all"
                />
             </div>
          </div>
          <button type="submit" className="w-full bg-slate-950 text-white font-black text-[10px] uppercase tracking-[0.2em] py-4 rounded-xl hover:bg-black transition-all shadow-lg active:scale-[0.98]">Authorize Connection</button>
        </form>

        <form className="premium-card p-10 space-y-8" onSubmit={createAgent}>
          <div className="space-y-1">
            <h3 className="heading-md">Deploy Personnel</h3>
            <p className="small-label opacity-60">Initialize new operator credentials.</p>
          </div>
          <div className="space-y-4">
            <div className="space-y-1.5">
                <label className="small-label">Full Identity</label>
                <input value={agentForm.name} onChange={(event) => setAgentForm((current) => ({ ...current, name: event.target.value }))} placeholder="Operator Name" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-xs font-bold focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all" />
            </div>
            <div className="space-y-1.5">
                <label className="small-label">Access Email</label>
                <input value={agentForm.email} onChange={(event) => setAgentForm((current) => ({ ...current, email: event.target.value }))} placeholder="email@node.com" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-xs font-bold focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all" />
            </div>
            <div className="space-y-1.5">
                <label className="small-label">Security Key</label>
                <input value={agentForm.password} onChange={(event) => setAgentForm((current) => ({ ...current, password: event.target.value }))} placeholder="••••••••" type="password" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-xs font-bold focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all" />
            </div>
          </div>
          <button type="submit" className="w-full bg-indigo-600 text-white font-black text-[10px] uppercase tracking-[0.2em] py-4 rounded-xl hover:bg-indigo-700 transition-all shadow-lg active:scale-[0.98]">Initialize Agent</button>
        </form>
      </section>

      <section className="premium-card p-10 space-y-10 mb-10">
        <div className="flex flex-col gap-1">
            <h3 className="heading-md">System Registry</h3>
            <p className="small-label opacity-60">Synchronized website repositories and integration snippets.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {websites.map((website) => (
              <article key={website._id} className="p-8 bg-slate-50/50 rounded-3xl border border-slate-100 group hover:border-indigo-100 transition-all">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-lg shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">🌐</div>
                        <div>
                            <strong className="text-xs font-black text-slate-950 uppercase tracking-tight block">{website.websiteName}</strong>
                            <span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">{website.domain}</span>
                        </div>
                    </div>
                    <code className="text-[9px] font-black text-slate-400 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">{website.apiKey}</code>
                </div>
                <div className="relative">
                    <textarea readOnly value={website.embedScript} rows={3} className="w-full bg-slate-950 text-indigo-300 font-mono text-[9px] p-5 rounded-2xl border border-slate-800 outline-none resize-none shadow-inner leading-relaxed" />
                    <div className="absolute top-2 right-2 px-2 py-1 bg-white/5 backdrop-blur-sm rounded text-[8px] font-black text-slate-500 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Copy</div>
                </div>
              </article>
            ))}
        </div>
      </section>

      <section className="premium-card p-0 overflow-hidden">
        <div className="p-10 border-b border-slate-50 bg-slate-50/30">
            <h3 className="heading-md">Stream Monitor</h3>
            <p className="small-label opacity-60">Real-time oversight of concurrent visitor sessions.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-10 py-5 small-label">Network Source</th>
                <th className="px-10 py-5 small-label">Client Identity</th>
                <th className="px-10 py-5 small-label">Operation Status</th>
                <th className="px-10 py-5 small-label">Assigned Resource</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {sessions.map((session) => (
                <tr key={session._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-10 py-6 text-xs font-black text-slate-950 uppercase tracking-tight">{session.websiteId?.websiteName}</td>
                  <td className="px-10 py-6 text-xs font-bold text-slate-400 tracking-widest">{session.visitorId?.visitorId}</td>
                  <td className="px-10 py-6">
                      <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                          session.status === 'active' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}>
                          {session.status}
                      </span>
                  </td>
                  <td className="px-10 py-6">
                      <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-slate-200 text-[10px] flex items-center justify-center font-black text-slate-600">
                              {session.assignedAgent?.name?.[0] || 'Q'}
                          </div>
                          <span className="text-xs font-bold text-slate-600 uppercase tracking-tighter">{session.assignedAgent?.name || "Unassigned"}</span>
                      </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </Layout>
  );
}

