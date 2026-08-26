"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Terminal, Crosshair, ShieldCheck, Lightning, Target, ArrowUpRight, ArrowDownRight, Clock, ChartLineUp, Pulse } from "@phosphor-icons/react";
import Hero3D from "../components/Hero3D";

type Signal = {
  market: string;
  marketId: string;
  direction: "UP" | "DOWN";
  confidence: number;
  reasoning: string[];
  timestamp: number;
  narrative: string;
  outcome?: "WIN" | "LOSS" | "PENDING";
  commitTxHash?: string;
};

type Performance = {
  total: number;
  wins: number;
  losses: number;
  pending: number;
  winRate: number;
};

export default function Dashboard() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [perf, setPerf] = useState<Performance | null>(null);

  useEffect(() => {
    const fetchSignals = async () => {
      try {
        const res = await fetch("/api/signals");
        if (res.ok) {
          const data = await res.json();
          setSignals(data.signals || []);
          setPerf(data.performance || null);
        }
      } catch (err) {}
    };
    fetchSignals();
    const interval = setInterval(fetchSignals, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-[100dvh] bg-[#030303] text-zinc-300 font-sans selection:bg-emerald-500/30 selection:text-emerald-400 overflow-x-hidden relative">
      
      {/* Ethereal Glass Radial Gradient */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[80vw] h-[50vh] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none opacity-50" />
      
      {/* CSS Noise Overlay */}
      <div className="fixed inset-0 opacity-[0.015] pointer-events-none mix-blend-overlay z-50" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />

      {/* Navbar Minimalist */}
      <nav className="fixed top-0 w-full z-40 border-b border-white/[0.05] bg-black/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono text-xs tracking-widest uppercase text-white">
            <div className="w-2 h-2 bg-emerald-500 rounded-sm animate-pulse" />
            Vanguard Systems Online
          </div>
          <div className="font-mono text-xs text-zinc-500 uppercase tracking-widest flex items-center gap-4">
            <span>Somnia Shannon Testnet</span>
            <div className="px-2 py-1 bg-white/5 border border-white/10 text-emerald-500 text-[10px] rounded-sm">
              QUANT_ENGINE_V1
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 pt-32 pb-24 relative z-10">
        
        {/* Editorial Split Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 min-h-[60vh] items-center border-b border-white/[0.05] pb-24">
          
          {/* Left: Giant Typography */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-3 mb-8"
            >
              <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono uppercase tracking-[0.2em] flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                SYSTEM.ONLINE // T-00:00
              </div>
            </motion.div>
            
            <h1 className="text-[12vw] lg:text-[10rem] leading-[0.8] font-bold tracking-tighter text-white flex flex-col uppercase mb-12">
              <motion.span 
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              >
                Dream
              </motion.span>
              <motion.span 
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="text-emerald-500"
              >
                Signal.
              </motion.span>
            </h1>
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.4 }}
              className="max-w-md font-mono text-xs md:text-sm text-zinc-500 leading-relaxed uppercase tracking-widest border-l border-emerald-500/30 pl-6"
            >
              <p className="mb-6 text-zinc-400">
                High-frequency momentum & volatility indexing agent. 
                Operating natively on Somnia Shannon Testnet.
              </p>
              <div className="flex items-center gap-2 text-emerald-500/70">
                <Target size={16} className="animate-spin-slow" />
                Awaiting market anomalies...
              </div>
            </motion.div>
          </div>

          {/* Right: 3D Radar Capsule */}
          <div className="lg:col-span-5 h-[400px] lg:h-[500px] relative hidden md:block">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 bg-white/[0.02] border border-white/10 rounded-3xl overflow-hidden backdrop-blur-2xl shadow-[inset_0_0_100px_rgba(16,185,129,0.05)]"
            >
              {/* Target HUD Elements */}
              <div className="absolute top-6 left-6 text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
                LAT: 40.7128 N<br/>LNG: 74.0060 W
              </div>
              <div className="absolute bottom-6 right-6 text-[10px] font-mono text-emerald-500 uppercase tracking-widest text-right">
                QUANT_ENGINE_V1<br/>ACTIVE
              </div>
              
              {/* Crosshairs */}
              <div className="absolute top-1/2 left-0 w-full h-[1px] bg-white/[0.05]" />
              <div className="absolute top-0 left-1/2 w-[1px] h-full bg-white/[0.05]" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-white/[0.05] rounded-full" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-white/[0.05] rounded-full" />

              {/* The 3D Object */}
              <Hero3D />
            </motion.div>
          </div>
        </div>

        {/* Asymmetrical Bento Grid Stats */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-24">
          
          {/* Main Stat (Col-span 8) */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
            className="md:col-span-8 group"
          >
            {/* Double-Bezel Outer Shell */}
            <div className="h-full bg-white/[0.02] p-2 rounded-[2rem] border border-white/[0.05] shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
              {/* Inner Core */}
              <div className="h-full bg-[#0a0a0a] rounded-[calc(2rem-0.5rem)] p-8 md:p-12 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] flex flex-col justify-between gap-12 relative overflow-hidden">
                
                {/* Glowing Sparkline Chart Background */}
                <svg className="absolute inset-0 w-full h-full opacity-40 pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                    </linearGradient>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                  {/* Area under the line */}
                  <motion.path 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1.5, delay: 0.5 }}
                    d="M 0 100 L 0 90 L 15 75 L 30 80 L 45 40 L 60 50 L 75 25 L 90 30 L 100 15 L 100 100 Z" 
                    fill="url(#chartGradient)" 
                  />
                  {/* The Line */}
                  <motion.path 
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 2, ease: [0.32, 0.72, 0, 1], delay: 0.2 }}
                    d="M 0 90 L 15 75 L 30 80 L 45 40 L 60 50 L 75 25 L 90 30 L 100 15" 
                    fill="none" 
                    stroke="#10b981" 
                    strokeWidth="2" 
                    vectorEffect="non-scaling-stroke"
                    filter="url(#glow)"
                  />
                </svg>

                {/* Decoration */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px] group-hover:bg-emerald-500/10 transition-colors duration-1000" />
                
                <div className="flex justify-between items-start relative z-10">
                  <h2 className="text-sm uppercase tracking-widest text-zinc-500 font-medium">Global Win Rate</h2>
                  <ChartLineUp size={24} weight="light" className="text-zinc-600 group-hover:text-emerald-500 transition-colors duration-700" />
                </div>
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
                  <div className="text-7xl md:text-9xl font-medium tracking-tighter text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                    {perf ? (perf.winRate * 100).toFixed(1) : "0.0"}<span className="text-zinc-700 text-5xl md:text-7xl">%</span>
                  </div>
                  
                  <div className="flex gap-6 text-sm text-zinc-500">
                    <div className="flex flex-col gap-1">
                      <span className="uppercase tracking-widest text-[10px]">Total Hits</span>
                      <span className="text-white text-xl">{perf?.wins || 0}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="uppercase tracking-widest text-[10px]">Misses</span>
                      <span className="text-zinc-600 text-xl">{perf?.losses || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Secondary Stats (Col-span 4) */}
          <div className="md:col-span-4 flex flex-col gap-6">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.32, 0.72, 0, 1] }}
              className="flex-1 bg-white/[0.02] p-8 rounded-[2rem] border border-white/[0.05] hover:bg-white/[0.04] transition-colors duration-500 flex flex-col justify-between"
            >
              <div className="flex justify-between items-start mb-8">
                <h2 className="text-sm uppercase tracking-widest text-zinc-500 font-medium">Engine Status</h2>
                <Lightning size={20} weight="light" className="text-emerald-500" />
              </div>
              <div>
                <div className="text-3xl font-medium text-white mb-2">ACTIVE</div>
                <div className="text-xs text-zinc-500 uppercase tracking-widest font-mono">Monitoring {signals.length > 0 ? "LIVE" : "WAITING"}</div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.32, 0.72, 0, 1] }}
              className="flex-1 bg-white/[0.02] p-8 rounded-[2rem] border border-white/[0.05] hover:bg-white/[0.04] transition-colors duration-500 flex flex-col justify-between"
            >
              <div className="flex justify-between items-start mb-8">
                <h2 className="text-sm uppercase tracking-widest text-zinc-500 font-medium">Trust Protocol</h2>
                <ShieldCheck size={20} weight="light" className="text-zinc-600" />
              </div>
              <div>
                <div className="text-xl font-medium text-white mb-2">100% On-Chain Verification</div>
                <div className="text-xs text-zinc-500 font-mono tracking-widest uppercase">Zero-Trust Settlement</div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Live Signal Feed */}
        <div className="relative mt-24">
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex items-end justify-between border-b border-white/20 pb-4 mb-0"
          >
            <h2 className="text-3xl md:text-5xl font-bold tracking-tighter text-white flex items-center gap-4">
              INTERCEPTS.
              <span className="px-3 py-1 bg-white/10 text-[10px] text-white uppercase tracking-[0.2em] font-mono rounded-none">
                {signals.length} RECORDED
              </span>
            </h2>
            <div className="hidden md:flex items-center gap-2 text-[10px] text-emerald-500 font-mono uppercase tracking-[0.2em]">
              <Pulse size={14} className="animate-pulse" /> SYNCED
            </div>
          </motion.div>
          
          <div className="flex flex-col border-b border-white/[0.05]">
            <AnimatePresence mode="popLayout">
              {signals.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-32 text-center flex flex-col items-center justify-center gap-4 border-l border-r border-white/[0.05]"
                >
                  <div className="w-8 h-8 border border-white/20 rounded-full border-t-emerald-500 animate-spin" />
                  <div className="text-zinc-600 text-xs font-mono uppercase tracking-widest">
                    Awaiting Telemetry...
                  </div>
                </motion.div>
              ) : (
                signals.map((sig, i) => (
                  <motion.div 
                    key={`${sig.marketId}-${sig.timestamp}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: i * 0.1, ease: [0.32, 0.72, 0, 1] }}
                    className="grid grid-cols-1 md:grid-cols-12 border-x border-b border-white/[0.05] group hover:bg-white/[0.02] transition-colors duration-500 relative overflow-hidden"
                  >
                    {/* Hover Glow */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.01] to-transparent opacity-0 group-hover:opacity-100 transform -translate-x-full group-hover:translate-x-full transition-all duration-1000 ease-out pointer-events-none" />

                    {/* Column 1: Asset (Span 3) */}
                    <div className="col-span-1 md:col-span-3 p-6 md:p-10 border-b md:border-b-0 md:border-r border-white/[0.05] flex flex-col justify-between gap-8 relative">
                      <div className="flex items-center justify-between w-full">
                        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-600">Asset</div>
                        <div className={`w-2 h-2 rounded-full ${sig.direction === "UP" ? "bg-emerald-500" : "bg-rose-500"}`} />
                      </div>
                      
                      <div>
                        <div className="text-5xl md:text-6xl font-bold tracking-tighter text-white uppercase leading-none">
                          {sig.market}
                        </div>
                        <div className={`text-sm font-mono tracking-widest uppercase mt-2 ${sig.direction === "UP" ? "text-emerald-500" : "text-rose-500"}`}>
                          TARGET: {sig.direction}
                        </div>
                      </div>
                    </div>

                    {/* Column 2: Narrative & Trace (Span 7) */}
                    <div className="col-span-1 md:col-span-7 p-6 md:p-10 border-b md:border-b-0 md:border-r border-white/[0.05] flex flex-col justify-between gap-8">
                      <div>
                        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-600 mb-4">Neural Narrative</div>
                        <p className="text-xl md:text-2xl text-zinc-300 leading-tight font-medium tracking-tight">
                          {sig.narrative}
                        </p>
                      </div>
                      
                      <div className="font-mono text-[11px] text-zinc-500 uppercase tracking-widest flex flex-col gap-2 border-t border-white/[0.05] pt-6">
                        <div className="flex items-center justify-between gap-2 text-zinc-400 mb-1">
                          <div className="flex items-center gap-2">
                            <Terminal size={14} /> Execution Trace
                          </div>
                          {sig.commitTxHash && (
                            <a 
                              href={`https://shannon-explorer.somnia.network/tx/${sig.commitTxHash}`}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1.5 text-emerald-500 hover:text-emerald-400 transition-colors px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[9px] z-10 relative"
                            >
                              <ShieldCheck size={12} />
                              VERIFY COMMITMENT
                            </a>
                          )}
                        </div>
                        {sig.reasoning.map((r, ri) => (
                          <div key={ri} className="flex gap-4">
                            <span className="text-emerald-500/50">[{ri}]</span> 
                            <span className="truncate">{r}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Column 3: Meta (Span 2) */}
                    <div className="col-span-1 md:col-span-2 p-6 md:p-10 flex flex-col justify-between items-start md:items-end text-left md:text-right bg-black/20">
                      <div className="flex flex-col gap-1 w-full md:items-end">
                        <span className="text-[10px] text-zinc-600 font-mono uppercase tracking-[0.2em]">Confidence</span>
                        <span className="text-4xl font-bold text-white tracking-tighter">{(sig.confidence * 100).toFixed(0)}%</span>
                      </div>
                      
                      <div className="flex flex-col md:items-end gap-4 w-full">
                        {sig.outcome && sig.outcome !== "PENDING" && (
                          <div className={`px-2 py-1 text-[9px] font-mono uppercase tracking-[0.2em] border ${
                            sig.outcome === "WIN" 
                              ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" 
                              : "text-rose-400 border-rose-500/30 bg-rose-500/10"
                          }`}>
                            {sig.outcome}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono tracking-widest uppercase">
                          <Clock size={12} />
                          {new Date(sig.timestamp).toLocaleTimeString("en-US", { hour12: false })}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
