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
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-emerald-900/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/10 blur-[120px]" />
        {/* Subtle CSS Noise */}
        <div className="absolute inset-0 opacity-[0.015] mix-blend-overlay pointer-events-none" style={{ backgroundImage: "url(`data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E`)" }} />
      </div>

      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-12 md:py-24 relative z-10 flex flex-col gap-24">
        
        {/* BRUTALIST HERO SECTION */}
        <header className="relative w-full min-h-[70vh] flex flex-col md:flex-row items-center justify-between border-b border-white/10 pb-12 mb-12">
          
          {/* Left Column: Massive Typography */}
          <div className="flex-1 flex flex-col items-start z-10">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
              className="rounded-full px-4 py-2 text-[10px] uppercase tracking-[0.3em] font-bold bg-white/5 border border-white/10 text-emerald-500 mb-8 flex items-center gap-3 backdrop-blur-md"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.8)]" />
              SYSTEM.ONLINE // T-00:00
            </motion.div>
            
            <div className="flex flex-col gap-0 mb-8 mix-blend-difference">
              <motion.h1 
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.1, ease: [0.32, 0.72, 0, 1] }}
                className="text-7xl md:text-[8rem] lg:text-[10rem] font-bold tracking-tighter text-white leading-[0.8]"
              >
                DREAM
              </motion.h1>
              <motion.h1 
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.2, ease: [0.32, 0.72, 0, 1] }}
                className="text-7xl md:text-[8rem] lg:text-[10rem] font-bold tracking-tighter text-emerald-500 leading-[0.8] ml-2 md:ml-12"
              >
                SIGNAL.
              </motion.h1>
            </div>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.4 }}
              className="text-zinc-500 max-w-md text-sm md:text-base font-mono leading-relaxed border-l border-emerald-500/30 pl-4"
            >
              High-frequency momentum & volatility indexing agent. Operating natively on Somnia Shannon Testnet. 
              <br/><br/>
              <span className="text-emerald-500/70">Awaiting market anomalies...</span>
            </motion.p>
          </div>

          {/* Right Column: 3D Architectural Capsule */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.5, delay: 0.3, ease: [0.32, 0.72, 0, 1] }}
            className="flex-1 w-full mt-12 md:mt-0 relative flex justify-end"
          >
            {/* The Glass Capsule for 3D */}
            <div className="w-full md:w-[500px] h-[500px] rounded-[3rem] border border-white/10 bg-black/40 backdrop-blur-2xl overflow-hidden relative shadow-[0_0_100px_rgba(16,185,129,0.05)]">
              {/* Coordinates Decoration */}
              <div className="absolute top-6 left-6 text-[9px] text-zinc-600 font-mono tracking-widest z-20">
                LAT: 40.7128 N<br/>
                LNG: 74.0060 W
              </div>
              <div className="absolute bottom-6 right-6 text-[9px] text-emerald-500 font-mono tracking-widest z-20 text-right">
                QUANT_ENGINE_V1<br/>
                ACTIVE
              </div>
              
              {/* Target Crosshairs */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] border border-white/5 rounded-full pointer-events-none z-10" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40%] h-[40%] border border-white/10 rounded-full pointer-events-none z-10" />
              <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white/5 pointer-events-none z-10" />
              <div className="absolute left-0 right-0 top-1/2 h-px bg-white/5 pointer-events-none z-10" />

              {/* The 3D Object */}
              <Hero3D />
            </div>
          </motion.div>
        </header>

        {/* Asymmetrical Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Main Performance Card (Col-span 8) */}
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
                
                {/* Decoration */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px] group-hover:bg-emerald-500/10 transition-colors duration-1000" />
                
                <div className="flex justify-between items-start relative z-10">
                  <h2 className="text-sm uppercase tracking-widest text-zinc-500 font-medium">Global Win Rate</h2>
                  <ChartLineUp size={24} weight="light" className="text-zinc-600 group-hover:text-emerald-500 transition-colors duration-700" />
                </div>
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
                  <div className="text-7xl md:text-9xl font-medium tracking-tighter text-white">
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
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.32, 0.72, 0, 1] }}
              className="flex-1 bg-white/[0.02] p-1.5 rounded-[2rem] border border-white/[0.05]"
            >
              <div className="h-full bg-[#0a0a0a] rounded-[calc(2rem-0.375rem)] p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] flex flex-col justify-between">
                <div className="text-sm uppercase tracking-widest text-zinc-500 font-medium flex justify-between">
                  Executions
                  <Lightning size={20} weight="light" className="text-zinc-600" />
                </div>
                <div className="text-5xl font-medium tracking-tighter text-white mt-8">
                  {perf?.total || 0}
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.32, 0.72, 0, 1] }}
              className="flex-1 bg-white/[0.02] p-1.5 rounded-[2rem] border border-white/[0.05]"
            >
              <div className="h-full bg-emerald-950/20 rounded-[calc(2rem-0.375rem)] p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] flex flex-col justify-between group cursor-pointer hover:bg-emerald-900/20 transition-colors duration-500">
                <div className="text-sm uppercase tracking-widest text-emerald-500/70 font-medium">
                  System Status
                </div>
                <div className="flex items-center gap-4 mt-8">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.8)]" />
                  <span className="text-emerald-400 tracking-tight font-medium">Uplink Active</span>
                </div>
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
                        <div className="flex items-center gap-2 text-zinc-400 mb-1">
                          <Terminal size={14} /> Execution Trace
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

      </div>
    </div>
  );
}

