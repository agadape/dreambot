"use client";

import { useEffect, useState } from "react";

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
      } catch (err) {
        console.error("Failed to fetch signals", err);
      }
    };
    fetchSignals();
    const interval = setInterval(fetchSignals, 5000); // Polling setiap 5 detik
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="mb-10 text-center md:text-left flex flex-col md:flex-row justify-between items-center">
          <div>
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-2">
              DreamBot Signal
            </h1>
            <p className="text-gray-400 text-sm md:text-base">
              Live AI-driven momentum & volatility signals on Somnia Shannon Testnet.
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center gap-2 bg-gray-900 border border-gray-800 px-4 py-2 rounded-full">
            <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-xs font-medium text-gray-300 tracking-wider uppercase">Live Feed</span>
          </div>
        </header>

        {perf && perf.total > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl text-center">
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Win Rate</p>
              <p className="text-3xl font-bold text-green-400">{(perf.winRate * 100).toFixed(1)}%</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl text-center">
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Total</p>
              <p className="text-3xl font-bold text-white">{perf.total}</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl text-center">
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Wins</p>
              <p className="text-3xl font-bold text-green-400">{perf.wins}</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl text-center">
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Losses</p>
              <p className="text-3xl font-bold text-red-400">{perf.losses}</p>
            </div>
          </div>
        )}

        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white mb-2">Signal History</h2>
          
          {signals.length === 0 ? (
            <div className="text-center py-12 bg-gray-900 border border-gray-800 rounded-3xl">
              <p className="text-gray-500">Belum ada data sinyal tersedia. Menunggu agent run...</p>
            </div>
          ) : (
            signals.map((sig, i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 p-6 rounded-3xl flex flex-col gap-4 shadow-lg hover:border-gray-700 transition-colors">
                <div className="flex flex-wrap justify-between items-start gap-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="bg-gray-800 px-3 py-1.5 rounded-lg text-sm font-semibold tracking-wide text-white shadow-sm border border-gray-700">
                      {sig.market.toUpperCase()}
                    </span>
                    <span className={`px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm ${
                      sig.direction === 'UP' 
                        ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                      {sig.direction}
                    </span>
                    <span className="text-gray-400 text-sm font-medium">
                      Conf: {(sig.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 bg-gray-950 px-3 py-1 rounded-full border border-gray-800">
                    {new Date(sig.timestamp).toLocaleString()}
                  </div>
                </div>
                
                <p className="text-gray-200 text-lg leading-relaxed">
                  {sig.narrative}
                </p>
                
                <div className="bg-gray-950 p-4 rounded-2xl text-sm text-gray-400 font-mono border border-gray-800/50">
                  <span className="block mb-2 text-gray-500 text-xs tracking-widest uppercase">Reasoning Trace</span>
                  <ul className="list-disc pl-5 space-y-1">
                    {sig.reasoning.map((r, ri) => (
                      <li key={ri}>{r}</li>
                    ))}
                  </ul>
                </div>
                
                {sig.outcome && sig.outcome !== "PENDING" && (
                  <div className="mt-1">
                    <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-bold shadow-sm ${
                      sig.outcome === 'WIN' 
                        ? 'bg-green-600 text-white' 
                        : 'bg-red-600 text-white'
                    }`}>
                      {sig.outcome === 'WIN' ? '✓' : '✗'} RESULT: {sig.outcome}
                    </span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
