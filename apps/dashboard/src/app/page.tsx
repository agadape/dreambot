"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Terminal, Crosshair, ShieldCheck, Lightning, Target, ArrowUpRight, ArrowDownRight, Clock, ChartLineUp, Pulse } from "@phosphor-icons/react";

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
        
        {/* Hero Section */}
        <header className="flex flex-col items-center text-center gap-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
            className="rounded-full px-4 py-1.5 text-[10px] uppercase tracking-[0.2em] font-medium bg-white/5 border border-white/10 text-zinc-400 flex items-center gap-2"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            Vanguard Systems Online
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.32, 0.72, 0, 1] }}
            className="text-5xl md:text-7xl lg:text-8xl font-medium tracking-tighter text-white max-w-4xl leading-[1.1]"
          >
            DreamBot <span className="text-zinc-600">Signal</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.32, 0.72, 0, 1] }}
            className="text-lg md:text-xl text-zinc-500 max-w-2xl leading-relaxed"
          >
            Autonomous quantitative execution agent. Operating on Somnia Shannon Testnet with sub-second momentum indexing.
          </motion.p>
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
        <div className="space-y-12">
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex items-center justify-between border-b border-white/[0.05] pb-6"
          >
            <h2 className="text-xl md:text-2xl font-medium tracking-tight text-white flex items-center gap-3">
              Live Intercepts
              <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] text-zinc-500 uppercase tracking-widest border border-white/5 font-mono">
                {signals.length} Entries
              </span>
            </h2>
            <div className="hidden md:flex items-center gap-2 text-xs text-zinc-600 font-mono uppercase tracking-widest">
              <Pulse size={16} /> 15s Polling
            </div>
          </motion.div>
          
          <div className="flex flex-col gap-6">
            <AnimatePresence mode="popLayout">
              {signals.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-24 text-center text-zinc-600 text-sm uppercase tracking-widest border border-dashed border-white/[0.05] rounded-[2rem]"
                >
                  Awaiting Telemetry...
                </motion.div>
              ) : (
                signals.map((sig, i) => (
                  <motion.div 
                    key={`${sig.marketId}-${sig.timestamp}`}
                    initial={{ opacity: 0, y: 40, scale: 0.98, filter: "blur(10px)" }}
                    animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                    transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
                    className="bg-white/[0.02] p-1.5 rounded-[2rem] border border-white/[0.05] hover:border-white/[0.1] transition-colors duration-700"
                  >
                    <div className="bg-[#0a0a0a] rounded-[calc(2rem-0.375rem)] p-6 md:p-8 flex flex-col lg:flex-row gap-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
                      
                      {/* Asset Block */}
                      <div className="flex-shrink-0 flex items-center lg:items-start lg:flex-col gap-6 lg:w-48 border-b lg:border-b-0 lg:border-r border-white/[0.05] pb-6 lg:pb-0 lg:pr-6">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] ${
                          sig.direction === "UP" ? "bg-emerald-950/30 border-emerald-900/50 text-emerald-500" : "bg-rose-950/30 border-rose-900/50 text-rose-500"
                        }`}>
                          {sig.direction === "UP" ? <ArrowUpRight size={28} weight="light" /> : <ArrowDownRight size={28} weight="light" />}
                        </div>
                        <div>
                          <div className="text-3xl font-medium tracking-tighter text-white uppercase">{sig.market}</div>
                          <div className={`text-sm font-medium tracking-widest uppercase mt-1 ${sig.direction === "UP" ? "text-emerald-500" : "text-rose-500"}`}>
                            {sig.direction}
                          </div>
                        </div>
                      </div>

                      {/* Content Block */}
                      <div className="flex-1 flex flex-col justify-between gap-6">
                        <p className="text-lg md:text-xl text-zinc-300 leading-relaxed font-light">
                          {sig.narrative}
                        </p>
                        
                        <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4 font-mono text-xs text-zinc-500">
                          <div className="flex items-center gap-2 mb-3 text-zinc-400">
                            <Terminal size={14} weight="bold" /> 
                            <span className="uppercase tracking-widest">Execution Trace</span>
                          </div>
                          <ul className="space-y-2">
                            {sig.reasoning.map((r, ri) => (
                              <li key={ri} className="flex gap-3">
                                <span className="text-zinc-700">?</span> {r}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Meta Block */}
                      <div className="flex-shrink-0 flex flex-row lg:flex-col justify-between items-end lg:items-end lg:w-32 text-right border-t lg:border-t-0 border-white/[0.05] pt-6 lg:pt-0">
                        <div className="flex flex-col items-start lg:items-end gap-1">
                          <span className="text-[10px] text-zinc-600 uppercase tracking-widest">Confidence</span>
                          <span className="text-2xl font-medium text-white tracking-tight">{(sig.confidence * 100).toFixed(0)}%</span>
                        </div>
                        
                        <div className="flex flex-col items-end gap-3">
                          {sig.outcome && sig.outcome !== "PENDING" && (
                            <div className={`px-3 py-1 text-[10px] uppercase tracking-widest font-medium rounded-full border ${
                              sig.outcome === "WIN" 
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                                : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                            }`}>
                              {sig.outcome}
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 text-xs text-zinc-600 font-mono">
                            <Clock size={14} weight="light" />
                            {new Date(sig.timestamp).toLocaleTimeString("en-US", { hour12: false })}
                          </div>
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

