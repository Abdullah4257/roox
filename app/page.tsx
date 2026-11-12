"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

interface Coin {
  id: string;
  name: string;
  symbol: string;
  current_price: number;
  image: string;
  price_change_percentage_24h: number;
}

export default function Home() {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState<string>("0.00");
  const [selectedCoin, setSelectedCoin] = useState<string>("Bitcoin (BTC)");
  
  // Wallet / Action States
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(1250.00);
  const [network, setNetwork] = useState<string>("TRC20");
  const [txAmount, setTxAmount] = useState<string>("");
  const [txSuccess, setTxSuccess] = useState<string>("");

  useEffect(() => {
    fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=6&page=1&sparkline=false")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCoins(data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching data:", err);
        setLoading(false);
      });
  }, []);

  const handleTransaction = (e: React.FormEvent, type: string) => {
    e.preventDefault();
    const val = parseFloat(txAmount);
    if (!val || val <= 0) return;

    if (type === "deposit") {
      setWalletBalance(prev => prev + val);
      setTxSuccess(`Successfully deposited $${val} via ${network}!`);
    } else {
      if (val > walletBalance) {
        setTxSuccess("Insufficient balance for withdrawal!");
        return;
      }
      setWalletBalance(prev => prev - val);
      setTxSuccess(`Successfully withdrawn $${val} via ${network}!`);
    }
    setTxAmount("");
    setTimeout(() => setTxSuccess(""), 4000);
  };

  return (
    <main className="min-h-screen bg-[#0b0e14] text-white font-sans selection:bg-[#0ecb81] selection:text-black">
      
      {/* Header / Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 bg-[#0b0e14] border-b border-gray-800 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Image 
            src="/logo.png" 
            alt="ROOX.IO Logo" 
            width={120} 
            height={40} 
            className="object-contain"
          />
          <span className="text-xl font-bold tracking-wider text-white">ROOX.IO</span>
        </div>

        <div className="hidden md:flex items-center gap-6 text-sm text-gray-300">
          <Link href="#markets" className="hover:text-white transition">Markets</Link>
          <Link href="#trade" className="hover:text-white transition">Trade Terminal</Link>
          <button onClick={() => setActiveModal("deposit")} className="hover:text-white transition">Deposit</button>
          <button onClick={() => setActiveModal("withdraw")} className="hover:text-white transition">Withdraw</button>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center bg-[#181a20] px-3 py-1.5 rounded-lg border border-gray-800 text-xs gap-2">
            <span className="text-gray-400">Balance:</span>
            <span className="text-[#0ecb81] font-bold">${walletBalance.toFixed(2)}</span>
          </div>
          <Link href="/login" className="text-sm text-gray-300 hover:text-white transition">Login</Link>
          <Link href="/login" className="px-4 py-2 text-sm font-medium text-black bg-[#0ecb81] rounded-lg hover:opacity-90 transition font-semibold">
            Sign Up
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#181a20] border border-gray-800 text-xs text-[#0ecb81]">
            <span className="w-2 h-2 rounded-full bg-[#0ecb81] animate-pulse"></span>
            Powered by Live CoinGecko API
          </div>
          
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight">
            Next-Gen Crypto Exchange for <span className="text-[#0ecb81]">Global Traders</span>
          </h1>
          
          <p className="text-gray-400 text-lg max-w-xl">
            Experience ultra-fast order matching, multi-network deposits, live market analytics, and institutional-grade security.
          </p>

          <div className="flex flex-wrap gap-4 pt-4">
            <Link href="/login" className="px-6 py-3.5 bg-[#0ecb81] text-black font-bold rounded-xl hover:opacity-90 transition shadow-lg shadow-[#0ecb81]/10">
              Create Account & Trade
            </Link>
            <button onClick={() => setActiveModal("deposit")} className="px-6 py-3.5 bg-[#181a20] border border-gray-800 text-white font-semibold rounded-xl hover:bg-gray-800 transition">
              Instant Deposit
            </button>
          </div>
        </div>

        {/* Instant Swap & Quick Actions Box */}
        <div className="lg:col-span-5 bg-[#181a20] border border-gray-800 p-6 rounded-2xl shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold">Instant Swap & Trade</h3>
            <div className="flex bg-[#0b0e14] p-1 rounded-lg border border-gray-800">
              <button className="px-3 py-1 text-xs font-bold bg-[#0ecb81] text-black rounded-md">BUY</button>
              <button className="px-3 py-1 text-xs font-semibold text-gray-400 hover:text-white">SELL</button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Select Asset</label>
              <select 
                value={selectedCoin}
                onChange={(e) => setSelectedCoin(e.target.value)}
                className="w-full bg-[#0b0e14] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#0ecb81]"
              >
                <option>Bitcoin (BTC)</option>
                <option>Ethereum (ETH)</option>
                <option>Tether (USDT)</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Amount (USD)</label>
              <input 
                type="number" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-[#0b0e14] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#0ecb81]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button onClick={() => setActiveModal("deposit")} className="py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-xl text-sm transition">
                Deposit Funds
              </button>
              <button onClick={() => setActiveModal("withdraw")} className="py-3 bg-[#0ecb81] hover:opacity-90 text-black font-bold rounded-xl text-sm transition">
                Withdraw
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Market Trend & Prices Section */}
      <section id="markets" className="max-w-7xl mx-auto px-6 py-16 border-t border-gray-800/60">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold tracking-tight">Market Trend & Prices</h2>
          <span className="text-xs text-[#0ecb81] bg-[#0ecb81]/10 px-3 py-1 rounded-full border border-[#0ecb81]/20">Live Updates</span>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500 animate-pulse">Loading live crypto data...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coins.map((coin) => (
              <div key={coin.id} className="bg-[#181a20] border border-gray-800 p-6 rounded-2xl hover:border-gray-700 transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <img src={coin.image} alt={coin.name} className="w-8 h-8" />
                    <div>
                      <h4 className="font-bold text-white">{coin.name}</h4>
                      <span className="text-xs text-gray-400 uppercase">{coin.symbol}</span>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${coin.price_change_percentage_24h >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
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

      {/* Footer with Social Links */}
      <footer className="border-t border-gray-800/80 mt-20 py-12 text-center text-gray-500 text-sm">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="ROOX.IO" width={90} height={30} className="object-contain" />
            <span className="text-white font-bold">ROOX.IO</span>
          </div>

          <p>&copy; 2026 ROOX.IO Exchange Platform. All rights reserved.</p>

          <div className="flex items-center gap-4">
            <a 
              href="https://x.com/Rooxoi" 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-2.5 bg-[#181a20] border border-gray-800 rounded-xl text-gray-300 hover:text-white hover:border-gray-600 transition"
              title="Twitter (X)"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            <a 
              href="https://t.me/rooxio" 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-2.5 bg-[#181a20] border border-gray-800 rounded-xl text-gray-300 hover:text-white hover:border-gray-600 transition"
              title="Telegram"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.03-1.99 1.27-5.62 3.72-.53.36-1.01.54-1.44.53-.47-.01-1.37-.26-2.03-.48-.82-.27-1.47-.42-1.42-.88.03-.25.38-.51 1.05-.78 4.1-1.78 6.84-2.95 8.22-3.52 3.91-1.63 4.72-1.92 5.25-1.93.12 0 .39.03.56.17.14.12.18.28.2.45-.02.07-.02.13-.04.2z"/>
              </svg>
            </a>
          </div>
        </div>
      </footer>

      {/* Deposit / Withdraw Modal */}
      {activeModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#181a20] border border-gray-800 rounded-2xl w-full max-w-md p-6 relative shadow-2xl">
            <button 
              onClick={() => { setActiveModal(null); setTxSuccess(""); }}
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-lg font-bold"
            >
              ✕
            </button>

            <h3 className="text-xl font-bold mb-1 capitalize">
              {activeModal === "deposit" ? "Deposit Crypto / Funds" : "Withdraw Funds"}
            </h3>
            <p className="text-xs text-gray-400 mb-6">
              Select your preferred network and enter the amount.
            </p>

            {txSuccess && (
              <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl text-center">
                {txSuccess}
              </div>
            )}

            <form onSubmit={(e) => handleTransaction(e, activeModal)} className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Select Network</label>
                <select 
                  value={network}
                  onChange={(e) => setNetwork(e.target.value)}
                  className="w-full bg-[#0b0e14] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#0ecb81]"
                >
                  <option value="TRC20">Tron (TRC20)</option>
                  <option value="ERC20">Ethereum (ERC20)</option>
                  <option value="BEP20">Binance Smart Chain (BEP20)</option>
                  <option value="SOL">Solana Network</option>
                  <option value="BTC">Bitcoin Network</option>
                  <option value="BKASH">bKash / Nagad (Local Fiat)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">Amount (USD)</label>
                <input 
                  type="number" 
                  placeholder="0.00"
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                  className="w-full bg-[#0b0e14] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#0ecb81]"
                  required
                />
              </div>

              <button 
                type="submit" 
                className="w-full py-3.5 bg-[#0ecb81] text-black font-bold rounded-xl hover:opacity-90 transition shadow-md"
              >
                Confirm {activeModal === "deposit" ? "Deposit" : "Withdrawal"}
              </button>
            </form>
          </div>
        </div>
      )}

    </main>
  );
}