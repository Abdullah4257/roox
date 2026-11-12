"use client";

import React, { useState, useEffect } from "react";

interface CryptoCoin {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  image: string;
}

export default function Home() {
  const [coins, setCoins] = useState<CryptoCoin[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Trading Form States
  const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState<string>("");
  const [selectedCoin, setSelectedCoin] = useState<string>("bitcoin");

  // Fetch Live Crypto Data from CoinGecko API
  useEffect(() => {
    const fetchCryptoData = async () => {
      try {
        const res = await fetch(
          "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=6&page=1&sparkline=false"
        );
        const data = await res.json();
        setCoins(data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching crypto data:", error);
        setLoading(false);
      }
    };

    fetchCryptoData();
    const interval = setInterval(fetchCryptoData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Header / Navigation */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 backdrop-blur-md sticky top-0 z-50 bg-slate-950/80">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <span className="text-white font-extrabold text-xl">R</span>
          </div>
          <span className="text-2xl font-black tracking-wider text-white">
            ROOX<span className="text-cyan-400">.IO</span>
          </span>
        </div>
        
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <a href="#markets" className="hover:text-cyan-400 transition-colors">Markets</a>
          <a href="#trade" className="hover:text-cyan-400 transition-colors">Trade Terminal</a>
          <a href="#features" className="hover:text-cyan-400 transition-colors">Security</a>
        </nav>

        <div className="flex items-center gap-3">
          <button className="text-sm font-medium text-slate-300 hover:text-white px-4 py-2">
            Login
          </button>
          <button className="text-sm font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-5 py-2.5 rounded-xl shadow-lg shadow-cyan-500/20 transition-all">
            Get Started
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7 text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-6">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            Powered by Live CoinGecko API
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight mb-6">
            Next-Gen Crypto Exchange for <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Global Traders</span>
          </h1>
          
          <p className="text-slate-400 text-base md:text-lg max-w-xl mb-8">
            Experience ultra-fast order matching, live market analytics, and institutional-grade security all in one sleek platform.
          </p>

          <div className="flex flex-wrap gap-4">
            <a href="#trade" className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-8 py-4 rounded-xl shadow-xl shadow-cyan-500/25 transition-all text-base">
              Start Trading Now
            </a>
            <a href="#markets" className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-8 py-4 rounded-xl border border-slate-800 transition-all text-base">
              Live Market Prices
            </a>
          </div>
        </div>

        {/* Quick Trade Widget Box */}
        <div id="trade" className="lg:col-span-5 bg-slate-900/80 border border-slate-800 p-6 rounded-3xl backdrop-blur-md shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white">Instant Swap & Trade</h3>
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button 
                onClick={() => setTradeType("buy")}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${tradeType === "buy" ? "bg-emerald-500 text-slate-950" : "text-slate-400 hover:text-white"}`}
              >
                BUY
              </button>
              <button 
                onClick={() => setTradeType("sell")}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${tradeType === "sell" ? "bg-rose-500 text-slate-950" : "text-slate-400 hover:text-white"}`}
              >
                SELL
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 font-medium mb-1 block">Select Asset</label>
              <select 
                value={selectedCoin}
                onChange={(e) => setSelectedCoin(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500"
              >
                <option value="bitcoin">Bitcoin (BTC)</option>
                <option value="ethereum">Ethereum (ETH)</option>
                <option value="solana">Solana (SOL)</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-medium mb-1 block">Amount (USD)</label>
              <input 
                type="number" 
                placeholder="0.00" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>

            <button className={`w-full py-4 rounded-xl font-bold text-slate-950 transition-all shadow-lg mt-2 ${tradeType === "buy" ? "bg-emerald-400 hover:bg-emerald-300 shadow-emerald-500/20" : "bg-rose-400 hover:bg-rose-300 shadow-rose-500/20"}`}>
              {tradeType === "buy" ? "Execute Buy Order" : "Execute Sell Order"}
            </button>
          </div>
        </div>
      </section>

      {/* Live Markets Section */}
      <section id="markets" className="max-w-7xl mx-auto px-6 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold tracking-tight">Market Trend & Prices</h2>
          <span className="text-xs text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">Live Updates</span>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-500">Loading live crypto data...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coins.map((coin) => (
              <div key={coin.id} className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl hover:border-cyan-500/50 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <img src={coin.image} alt={coin.name} className="w-8 h-8" />
                    <div>
                      <h4 className="font-bold text-white">{coin.name}</h4>
                      <span className="text-xs text-slate-400 uppercase">{coin.symbol}</span>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${coin.price_change_percentage_24h >= 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
                    {coin.price_change_percentage_24h >= 0 ? "+" : ""}{coin.price_change_percentage_24h?.toFixed(2)}%
                  </span>
                </div>
                <div className="text-2xl font-extrabold text-white">
                  ${coin.current_price?.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 mt-20 py-8 text-center text-slate-500 text-sm">
        <p>&copy; 2026 ROOX.IO Exchange Platform. All rights reserved.</p>
      </footer>
    </main>
  );
}