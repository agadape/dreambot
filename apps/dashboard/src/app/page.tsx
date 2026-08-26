"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Terminal, Crosshair, ShieldCheck, Lightning, Target, ArrowUpRight, ArrowDownRight, Clock } from "@phosphor-icons/react";

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
    <div className="min-h-screen bg-[#050505] text-zinc-300 font-mono selection:bg-emerald-500/30 selection:text-emerald-400">
      {/* Brutalist Grid Background */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      
      <div className="max-w-[1200px] mx-auto p-4 md:p-8 relative z-10">
        
        {/* Header - Terminal Style */}
        <header className="mb-12 border-b border-zinc-800 pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Terminal size={28} className="text-emerald-500" weight="duotone" />
              <h1 className="text-2xl md:text-3xl tracking-tighter font-bold text-white uppercase">DreamBot<span className="text-emerald-500">_</span>Signal</h1>
            </div>
            <p className="text-zinc-500 text-sm max-w-md leading-relaxed">
              Autonomous momentum & volatility indexing agent. Scanning Somnia Shannon Testnet.
            </p>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2 bg-emerald-950/30 border border-emerald-900/50 px-3 py-1.5 text-emerald-500 text-xs tracking-widest uppercase">
              <div className="w-2 h-2 bg-emerald-500 animate-pulse" />
              System_Online
            </div>
            <div className="text-zinc-600 text-xs">
              UPLINK: ACTIVE // INTERVAL: 15s
            </div>
          </div>
        </header>

        {/* Performance Metrics - Brutalist Bento */}
        {perf && perf.total > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-zinc-800 border border-zinc-800 mb-12">
            <div className="bg-[#0a0a0a] p-6 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-zinc-500 text-xs uppercase tracking-widest">
                <Target size={16} /> Win_Rate
              </div>
              <div className="text-4xl text-emerald-400 tracking-tighter">
                {(perf.winRate * 100).toFixed(1)}%
              </div>
            </div>
            <div className="bg-[#0a0a0a] p-6 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-zinc-500 text-xs uppercase tracking-widest">
                <Lightning size={16} /> Executed
              </div>
              <div className="text-4xl text-white tracking-tighter">
                {perf.total}
              </div>
            </div>
            <div className="bg-[#0a0a0a] p-6 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-zinc-500 text-xs uppercase tracking-widest">
                <ShieldCheck size={16} /> Alpha_Hits
              </div>
              <div className="text-4xl text-emerald-400 tracking-tighter">
                {perf.wins}
              </div>
            </div>
            <div className="bg-[#0a0a0a] p-6 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-zinc-500 text-xs uppercase tracking-widest">
                <Crosshair size={16} /> Misses
              </div>
              <div className="text-4xl text-rose-500 tracking-tighter">
                {perf.losses}
              </div>
            </div>
          </div>
        )}

        {/* Signal Feed */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest">/ Live_Signal_Feed</h2>
            <span className="text-xs text-zinc-600">AWAITING_INSTRUCTION</span>
          </div>
          
          <div className="flex flex-col gap-4">
            <AnimatePresence mode="popLayout">
              {signals.length === 0 ? (
                <div className="border border-dashed border-zinc-800 p-8 text-center text-zinc-600 text-sm uppercase tracking-widest">
                  NO_DATA_STREAM_DETECTED
                </div>
              ) : (
                signals.map((sig, i) => (
                  <motion.div 
                    key={`${sig.marketId}-${sig.timestamp}`}
                    initial={{ opacity: 0, y: -20, backgroundColor: "#064e3b" }}
                    animate={{ opacity: 1, y: 0, backgroundColor: "#0a0a0a" }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="group border border-zinc-800 bg-[#0a0a0a] p-5 hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex flex-col md:flex-row gap-6">
                      
                      {/* Left: Direction & Market */}
                      <div className="flex-shrink-0 flex flex-row md:flex-col items-center md:items-start gap-4 md:w-32">
                        <div className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase tracking-widest ${
                          sig.direction === "UP" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        }`}>
                          {sig.direction === "UP" ? <ArrowUpRight weight="bold" /> : <ArrowDownRight weight="bold" />}
                          {sig.direction}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xl font-bold text-white uppercase tracking-tight">{sig.market}</span>
                          <span className="text-xs text-zinc-500">CONF: {(sig.confidence * 100).toFixed(0)}%</span>
                        </div>
                      </div>

                      {/* Middle: Narrative & Trace */}
                      <div className="flex-1 flex flex-col gap-4">
                        <p className="text-sm text-zinc-300 leading-relaxed font-sans">
                          {sig.narrative}
                        </p>
                        
                        <div className="bg-black border border-zinc-900 p-3 text-xs text-zinc-500 font-mono">
                          <div className="mb-2 uppercase tracking-widest text-zinc-700">Trace_Log //</div>
                          <ul className="space-y-1">
                            {sig.reasoning.map((r, ri) => (
                              <li key={ri} className="flex gap-2">
                                <span className="text-emerald-900">&gt;</span> {r}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Right: Timestamp & Outcome */}
                      <div className="flex-shrink-0 flex flex-row md:flex-col items-end md:items-end justify-between md:w-32">
                        <div className="flex items-center gap-1.5 text-xs text-zinc-600">
                          <Clock size={14} />
                          {new Date(sig.timestamp).toLocaleTimeString("en-US", { hour12: false })}
                        </div>
                        
                        {sig.outcome && sig.outcome !== "PENDING" && (
                          <div className={`mt-auto px-2 py-1 text-[10px] uppercase tracking-widest font-bold border ${
                            sig.outcome === "WIN" 
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                              : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                          }`}>
                            {sig.outcome}
                          </div>
                        )}
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

