"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ArrowUpDown,
  Wallet,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  RefreshCw,
  ArrowDownLeft,
  ArrowUpRight,
  X,
  Activity,
  Layers,
  Clock,
} from "lucide-react";

interface MarketCoin {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  total_volume: number;
  image: string;
}

interface OrderEntry {
  price: string;
  amount: string;
  total: string;
  depth: number;
}

export default function RooxExchange() {
  // Navigation & Wallet States
  const [activeTab, setActiveTab] = useState<"trade" | "wallet" | "markets">("trade");
  const [walletType, setWalletType] = useState<"spot" | "futures">("spot");
  const [spotBalance, setSpotBalance] = useState<number>(1250.0);
  const [futuresBalance, setFuturesBalance] = useState<number>(450.0);
  const [btcHolding, setBtcHolding] = useState<number>(0.015);

  // Market & Trading States
  const [markets, setMarkets] = useState<MarketCoin[]>([]);
  const [selectedPair, setSelectedPair] = useState<string>("BTCUSDT");
  const [livePrice, setLivePrice] = useState<number>(67420.5);
  const [tradeSide, setTradeSide] = useState<"BUY" | "SELL">("BUY");
  const [orderType, setOrderType] = useState<"Limit" | "Market">("Limit");
  const [orderPrice, setOrderPrice] = useState<string>("67420.50");
  const [orderAmount, setOrderAmount] = useState<string>("");

  // Order Book & Recent Trades States
  const [asks, setAsks] = useState<OrderEntry[]>([]);
  const [bids, setBids] = useState<OrderEntry[]>([]);
  const [recentTrades, setRecentTrades] = useState<
    { id: number; price: string; amount: string; time: string; isBuy: boolean }[]
  >([]);

  // Deposit / Withdraw Modal States
  const [modalOpen, setModalOpen] = useState<"deposit" | "withdraw" | null>(null);
  const [modalAmount, setModalAmount] = useState<string>("");
  const [selectedNetwork, setSelectedNetwork] = useState<string>("TRC20 (USDT)");
  const [notification, setNotification] = useState<string | null>(null);

  const tvContainerRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // 1. Fetch Live CoinGecko Prices
  const fetchMarketData = async () => {
    try {
      const res = await fetch(
        "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,tether,solana,binancecoin,ripple&order=market_cap_desc&sparkline=false"
      );
      if (!res.ok) throw new Error("API limit");
      const data: MarketCoin[] = await res.json();
      setMarkets(data);
      const btc = data.find((c) => c.id === "bitcoin");
      if (btc) {
        setLivePrice(btc.current_price);
        setOrderPrice(btc.current_price.toFixed(2));
      }
    } catch {
      // Fallback data if rate-limited
      setMarkets([
        {
          id: "bitcoin",
          symbol: "btc",
          name: "Bitcoin",
          current_price: 67420.5,
          price_change_percentage_24h: 2.45,
          total_volume: 28400000000,
          image: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png",
        },
        {
          id: "ethereum",
          symbol: "eth",
          name: "Ethereum",
          current_price: 3480.2,
          price_change_percentage_24h: -1.12,
          total_volume: 15200000000,
          image: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
        },
        {
          id: "tether",
          symbol: "usdt",
          name: "Tether",
          current_price: 1.0,
          price_change_percentage_24h: 0.01,
          total_volume: 54000000000,
          image: "https://assets.coingecko.com/coins/images/325/small/Tether.png",
        },
        {
          id: "solana",
          symbol: "sol",
          name: "Solana",
          current_price: 172.85,
          price_change_percentage_24h: 5.64,
          total_volume: 4900000000,
          image: "https://assets.coingecko.com/coins/images/4128/small/solana.png",
        },
      ]);
    }
  };

  useEffect(() => {
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 30000);
    return () => clearInterval(interval);
  }, []);

  // 2. Embed Official TradingView Real-Time Candlestick Widget
  useEffect(() => {
    if (activeTab !== "trade" || !tvContainerRef.current) return;
    tvContainerRef.current.innerHTML = "";
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
    tvContainerRef.current.appendChild(script);
  }, [selectedPair, activeTab]);

  // 3. Simulated Live Order Book & Recent Trades Stream
  useEffect(() => {
    const updateOrderBook = () => {
      const base = livePrice;
      const newAsks: OrderEntry[] = Array.from({ length: 8 }, (_, i) => {
        const p = base + (8 - i) * (base * 0.00018) + Math.random() * 4;
        const amt = +(Math.random() * 1.4 + 0.05).toFixed(4);
        return {
          price: p.toFixed(2),
          amount: amt.toFixed(4),
          total: (p * amt).toFixed(2),
          depth: Math.floor(Math.random() * 85) + 15,
        };
      });

      const newBids: OrderEntry[] = Array.from({ length: 8 }, (_, i) => {
        const p = base - (i + 1) * (base * 0.00018) - Math.random() * 4;
        const amt = +(Math.random() * 1.4 + 0.05).toFixed(4);
        return {
          price: p.toFixed(2),
          amount: amt.toFixed(4),
          total: (p * amt).toFixed(2),
          depth: Math.floor(Math.random() * 85) + 15,
        };
      });

      setAsks(newAsks);
      setBids(newBids);

      const now = new Date();
      const timeStr = now.toTimeString().split(" ")[0];
      const isBuy = Math.random() > 0.48;
      const tradeP = (base + (Math.random() - 0.5) * 15).toFixed(2);
      const tradeA = (Math.random() * 0.65 + 0.01).toFixed(4);

      setRecentTrades((prev) => [
        { id: Date.now(), price: tradeP, amount: tradeA, time: timeStr, isBuy },
        ...prev.slice(0, 11),
      ]);
    };

    updateOrderBook();
    const timer = setInterval(updateOrderBook, 2200);
    return () => clearInterval(timer);
  }, [livePrice]);

  // Handle Spot Buy / Sell Execution
  const handleExecuteOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(orderAmount);
    const prc = orderType === "Market" ? livePrice : parseFloat(orderPrice);

    if (!amt || amt <= 0 || !prc || prc <= 0) {
      showToast("অনুগ্রহ করে সঠিক পরিমাণ (Amount) লিখুন।");
      return;
    }

    const totalCost = amt * prc;

    if (tradeSide === "BUY") {
      if (totalCost > spotBalance) {
        showToast("পর্যাপ্ত Spot USDT ব্যালেন্স নেই! অনুগ্রহ করে ডিপোজিট করুন।");
        return;
      }
      setSpotBalance((prev) => +(prev - totalCost).toFixed(2));
      setBtcHolding((prev) => +(prev + amt).toFixed(6));
      showToast(`সফলভাবে ${amt} BTC কেনা হয়েছে ($${totalCost.toFixed(2)})`);
    } else {
      if (amt > btcHolding) {
        showToast("বিক্রি করার জন্য পর্যাপ্ত BTC ব্যালেন্স নেই!");
        return;
      }
      setBtcHolding((prev) => +(prev - amt).toFixed(6));
      setSpotBalance((prev) => +(prev + totalCost).toFixed(2));
      showToast(`সফলভাবে ${amt} BTC বিক্রি করা হয়েছে (+$${totalCost.toFixed(2)})`);
    }
    setOrderAmount("");
  };

  // Handle Deposit & Withdraw
  const handleWalletTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(modalAmount);
    if (!val || val <= 0) {
      showToast("সঠিক পরিমাণ লিখুন।");
      return;
    }

    if (modalOpen === "deposit") {
      setSpotBalance((prev) => +(prev + val).toFixed(2));
      showToast(`$${val.toFixed(2)} USDT (${selectedNetwork}) সফলভাবে ডিপোজিট হয়েছে!`);
    } else if (modalOpen === "withdraw") {
      if (val > spotBalance) {
        showToast("উইথড্র করার মতো পর্যাপ্ত ব্যালেন্স নেই।");
        return;
      }
      setSpotBalance((prev) => +(prev - val).toFixed(2));
      showToast(`$${val.toFixed(2)} USDT উইথড্র রিকোয়েস্ট সম্পন্ন হয়েছে!`);
    }
    setModalAmount("");
    setModalOpen(null);
  };

  // Transfer between Spot & Futures
  const handleInternalTransfer = () => {
    if (spotBalance < 100) {
      showToast("ট্রান্সফার করার জন্য ন্যূনতম $100 Spot ব্যালেন্স প্রয়োজন।");
      return;
    }
    setSpotBalance((prev) => +(prev - 100).toFixed(2));
    setFuturesBalance((prev) => +(prev + 100).toFixed(2));
    showToast("Spot থেকে Futures ওয়ালেটে $100.00 ট্রান্সফার সম্পন্ন হয়েছে!");
  };

  return (
    <div className="min-h-screen bg-[#0B0E11] text-[#EAECEF] font-sans selection:bg-[#10B981] selection:text-black">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#1E2329] border border-[#10B981] text-white px-4 py-3 rounded-lg shadow-2xl flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
          <span className="text-sm font-medium">{notification}</span>
        </div>
      )}

      {/* Top Navigation Bar (Binance-style + ROOX.IO Logo) */}
      <header className="sticky top-0 z-40 bg-[#181A20] border-b border-[#2B3139] px-4 lg:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          {/* Logo from public/logo.png */}
          <div
            onClick={() => setActiveTab("trade")}
            className="flex items-center gap-2.5 cursor-pointer"
          >
            <img
              src="/logo.png"
              alt="ROOX.IO Logo"
              className="w-9 h-9 rounded-md object-contain bg-[#0B0E11] p-0.5 border border-[#2B3139]"
            />
            <span className="text-xl font-extrabold tracking-wide text-white">
              ROOX<span className="text-[#10B981]">.IO</span>
            </span>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => setActiveTab("trade")}
              className={`px-3.5 py-2 rounded-md text-sm font-medium transition ${
                activeTab === "trade"
                  ? "bg-[#2B3139] text-[#10B981]"
                  : "text-[#848E9C] hover:text-white"
              }`}
            >
              Trade Terminal
            </button>
            <button
              onClick={() => setActiveTab("markets")}
              className={`px-3.5 py-2 rounded-md text-sm font-medium transition ${
                activeTab === "markets"
                  ? "bg-[#2B3139] text-[#10B981]"
                  : "text-[#848E9C] hover:text-white"
              }`}
            >
              Markets
            </button>
            <button
              onClick={() => setActiveTab("wallet")}
              className={`px-3.5 py-2 rounded-md text-sm font-medium transition ${
                activeTab === "wallet"
                  ? "bg-[#2B3139] text-[#10B981]"
                  : "text-[#848E9C] hover:text-white"
              }`}
            >
              Wallet & Assets
            </button>
          </nav>
        </div>

        {/* Right Controls: Live Balance + Deposit / Withdraw */}
        <div className="flex items-center gap-3">
          <div
            onClick={() => setActiveTab("wallet")}
            className="hidden sm:flex items-center gap-2 bg-[#0B0E11] border border-[#2B3139] hover:border-[#10B981] px-3 py-1.5 rounded-lg cursor-pointer transition"
          >
            <Wallet className="w-4 h-4 text-[#10B981]" />
            <span className="text-xs text-[#848E9C]">Spot:</span>
            <span className="text-sm font-bold text-white">
              ${spotBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>

          <button
            onClick={() => setModalOpen("deposit")}
            className="bg-[#10B981] hover:bg-[#059669] text-black font-semibold text-xs sm:text-sm px-3.5 py-2 rounded-lg transition"
          >
            Deposit
          </button>
          <button
            onClick={() => setModalOpen("withdraw")}
            className="bg-[#2B3139] hover:bg-[#363C45] text-white font-semibold text-xs sm:text-sm px-3.5 py-2 rounded-lg transition"
          >
            Withdraw
          </button>
        </div>
      </header>

      {/* Mobile Navigation Bar */}
      <div className="flex md:hidden bg-[#181A20] border-b border-[#2B3139] px-4 py-2 gap-2">
        {(["trade", "markets", "wallet"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-1.5 rounded text-xs font-semibold capitalize ${
              activeTab === tab ? "bg-[#10B981] text-black" : "bg-[#2B3139] text-[#848E9C]"
            }`}
          >
            {tab === "trade" ? "Terminal" : tab}
          </button>
        ))}
      </div>

      {/* ================= TAB 1: BINANCE-STYLE TRADING TERMINAL ================= */}
      {activeTab === "trade" && (
        <main className="max-w-[1600px] mx-auto p-2 sm:p-4 space-y-3">
          {/* Ticker Info Bar */}
          <div className="bg-[#181A20] border border-[#2B3139] rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <select
                value={selectedPair}
                onChange={(e) => setSelectedPair(e.target.value)}
                className="bg-[#0B0E11] border border-[#2B3139] text-white font-bold text-base px-3 py-1.5 rounded-lg focus:outline-none focus:border-[#10B981]"
              >
                <option value="BTCUSDT">BTC / USDT</option>
                <option value="ETHUSDT">ETH / USDT</option>
                <option value="SOLUSDT">SOL / USDT</option>
                <option value="BNBUSDT">BNB / USDT</option>
              </select>

              <div>
                <div className="text-lg sm:text-xl font-bold text-[#10B981]">
                  ${livePrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>
                <div className="text-[11px] text-[#848E9C]">Live CoinGecko & TradingView Feed</div>
              </div>
            </div>

            <div className="flex items-center gap-6 text-xs">
              <div>
                <span className="text-[#848E9C] block">24h Change</span>
                <span className="text-[#10B981] font-semibold">+2.45%</span>
              </div>
              <div>
                <span className="text-[#848E9C] block">24h High</span>
                <span className="text-white font-semibold">
                  ${(livePrice * 1.028).toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-[#848E9C] block">24h Low</span>
                <span className="text-white font-semibold">
                  ${(livePrice * 0.972).toFixed(2)}
                </span>
              </div>
              <div className="hidden sm:block">
                <span className="text-[#848E9C] block">Security</span>
                <span className="text-[#10B981] font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Institutional
                </span>
              </div>
            </div>
          </div>

          {/* 3-Column Trading Grid: Order Book | TradingView Chart | Spot Buy/Sell */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
            {/* LEFT: Order Book & Recent Trades (3 Cols) */}
            <div className="lg:col-span-3 bg-[#181A20] border border-[#2B3139] rounded-xl p-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#2B3139]">
                  <span className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#10B981]" /> Order Book
                  </span>
                  <span className="text-[11px] text-[#848E9C]">USDT</span>
                </div>

                {/* Column Headers */}
                <div className="grid grid-cols-3 text-[11px] text-[#848E9C] mb-1.5 px-1">
                  <span>Price(USDT)</span>
                  <span className="text-right">Amount</span>
                  <span className="text-right">Total</span>
                </div>

                {/* Sell Orders (Asks) */}
                <div className="space-y-0.5 mb-2">
                  {asks.map((ask, idx) => (
                    <div
                      key={idx}
                      onClick={() => setOrderPrice(ask.price)}
                      className="relative grid grid-cols-3 text-xs py-0.5 px-1 cursor-pointer hover:bg-[#2B3139] rounded overflow-hidden"
                    >
                      <div
                        style={{ width: `${ask.depth}%` }}
                        className="absolute right-0 top-0 bottom-0 bg-[#F6465D]/15 pointer-events-none"
                      />
                      <span className="text-[#F6465D] font-mono z-10">{ask.price}</span>
                      <span className="text-right font-mono text-[#EAECEF] z-10">{ask.amount}</span>
                      <span className="text-right font-mono text-[#848E9C] z-10">{ask.total}</span>
                    </div>
                  ))}
                </div>

                {/* Current Spread Price */}
                <div className="py-2 my-1 border-y border-[#2B3139] flex items-center justify-between px-1">
                  <span className="text-base font-bold text-[#10B981] font-mono">
                    ${livePrice.toFixed(2)}
                  </span>
                  <span className="text-[11px] text-[#848E9C]">Spread 0.01%</span>
                </div>

                {/* Buy Orders (Bids) */}
                <div className="space-y-0.5 mt-2">
                  {bids.map((bid, idx) => (
                    <div
                      key={idx}
                      onClick={() => setOrderPrice(bid.price)}
                      className="relative grid grid-cols-3 text-xs py-0.5 px-1 cursor-pointer hover:bg-[#2B3139] rounded overflow-hidden"
                    >
                      <div
                        style={{ width: `${bid.depth}%` }}
                        className="absolute right-0 top-0 bottom-0 bg-[#0ECB81]/15 pointer-events-none"
                      />
                      <span className="text-[#0ECB81] font-mono z-10">{bid.price}</span>
                      <span className="text-right font-mono text-[#EAECEF] z-10">{bid.amount}</span>
                      <span className="text-right font-mono text-[#848E9C] z-10">{bid.total}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Trades Sub-Panel */}
              <div className="mt-4 pt-3 border-t border-[#2B3139]">
                <div className="text-xs font-bold text-white mb-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#10B981]" /> Recent Trades
                </div>
                <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                  {recentTrades.map((t) => (
                    <div key={t.id} className="grid grid-cols-3 text-[11px] font-mono">
                      <span className={t.isBuy ? "text-[#0ECB81]" : "text-[#F6465D]"}>
                        {t.price}
                      </span>
                      <span className="text-right text-[#EAECEF]">{t.amount}</span>
                      <span className="text-right text-[#848E9C]">{t.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* CENTER: Advanced TradingView Candlestick Chart (6 Cols) */}
            <div className="lg:col-span-6 bg-[#181A20] border border-[#2B3139] rounded-xl overflow-hidden flex flex-col min-h-[520px]">
              <div className="px-4 py-2.5 border-b border-[#2B3139] flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#10B981]" /> Advanced TradingView Chart
                </span>
                <span className="text-[11px] text-[#848E9C]">Real-Time Candlesticks</span>
              </div>
              <div ref={tvContainerRef} className="w-full flex-1 min-h-[480px]" />
            </div>

            {/* RIGHT: Spot Order Execution Panel (3 Cols) */}
            <div className="lg:col-span-3 bg-[#181A20] border border-[#2B3139] rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-white">Spot Trade</span>
                  <span className="text-xs text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded">
                    0% Maker Fee
                  </span>
                </div>

                {/* Buy / Sell Tabs */}
                <div className="grid grid-cols-2 bg-[#0B0E11] p-1 rounded-lg mb-4">
                  <button
                    type="button"
                    onClick={() => setTradeSide("BUY")}
                    className={`py-2 rounded-md text-xs font-bold transition ${
                      tradeSide === "BUY"
                        ? "bg-[#0ECB81] text-black"
                        : "text-[#848E9C] hover:text-white"
                    }`}
                  >
                    BUY
                  </button>
                  <button
                    type="button"
                    onClick={() => setTradeSide("SELL")}
                    className={`py-2 rounded-md text-xs font-bold transition ${
                      tradeSide === "SELL"
                        ? "bg-[#F6465D] text-white"
                        : "text-[#848E9C] hover:text-white"
                    }`}
                  >
                    SELL
                  </button>
                </div>

                {/* Order Type Selector */}
                <div className="flex gap-3 text-xs font-semibold mb-4 border-b border-[#2B3139] pb-2">
                  {(["Limit", "Market"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setOrderType(type)}
                      className={`pb-1 transition ${
                        orderType === type
                          ? "text-[#10B981] border-b-2 border-[#10B981]"
                          : "text-[#848E9C]"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                {/* Available Balance */}
                <div className="flex justify-between text-xs text-[#848E9C] mb-3">
                  <span>Available:</span>
                  <span className="text-white font-mono">
                    {tradeSide === "BUY"
                      ? `${spotBalance.toFixed(2)} USDT`
                      : `${btcHolding.toFixed(6)} BTC`}
                  </span>
                </div>

                {/* Order Form */}
                <form onSubmit={handleExecuteOrder} className="space-y-3">
                  <div>
                    <label className="text-[11px] text-[#848E9C] block mb-1">Price (USDT)</label>
                    <input
                      type="number"
                      step="any"
                      disabled={orderType === "Market"}
                      value={orderType === "Market" ? livePrice.toFixed(2) : orderPrice}
                      onChange={(e) => setOrderPrice(e.target.value)}
                      className="w-full bg-[#0B0E11] border border-[#2B3139] focus:border-[#10B981] rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-[#848E9C] block mb-1">
                      Amount ({selectedPair.replace("USDT", "")})
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="0.00"
                      value={orderAmount}
                      onChange={(e) => setOrderAmount(e.target.value)}
                      className="w-full bg-[#0B0E11] border border-[#2B3139] focus:border-[#10B981] rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none"
                    />
                  </div>

                  {/* Quick Percentage Buttons */}
                  <div className="grid grid-cols-4 gap-1.5 pt-1">
                    {[25, 50, 75, 100].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => {
                          if (tradeSide === "BUY") {
                            const maxBtc = (spotBalance * (pct / 100)) / livePrice;
                            setOrderAmount(maxBtc.toFixed(5));
                          } else {
                            setOrderAmount((btcHolding * (pct / 100)).toFixed(6));
                          }
                        }}
                        className="bg-[#2B3139] hover:bg-[#363C45] text-[11px] py-1 rounded text-[#EAECEF]"
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>

                  <div className="pt-2 flex justify-between text-xs text-[#848E9C]">
                    <span>Est. Total:</span>
                    <span className="text-white font-mono">
                      $
                      {(
                        (parseFloat(orderAmount) || 0) *
                        (orderType === "Market" ? livePrice : parseFloat(orderPrice) || 0)
                      ).toFixed(2)}{" "}
                      USDT
                    </span>
                  </div>

                  <button
                    type="submit"
                    className={`w-full py-2.5 rounded-lg font-bold text-sm transition mt-2 ${
                      tradeSide === "BUY"
                        ? "bg-[#0ECB81] hover:bg-[#0bb572] text-black"
                        : "bg-[#F6465D] hover:bg-[#df3b50] text-white"
                    }`}
                  >
                    {tradeSide === "BUY" ? "Buy BTC" : "Sell BTC"}
                  </button>
                </form>
              </div>

              <div className="mt-4 pt-3 border-t border-[#2B3139] flex items-center justify-between text-xs text-[#848E9C]">
                <span>Instant Swap & Deposit</span>
                <button
                  onClick={() => setModalOpen("deposit")}
                  className="text-[#10B981] hover:underline font-semibold"
                >
                  + Add Funds
                </button>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* ================= TAB 2: WALLET & ASSET OVERVIEW (SPOT & FUTURES) ================= */}
      {activeTab === "wallet" && (
        <main className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
          <div className="bg-[#181A20] border border-[#2B3139] rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs uppercase tracking-wider text-[#848E9C]">
                Estimated Total Portfolio Value
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white mt-1">
                $
                {(spotBalance + futuresBalance + btcHolding * livePrice).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                <span className="text-base font-normal text-[#848E9C]">USDT</span>
              </h1>
            </div>

            <div className="flex flex-wrap gap-2.5">
              <button
                onClick={() => setModalOpen("deposit")}
                className="bg-[#10B981] hover:bg-[#059669] text-black font-bold px-4 py-2 rounded-lg text-sm flex items-center gap-1.5"
              >
                <ArrowDownLeft className="w-4 h-4" /> Deposit
              </button>
              <button
                onClick={() => setModalOpen("withdraw")}
                className="bg-[#2B3139] hover:bg-[#363C45] text-white font-bold px-4 py-2 rounded-lg text-sm flex items-center gap-1.5"
              >
                <ArrowUpRight className="w-4 h-4" /> Withdraw
              </button>
              <button
                onClick={handleInternalTransfer}
                className="bg-[#2B3139] hover:bg-[#363C45] text-[#10B981] font-bold px-4 py-2 rounded-lg text-sm flex items-center gap-1.5"
              >
                <ArrowUpDown className="w-4 h-4" /> Transfer $100 to Futures
              </button>
            </div>
          </div>

          {/* Spot vs Futures Account Switcher */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              onClick={() => setWalletType("spot")}
              className={`p-5 rounded-xl border cursor-pointer transition ${
                walletType === "spot"
                  ? "bg-[#181A20] border-[#10B981]"
                  : "bg-[#181A20]/60 border-[#2B3139] hover:border-[#848E9C]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white">Spot Wallet</span>
                <span className="text-xs bg-[#10B981]/15 text-[#10B981] px-2.5 py-0.5 rounded-full">
                  Active Trading
                </span>
              </div>
              <div className="text-2xl font-extrabold text-white mt-3">
                ${(spotBalance + btcHolding * livePrice).toFixed(2)} USDT
              </div>
              <p className="text-xs text-[#848E9C] mt-1">
                Available USDT: ${spotBalance.toFixed(2)} | BTC Holdings: {btcHolding} BTC
              </p>
            </div>

            <div
              onClick={() => setWalletType("futures")}
              className={`p-5 rounded-xl border cursor-pointer transition ${
                walletType === "futures"
                  ? "bg-[#181A20] border-[#10B981]"
                  : "bg-[#181A20]/60 border-[#2B3139] hover:border-[#848E9C]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white">USDⓈ-M Futures Wallet</span>
                <span className="text-xs bg-amber-500/15 text-amber-400 px-2.5 py-0.5 rounded-full">
                  Up to 50x Leverage
                </span>
              </div>
              <div className="text-2xl font-extrabold text-white mt-3">
                ${futuresBalance.toFixed(2)} USDT
              </div>
              <p className="text-xs text-[#848E9C] mt-1">
                Margin Balance: ${futuresBalance.toFixed(2)} | Unrealized PNL: +$0.00
              </p>
            </div>
          </div>

          {/* Asset Breakdown Table */}
          <div className="bg-[#181A20] border border-[#2B3139] rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#2B3139] font-bold text-sm text-white">
              {walletType === "spot" ? "Spot Assets Breakdown" : "Futures Margin Assets"}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#0B0E11] text-[#848E9C] text-xs">
                  <tr>
                    <th className="py-3 px-5">Coin</th>
                    <th className="py-3 px-5">Total Balance</th>
                    <th className="py-3 px-5">USDT Value</th>
                    <th className="py-3 px-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2B3139]">
                  <tr>
                    <td className="py-3.5 px-5 font-bold text-white">USDT (Tether)</td>
                    <td className="py-3.5 px-5 font-mono">
                      {walletType === "spot" ? spotBalance.toFixed(2) : futuresBalance.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-5 font-mono text-[#10B981]">
                      ${walletType === "spot" ? spotBalance.toFixed(2) : futuresBalance.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <button
                        onClick={() => setActiveTab("trade")}
                        className="text-xs text-[#10B981] hover:underline font-semibold"
                      >
                        Trade
                      </button>
                    </td>
                  </tr>
                  {walletType === "spot" && (
                    <tr>
                      <td className="py-3.5 px-5 font-bold text-white">BTC (Bitcoin)</td>
                      <td className="py-3.5 px-5 font-mono">{btcHolding.toFixed(6)}</td>
                      <td className="py-3.5 px-5 font-mono text-[#10B981]">
                        ${(btcHolding * livePrice).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <button
                          onClick={() => setActiveTab("trade")}
                          className="text-xs text-[#10B981] hover:underline font-semibold"
                        >
                          Trade
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      )}

      {/* ================= TAB 3: LIVE MARKETS OVERVIEW ================= */}
      {activeTab === "markets" && (
        <main className="max-w-5xl mx-auto p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Live Crypto Markets (CoinGecko API)</h2>
            <button
              onClick={fetchMarketData}
              className="flex items-center gap-1.5 text-xs bg-[#181A20] border border-[#2B3139] hover:border-[#10B981] px-3 py-1.5 rounded-lg text-[#10B981]"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Prices
            </button>
          </div>

          <div className="bg-[#181A20] border border-[#2B3139] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#0B0E11] text-[#848E9C] text-xs">
                  <tr>
                    <th className="py-3.5 px-5">Asset</th>
                    <th className="py-3.5 px-5">Price (USD)</th>
                    <th className="py-3.5 px-5">24h Change</th>
                    <th className="py-3.5 px-5 hidden sm:table-cell">24h Volume</th>
                    <th className="py-3.5 px-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2B3139]">
                  {markets.map((coin) => {
                    const isPositive = coin.price_change_percentage_24h >= 0;
                    return (
                      <tr key={coin.id} className="hover:bg-[#2B3139]/40 transition">
                        <td className="py-3.5 px-5 flex items-center gap-3">
                          <img src={coin.image} alt={coin.name} className="w-6 h-6 rounded-full" />
                          <div>
                            <div className="font-bold text-white">{coin.name}</div>
                            <div className="text-xs text-[#848E9C] uppercase">{coin.symbol}</div>
                          </div>
                        </td>
                        <td className="py-3.5 px-5 font-mono font-semibold text-white">
                          ${coin.current_price.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-5">
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded ${
                              isPositive
                                ? "bg-[#0ECB81]/15 text-[#0ECB81]"
                                : "bg-[#F6465D]/15 text-[#F6465D]"
                            }`}
                          >
                            {isPositive ? (
                              <TrendingUp className="w-3 h-3" />
                            ) : (
                              <TrendingDown className="w-3 h-3" />
                            )}
                            {coin.price_change_percentage_24h?.toFixed(2)}%
                          </span>
                        </td>
                        <td className="py-3.5 px-5 font-mono text-xs text-[#848E9C] hidden sm:table-cell">
                          ${(coin.total_volume / 1e9).toFixed(2)}B
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          <button
                            onClick={() => {
                              const pair = `${coin.symbol.toUpperCase()}USDT`;
                              setSelectedPair(pair === "USDTUSDT" ? "BTCUSDT" : pair);
                              setActiveTab("trade");
                            }}
                            className="bg-[#10B981] hover:bg-[#059669] text-black font-bold text-xs px-3 py-1.5 rounded-lg"
                          >
                            Trade Now
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      )}

      {/* ================= DEPOSIT / WITHDRAW MODAL ================= */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#181A20] border border-[#2B3139] rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#2B3139] pb-3">
              <h3 className="text-lg font-bold text-white capitalize">
                {modalOpen} USDT — ROOX.IO
              </h3>
              <button
                onClick={() => setModalOpen(null)}
                className="text-[#848E9C] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleWalletTransaction} className="space-y-4">
              <div>
                <label className="text-xs text-[#848E9C] block mb-1.5">Select Network</label>
                <select
                  value={selectedNetwork}
                  onChange={(e) => setSelectedNetwork(e.target.value)}
                  className="w-full bg-[#0B0E11] border border-[#2B3139] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#10B981]"
                >
                  <option value="TRC20 (USDT)">TRON (TRC20) — Instant</option>
                  <option value="BEP20 (BSC)">BNB Smart Chain (BEP20)</option>
                  <option value="ERC20 (Ethereum)">Ethereum (ERC20)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-[#848E9C] block mb-1.5">Amount (USD)</label>
                <input
                  type="number"
                  step="any"
                  placeholder="Enter amount (e.g. 500)"
                  value={modalAmount}
                  onChange={(e) => setModalAmount(e.target.value)}
                  className="w-full bg-[#0B0E11] border border-[#2B3139] focus:border-[#10B981] rounded-lg px-3 py-2.5 text-sm text-white font-mono focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#10B981] hover:bg-[#059669] text-black font-bold py-2.5 rounded-lg text-sm transition"
              >
                Confirm {modalOpen === "deposit" ? "Deposit" : "Withdrawal"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}