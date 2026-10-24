import React, { useState, useEffect, useRef } from 'react';
import { CoinAnalysis, TrendDirection } from '../types';
import { MOCK_LOGS } from '../constants';
import { scanMarketWithGemini } from '../services/geminiService';
import CoinCard from './CoinCard';
import TrendChart from './TrendChart';
import { MonetizeSpace } from './MonetizeSpace';

const ITEMS_PER_PAGE_GRID = 24;
const ITEMS_PER_PAGE_LIST = 20;

interface ScannerProps {
  coins: CoinAnalysis[];
  setCoins: React.Dispatch<React.SetStateAction<CoinAnalysis[]>>;
  onTrade: (coin: CoinAnalysis) => void;
  watchlist: string[];
  onToggleWatchlist: (symbol: string) => void;
}

const Scanner: React.FC<ScannerProps> = ({ coins, setCoins, onTrade, watchlist, onToggleWatchlist }) => {
  const [filteredCoins, setFilteredCoins] = useState<CoinAnalysis[]>(coins);
  const [isScanning, setIsScanning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const [newSignalsCount, setNewSignalsCount] = useState<number | null>(null);
  
  // Filtering & Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'WATCHLIST' | 'BULLISH' | 'BEARISH' | 'HIGH_SENTIMENT'>('ALL');
  const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('GRID');
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = viewMode === 'GRID' ? ITEMS_PER_PAGE_GRID : ITEMS_PER_PAGE_LIST;

  // Derived state for the "Top Watchlist" section
  const showWatchlistSection = filterType === 'ALL' && !searchTerm && watchlist.length > 0;
  // If showing watchlist section separately, we filter based on that, otherwise empty array
  const topWatchlistCoins = showWatchlistSection ? coins.filter(c => watchlist.includes(c.symbol)) : [];

  // Auto-scroll logs
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Reset page ONLY when search, filter criteria, or view mode changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType, viewMode]);

  // Handle Filtering (Updates when coins or criteria change)
  useEffect(() => {
    if (!coins) return;
    
    let result = coins;

    // Search overrides everything
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(c => 
        c.symbol.toLowerCase().includes(lower) || 
        c.name.toLowerCase().includes(lower)
      );
    } else {
        // Filter Type Logic
        if (filterType === 'WATCHLIST') {
            result = result.filter(c => watchlist.includes(c.symbol));
        } else if (filterType === 'BULLISH') {
            result = result.filter(c => c.prediction?.trend === 'BULLISH');
        } else if (filterType === 'BEARISH') {
            result = result.filter(c => c.prediction?.trend === 'BEARISH');
        } else if (filterType === 'HIGH_SENTIMENT') {
            result = result.filter(c => c.sentiment.score >= 70);
        } else if (filterType === 'ALL') {
            // If we are showing the dedicated watchlist section at the top,
            // remove those coins from this main list to avoid duplication.
            if (watchlist.length > 0) {
                 result = result.filter(c => !watchlist.includes(c.symbol));
            }
        }
    }

    setFilteredCoins(result);
  }, [coins, searchTerm, filterType, watchlist]);

  // Pagination
  const totalPages = Math.ceil(filteredCoins.length / itemsPerPage);
  const visibleCoins = filteredCoins.slice(
    (currentPage - 1) * itemsPerPage, 
    currentPage * itemsPerPage
  );

  const handleScan = async () => {
    if (isScanning) return;
    setIsScanning(true);
    setLogs([]); 
    setNewSignalsCount(null);

    addLog("Initiating market-wide scan protocol...");
    await new Promise(r => setTimeout(r, 800));
    
    addLog(`Fetching live data for ${coins.length} assets...`);
    
    // Scan visible coins + watchlist coins to optimize
    const currentViewSymbols = [...visibleCoins, ...topWatchlistCoins].map(c => c.symbol);
    const uniqueSymbols = Array.from(new Set(currentViewSymbols));
    
    const targets = coins.filter(c => uniqueSymbols.includes(c.symbol));
    
    addLog(`Prioritizing analysis for: ${targets.map(t => t.symbol).join(', ')}...`);

    // Set Loading State for targets
    setCoins(prevCoins => prevCoins.map(c => 
        uniqueSymbols.includes(c.symbol) ? { ...c, isAnalyzing: true } : c
    ));

    try {
      MOCK_LOGS.forEach((log, index) => {
         setTimeout(() => {
             if(index < MOCK_LOGS.length - 1) addLog(log);
         }, index * 600 + 500);
      });

      const predictions = await scanMarketWithGemini(targets);
      
      addLog("Gemini 3 Pro reasoning complete.");
      
      setCoins(prevCoins => prevCoins.map(coin => {
        // If it was a target, clear the analyzing flag
        const wasTarget = uniqueSymbols.includes(coin.symbol);
        
        const newPred = predictions.find(p => p.symbol === coin.symbol);
        if (newPred) {
            return { ...coin, prediction: newPred, isAnalyzing: false };
        }
        
        // If target but no result, just stop loading
        if (wasTarget) {
            return { ...coin, isAnalyzing: false };
        }

        return coin;
      }));
      
      // Calculate how many were updated/found
      if (predictions.length > 0) {
          setNewSignalsCount(predictions.length);
          // Auto-hide notification after 5s
          setTimeout(() => setNewSignalsCount(null), 5000);
      }
      
      addLog("Dashboard telemetry updated.");

    } catch (error: any) {
      if (error.message && error.message.includes('API Key not found')) {
         addLog("CRITICAL ERROR: Gemini API Key missing.");
         addLog("Check environment variables in your deployment.");
      } else {
         addLog("Error during AI analysis.");
      }
      console.error(error);
      // Reset loading state on error
      setCoins(prevCoins => prevCoins.map(c => 
         uniqueSymbols.includes(c.symbol) ? { ...c, isAnalyzing: false } : c
      ));
    } finally {
      setIsScanning(false);
    }
  };

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  // Helper for List View Row
  const renderListRow = (coin: CoinAnalysis) => {
      const isPositive = coin.change24h >= 0;
      const isWatched = watchlist.includes(coin.symbol);
      const isAnalyzing = coin.isAnalyzing;

      return (
        <tr key={coin.id} className={`hover:bg-gray-800/50 transition-colors ${isWatched ? 'bg-yellow-900/5 hover:bg-yellow-900/10' : ''}`}>
            <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => onToggleWatchlist(coin.symbol)}
                        className="text-gray-600 hover:text-yellow-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded"
                        aria-label={isWatched ? `Remove ${coin.name} from watchlist` : `Add ${coin.name} to watchlist`}
                    >
                        {isWatched ? (
                            <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                        ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                        )}
                    </button>
                    <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden">
                        <img 
                            src={`https://assets.coincap.io/assets/icons/${coin.symbol.toLowerCase()}@2x.png`} 
                            alt={`${coin.name} logo`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = `https://lcw.nyc3.cdn.digitaloceanspaces.com/production/currencies/64/${coin.symbol.toLowerCase()}.png`
                            }}
                        />
                    </div>
                    <div>
                        <div className="font-bold text-white text-sm">{coin.name}</div>
                        <div className="text-xs text-gray-500">{coin.symbol}</div>
                    </div>
                </div>
            </td>
            <td className="px-6 py-4 font-mono text-white text-sm">
                ${coin.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 7 })}
            </td>
            <td className={`px-6 py-4 font-mono text-sm font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                {isPositive ? '+' : ''}{coin.change24h.toFixed(2)}%
            </td>
            <td className="px-6 py-4">
                <TrendChart data={coin.priceHistory} color={isPositive ? '#4ade80' : '#f87171'} />
            </td>
            <td className="px-6 py-4">
                {isAnalyzing ? (
                     <div className="flex items-center gap-2 text-cyan-400">
                         <div className="w-3 h-3 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                         <span className="text-xs">Analyzing...</span>
                     </div>
                ) : coin.prediction ? (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border ${
                        coin.prediction.trend === 'BULLISH' ? 'bg-green-900/30 text-green-400 border-green-800' :
                        coin.prediction.trend === 'BEARISH' ? 'bg-red-900/30 text-red-400 border-red-800' :
                        'bg-yellow-900/30 text-yellow-400 border-yellow-800'
                    }`}>
                        {coin.prediction.trend}
                    </span>
                ) : (
                    <span className="text-gray-600 text-xs">-</span>
                )}
            </td>
            <td className="px-6 py-4">
                <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div 
                        className={`h-full ${coin.sentiment.score > 60 ? 'bg-green-500' : coin.sentiment.score < 40 ? 'bg-red-500' : 'bg-yellow-500'}`} 
                        style={{ width: `${coin.sentiment.score}%` }}
                    ></div>
                </div>
            </td>
            <td className="px-6 py-4 text-right">
                <button 
                    onClick={() => onTrade(coin)}
                    className="text-xs bg-gray-800 hover:bg-cyan-900 hover:text-cyan-400 text-gray-300 border border-gray-700 hover:border-cyan-500/50 px-3 py-1.5 rounded transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                    aria-label={`Trade ${coin.name}`}
                >
                    Trade
                </button>
            </td>
        </tr>
      );
  };

  // Safe check if data is loading or empty
  if (!coins || coins.length === 0) {
      return (
          <div className="w-full h-96 flex flex-col items-center justify-center">
              <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-gray-400 font-mono">Loading Market Data...</p>
          </div>
      );
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
      
      {/* Toast Notification for New Signals */}
      {newSignalsCount !== null && (
          <div role="status" aria-live="polite" className="fixed top-24 right-6 z-50 transition-all duration-500 transform translate-y-0 opacity-100">
              <div className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg shadow-2xl p-4 flex items-center gap-4 border border-cyan-400/30">
                  <div className="bg-white/20 p-2 rounded-full">
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                  </div>
                  <div>
                      <h4 className="font-bold text-sm">Scan Complete</h4>
                      <p className="text-xs text-cyan-100">{newSignalsCount} new signals generated.</p>
                  </div>
                  <button onClick={() => setNewSignalsCount(null)} className="text-white/60 hover:text-white" aria-label="Close notification">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
              </div>
          </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-6">
        <div>
           <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Market Intelligence</h2>
           <div className="flex items-center gap-2">
             <span className="relative flex h-3 w-3">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
               <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
             </span>
             <p className="text-gray-400 text-sm">Live Feed • Tracking {coins.length} assets</p>
           </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto items-center">
            {/* View Toggle */}
            <div className="flex bg-gray-900 rounded-lg p-1 border border-gray-800" role="group" aria-label="View Mode">
                <button 
                    onClick={() => setViewMode('GRID')}
                    className={`p-2 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${viewMode === 'GRID' ? 'bg-gray-700 text-cyan-400' : 'text-gray-500 hover:text-white'}`}
                    aria-label="Grid View"
                    aria-pressed={viewMode === 'GRID'}
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                </button>
                <button 
                    onClick={() => setViewMode('LIST')}
                    className={`p-2 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${viewMode === 'LIST' ? 'bg-gray-700 text-cyan-400' : 'text-gray-500 hover:text-white'}`}
                    aria-label="List View"
                    aria-pressed={viewMode === 'LIST'}
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                </button>
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-auto">
                <input 
                    type="text" 
                    placeholder="Search coin..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full sm:w-64 bg-gray-900 border border-gray-700 text-gray-200 text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block pl-10 p-2.5 outline-none"
                    aria-label="Search coins"
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
                    </svg>
                </div>
            </div>

            <button
                onClick={handleScan}
                disabled={isScanning}
                className={`
                    w-full sm:w-auto whitespace-nowrap px-6 py-2.5 rounded-lg font-bold text-sm tracking-wide uppercase transition-all duration-300 flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500
                    ${isScanning 
                        ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:shadow-lg hover:shadow-cyan-500/30'}
                `}
                aria-label={isScanning ? "Scanning market..." : "Analyze Crypto Market"}
            >
                {isScanning ? (
                    <>
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Scanning...
                    </>
                ) : 'Analyze Crypto'}
            </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex overflow-x-auto pb-4 mb-4 gap-2 no-scrollbar" role="tablist">
         {[
             { id: 'ALL', label: 'All Assets' },
             { id: 'WATCHLIST', label: 'My Watchlist', icon: true },
             { id: 'BULLISH', label: 'Bullish Signals' },
             { id: 'BEARISH', label: 'Bearish Signals' },
             { id: 'HIGH_SENTIMENT', label: 'High Sentiment' }
         ].map(tab => (
             <button
                key={tab.id}
                role="tab"
                aria-selected={filterType === tab.id}
                onClick={() => setFilterType(tab.id as any)}
                className={`
                    px-4 py-2 rounded-full text-xs font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500
                    ${filterType === tab.id 
                        ? 'bg-cyan-900/50 text-cyan-400 border border-cyan-500/50' 
                        : 'bg-gray-900 text-gray-400 border border-gray-800 hover:bg-gray-800'}
                `}
             >
                 {tab.icon && (
                     <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                 )}
                 {tab.label}
             </button>
         ))}
      </div>

      {/* Logs Terminal */}
      {(isScanning || logs.length > 0) && (
        <div className="mb-8 bg-black/80 border border-gray-800 rounded-lg p-4 font-mono text-xs h-32 overflow-y-auto shadow-inner custom-scrollbar" aria-live="polite">
            {logs.map((log, i) => (
                <div key={i} className="text-green-500/90 mb-1">
                    <span className="opacity-50 mr-2">{'>'}</span>{log}
                </div>
            ))}
            <div ref={logsEndRef} />
        </div>
      )}

      <MonetizeSpace slotId="scanner_feed" />

      {/* --- DEDICATED WATCHLIST SECTION --- */}
      {showWatchlistSection && (
        <div className="mb-12">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                My Watchlist
            </h3>
            {viewMode === 'GRID' ? (
                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                    {topWatchlistCoins.map((coin) => (
                        <CoinCard 
                            key={coin.id} 
                            coin={coin} 
                            onTrade={() => onTrade(coin)} 
                            isWatched={watchlist.includes(coin.symbol)}
                            onToggleWatchlist={() => onToggleWatchlist(coin.symbol)}
                        />
                    ))}
                 </div>
            ) : (
                <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-950 text-gray-400 text-xs uppercase">
                                <tr>
                                    <th className="px-6 py-4">Asset</th>
                                    <th className="px-6 py-4">Price</th>
                                    <th className="px-6 py-4">24h</th>
                                    <th className="px-6 py-4">Trend (7d)</th>
                                    <th className="px-6 py-4">AI Prediction</th>
                                    <th className="px-6 py-4">Sentiment</th>
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {topWatchlistCoins.map(renderListRow)}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            <div className="mt-10 border-t border-gray-800 relative">
                <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-950 px-4 text-gray-500 text-xs uppercase font-bold tracking-widest">
                    All Assets
                </span>
            </div>
        </div>
      )}

      {/* --- MAIN CONTENT AREA --- */}
      {visibleCoins.length > 0 ? (
        <>
            {viewMode === 'GRID' ? (
                // GRID VIEW (5 Columns on XL, 6 on 2XL)
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                    {visibleCoins.map((coin) => (
                    <CoinCard 
                        key={coin.id} 
                        coin={coin} 
                        onTrade={() => onTrade(coin)} 
                        isWatched={watchlist.includes(coin.symbol)}
                        onToggleWatchlist={() => onToggleWatchlist(coin.symbol)}
                    />
                    ))}
                </div>
            ) : (
                // LIST VIEW
                <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-950 text-gray-400 text-xs uppercase">
                                <tr>
                                    <th className="px-6 py-4">Asset</th>
                                    <th className="px-6 py-4">Price</th>
                                    <th className="px-6 py-4">24h</th>
                                    <th className="px-6 py-4">Trend (7d)</th>
                                    <th className="px-6 py-4">AI Prediction</th>
                                    <th className="px-6 py-4">Sentiment</th>
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {visibleCoins.map(renderListRow)}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </>
      ) : (
        <div className="text-center py-20 text-gray-500 border border-dashed border-gray-800 rounded-xl">
            {filterType === 'WATCHLIST' ? (
                <>
                    <p className="text-lg text-white mb-2">Your watchlist is empty.</p>
                    <p className="text-sm">Star coins in the main list to track them here.</p>
                </>
            ) : (
                'No assets found matching your criteria.'
            )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-12 gap-2">
            <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded bg-gray-900 text-gray-400 disabled:opacity-50 hover:bg-gray-800 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                aria-label="Previous Page"
            >
                Previous
            </button>
            <span className="flex items-center px-4 text-gray-500 text-sm">
                Page {currentPage} of {totalPages}
            </span>
            <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded bg-gray-900 text-gray-400 disabled:opacity-50 hover:bg-gray-800 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                aria-label="Next Page"
            >
                Next
            </button>
        </div>
      )}
    </div>
  );
};

export default Scanner;
