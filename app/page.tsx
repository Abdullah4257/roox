"use client";

import React, { useState, useEffect, useRef } from "react";

interface MarketCoin {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  total_volume: number;
  image: string;
}

interface OrderBookEntry {
  price: string;
  amount: string;
  total: string;
  depth: number;
}

interface TradeHistoryEntry {
  id: number;
  price: string;
  amount: string;
  time: string;
  isBuy: boolean;
}

export default function RooxEnterpriseExchange() {
  // Navigation & Global States
  const [currentView, setCurrentView] = useState<string>("home");
  const [coins, setCoins] = useState<MarketCoin[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  // Authentication & User States
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string>("");
  const [authStep, setAuthStep] = useState<"register" | "verify" | null>(null);
  const [inputEmail, setInputEmail] = useState<string>("");
  const [inputPassword, setInputPassword] = useState<string>("");
  const [otpCode, setOtpCode] = useState<string>("");
  const [sentOtp, setSentOtp] = useState<string>("123456"); // Simulated OTP for instant testing

  // Initial Balances & Demo Claim Tracker (Max $500 Limit)
  const [spotBalance, setSpotBalance] = useState<number>(0);
  const [futuresBalance, setFuturesBalance] = useState<number>(0);
  const [earnBalance, setEarnBalance] = useState<number>(0);
  const [btcHolding, setBtcHolding] = useState<number>(0);
  const [totalDemoClaimed, setTotalDemoClaimed] = useState<number>(0);
  const MAX_DEMO_LIMIT = 500;

  // Spot Trading States
  const [selectedPair, setSelectedPair] = useState<string>("BTCUSDT");
  const [livePrice, setLivePrice] = useState<number>(67420.50);
  const [orderType, setOrderType] = useState<"Limit" | "Market">("Limit");
  const [tradeSide, setTradeSide] = useState<"BUY" | "SELL">("BUY");
  const [orderPrice, setOrderPrice] = useState<string>("67420.50");
  const [orderAmount, setOrderAmount] = useState<string>("");

  // Futures Margin & Leverage States
  const [leverage, setLeverage] = useState<number>(20);
  const [marginMode, setMarginMode] = useState<"Cross" | "Isolated">("Cross");

  // Order Book & Recent Trades
  const [asks, setAsks] = useState<OrderBookEntry[]>([]);
  const [bids, setBids] = useState<OrderBookEntry[]>([]);
  const [recentTrades, setRecentTrades] = useState<TradeHistoryEntry[]>([]);

  // Modal States
  const [modalType, setModalType] = useState<"demo_request" | "withdraw" | "transfer" | null>(null);
  const [modalAmount, setModalAmount] = useState<string>("");
  const [selectedNetwork, setSelectedNetwork] = useState<string>("TRC20 (Tron)");

  // TradingView Chart Refs
  const spotTvRef = useRef<HTMLDivElement>(null);
  const futuresTvRef = useRef<HTMLDivElement>(null);

  const showNotification = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  // Total Net Worth Calculation
  const totalNetWorth = spotBalance + futuresBalance + earnBalance + btcHolding * livePrice;
  const remainingDemoQuota = Math.max(0, MAX_DEMO_LIMIT - totalDemoClaimed);

  // 1. Fetch Live CoinGecko API Data
  useEffect(() => {
    fetch(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,tether,solana,binancecoin,ripple,cardano,avalanche-2,chainlink,polkadot,dogecoin,shiba-inu&order=market_cap_desc&sparkline=false"
    )
      .then((res) => res.json())
      .then((data) => {
        setCoins(data);
        const btc = data.find((c: MarketCoin) => c.id === "bitcoin");
        if (btc) {
          setLivePrice(btc.current_price);
          setOrderPrice(btc.current_price.toFixed(2));
        }
      })
      .catch(() => {
        setCoins([
          { id: "bitcoin", symbol: "btc", name: "Bitcoin", current_price: 67420.5, price_change_percentage_24h: 3.45, total_volume: 28400000000, image: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png" },
          { id: "ethereum", symbol: "eth", name: "Ethereum", current_price: 3580.2, price_change_percentage_24h: 2.12, total_volume: 15200000000, image: "https://assets.coingecko.com/coins/images/279/small/ethereum.png" },
          { id: "binancecoin", symbol: "bnb", name: "BNB", current_price: 615.88, price_change_percentage_24h: -1.75, total_volume: 9000000000, image: "https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png" },
          { id: "solana", symbol: "sol", name: "Solana", current_price: 184.25, price_change_percentage_24h: 7.64, total_volume: 5400000000, image: "https://assets.coingecko.com/coins/images/4128/small/solana.png" },
        ]);
      });
  }, []);

  // 2. Embed Official TradingView Real-Time Chart
  useEffect(() => {
    const targetRef = currentView === "trade" ? spotTvRef.current : currentView === "futures" ? futuresTvRef.current : null;
    if (!targetRef) return;

    targetRef.innerHTML = "";
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: `BINANCE:${selectedPair}`,
      interval: "15",
      timezone: "Asia/Dhaka",
      theme: "dark",
      style: "1",
      locale: "en",
      backgroundColor: "#0B0E11",
      gridColor: "rgba(43, 49, 57, 0.4)",
      hide_top_toolbar: false,
      hide_legend: false,
      allow_symbol_change: true,
      save_image: false,
      calendar: false,
      support_host: "https://www.tradingview.com",
    });
    targetRef.appendChild(script);
  }, [selectedPair, currentView]);

  // 3. Real-Time Order Book & Trade Simulation Stream
  useEffect(() => {
    const streamEngine = () => {
      const base = livePrice;
      const newAsks: OrderBookEntry[] = Array.from({ length: 9 }, (_, i) => {
        const p = base + (9 - i) * (base * 0.00015) + Math.random() * 3;
        const amt = +(Math.random() * 1.8 + 0.02).toFixed(4);
        return {
          price: p.toFixed(2),
          amount: amt.toFixed(4),
          total: (p * amt).toFixed(2),
          depth: Math.floor(Math.random() * 80) + 15,
        };
      });

      const newBids: OrderBookEntry[] = Array.from({ length: 9 }, (_, i) => {
        const p = base - (i + 1) * (base * 0.00015) - Math.random() * 3;
        const amt = +(Math.random() * 1.8 + 0.02).toFixed(4);
        return {
          price: p.toFixed(2),
          amount: amt.toFixed(4),
          total: (p * amt).toFixed(2),
          depth: Math.floor(Math.random() * 80) + 15,
        };
      });

      setAsks(newAsks);
      setBids(newBids);

      const now = new Date();
      const timeStr = now.toTimeString().split(" ")[0];
      const isBuy = Math.random() > 0.46;
      const tPrice = (base + (Math.random() - 0.5) * 12).toFixed(2);
      const tAmount = (Math.random() * 0.8 + 0.01).toFixed(4);

      setRecentTrades((prev) => [
        { id: Date.now(), price: tPrice, amount: tAmount, time: timeStr, isBuy },
        ...prev.slice(0, 14),
      ]);
    };

    streamEngine();
    const interval = setInterval(streamEngine, 2000);
    return () => clearInterval(interval);
  }, [livePrice]);

  // Handle Auth: Send Verification Code
  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputEmail || !inputEmail.includes("@")) {
      showNotification("দয়া করে একটি সঠিক জিমেইল (Email) ঠিকানা লিখুন।");
      return;
    }
    if (!inputPassword || inputPassword.length < 6) {
      showNotification("পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে।");
      return;
    }
    // Generate a random 6 digit code for simulation
    const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
    setSentOtp(randomCode);
    setAuthStep("verify");
    showNotification(`ভেরিফিকেশন কোড পাঠানো হয়েছে! (ডেমো কোডটি হলো: ${randomCode})`);
  };

  // Handle Auth: Verify OTP and Complete Registration
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode !== sentOtp) {
      showNotification("ভুল ভেরিফিকেশন কোড! সঠিক কোডটি বসান।");
      return;
    }
    setIsLoggedIn(true);
    setUserEmail(inputEmail);
    setAuthStep(null);
    showNotification("অভিনন্দন! আপনার ROOX.IO একাউন্ট সফলভাবে তৈরি হয়েছে।");
  };

  // Handle Demo Dollar Request (Max $500)
  const handleDemoRequest = () => {
    if (!isLoggedIn) {
      setAuthStep("register");
      showNotification("ডেমো ডলার রিকোয়েস্ট করার জন্য আগে একাউন্ট তৈরি করুন।");
      return;
    }
    const reqAmount = parseFloat(modalAmount);
    if (!reqAmount || reqAmount <= 0) {
      showNotification("সঠিক ডলারের পরিমাণ লিখুন (যেমন: 100 বা 500)।");
      return;
    }
    if (remainingDemoQuota <= 0) {
      showNotification("আপনি ইতিমধ্যে সর্বোচ্চ $500 ডেমো ডলার নিয়ে ফেলেছেন!");
      return;
    }
    if (reqAmount > remainingDemoQuota) {
      showNotification(`আপনি আর সর্বোচ্চ $${remainingDemoQuota.toFixed(2)} ডেমো ডলার রিকোয়েস্ট করতে পারবেন!`);
      return;
    }

    setSpotBalance((prev) => prev + reqAmount);
    setTotalDemoClaimed((prev) => prev + reqAmount);
    showNotification(`সফলভাবে $${reqAmount.toFixed(2)} ডেমো USDT আপনার একাউন্টে যোগ হয়েছে!`);
    setModalAmount("");
    setModalType(null);
  };

  return (
    <div className="min-h-screen bg-[#181A20] text-[#EAECEF] font-sans selection:bg-[#F0B90B] selection:text-black">
      {/* Toast Notification Alert */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#2B3139] border border-[#F0B90B] text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 max-w-md">
          <span className="w-2.5 h-2.5 rounded-full bg-[#F0B90B] animate-ping shrink-0" />
          <span className="text-sm font-semibold">{toast}</span>
        </div>
      )}

      {/* ================= MASTER NAVIGATION HEADER ================= */}
      <header className="sticky top-0 z-50 bg-[#181A20] border-b border-[#2B3139] px-4 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div onClick={() => setCurrentView("home")} className="flex items-center gap-2.5 cursor-pointer">
            <img src="/logo.png" alt="ROOX.IO" className="w-9 h-9 object-contain rounded bg-[#0B0E11] p-0.5 border border-[#2B3139]" />
            <span className="text-xl font-extrabold tracking-wider text-white">
              ROOX<span className="text-[#F0B90B]">.IO</span>
            </span>
          </div>

          <nav className="hidden xl:flex items-center gap-1 text-sm font-medium text-[#848E9C]">
            <button onClick={() => setCurrentView("home")} className={`px-3 py-2 hover:text-white transition ${currentView === "home" ? "text-[#F0B90B]" : ""}`}>Home</button>
            <button onClick={() => setCurrentView("markets")} className={`px-3 py-2 hover:text-white transition ${currentView === "markets" ? "text-[#F0B90B]" : ""}`}>Markets</button>
            <button onClick={() => setCurrentView("trade")} className={`px-3 py-2 hover:text-white transition ${currentView === "trade" ? "text-[#F0B90B]" : ""}`}>Spot Trade</button>
            <button onClick={() => setCurrentView("futures")} className={`px-3 py-2 hover:text-white transition ${currentView === "futures" ? "text-[#F0B90B]" : ""}`}>USDⓈ-M Futures</button>
            <button onClick={() => setCurrentView("earn")} className={`px-3 py-2 hover:text-white transition ${currentView === "earn" ? "text-[#F0B90B]" : ""}`}>Earn & Staking</button>
            <button onClick={() => setCurrentView("p2p")} className={`px-3 py-2 hover:text-white transition ${currentView === "p2p" ? "text-[#F0B90B]" : ""}`}>P2P Express</button>
            <button onClick={() => setCurrentView("wallet")} className={`px-3 py-2 hover:text-white transition ${currentView === "wallet" ? "text-[#F0B90B]" : ""}`}>Asset Portfolio</button>
          </nav>
        </div>

        <div className="flex items-center gap-2.5">
          {isLoggedIn ? (
            <>
              <button
                onClick={() => {
                  setModalAmount(remainingDemoQuota > 0 ? String(remainingDemoQuota) : "");
                  setModalType("demo_request");
                }}
                className="bg-[#F0B90B] hover:bg-[#dbb507] text-black font-bold text-xs px-3.5 py-2 rounded-lg transition shadow"
              >
                + Request Demo ($500 Max)
              </button>
              <div onClick={() => setCurrentView("wallet")} className="flex items-center bg-[#0B0E11] border border-[#2B3139] hover:border-[#F0B90B] cursor-pointer px-3 py-1.5 rounded-lg text-xs transition">
                <span className="text-[#848E9C] mr-1.5">{userEmail.split("@")[0]}:</span>
                <span className="text-[#F0B90B] font-bold font-mono">${totalNetWorth.toFixed(2)}</span>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAuthStep("register")}
                className="bg-[#F0B90B] hover:bg-[#dbb507] text-black font-bold text-xs px-4 py-2 rounded-lg transition shadow"
              >
                Sign Up / Create Account
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Mobile Navigation Bar */}
      <div className="flex xl:hidden overflow-x-auto bg-[#181A20] border-b border-[#2B3139] px-3 py-2 gap-2 text-xs">
        {(["home", "trade", "futures", "markets", "earn", "p2p", "wallet"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setCurrentView(tab)}
            className={`px-3 py-1.5 rounded font-semibold capitalize whitespace-nowrap ${
              currentView === tab ? "bg-[#F0B90B] text-black" : "bg-[#2B3139] text-[#848E9C]"
            }`}
          >
            {tab === "trade" ? "Spot Trade" : tab}
          </button>
        ))}
      </div>

      {/* ================= VIEW 1: HOME PAGE ================= */}
      {currentView === "home" && (
        <main className="max-w-7xl mx-auto px-4 lg:px-8 py-12 lg:py-20 space-y-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 bg-[#2B3139]/60 border border-[#363C45] px-3.5 py-1.5 rounded-full text-xs text-[#F0B90B]">
                <span className="w-2 h-2 rounded-full bg-[#F0B90B] animate-pulse" /> Global Tier-1 Digital Asset Exchange
              </div>
              <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
                368,450,120 <br />
                <span className="text-white">ACTIVE INVESTORS</span> <br />
                <span className="text-[#F0B90B]">TRUST ROOX.IO</span>
              </h1>
              <p className="text-base text-[#848E9C]">
                Create your account with Gmail, verify your code, and claim up to <strong className="text-white">$500.00 Free Demo USDT</strong> to trade securely on real-time TradingView charts.
              </p>

              {/* Demo Account Quick Status Banner */}
              <div className="bg-[#1E2329] border border-[#2B3139] p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-xs text-[#848E9C]">Your Account Demo Balance</div>
                  <div className="text-2xl font-extrabold text-white font-mono">${spotBalance.toFixed(2)} <span className="text-xs text-[#F0B90B]">USDT</span></div>
                  <div className="text-[11px] text-[#848E9C] mt-0.5">
                    {isLoggedIn ? `Status: Verified (${userEmail})` : "Status: Account required to claim bonus"}
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (!isLoggedIn) {
                      setAuthStep("register");
                      showNotification("প্রথমে আপনার জিমেইল দিয়ে একটি একাউন্ট তৈরি করুন।");
                      return;
                    }
                    setModalAmount(remainingDemoQuota > 0 ? String(remainingDemoQuota) : "");
                    setModalType("demo_request");
                  }}
                  disabled={isLoggedIn && remainingDemoQuota <= 0}
                  className={`font-bold px-5 py-3 rounded-xl text-xs transition ${
                    !isLoggedIn
                      ? "bg-[#0ECB81] hover:bg-[#0bb572] text-black"
                      : remainingDemoQuota > 0
                      ? "bg-[#F0B90B] hover:bg-[#dbb507] text-black"
                      : "bg-[#2B3139] text-[#848E9C] cursor-not-allowed"
                  }`}
                >
                  {!isLoggedIn ? "Create Account & Get $500" : remainingDemoQuota > 0 ? `Request Demo ($${remainingDemoQuota} Left)` : "Max $500 Limit Reached"}
                </button>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setCurrentView("trade")} className="bg-[#0ECB81] hover:bg-[#0bb572] text-black font-bold px-6 py-3.5 rounded-xl text-sm transition">
                  Launch Spot Terminal
                </button>
                <button onClick={() => setCurrentView("futures")} className="bg-[#2B3139] hover:bg-[#363C45] text-white font-bold px-6 py-3.5 rounded-xl text-sm transition">
                  Trade Futures 125x
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 space-y-6">
              <div className="bg-[#1E2329] border border-[#2B3139] rounded-2xl p-5 shadow-2xl">
                <div className="flex items-center justify-between border-b border-[#2B3139] pb-3 mb-3 text-xs font-bold text-[#F0B90B]">
                  <span>Trending Cryptocurrencies</span>
                  <button onClick={() => setCurrentView("markets")} className="hover:underline">View Markets ›</button>
                </div>
                <div className="space-y-3">
                  {coins.slice(0, 5).map((c) => {
                    const isUp = c.price_change_percentage_24h >= 0;
                    return (
                      <div key={c.id} onClick={() => { setSelectedPair(`${c.symbol.toUpperCase()}USDT`); setCurrentView("trade"); }} className="flex items-center justify-between py-2.5 hover:bg-[#2B3139]/40 px-3 rounded-xl transition cursor-pointer">
                        <div className="flex items-center gap-3">
                          <img src={c.image} alt={c.name} className="w-7 h-7 rounded-full" />
                          <div>
                            <div className="font-bold text-sm text-white">{c.symbol.toUpperCase()}</div>
                            <div className="text-[11px] text-[#848E9C]">{c.name}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-semibold text-sm text-white">${c.current_price.toLocaleString()}</div>
                          <div className={`text-xs font-bold ${isUp ? "text-[#0ECB81]" : "text-[#F6465D]"}`}>{isUp ? "+" : ""}{c.price_change_percentage_24h?.toFixed(2)}%</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* ================= VIEW 2: SPOT TRADING TERMINAL WITH TRADINGVIEW ================= */}
      {currentView === "trade" && (
        <main className="max-w-[1680px] mx-auto p-4 space-y-4">
          <div className="bg-[#1E2329] border border-[#2B3139] rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <select value={selectedPair} onChange={(e) => setSelectedPair(e.target.value)} className="bg-[#0B0E11] border border-[#2B3139] text-white font-bold text-lg px-4 py-2 rounded-lg focus:outline-none focus:border-[#F0B90B]">
                <option value="BTCUSDT">BTC / USDT</option>
                <option value="ETHUSDT">ETH / USDT</option>
                <option value="BNBUSDT">BNB / USDT</option>
                <option value="SOLUSDT">SOL / USDT</option>
                <option value="XRPUSDT">XRP / USDT</option>
              </select>
              <div>
                <div className="text-2xl font-extrabold text-[#0ECB81] font-mono">${livePrice.toLocaleString()}</div>
                <div className="text-[11px] text-[#848E9C]">24h High: ${(livePrice * 1.024).toFixed(2)} | Low: ${(livePrice * 0.976).toFixed(2)}</div>
              </div>
            </div>
            <div className="flex gap-6 text-xs text-[#848E9C]">
              <div><span>Spot Available:</span> <strong className="text-white block font-mono">${spotBalance.toFixed(2)} USDT</strong></div>
              <div><span>Account:</span> <strong className="text-[#F0B90B] block">{isLoggedIn ? userEmail : "Guest (Sign Up Required)"}</strong></div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left Order Book */}
            <div className="lg:col-span-3 bg-[#1E2329] border border-[#2B3139] rounded-xl p-4 space-y-2">
              <div className="text-xs font-bold text-white uppercase border-b border-[#2B3139] pb-2 flex justify-between">
                <span>Order Book</span><span>Spread 0.01%</span>
              </div>
              <div className="grid grid-cols-3 text-[10px] text-[#848E9C]">
                <span>Price(USDT)</span><span className="text-right">Size</span><span className="text-right">Total</span>
              </div>
              <div className="space-y-1">
                {asks.map((a, idx) => (
                  <div key={idx} onClick={() => setOrderPrice(a.price)} className="relative grid grid-cols-3 text-xs font-mono py-0.5 px-1 cursor-pointer hover:bg-[#2B3139] overflow-hidden">
                    <div style={{ width: `${a.depth}%` }} className="absolute right-0 top-0 bottom-0 bg-[#F6465D]/15 pointer-events-none" />
                    <span className="text-[#F6465D] z-10">{a.price}</span>
                    <span className="text-right text-white z-10">{a.amount}</span>
                    <span className="text-right text-[#848E9C] z-10">{a.total}</span>
                  </div>
                ))}
              </div>
              <div className="py-2.5 text-center font-mono text-base font-extrabold text-[#0ECB81] border-y border-[#2B3139]">${livePrice.toFixed(2)} USD</div>
              <div className="space-y-1">
                {bids.map((b, idx) => (
                  <div key={idx} onClick={() => setOrderPrice(b.price)} className="relative grid grid-cols-3 text-xs font-mono py-0.5 px-1 cursor-pointer hover:bg-[#2B3139] overflow-hidden">
                    <div style={{ width: `${b.depth}%` }} className="absolute right-0 top-0 bottom-0 bg-[#0ECB81]/15 pointer-events-none" />
                    <span className="text-[#0ECB81] z-10">{b.price}</span>
                    <span className="text-right text-white z-10">{b.amount}</span>
                    <span className="text-right text-[#848E9C] z-10">{b.total}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Center Official TradingView Candlestick Chart */}
            <div className="lg:col-span-6 bg-[#1E2329] border border-[#2B3139] rounded-xl overflow-hidden flex flex-col min-h-[540px]">
              <div className="px-4 py-2.5 border-b border-[#2B3139] flex justify-between items-center text-xs text-[#848E9C]">
                <span className="text-white font-bold">{selectedPair} — TradingView Advanced Chart</span>
                <span className="text-[#0ECB81]">● Live Candlesticks</span>
              </div>
              <div ref={spotTvRef} className="w-full flex-1 min-h-[490px]" />
            </div>

            {/* Right Spot Execution Panel */}
            <div className="lg:col-span-3 bg-[#1E2329] border border-[#2B3139] rounded-xl p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                <div className="flex justify-between text-sm font-bold text-white border-b border-[#2B3139] pb-3">
                  <span>Spot Execution</span>
                  {isLoggedIn ? (
                    <button onClick={() => setModalType("demo_request")} className="text-xs text-[#F0B90B] hover:underline">+ Get Demo $</button>
                  ) : (
                    <button onClick={() => setAuthStep("register")} className="text-xs text-[#0ECB81] font-bold hover:underline">Sign Up First</button>
                  )}
                </div>

                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 bg-[#0B0E11] p-1 rounded-lg">
                    <button onClick={() => setTradeSide("BUY")} className={`py-2 rounded font-bold transition ${tradeSide === "BUY" ? "bg-[#0ECB81] text-black" : "text-[#848E9C]"}`}>BUY</button>
                    <button onClick={() => setTradeSide("SELL")} className={`py-2 rounded font-bold transition ${tradeSide === "SELL" ? "bg-[#F6465D] text-white" : "text-[#848E9C]"}`}>SELL</button>
                  </div>

                  <div className="flex justify-between text-[#848E9C]">
                    <span>Available:</span>
                    <span className="text-white font-mono">
                      {tradeSide === "BUY" ? `${spotBalance.toFixed(2)} USDT` : `${btcHolding.toFixed(6)} BTC`}
                    </span>
                  </div>

                  <div>
                    <label className="text-[#848E9C] block mb-1">Order Type</label>
                    <select value={orderType} onChange={(e) => setOrderType(e.target.value as "Limit" | "Market")} className="w-full bg-[#0B0E11] border border-[#2B3139] p-2.5 rounded-lg text-white">
                      <option value="Limit">Limit Order</option>
                      <option value="Market">Market Order</option>
                    </select>
                  </div>

                  {orderType === "Limit" && (
                    <div>
                      <label className="text-[#848E9C] block mb-1">Price (USDT)</label>
                      <input type="number" value={orderPrice} onChange={(e) => setOrderPrice(e.target.value)} className="w-full bg-[#0B0E11] border border-[#2B3139] p-2.5 rounded-lg text-white font-mono" />
                    </div>
                  )}

                  <div>
                    <label className="text-[#848E9C] block mb-1">Amount (BTC)</label>
                    <input type="number" placeholder="0.001" value={orderAmount} onChange={(e) => setOrderAmount(e.target.value)} className="w-full bg-[#0B0E11] border border-[#2B3139] p-2.5 rounded-lg text-white font-mono" />
                  </div>

                  {/* Quick Percentage Selector */}
                  <div className="grid grid-cols-4 gap-1.5">
                    {[25, 50, 75, 100].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => {
                          if (tradeSide === "BUY") {
                            const maxBtc = (spotBalance * (pct / 100)) / livePrice;
                            setOrderAmount(maxBtc.toFixed(6));
                          } else {
                            setOrderAmount((btcHolding * (pct / 100)).toFixed(6));
                          }
                        }}
                        className="bg-[#0B0E11] hover:bg-[#2B3139] border border-[#2B3139] py-1 rounded text-[11px] text-[#848E9C] hover:text-white"
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>

                  <div className="pt-2">
                    <button onClick={() => {
                      if (!isLoggedIn) {
                        setAuthStep("register");
                        showNotification("ট্রেড করার জন্য দয়া করে আগে একাউন্ট তৈরি করুন।");
                        return;
                      }
                      const amt = parseFloat(orderAmount);
                      if (!amt || amt <= 0) {
                        showNotification("সঠিক পরিমাণ লিখুন।");
                        return;
                      }
                      const cost = amt * livePrice;
                      if (tradeSide === "BUY") {
                        if (spotBalance <= 0) {
                          showNotification("আপনার ব্যালেন্স $0.00! প্রথমে 'Request Demo' থেকে ডলার নিন।");
                          return;
                        }
                        if (cost > spotBalance) {
                          showNotification(`পর্যাপ্ত ব্যালেন্স নেই! প্রয়োজন $${cost.toFixed(2)}, আছে $${spotBalance.toFixed(2)}।`);
                          return;
                        }
                        setSpotBalance((prev) => prev - cost);
                        setBtcHolding((prev) => prev + amt);
                        showNotification(`সফলভাবে $${cost.toFixed(2)} মূল্যের ${amt} BTC কেনা হয়েছে!`);
                      } else {
                        if (amt > btcHolding) {
                          showNotification("বিক্রি করার মতো পর্যাপ্ত BTC ব্যালেন্স নেই!");
                          return;
                        }
                        setBtcHolding((prev) => prev - amt);
                        setSpotBalance((prev) => prev + cost);
                        showNotification(`সফলভাবে ${amt} BTC বিক্রি করে $${cost.toFixed(2)} USDT পাওয়া গেছে!`);
                      }
                      setOrderAmount("");
                    }} className={`w-full font-bold py-3.5 rounded-xl text-sm transition ${tradeSide === "BUY" ? "bg-[#0ECB81] hover:bg-[#0bb572] text-black" : "bg-[#F6465D] hover:bg-[#df3b50] text-white"}`}>
                      Execute {tradeSide} Order
                    </button>
                  </div>
                </div>
              </div>

              {/* Recent Trades Feed */}
              <div className="border-t border-[#2B3139] pt-3">
                <div className="text-xs font-bold text-white mb-2">Recent Market Trades</div>
                <div className="space-y-1 max-h-28 overflow-y-auto text-[11px] font-mono">
                  {recentTrades.map((t) => (
                    <div key={t.id} className="grid grid-cols-3">
                      <span className={t.isBuy ? "text-[#0ECB81]" : "text-[#F6465D]"}>{t.price}</span>
                      <span className="text-right text-white">{t.amount}</span>
                      <span className="text-right text-[#848E9C]">{t.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* ================= VIEW 3: FUTURES 125X LEVERAGE + TRADINGVIEW ================= */}
      {currentView === "futures" && (
        <main className="max-w-7xl mx-auto p-6 space-y-6">
          <div className="bg-[#1E2329] border border-[#2B3139] rounded-2xl p-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <span className="bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full text-xs font-bold">USDⓈ-M FUTURES</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-2">Perpetual Contracts (Up to 125x Leverage)</h2>
              </div>
              <div className="flex gap-4 items-center">
                <div className="bg-[#0B0E11] border border-[#2B3139] px-4 py-2 rounded-xl">
                  <span className="text-xs text-[#848E9C] block">Futures Margin Balance</span>
                  <span className="text-lg font-bold text-white font-mono">${futuresBalance.toFixed(2)} USDT</span>
                </div>
                <button onClick={() => {
                  if (!isLoggedIn) { setAuthStep("register"); return; }
                  setModalType("transfer");
                }} className="bg-[#F0B90B] text-black font-bold px-4 py-2.5 rounded-xl text-xs">Transfer Margin</button>
              </div>
            </div>

            <div className="bg-[#0B0E11] border border-[#2B3139] rounded-xl overflow-hidden h-[420px] flex flex-col">
              <div className="px-4 py-2 border-b border-[#2B3139] flex justify-between text-xs text-[#848E9C]">
                <span className="text-white font-bold">{selectedPair} Perpetual TradingView Chart</span>
                <span className="text-[#F0B90B]">Funding Rate: +0.0100%</span>
              </div>
              <div ref={futuresTvRef} className="w-full flex-1" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="bg-[#0B0E11] border border-[#2B3139] p-6 rounded-xl space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-white">Leverage Multiplier</span>
                  <span className="text-xl font-extrabold text-[#F0B90B]">{leverage}x</span>
                </div>
                <input type="range" min="1" max="125" value={leverage} onChange={(e) => setLeverage(Number(e.target.value))} className="w-full accent-[#F0B90B]" />
                <div className="flex justify-between text-xs text-[#848E9C]">
                  <span>1x</span><span>50x</span><span>125x (High Leverage)</span>
                </div>
              </div>

              <div className="bg-[#0B0E11] border border-[#2B3139] p-6 rounded-xl space-y-4">
                <span className="text-sm font-bold text-white block">Margin Mode</span>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setMarginMode("Cross")} className={`py-2.5 rounded-lg text-xs font-bold ${marginMode === "Cross" ? "bg-[#F0B90B] text-black" : "bg-[#2B3139] text-white"}`}>Cross Margin</button>
                  <button onClick={() => setMarginMode("Isolated")} className={`py-2.5 rounded-lg text-xs font-bold ${marginMode === "Isolated" ? "bg-[#F0B90B] text-black" : "bg-[#2B3139] text-white"}`}>Isolated Margin</button>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button onClick={() => {
                    if (!isLoggedIn) { setAuthStep("register"); return; }
                    if (futuresBalance <= 0) {
                      showNotification("Futures ব্যালেন্স $0.00! প্রথমে Demo ডলার নিয়ে Transfer করুন।");
                      return;
                    }
                    showNotification(`Long position opened with ${leverage}x (${marginMode})!`);
                  }} className="bg-[#0ECB81] text-black font-bold py-3 rounded-xl text-xs">
                    Open Long
                  </button>
                  <button onClick={() => {
                    if (!isLoggedIn) { setAuthStep("register"); return; }
                    if (futuresBalance <= 0) {
                      showNotification("Futures ব্যালেন্স $0.00! প্রথমে Demo ডলার নিয়ে Transfer করুন।");
                      return;
                    }
                    showNotification(`Short position opened with ${leverage}x (${marginMode})!`);
                  }} className="bg-[#F6465D] text-white font-bold py-3 rounded-xl text-xs">
                    Open Short
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* ================= VIEW 4: MARKETS OVERVIEW ================= */}
      {currentView === "markets" && (
        <main className="max-w-7xl mx-auto p-6 space-y-6">
          <h2 className="text-2xl font-bold text-white">Cryptocurrency Markets & Real-Time Prices</h2>
          <div className="bg-[#1E2329] border border-[#2B3139] rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#0B0E11] text-[#848E9C] text-xs">
                <tr>
                  <th className="py-4 px-6">Asset</th>
                  <th className="py-4 px-6">Price</th>
                  <th className="py-4 px-6">24h Change</th>
                  <th className="py-4 px-6">24h Volume</th>
                  <th className="py-4 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2B3139]">
                {coins.map((c) => {
                  const isUp = c.price_change_percentage_24h >= 0;
                  return (
                    <tr key={c.id} className="hover:bg-[#2B3139]/40 transition">
                      <td className="py-4 px-6 flex items-center gap-3">
                        <img src={c.image} alt={c.name} className="w-7 h-7 rounded-full" />
                        <div><div className="font-bold text-white">{c.name}</div><div className="text-xs text-[#848E9C] uppercase">{c.symbol}</div></div>
                      </td>
                      <td className="py-4 px-6 font-mono font-bold text-white">${c.current_price.toLocaleString()}</td>
                      <td className="py-4 px-6">
                        <span className={`font-bold text-xs px-2.5 py-1 rounded ${isUp ? "bg-[#0ECB81]/15 text-[#0ECB81]" : "bg-[#F6465D]/15 text-[#F6465D]"}`}>
                          {isUp ? "+" : ""}{c.price_change_percentage_24h?.toFixed(2)}%
                        </span>
                      </td>
                      <td className="py-4 px-6 font-mono text-xs text-[#848E9C]">${(c.total_volume / 1e9).toFixed(2)}B</td>
                      <td className="py-4 px-6 text-right">
                        <button onClick={() => { setSelectedPair(`${c.symbol.toUpperCase()}USDT`); setCurrentView("trade"); }} className="bg-[#F0B90B] text-black font-bold text-xs px-4 py-2 rounded-lg">Trade</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </main>
      )}

      {/* ================= VIEW 5: EARN & STAKING ================= */}
      {currentView === "earn" && (
        <main className="max-w-7xl mx-auto p-6 space-y-6">
          <div className="bg-[#1E2329] border border-[#2B3139] rounded-2xl p-8 text-center space-y-6">
            <h2 className="text-3xl font-extrabold text-white">ROOX.IO Simple Earn & High Yield Staking</h2>
            <p className="text-[#848E9C] max-w-xl mx-auto">Stake your Demo USDT to earn up to 24.8% APY daily rewards.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              {[
                { title: "USDT Flexible Pool", apy: "18.5% APY", min: 50 },
                { title: "USDT 30D Locked", apy: "21.4% APY", min: 100 },
                { title: "USDT VIP Pro Pool", apy: "24.8% APY", min: 250 },
              ].map((pool, i) => (
                <div key={i} className="bg-[#0B0E11] p-6 rounded-xl border border-[#2B3139] space-y-3">
                  <div className="font-bold text-white text-lg">{pool.title}</div>
                  <div className="text-2xl font-extrabold text-[#0ECB81]">{pool.apy}</div>
                  <div className="text-xs text-[#848E9C]">Minimum Stake: ${pool.min} USDT</div>
                  <button
                    onClick={() => {
                      if (!isLoggedIn) { setAuthStep("register"); return; }
                      if (spotBalance < pool.min) {
                        showNotification(`স্টেকিংয়ের জন্য অন্তত $${pool.min} USDT ব্যালেন্স প্রয়োজন!`);
                        return;
                      }
                      setSpotBalance((prev) => prev - pool.min);
                      setEarnBalance((prev) => prev + pool.min);
                      showNotification(`সফলভাবে $${pool.min} USDT স্টেক করা হয়েছে!`);
                    }}
                    className="w-full bg-[#F0B90B] text-black font-bold py-2.5 rounded-lg text-xs"
                  >
                    Stake ${pool.min} USDT
                  </button>
                </div>
              ))}
            </div>
          </div>
        </main>
      )}

      {/* ================= VIEW 6: P2P EXPRESS ================= */}
      {currentView === "p2p" && (
        <main className="max-w-7xl mx-auto p-6 space-y-6">
          <div className="bg-[#1E2329] border border-[#2B3139] rounded-2xl p-8 space-y-6">
            <h2 className="text-2xl font-bold text-white">P2P Express Crypto Trading</h2>
            <p className="text-[#848E9C] text-xs">Zero-fee gateway secured by ROOX Escrow Protection.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#0B0E11] p-5 rounded-xl border border-[#2B3139] flex justify-between items-center">
                <div>
                  <div className="font-bold text-white">Merchant: ApexGlobal Pay</div>
                  <div className="text-xs text-[#0ECB81] mt-1">99.9% Completion (1,420 Orders)</div>
                </div>
                <button onClick={() => {
                  if (!isLoggedIn) { setAuthStep("register"); return; }
                  setModalType("demo_request");
                }} className="bg-[#0ECB81] text-black font-bold px-4 py-2 rounded-lg text-xs">Request Demo $</button>
              </div>
              <div className="bg-[#0B0E11] p-5 rounded-xl border border-[#2B3139] flex justify-between items-center">
                <div>
                  <div className="font-bold text-white">Merchant: SecureTrust Escrow</div>
                  <div className="text-xs text-[#0ECB81] mt-1">99.4% Completion (890 Orders)</div>
                </div>
                <button onClick={() => {
                  if (!isLoggedIn) { setAuthStep("register"); return; }
                  setModalType("demo_request");
                }} className="bg-[#0ECB81] text-black font-bold px-4 py-2 rounded-lg text-xs">Request Demo $</button>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* ================= VIEW 7: ASSET PORTFOLIO DASHBOARD ================= */}
      {currentView === "wallet" && (
        <main className="max-w-5xl mx-auto p-6 space-y-6">
          {isLoggedIn ? (
            <>
              <div className="bg-[#1E2329] border border-[#2B3139] rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div>
                  <span className="text-xs text-[#848E9C]">Account: <strong className="text-white">{userEmail}</strong></span>
                  <h1 className="text-3xl font-extrabold text-white mt-1 font-mono">
                    ${totalNetWorth.toFixed(2)} <span className="text-sm font-normal text-[#848E9C]">USDT</span>
                  </h1>
                  <div className="text-xs text-[#F0B90B] mt-1">
                    Demo Quota Used: ${totalDemoClaimed.toFixed(2)} / $500.00 (Remaining: ${remainingDemoQuota.toFixed(2)})
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => {
                      setModalAmount(remainingDemoQuota > 0 ? String(remainingDemoQuota) : "");
                      setModalType("demo_request");
                    }}
                    className="bg-[#F0B90B] text-black font-bold px-4 py-2.5 rounded-lg text-sm"
                  >
                    + Request Demo ($)
                  </button>
                  <button onClick={() => setModalType("transfer")} className="bg-[#2B3139] text-white font-bold px-4 py-2.5 rounded-lg text-sm">
                    Transfer
                  </button>
                  <button onClick={() => setModalType("withdraw")} className="bg-[#2B3139] text-white font-bold px-4 py-2.5 rounded-lg text-sm">
                    Withdraw
                  </button>
                </div>
              </div>

              {/* Wallet Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-[#1E2329] border border-[#2B3139] p-5 rounded-xl">
                  <span className="text-xs text-[#848E9C]">Spot Wallet (USDT)</span>
                  <div className="text-xl font-bold text-white font-mono mt-1">${spotBalance.toFixed(2)}</div>
                </div>
                <div className="bg-[#1E2329] border border-[#2B3139] p-5 rounded-xl">
                  <span className="text-xs text-[#848E9C]">Bitcoin Holding</span>
                  <div className="text-xl font-bold text-white font-mono mt-1">{btcHolding.toFixed(6)} BTC</div>
                </div>
                <div className="bg-[#1E2329] border border-[#2B3139] p-5 rounded-xl">
                  <span className="text-xs text-[#848E9C]">Futures Margin</span>
                  <div className="text-xl font-bold text-white font-mono mt-1">${futuresBalance.toFixed(2)}</div>
                </div>
                <div className="bg-[#1E2329] border border-[#2B3139] p-5 rounded-xl">
                  <span className="text-xs text-[#848E9C]">Earn Staking</span>
                  <div className="text-xl font-bold text-[#0ECB81] font-mono mt-1">${earnBalance.toFixed(2)}</div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-[#1E2329] border border-[#2B3139] rounded-2xl p-12 text-center space-y-4">
              <h2 className="text-2xl font-bold text-white">Please Create an Account</h2>
              <p className="text-xs text-[#848E9C]">You need to sign up with your Gmail and verify your code to view your portfolio and claim $500 bonus.</p>
              <button onClick={() => setAuthStep("register")} className="bg-[#F0B90B] text-black font-bold px-6 py-3 rounded-xl text-xs">
                Sign Up Now
              </button>
            </div>
          )}
        </main>
      )}

      {/* ================= AUTHENTICATION MODAL (SIGN UP & OTP VERIFICATION) ================= */}
      {authStep && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1E2329] border border-[#2B3139] rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#2B3139] pb-3">
              <h3 className="text-lg font-bold text-white">
                {authStep === "register" ? "Create ROOX.IO Account" : "Enter Verification Code (OTP)"}
              </h3>
              <button onClick={() => setAuthStep(null)} className="text-[#848E9C] hover:text-white font-bold text-lg">✕</button>
            </div>

            {authStep === "register" ? (
              <form onSubmit={handleSendOtp} className="space-y-4 text-xs">
                <p className="text-[#848E9C]">Enter your Gmail address to create your secure exchange account and unlock up to $500 demo trading bonus.</p>
                <div>
                  <label className="text-[#848E9C] block mb-1">Gmail Address</label>
                  <input
                    type="email"
                    placeholder="name@gmail.com"
                    value={inputEmail}
                    onChange={(e) => setInputEmail(e.target.value)}
                    className="w-full bg-[#0B0E11] border border-[#2B3139] p-3 rounded-lg text-white text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="text-[#848E9C] block mb-1">Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={inputPassword}
                    onChange={(e) => setInputPassword(e.target.value)}
                    className="w-full bg-[#0B0E11] border border-[#2B3139] p-3 rounded-lg text-white text-sm"
                    required
                  />
                </div>
                <button type="submit" className="w-full bg-[#F0B90B] hover:bg-[#dbb507] text-black font-bold py-3.5 rounded-xl text-sm transition">
                  Continue & Send Code
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4 text-xs">
                <div className="bg-[#0B0E11] border border-[#2B3139] p-3.5 rounded-xl text-center space-y-1">
                  <div className="text-[#848E9C]">Verification code sent to:</div>
                  <div className="text-white font-bold text-sm">{inputEmail}</div>
                  <div className="text-[11px] text-[#F0B90B] mt-2">*(For testing convenience, your code is: <strong>{sentOtp}</strong>)*</div>
                </div>

                <div>
                  <label className="text-[#848E9C] block mb-1">Enter 6-digit Code</label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="w-full bg-[#0B0E11] border border-[#2B3139] p-3 text-center text-xl tracking-widest rounded-lg text-white font-mono"
                    required
                  />
                </div>

                <button type="submit" className="w-full bg-[#0ECB81] hover:bg-[#0bb572] text-black font-bold py-3.5 rounded-xl text-sm transition">
                  Verify & Create Account
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ================= UNIVERSAL MODAL SYSTEM (DEMO REQUEST / TRANSFER / WITHDRAW) ================= */}
      {modalType && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1E2329] border border-[#2B3139] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#2B3139] pb-3">
              <h3 className="text-lg font-bold text-white">
                {modalType === "demo_request"
                  ? "Request Free Demo Dollar ($500 Max)"
                  : modalType === "transfer"
                  ? "Transfer Spot to Futures"
                  : "Withdraw Funds — ROOX.IO"}
              </h3>
              <button onClick={() => setModalType(null)} className="text-[#848E9C] hover:text-white font-bold text-lg">✕</button>
            </div>

            {modalType === "demo_request" ? (
              <div className="space-y-4 text-xs">
                <div className="bg-[#0B0E11] border border-[#2B3139] p-3.5 rounded-xl space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[#848E9C]">Account:</span>
                    <span className="text-white font-bold">{userEmail}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#848E9C]">Already Requested:</span>
                    <span className="text-[#F0B90B] font-bold">${totalDemoClaimed.toFixed(2)} USDT</span>
                  </div>
                  <div className="flex justify-between border-t border-[#2B3139] pt-1 mt-1">
                    <span className="text-[#848E9C]">Remaining Quota:</span>
                    <span className="text-[#0ECB81] font-bold">${remainingDemoQuota.toFixed(2)} USDT</span>
                  </div>
                </div>

                <div>
                  <label className="text-[#848E9C] block mb-1">Request Amount (USDT)</label>
                  <input
                    type="number"
                    max={remainingDemoQuota}
                    placeholder="Enter amount up to 500..."
                    value={modalAmount}
                    onChange={(e) => setModalAmount(e.target.value)}
                    className="w-full bg-[#0B0E11] border border-[#2B3139] p-3 rounded-lg text-white font-mono text-sm"
                  />
                  <div className="flex gap-2 mt-2">
                    {[100, 250, 500].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        disabled={preset > remainingDemoQuota}
                        onClick={() => setModalAmount(String(preset))}
                        className={`px-3 py-1 rounded text-xs font-bold ${
                          preset <= remainingDemoQuota
                            ? "bg-[#2B3139] hover:bg-[#363C45] text-white"
                            : "bg-[#0B0E11] text-[#848E9C]/40 cursor-not-allowed"
                        }`}
                      >
                        +${preset}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleDemoRequest}
                  disabled={remainingDemoQuota <= 0}
                  className={`w-full font-bold py-3.5 rounded-xl text-sm transition ${
                    remainingDemoQuota > 0
                      ? "bg-[#F0B90B] hover:bg-[#dbb507] text-black"
                      : "bg-[#2B3139] text-[#848E9C] cursor-not-allowed"
                  }`}
                >
                  {remainingDemoQuota > 0 ? "Submit Demo Dollar Request" : "Maximum $500 Limit Reached"}
                </button>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                {modalType === "withdraw" && (
                  <div>
                    <label className="text-[#848E9C] block mb-1">Select Network</label>
                    <select value={selectedNetwork} onChange={(e) => setSelectedNetwork(e.target.value)} className="w-full bg-[#0B0E11] border border-[#2B3139] p-2.5 rounded-lg text-white">
                      <option value="TRC20">TRON (TRC20) — Instant</option>
                      <option value="BEP20">BNB Smart Chain (BEP20)</option>
                      <option value="ERC20">Ethereum (ERC20)</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="text-[#848E9C] block mb-1">Amount (Available: ${spotBalance.toFixed(2)} USDT)</label>
                  <input type="number" placeholder="Enter amount..." value={modalAmount} onChange={(e) => setModalAmount(e.target.value)} className="w-full bg-[#0B0E11] border border-[#2B3139] p-2.5 rounded-lg text-white font-mono" />
                </div>

                <button onClick={() => {
                  const val = parseFloat(modalAmount);
                  if (!val || val <= 0) { showNotification("সঠিক পরিমাণ লিখুন।"); return; }
                  if (val > spotBalance) { showNotification("পর্যাপ্ত Spot ব্যালেন্স নেই!"); return; }

                  if (modalType === "transfer") {
                    setSpotBalance((prev) => prev - val);
                    setFuturesBalance((prev) => prev + val);
                    showNotification(`সফলভাবে $${val.toFixed(2)} Futures ওয়ালেটে ট্রান্সফার হয়েছে!`);
                  } else {
                    setSpotBalance((prev) => prev - val);
                    showNotification(`সফলভাবে $${val.toFixed(2)} USDT Withdraw প্রসেস হয়েছে!`);
                  }
                  setModalAmount("");
                  setModalType(null);
                }} className="w-full bg-[#F0B90B] hover:bg-[#dbb507] text-black font-bold py-3 rounded-xl transition">
                  Confirm {modalType === "transfer" ? "Transfer" : "Withdraw"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer with Contact Links */}
      <footer className="border-t border-[#2B3139] py-8 bg-[#181A20] text-center text-xs text-[#848E9C] mt-20">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>© 2026 ROOX.IO — The World's Leading Cryptocurrency Exchange</div>
          
          <div className="flex items-center gap-6">
            <a 
              href="https://x.com/Rooxoi" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-[#F0B90B] transition flex items-center gap-1.5 font-semibold text-white"
            >
              <span>𝕏 Twitter (X)</span>
            </a>
            <a 
              href="https://t.me/rooxio" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-[#F0B90B] transition flex items-center gap-1.5 font-semibold text-white"
            >
              <span>💬 Telegram</span>
            </a>
          </div>

          <div className="flex gap-6">
            <a href="#privacy" className="hover:text-white">Privacy Policy</a>
            <a href="#terms" className="hover:text-white">Terms of Service</a>
            <a href="#security" className="hover:text-white">Institutional Security</a>
          </div>
        </div>
      </footer>
    </div>
  );
}