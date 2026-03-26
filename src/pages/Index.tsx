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
  Activity,
  BarChart3,
  Globe,
} from 'lucide-react';

const Index = () => {
  return (
    <main className="min-h-screen bg-[#04060c] text-white flex flex-col items-center font-sans overflow-x-hidden selection:bg-cyan-500/30">

      {/* ── DEEP SPACE BACKGROUND ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[80vw] h-[80vw] bg-cyan-500/[0.06] blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-20%] w-[90vw] h-[90vw] bg-blue-600/[0.04] blur-[150px] rounded-full" />
        <div className="absolute top-[40%] left-[30%] w-[50vw] h-[50vw] bg-indigo-500/[0.03] blur-[180px] rounded-full" />
      </div>

      {/* ── NAVBAR ── */}
      <nav className="w-full max-w-[500px] md:max-w-[800px] flex items-center justify-between px-5 py-4 mx-auto relative z-50 bg-white/[0.03] backdrop-blur-[30px] border border-white/[0.06] shadow-[0_20px_40px_rgba(0,0,0,0.5)] rounded-b-[2rem]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-[14px] flex items-center justify-center shadow-[0_0_25px_rgba(6,182,212,0.4)]">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl md:text-2xl font-[900] tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-400">Whopautopailot</span>
        </div>

        <Link to="/auth">
          <button className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 rounded-2xl text-[11px] font-[900] text-white uppercase tracking-[0.1em] shadow-[0_10px_25px_rgba(6,182,212,0.3)] flex items-center gap-2">
            LOGIN
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </Link>
      </nav>

      {/* ── HERO ── */}
      <section className="w-full max-w-[1200px] px-5 pt-20 pb-16 relative z-10 flex flex-col items-center text-center">

        <div className="inline-flex items-center gap-2 bg-cyan-500/[0.08] backdrop-blur-2xl border border-cyan-500/[0.15] px-5 py-2 rounded-full mb-8">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-[10px] font-[900] uppercase tracking-[0.2em] text-cyan-400/80">Console V2.0 Active</span>
        </div>

        <h1 className="text-6xl md:text-8xl lg:text-[7rem] font-[1000] leading-[0.85] tracking-tighter mb-6 pb-2">
          <span className="bg-clip-text text-transparent bg-gradient-to-br from-white via-cyan-200 to-cyan-400 drop-shadow-sm">Automate.</span><br />
          <span className="bg-clip-text text-transparent bg-gradient-to-br from-cyan-400 via-blue-400 to-blue-600">Dominate.</span><br />
          <span className="bg-clip-text text-transparent bg-gradient-to-br from-blue-400 via-indigo-400 to-white/60">Scale.</span>
        </h1>

        <p className="text-base md:text-xl text-white/40 font-bold mb-10 max-w-lg leading-relaxed">
          The ultimate growth autopilot inside a pocket-sized console. We don't send traffic, we send <span className="text-cyan-400">behavior</span>.
        </p>

        <Link to="/auth" className="w-full max-w-[320px] mb-14">
          <button className="w-full h-16 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-[2rem] font-[900] text-lg tracking-tight shadow-[0_20px_50px_rgba(6,182,212,0.3)] hover:shadow-[0_20px_60px_rgba(6,182,212,0.5)] flex items-center justify-center gap-3">
            GET STARTED <ArrowRight className="w-5 h-5" />
          </button>
        </Link>

        {/* ── STATS WIDGET ── */}
        <div className="relative w-full max-w-[420px]">
          <div className="w-full aspect-[4/3] bg-white/[0.03] backdrop-blur-[40px] border border-white/[0.08] rounded-[3rem] shadow-[0_40px_80px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col p-6 items-center justify-center relative">
            <div className="absolute top-4 right-4 bg-cyan-500/10 text-cyan-400 px-3 py-1 rounded-full text-[10px] font-[900] uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3 h-3" />
              System Active
            </div>
            <div className="relative z-10 w-20 h-20 bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border border-cyan-500/20 rounded-[1.5rem] shadow-[0_0_40px_rgba(6,182,212,0.15)] flex items-center justify-center mb-4">
              <Rocket className="w-10 h-10 text-cyan-400" />
            </div>
            <h3 className="relative z-10 text-4xl font-[1000] tracking-tighter text-white mb-1">122K+</h3>
            <p className="relative z-10 text-[10px] font-[900] text-white/30 uppercase tracking-widest">Active Automation Nodes</p>
          </div>
        </div>
      </section>

      {/* ── FEATURES GRID ── */}
      <section className="w-full py-16 relative z-10 px-5 md:px-10 flex flex-col items-center">
        <div className="mb-12 max-w-[1200px] w-full text-center">
          <h2 className="text-3xl md:text-5xl font-[900] tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500 mb-3">Built Different.</h2>
          <p className="text-sm font-bold text-white/30">Advanced network capabilities powered by intelligent automation.</p>
        </div>

        <div className="w-full max-w-[1000px] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { title: 'Smart Scheduler', desc: 'Fluctuates speed to match real viral surge patterns.', icon: Clock, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
            { title: 'Stealth Protocol', desc: 'Real ISP residential proxy rotation with zero traces.', icon: Shield, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
            { title: 'Loop Engine', desc: 'Nodes return to engage with future posts automatically.', icon: MousePointer2, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
            { title: 'AI Autopilot', desc: 'Reads content for contextually adapted delivery speed.', icon: Sparkles, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
            { title: 'Zero Footprint', desc: 'Encrypted trails with total operational security.', icon: Target, color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
            { title: 'Live Analytics', desc: 'Real-time performance tracking across all campaigns.', icon: BarChart3, color: 'text-violet-400 bg-violet-500/10 border-violet-500/20' },
          ].map((f, i) => (
            <div key={i} className="bg-white/[0.03] backdrop-blur-2xl border border-white/[0.06] rounded-3xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.3)] hover:border-cyan-500/20 hover:shadow-[0_10px_40px_rgba(6,182,212,0.1)] group flex flex-col">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 border ${f.color}`}>
                <f.icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-[900] text-white mb-2">{f.title}</h3>
                <p className="text-sm font-semibold text-white/35 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="w-full max-w-[1200px] px-5 py-16 relative z-10 flex flex-col items-center">
        <h2 className="text-3xl md:text-5xl font-[900] tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500 mb-10 text-center">Console Access.</h2>

        <div className="flex flex-col sm:flex-row gap-5 w-full max-w-[620px] justify-center">
          {/* MONTHLY */}
          <div className="flex-1 bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-7 shadow-[0_10px_30px_rgba(0,0,0,0.4)] flex flex-col items-center text-center hover:border-cyan-500/20">
            <div className="bg-cyan-500/10 border border-cyan-500/20 p-3 rounded-2xl mb-4"><Clock className="w-6 h-6 text-cyan-400" /></div>
            <h3 className="text-lg font-[900] text-white mb-2">Monthly Pro</h3>
            <div className="text-4xl font-[1000] tracking-tighter text-cyan-400 mb-6">$10<span className="text-sm font-bold text-white/30">/mo</span></div>
            <Link to="/auth" className="w-full mt-auto">
              <button className="w-full h-12 bg-white/[0.06] border border-white/[0.1] hover:bg-cyan-500/10 hover:border-cyan-500/20 text-white rounded-xl font-[900] text-[11px] uppercase tracking-widest shadow-xl">
                SUBSCRIBE
              </button>
            </Link>
          </div>

          {/* LIFETIME */}
          <div className="flex-1 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 rounded-3xl p-7 shadow-[0_20px_50px_rgba(6,182,212,0.15)] flex flex-col items-center text-center text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-400/10 blur-[40px] rounded-full" />
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl mb-4 shadow-inner relative z-10 border border-white/10"><Award className="w-6 h-6 text-cyan-300" /></div>
            <h3 className="text-lg font-[900] mb-2 relative z-10">Lifetime King</h3>
            <div className="text-4xl font-[1000] tracking-tighter mb-6 relative z-10 text-cyan-300">$99<span className="text-sm font-bold text-white/40 ml-1">once</span></div>
            <Link to="/auth" className="w-full mt-auto relative z-10">
              <button className="w-full h-12 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-[900] text-[11px] uppercase tracking-widest shadow-[0_10px_30px_rgba(6,182,212,0.3)]">
                BUY ONCE
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="w-full py-10 relative z-10 border-t border-white/[0.05] flex flex-col items-center gap-3">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-[900] text-white/30">Whopautopailot</span>
        </div>
        <p className="text-[10px] text-white/20 uppercase tracking-[0.2em] font-bold">Smart Automation Console • All Rights Reserved</p>
      </footer>

      {/* Extra CSS for hiding scrollbar */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}
      </style>

    </main>
  );
};

export default Index;
