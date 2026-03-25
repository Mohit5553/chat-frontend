import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

function destinationForRole(role) {
  if (role === "agent") return "/agent";
  if (role === "admin") return "/admin";
  return "/client";
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const user = mode === "login"
        ? await login(email, password)
        : await register({ name, email, password, role: "client" });

      navigate(destinationForRole(user.role));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#090e1a] overflow-hidden relative font-sans">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <form className="w-full max-w-[440px] bg-white rounded-[2.5rem] p-12 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] relative z-10 space-y-10 border border-white/20 animate-in fade-in zoom-in duration-700" onSubmit={submit}>
        <div className="space-y-3 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[9px] uppercase font-black tracking-[0.2em] leading-none mb-2 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            All Systems Operational
          </div>
          <h1 className="text-4xl font-black text-slate-950 tracking-tighter leading-none">
            {mode === "login" ? "Welcome back." : "Create Account."}
          </h1>
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
            {mode === "login" ? "Access your operational dashboard" : "Initialize a new enterprise instance"}
          </p>
        </div>

        <div className="p-1.5 bg-slate-50 rounded-2xl flex gap-1 border border-slate-100">
          <button
            type="button"
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-300 ${
              mode === "login" ? "bg-white text-slate-950 shadow-sm border border-slate-100" : "text-slate-400 hover:text-slate-600"
            }`}
            onClick={() => setMode("login")}
          >
            Login
          </button>
          <button
            type="button"
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-300 ${
              mode === "register" ? "bg-white text-slate-950 shadow-sm border border-slate-100" : "text-slate-400 hover:text-slate-600"
            }`}
            onClick={() => setMode("register")}
          >
            Register
          </button>
        </div>

        <div className="space-y-5">
          {mode === "register" && (
            <div className="space-y-1.5">
               <label className="small-label">Identity Name</label>
               <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Full Name"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-xs font-bold focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300"
                required
                />
            </div>
          )}
          <div className="space-y-1.5">
            <label className="small-label">Access Email</label>
            <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="email@example.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-xs font-bold focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300"
                required
            />
          </div>
          <div className="space-y-1.5">
            <label className="small-label">Security Key</label>
            <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                type="password"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-xs font-bold focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300"
                required
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-5 rounded-2xl text-[11px] font-black uppercase tracking-tight text-center border border-red-100 animate-in shake duration-500">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-slate-950 hover:bg-black disabled:bg-slate-200 text-white font-black text-[10px] uppercase tracking-[0.25em] py-5 rounded-2xl shadow-xl shadow-slate-200 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
        >
          {loading ? (
              <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: '0.4s' }}></span>
              </span>
          ) : mode === "login" ? "Authenticate" : "Create Fleet"}
        </button>

        <div className="text-center space-y-2">
            <button type="button" className="text-[10px] font-bold text-slate-400 hover:text-indigo-600 transition-colors underline-offset-2 hover:underline">
              Forgot your password?
            </button>
        </div>
      </form>
    </div>
  );
}

