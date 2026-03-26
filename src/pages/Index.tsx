import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Target,
  Shield,
  Clock,
  Rocket,
  MousePointer2,
  Sparkles,
  Award,
  Zap,
} from 'lucide-react';

const Index = () => {
  return (
    <main className="min-h-screen bg-[#faf5ff] text-[#1a1025] flex flex-col items-center font-sans overflow-x-hidden selection:bg-purple-300/30">

      {/* ── MASSIVE VIBRANT BLUR APP BACKGROUND ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[80vw] h-[80vw] bg-fuchsia-300/40 blur-[100px] rounded-full mix-blend-multiply opacity-70 animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-20%] w-[90vw] h-[90vw] bg-purple-400/30 blur-[120px] rounded-full mix-blend-multiply opacity-60" />
        <div className="absolute top-[30%] left-[20%] w-[60vw] h-[60vw] bg-indigo-300/30 blur-[150px] rounded-full mix-blend-multiply opacity-50" />
        <div className="absolute inset-0 bg-white/40 backdrop-blur-[50px]" />
      </div>

      {/* ── FLOATING APP HEADER ── */}
      <nav className="w-full max-w-[500px] md:max-w-[800px] flex items-center justify-between px-5 py-4 mx-auto relative z-50 bg-white/70 backdrop-blur-[30px] border border-t-0 border-white/60 shadow-[0_20px_40px_rgba(147,51,234,0.05)] rounded-b-[2rem]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-black rounded-[14px] flex items-center justify-center shadow-[0_0_20px_rgba(147,51,234,0.3)] overflow-hidden p-[2px]">
            <Zap className="w-10 h-10 text-[#0ea5e9] drop-shadow-[0_0_15px_rgba(14,165,233,0.5)]" />
          </div>
          <span className="text-xl md:text-2xl font-[900] tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-800 to-fuchsia-700">Whopautopilot 2.0</span>
        </div>

        <Link to="/auth">
          <button className="px-5 py-2.5 bg-purple-900 hover:bg-purple-800 rounded-2xl text-[11px] font-[900] text-white uppercase tracking-[0.1em] transition-all active:scale-95 shadow-[0_10px_20px_rgba(88,28,135,0.2)] flex items-center gap-2">
            LOGIN
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </Link>
      </nav>

      {/* ── SUPER APP HERO ── */}
      <section className="w-full max-w-[1200px] px-5 pt-16 pb-12 relative z-10 flex flex-col items-center text-center">

        <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-2xl border border-white/50 px-5 py-2 rounded-full mb-8 shadow-sm">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-[900] uppercase tracking-[0.2em] text-purple-900/60">Console V2.0 Active</span>
        </div>

        <h1 className="text-6xl md:text-8xl lg:text-[7rem] font-[1000] leading-[0.85] tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-br from-purple-950 via-purple-800 to-fuchsia-600 drop-shadow-sm pb-2">
          Hype.<br />
          Organic.<br />
          Simulated.
        </h1>

        <p className="text-base md:text-xl text-purple-950/50 font-bold mb-10 max-w-lg leading-relaxed">
          The ultimate growth console inside a pocket-sized interface. We don't send traffic, we send <span className="text-purple-600">behavior</span>.
        </p>

        <Link to="/auth" className="w-full max-w-[320px] mb-12">
          <button className="w-full h-16 bg-gradient-to-r from-purple-600 to-fuchsia-500 text-white rounded-[2rem] font-[900] text-lg tracking-tight shadow-[0_20px_40px_rgba(167,139,250,0.4)] hover:shadow-[0_20px_50px_rgba(167,139,250,0.6)] transition-all active:scale-95 active:translate-y-2 flex items-center justify-center gap-3">
            INITIALIZE <ArrowRight className="w-5 h-5" />
          </button>
        </Link>

        {/* ── 3D WIDGET THING ── */}
        <div className="relative w-full max-w-[400px]">
          <div className="w-full aspect-[4/3] bg-white/40 backdrop-blur-[40px] border border-white/60 rounded-[3rem] shadow-[0_40px_80px_rgba(147,51,234,0.1)] overflow-hidden flex flex-col p-6 items-center justify-center relative">
            <div className="absolute top-4 right-4 bg-emerald-500/10 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-[900] uppercase tracking-wider">
              System Healthy
            </div>
            <img src="/hero-3d.png" className="w-[120%] h-[120%] object-cover absolute mix-blend-multiply opacity-50" />
            <div className="relative z-10 w-20 h-20 bg-white rounded-[1.5rem] shadow-[0_20px_40px_rgba(0,0,0,0.05)] flex items-center justify-center mb-4">
              <Rocket className="w-10 h-10 text-purple-500" />
            </div>
            <h3 className="relative z-10 text-3xl font-[1000] tracking-tighter text-purple-950 mb-1">122K+</h3>
            <p className="relative z-10 text-[10px] font-[900] text-purple-900/40 uppercase tracking-widest">Active Ghost Nodes</p>
          </div>
        </div>
      </section>

      {/* ── RESPONSIVE FEATURES GRID ── */}
      <section className="w-full py-12 relative z-10 px-5 md:px-10 flex flex-col items-center">
        <div className="mb-10 max-w-[1200px] w-full text-center">
          <h2 className="text-3xl md:text-5xl font-[900] tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-900 to-fuchsia-600 mb-3">Unfair Logic.</h2>
          <p className="text-sm font-bold text-purple-900/40">Advanced network capabilities with organic simulation.</p>
        </div>

        <div className="w-full max-w-[1000px] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { title: 'Organic Scheduler', desc: 'Fluctuates speed to match viral surges.', icon: Clock, color: 'text-rose-500 bg-rose-100' },
            { title: 'Device Spoofing', desc: 'Real ISP residential proxy rotation.', icon: Shield, color: 'text-emerald-500 bg-emerald-100' },
            { title: 'Recursive Logic', desc: 'Nodes return to view future posts automatically.', icon: MousePointer2, color: 'text-sky-500 bg-sky-100' },
            { title: 'AI Automation', desc: 'Reads content for contextually adapted speed.', icon: Sparkles, color: 'text-amber-500 bg-amber-100' },
            { title: 'Ghost Setup', desc: 'Encrypted trails, total operational security.', icon: Target, color: 'text-purple-600 bg-purple-100' }
          ].map((f, i) => (
            <div key={i} className="bg-white/80 backdrop-blur-2xl border border-purple-50 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 transition-transform group-hover:scale-110 ${f.color}`}>
                <f.icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-[900] text-purple-950 mb-2">{f.title}</h3>
                <p className="text-sm font-semibold text-purple-900/50 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SNAPPY PRICING CHIPS (Fixed Size + Light Theme) ── */}
      <section className="w-full max-w-[1200px] px-5 py-12 relative z-10 flex flex-col items-center">
        <h2 className="text-3xl md:text-5xl font-[900] tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-900 to-fuchsia-600 mb-8 text-center">Console Access.</h2>

        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-[600px] justify-center">
          {/* MONTHLY */}
          <div className="flex-1 bg-white/80 backdrop-blur-2xl border border-purple-100 rounded-3xl p-6 shadow-[0_10px_30px_rgba(147,51,234,0.05)] flex flex-col items-center text-center">
            <div className="bg-purple-100/50 p-3 rounded-2xl mb-4"><Clock className="w-6 h-6 text-purple-600" /></div>
            <h3 className="text-lg font-[900] text-purple-950 mb-2">Monthly Pro</h3>
            <div className="text-4xl font-[1000] tracking-tighter text-purple-600 mb-6">$10<span className="text-sm font-bold text-purple-900/40">/mo</span></div>
            <Link to="/auth" className="w-full mt-auto">
              <button className="w-full h-12 bg-purple-900 text-white rounded-xl font-[900] text-[11px] uppercase tracking-widest shadow-xl active:scale-95 transition-transform">
                SUBSCRIBE
              </button>
            </Link>
          </div>

          {/* LIFETIME */}
          <div className="flex-1 bg-gradient-to-br from-purple-600 to-fuchsia-600 border border-purple-400 rounded-3xl p-6 shadow-[0_20px_40px_rgba(147,51,234,0.3)] flex flex-col items-center text-center text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 blur-[40px] rounded-full" />
            <div className="bg-white/20 backdrop-blur-md p-3 rounded-2xl mb-4 shadow-inner relative z-10"><Award className="w-6 h-6 text-white" /></div>
            <h3 className="text-lg font-[900] mb-2 relative z-10">Lifetime King</h3>
            <div className="text-4xl font-[1000] tracking-tighter mb-6 relative z-10">$99<span className="text-sm font-bold text-white/50 ml-1">once</span></div>
            <Link to="/auth" className="w-full mt-auto relative z-10">
              <button className="w-full h-12 bg-white text-purple-900 rounded-xl font-[900] text-[11px] uppercase tracking-widest shadow-xl active:scale-95 transition-transform">
                BUY ONCE
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Extra CSS for hiding scrollbar visually but keeping function */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

    </main>
  );
};

export default Index;
