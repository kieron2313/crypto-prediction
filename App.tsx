import React, { useState, useEffect, useRef } from 'react';
import Scanner from './components/Scanner';
import { Auth } from './components/Auth';
import { LandingPage } from './components/LandingPage';
import { Portfolio } from './components/Portfolio';
import { Signals } from './components/Signals';
import { TradeModal } from './components/TradeModal';
import { AdminDashboard } from './components/AdminDashboard';
import { GemHunter } from './components/GemHunter';
import { UserProfile } from './components/UserProfile';
import { OracleChat } from './components/OracleChat';
import { User, CoinAnalysis, Transaction, Notification } from './types';
import { INITIAL_MARKET_DATA } from './constants';
import { userService } from './services/userService';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'LANDING' | 'AUTH' | 'SCANNER' | 'SIGNALS' | 'PORTFOLIO' | 'ADMIN' | 'GEM_HUNTER' | 'PROFILE'>('LANDING');
  const [loading, setLoading] = useState(true);
  const [authInitialLogin, setAuthInitialLogin] = useState(true);
  
  // Market Data (Lifted State)
  const [coins, setCoins] = useState<CoinAnalysis[]>(INITIAL_MARKET_DATA);
  
  // Trade Modal State
  const [tradeModalOpen, setTradeModalOpen] = useState(false);
  const [selectedCoinSymbol, setSelectedCoinSymbol] = useState<string | null>(null);

  // Notification State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifDropdownRef = useRef<HTMLDivElement>(null);

  // Initialize Session
  useEffect(() => {
    const unsubscribe = userService.onAuthStateChanged((currentUser) => {
        if (currentUser) {
            setUser(currentUser);
            // If on auth/landing pages, redirect to scanner
            if (view === 'LANDING' || view === 'AUTH') {
                setView('SCANNER');
            }
        } else {
            setUser(null);
            setView('LANDING');
        }
        setLoading(false);
    });

    // Subscribe to notifications if user is logged in (handled inside effect when user changes, but simpler to just run always and check user)
    // Actually, let's just run it globally but only use if user exists.
    const unsubscribeNotifs = userService.subscribeToNotifications((notifs) => {
        setNotifications(notifs);
    });

    return () => {
        unsubscribe();
        unsubscribeNotifs();
    };
  }, []); // Run once, but internal logic handles user state changes.

  // Click outside listener for notification dropdown
  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (notifDropdownRef.current && !notifDropdownRef.current.contains(event.target as Node)) {
              setShowNotifications(false);
          }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Live Price Updates
  useEffect(() => {
    const ws = new WebSocket('wss://stream.binance.com:9443/ws/!ticker@arr');
    ws.onopen = () => console.log('Connected to Binance WebSocket');
    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            if (!Array.isArray(data) || data.length === 0) return;
            const updates = new Map<string, any>();
            data.forEach((ticker: any) => {
                if (ticker.s.endsWith('USDT')) {
                    updates.set(ticker.s.slice(0, -4), ticker);
                }
            });
            setCoins(currentCoins => {
                if (!currentCoins || currentCoins.length === 0) return currentCoins;
                return currentCoins.map(coin => {
                    const ticker = updates.get(coin.symbol) || updates.get(coin.symbol.toUpperCase());
                    if (ticker) {
                        const newPrice = parseFloat(ticker.c);
                        const volumeQuote = parseFloat(ticker.q);
                        let volString = volumeQuote > 1000000000 ? `$${(volumeQuote / 1000000000).toFixed(2)}B` : `$${(volumeQuote / 1000000).toFixed(2)}M`;
                        const prevHistory = coin.priceHistory;
                        const newHistory = [...prevHistory, newPrice];
                        if (newHistory.length > 20) newHistory.shift();
                        return { ...coin, price: newPrice, change24h: parseFloat(ticker.P), volume24h: volString, priceHistory: newHistory };
                    }
                    return coin;
                });
            });
        } catch (error) { console.error("WS Parse Error", error); }
    };
    return () => ws.close();
  }, []);

  const handleLogout = async () => {
    await userService.logout();
    setView('LANDING');
  };

  const handleUpdateUser = async (updatedUser: User) => {
      setUser(updatedUser);
      await userService.updateUser(updatedUser);
  };

  const toggleWatchlist = (symbol: string) => {
      if (!user) return;
      const currentList = user.watchlist || [];
      const newList = currentList.includes(symbol) ? currentList.filter(s => s !== symbol) : [...currentList, symbol];
      handleUpdateUser({ ...user, watchlist: newList });
  };

  const openTradeModal = (coin: CoinAnalysis) => {
    setSelectedCoinSymbol(coin.symbol);
    setTradeModalOpen(true);
  };

  const executeTrade = (amount: number, type: 'BUY' | 'SELL') => {
    if (!user || !selectedCoinSymbol) return;
    const currentCoinData = coins.find(c => c.symbol === selectedCoinSymbol);
    if (!currentCoinData) return;

    const price = currentCoinData.price;
    const cost = amount * price;
    let updatedUser = { ...user, portfolio: [...user.portfolio], transactions: [...user.transactions] };
    
    const existingIndex = updatedUser.portfolio.findIndex(p => p.symbol === selectedCoinSymbol);

    if (type === 'BUY') {
        if (user.balance < cost) { alert("Insufficient Funds"); return; }
        updatedUser.balance -= cost;
        if (existingIndex >= 0) {
            const currentItem = updatedUser.portfolio[existingIndex];
            const totalCost = (currentItem.amount * currentItem.avgBuyPrice) + cost;
            const newAmount = currentItem.amount + amount;
            updatedUser.portfolio[existingIndex] = { ...currentItem, amount: newAmount, avgBuyPrice: totalCost / newAmount };
        } else {
            updatedUser.portfolio.push({ symbol: selectedCoinSymbol, amount, avgBuyPrice: price });
        }
    } else {
        if (existingIndex < 0 || updatedUser.portfolio[existingIndex].amount < amount) { alert("Insufficient Holdings"); return; }
        updatedUser.balance += cost;
        const currentItem = updatedUser.portfolio[existingIndex];
        const newAmount = currentItem.amount - amount;
        if (newAmount <= 0.000001) updatedUser.portfolio.splice(existingIndex, 1);
        else updatedUser.portfolio[existingIndex] = { ...currentItem, amount: newAmount };
    }

    const newTransaction: Transaction = {
        id: crypto.randomUUID(), type, symbol: selectedCoinSymbol, amount, price, date: new Date().toISOString()
    };
    updatedUser.transactions = [newTransaction, ...updatedUser.transactions];
    handleUpdateUser(updatedUser);
  };

  const handleOpenNotifications = () => {
      setShowNotifications(!showNotifications);
      // Mark all as read by updating user timestamp to now
      if (user && !showNotifications) {
         handleUpdateUser({ ...user, lastReadNotifyTime: Date.now() });
      }
  };

  const getUnreadCount = () => {
      if (!user) return 0;
      const lastRead = user.lastReadNotifyTime || 0;
      return notifications.filter(n => n.timestamp > lastRead).length;
  };

  const activeTradeCoin = selectedCoinSymbol ? coins.find(c => c.symbol === selectedCoinSymbol) : null;

  if (loading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center"><div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans flex flex-col">
        {/* Responsive Header: Added top padding for mobile (pt-[5px]) and default for larger screens */}
        <nav className="sticky top-0 z-50 bg-gray-950/80 backdrop-blur-md border-b border-gray-800 pt-[5px] sm:pt-0">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Responsive Height: h-[70px] for mobile, h-16 for desktop */}
                <div className="flex items-center justify-between h-[70px] sm:h-16">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => !user ? setView('LANDING') : setView('SCANNER')}>
                        {/* Responsive Logo Size: w-[34px] for mobile */}
                        <div className="w-[34px] h-[34px] sm:w-8 sm:h-8 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/20">
                             {/* Responsive Icon Size: w-[22px] for mobile */}
                            <svg className="w-[22px] h-[22px] sm:w-5 sm:h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" /></svg>
                        </div>
                        <span className="text-xl font-bold text-white hidden sm:block">Crypto|Oracle <span className="text-white">Trend Prediction</span></span>
                    </div>

                    {user && (
                         <div className="hidden xl:flex items-center space-x-6">
                            <button onClick={() => setView('SCANNER')} className={`text-base font-bold transition ${view === 'SCANNER' ? 'text-white' : 'text-white hover:text-cyan-200'}`}>Crypto Trend Prediction</button>
                            <button onClick={() => setView('GEM_HUNTER')} className={`text-base font-bold transition flex items-center gap-1 ${view === 'GEM_HUNTER' ? 'text-purple-400' : 'text-white hover:text-purple-300'}`}>
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM17.414 10a1 1 0 100-2h-1a1 1 0 100 2h1zM15.657 15.657a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM10 17.414a1 1 0 100-2v-1a1 1 0 100 2v1zM4.343 15.657a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM3.586 10a1 1 0 100-2H2.586a1 1 0 100 2h1zM4.343 5.757a1 1 0 001.414-1.414l-.707.707a1 1 0 00-1.414 1.414l.707-.707z"/></svg>
                                5x Gems
                            </button>
                            <button onClick={() => setView('SIGNALS')} className={`text-base font-bold transition ${view === 'SIGNALS' ? 'text-white' : 'text-white hover:text-cyan-200'}`}>Top 9 Signals</button>
                            <button onClick={() => setView('PORTFOLIO')} className={`text-base font-bold transition ${view === 'PORTFOLIO' ? 'text-white' : 'text-white hover:text-cyan-200'}`}>Portfolio</button>
                            {user.isAdmin && <button onClick={() => setView('ADMIN')} className={`text-sm font-bold uppercase transition border border-gray-700 px-2 py-0.5 rounded ${view === 'ADMIN' ? 'bg-gray-800 text-white' : 'text-white hover:text-cyan-200'}`}>Admin</button>}
                         </div>
                    )}
                    
                    <div className="flex items-center gap-4">
                        {user ? (
                            <>
                                {/* Notification Bell */}
                                <div className="relative" ref={notifDropdownRef}>
                                    <button 
                                        onClick={handleOpenNotifications}
                                        className="relative p-2 text-gray-300 hover:text-white transition-colors"
                                    >
                                        {/* Responsive Bell Size: w-[26px] for mobile */}
                                        <svg className="w-[26px] h-[26px] sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                        </svg>
                                        {getUnreadCount() > 0 && (
                                            <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 rounded-full text-[10px] font-bold flex items-center justify-center border border-gray-900">
                                                {getUnreadCount()}
                                            </span>
                                        )}
                                    </button>

                                    {showNotifications && (
                                        <div className="absolute top-full right-0 mt-2 w-80 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50">
                                            <div className="p-3 bg-gray-950 border-b border-gray-800 flex justify-between items-center">
                                                <h3 className="text-sm font-bold text-white">Notifications</h3>
                                                <span className="text-xs text-gray-500">Last 7 days</span>
                                            </div>
                                            <div className="max-h-80 overflow-y-auto custom-scrollbar">
                                                {notifications.length > 0 ? (
                                                    notifications.map(n => (
                                                        <div key={n.id} className="p-4 border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                                                            <div className="flex justify-between items-start mb-1">
                                                                <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${n.type === 'BROADCAST' ? 'text-cyan-400 border-cyan-800 bg-cyan-900/20' : 'text-green-400 border-green-800 bg-green-900/20'}`}>
                                                                    {n.type}
                                                                </span>
                                                                <span className="text-[10px] text-gray-500">{new Date(n.timestamp).toLocaleDateString()}</span>
                                                            </div>
                                                            <h4 className="text-sm font-bold text-gray-200 mb-1">{n.title}</h4>
                                                            <p className="text-xs text-gray-400 leading-relaxed">{n.message}</p>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="p-8 text-center text-gray-500 text-xs">No recent notifications</div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Responsive Profile Size: w-[34px] for mobile */}
                                <div className="w-[34px] h-[34px] sm:w-8 sm:h-8 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-xs font-bold text-white uppercase cursor-pointer hover:border-cyan-500 transition shadow-lg" onClick={() => setView('PROFILE')}>
                                    {user.name[0]}
                                </div>
                                <button onClick={handleLogout} className="hidden sm:block text-xs border border-gray-700 hover:bg-gray-800 text-white px-3 py-1.5 rounded-md transition-colors">Logout</button>
                            </>
                        ) : (
                            <div className="flex items-center gap-3">
                                {/* Responsive Font Size: text-[15px] for mobile */}
                                <button onClick={() => { setAuthInitialLogin(true); setView('AUTH'); }} className="text-[15px] sm:text-sm font-bold text-gray-300 hover:text-white transition-colors">Sign In</button>
                                <button onClick={() => { setAuthInitialLogin(false); setView('AUTH'); }} className="text-[15px] sm:text-sm font-bold bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg transition-colors shadow-lg">Register</button>
                            </div>
                        )}
                    </div>
                </div>
                {user && (
                    <div className="xl:hidden flex border-t border-gray-800 overflow-x-auto no-scrollbar">
                         {/* Responsive Menu Font: text-[15px] for mobile */}
                        <button onClick={() => setView('SCANNER')} className={`flex-1 py-3 text-[15px] sm:text-sm font-bold whitespace-nowrap px-4 ${view === 'SCANNER' ? 'text-white bg-gray-900/50' : 'text-white'}`}>Prediction</button>
                        <button onClick={() => setView('GEM_HUNTER')} className={`flex-1 py-3 text-[15px] sm:text-sm font-bold whitespace-nowrap px-4 ${view === 'GEM_HUNTER' ? 'text-purple-400 bg-gray-900/50' : 'text-white'}`}>5x Gems</button>
                        <button onClick={() => setView('SIGNALS')} className={`flex-1 py-3 text-[15px] sm:text-sm font-bold whitespace-nowrap px-4 ${view === 'SIGNALS' ? 'text-white bg-gray-900/50' : 'text-white'}`}>Signals</button>
                        <button onClick={() => setView('PORTFOLIO')} className={`flex-1 py-3 text-[15px] sm:text-sm font-bold whitespace-nowrap px-4 ${view === 'PORTFOLIO' ? 'text-white bg-gray-900/50' : 'text-white'}`}>Portfolio</button>
                        <button onClick={() => setView('PROFILE')} className={`flex-1 py-3 text-[15px] sm:text-sm font-bold whitespace-nowrap px-4 ${view === 'PROFILE' ? 'text-white bg-gray-900/50' : 'text-white'}`}>Profile</button>
                        {user.isAdmin && <button onClick={() => setView('ADMIN')} className={`flex-1 py-3 text-[15px] sm:text-sm font-bold whitespace-nowrap px-4 ${view === 'ADMIN' ? 'text-white bg-gray-800' : 'text-white'}`}>ADMIN</button>}
                    </div>
                )}
            </div>
        </nav>

        <main className="relative z-10 flex-grow flex flex-col">
            {view === 'LANDING' && <LandingPage onGetStarted={() => { setAuthInitialLogin(false); setView('AUTH'); }} coins={coins} />}
            {view === 'AUTH' && <Auth onLogin={(u) => { setUser(u); setView('SCANNER'); }} onBack={() => setView('LANDING')} initialLoginMode={authInitialLogin} />}
            {view === 'SCANNER' && user && <Scanner coins={coins} setCoins={setCoins} onTrade={openTradeModal} watchlist={user.watchlist || []} onToggleWatchlist={toggleWatchlist} />}
            {view === 'GEM_HUNTER' && user && <GemHunter />}
            {view === 'SIGNALS' && user && <Signals coins={coins} onTrade={openTradeModal} />}
            {view === 'PORTFOLIO' && user && <Portfolio user={user} coins={coins} onTrade={openTradeModal} />}
            {view === 'ADMIN' && user && user.isAdmin && <AdminDashboard />}
            {view === 'PROFILE' && user && <UserProfile user={user} onUpdateUser={handleUpdateUser} />}
        </main>

        {activeTradeCoin && user && <TradeModal isOpen={tradeModalOpen} onClose={() => setTradeModalOpen(false)} coin={activeTradeCoin} currentBalance={user.balance} currentHolding={user.portfolio.find(p => p.symbol === activeTradeCoin.symbol)?.amount || 0} onConfirm={executeTrade} />}
        {user && <OracleChat />}

        <footer className="relative z-10 border-t border-gray-900 mt-auto bg-gray-950 py-8">
            <div className="max-w-7xl mx-auto px-4 text-center text-gray-600 text-sm">
                <p>&copy; {new Date().getFullYear()} Crypto|Oracle. AI Powered.</p>
                <div className="flex justify-center gap-4 mt-4 text-xs opacity-60">
                    <a href="#" className="hover:text-cyan-500">Terms</a>
                    <a href="#" className="hover:text-cyan-500">Privacy</a>
                    <a href="#" className="hover:text-cyan-500">API Status</a>
                </div>
            </div>
        </footer>
    </div>
  );
};

export default App;