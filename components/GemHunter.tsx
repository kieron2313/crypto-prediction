import React, { useEffect, useState } from 'react';
import { DexPair, AIPrediction } from '../types';
import { fetchDexPairs } from '../services/dexService';
import { analyzeGemCandidates } from '../services/geminiService';
import { MonetizeSpace } from './MonetizeSpace';

export const GemHunter: React.FC = () => {
  const [pairs, setPairs] = useState<DexPair[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<'h1' | 'h24' | 'liquidity' | 'gemScore'>('gemScore');
  
  // AI Signal State
  const [aiSignals, setAiSignals] = useState<AIPrediction[]>([]);
  const [isAiScanning, setIsAiScanning] = useState(false);
  const [lastScanTime, setLastScanTime] = useState<number | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const data = await fetchDexPairs();
      setPairs(data);
      setLoading(false);
      
      // Auto-run AI analysis if it hasn't run in the last hour
      const now = Date.now();
      const oneHour = 3600 * 1000;
      const lastRun = localStorage.getItem('lastGemScanTime');
      
      if (data.length > 0 && (!lastRun || now - parseInt(lastRun) > oneHour)) {
          runAiAnalysis(data);
      }
    };
    loadData();

    // Data Refresh every 60s
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, []);

  const runAiAnalysis = async (candidatePairs: DexPair[]) => {
      setIsAiScanning(true);
      const signals = await analyzeGemCandidates(candidatePairs);
      if (signals && signals.length > 0) {
          setAiSignals(signals);
          const now = Date.now();
          setLastScanTime(now);
          localStorage.setItem('lastGemScanTime', now.toString());
      }
      setIsAiScanning(false);
  };

  const calculateGemScore = (pair: DexPair) => {
    // Logic for "5x Potential":
    // 1. High Volume to Liquidity Ratio (Volatility)
    // 2. Rising Price Momentum (h1 > 0)
    // 3. Not too high FDV (Room to grow)
    
    let score = 0;
    
    const volLiqRatio = pair.volume.h24 / (pair.liquidity?.usd || 1);
    score += Math.min(volLiqRatio * 10, 40); // Max 40 pts for volume/liq

    if (pair.priceChange.h1 > 5) score += 20; // Momentum
    if (pair.priceChange.h6 > 10) score += 10;
    
    // Lower FDV is better for 5x, but not too low (rug risk)
    if (pair.fdv > 100000 && pair.fdv < 5000000) score += 30; // Sweet spot for moonshots
    else if (pair.fdv < 10000000) score += 15;

    return score;
  };

  const sortedPairs = [...pairs].sort((a, b) => {
    if (sortKey === 'gemScore') return calculateGemScore(b) - calculateGemScore(a);
    if (sortKey === 'h1') return b.priceChange.h1 - a.priceChange.h1;
    if (sortKey === 'h24') return b.priceChange.h24 - a.priceChange.h24;
    return (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0);
  });

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
           <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
             <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                Gem Hunter 5x
             </span>
             <span className="text-xs bg-purple-900/50 text-purple-300 px-2 py-1 rounded border border-purple-700/50">Beta</span>
           </h2>
           <p className="text-gray-400 text-sm">Real-time DexScreener feed scanning for high-volatility breakouts on Solana & Base.</p>
        </div>
        
        <div className="flex flex-col items-end gap-2">
            <div className="flex bg-gray-900 rounded-lg p-1 border border-gray-800">
            {(['gemScore', 'h1', 'h24', 'liquidity'] as const).map(key => (
                <button
                    key={key}
                    onClick={() => setSortKey(key)}
                    className={`px-4 py-2 rounded text-xs font-bold uppercase transition ${sortKey === key ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/50' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    {key === 'gemScore' ? 'Gem Score' : key}
                </button>
            ))}
            </div>
            {lastScanTime && (
                <div className="text-[10px] text-gray-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                    AI Last Checked: {new Date(lastScanTime).toLocaleTimeString()}
                </div>
            )}
        </div>
      </div>

      <MonetizeSpace slotId="gem_hunter_top" />

      {/* AI ALPHA FEED SECTION */}
      <div className="mb-12">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              AI Alpha Feed <span className="text-xs font-normal text-gray-500 ml-2">(Auto-refreshes hourly)</span>
          </h3>
          
          {isAiScanning ? (
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 flex flex-col items-center justify-center gap-3">
                   <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                   <p className="text-sm text-purple-300 font-mono">Gemini 3 Pro is analyzing liquidity pools...</p>
              </div>
          ) : aiSignals.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {aiSignals.map((signal, idx) => (
                      <div key={idx} className="bg-gradient-to-br from-gray-900 to-purple-900/20 border border-purple-500/30 rounded-xl p-5 shadow-lg shadow-purple-900/20 relative group hover:scale-[1.02] transition-transform duration-300">
                          <div className="absolute top-0 right-0 p-2 opacity-50">
                             <div className="text-4xl font-black text-white/5">0{idx + 1}</div>
                          </div>
                          
                          <div className="flex justify-between items-start mb-3">
                              <h4 className="text-lg font-bold text-white">{signal.symbol}</h4>
                              <span className="px-2 py-1 bg-green-900/40 text-green-400 text-xs font-bold rounded border border-green-800">
                                  {signal.confidence}% Conf.
                              </span>
                          </div>
                          
                          <p className="text-sm text-gray-300 mb-4 leading-relaxed line-clamp-3">
                              {signal.reasoning}
                          </p>
                          
                          <div className="flex items-center justify-between pt-3 border-t border-gray-800/50">
                              <div className="text-xs">
                                  <span className="text-gray-500 block uppercase font-bold text-[10px]">Entry Zone</span>
                                  <span className="text-cyan-400 font-mono">{signal.keyLevel}</span>
                              </div>
                              <button className="text-xs bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded transition shadow-lg shadow-purple-900/40">
                                  Chart
                              </button>
                          </div>
                      </div>
                  ))}
              </div>
          ) : (
             <div className="bg-gray-900/50 border border-dashed border-gray-800 rounded-xl p-6 text-center text-gray-500 text-sm">
                 Waiting for next hourly scan cycle...
                 <button onClick={() => runAiAnalysis(pairs)} className="ml-2 text-purple-400 hover:underline">Force Scan Now</button>
             </div>
          )}
      </div>

      <h3 className="text-xl font-bold text-white mb-4">Raw DexScreener Feed</h3>

      {loading ? (
         <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-purple-400 font-mono text-sm animate-pulse">Scanning DEX Liquidity Pools...</p>
         </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in duration-500">
            {sortedPairs.slice(0, 12).map((pair, idx) => {
                const score = calculateGemScore(pair);
                const isSolana = pair.chainId === 'solana';
                
                return (
                    <div key={pair.pairAddress} className="relative bg-gray-900/80 backdrop-blur border border-gray-800 rounded-xl overflow-hidden hover:border-purple-500/50 transition-all duration-300 group">
                        {/* Header Background */}
                        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${score > 70 ? 'from-purple-500 via-pink-500 to-orange-500' : 'from-gray-700 to-gray-800'}`}></div>
                        
                        <div className="p-5">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700 font-bold text-white text-xs overflow-hidden">
                                        {pair.baseToken.symbol.slice(0, 2)}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-white leading-none">{pair.baseToken.symbol}</h3>
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${isSolana ? 'bg-indigo-900/50 text-indigo-400 border border-indigo-800' : 'bg-blue-900/50 text-blue-400 border border-blue-800'}`}>
                                                {pair.chainId}
                                            </span>
                                        </div>
                                        <a href={pair.url} target="_blank" rel="noreferrer" className="text-xs text-gray-500 hover:text-purple-400 flex items-center gap-1 mt-1">
                                            {pair.pairAddress.slice(0, 6)}...{pair.pairAddress.slice(-4)}
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                        </a>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-gray-400 mb-0.5">Gem Score</div>
                                    <div className={`text-xl font-black italic ${score > 75 ? 'text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500' : 'text-gray-500'}`}>
                                        {Math.floor(score)}
                                    </div>
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 gap-4 mb-4 bg-black/20 p-3 rounded-lg border border-gray-800/50">
                                <div>
                                    <div className="text-xs text-gray-500">Price USD</div>
                                    <div className="font-mono text-sm text-gray-200">${parseFloat(pair.priceUsd).toFixed(8)}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500">Liquidity</div>
                                    <div className="font-mono text-sm text-gray-200">${pair.liquidity?.usd?.toLocaleString() || '0'}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500">FDV</div>
                                    <div className="font-mono text-sm text-gray-200">${pair.fdv?.toLocaleString() || '0'}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500">24h Vol</div>
                                    <div className="font-mono text-sm text-cyan-400">${pair.volume.h24?.toLocaleString()}</div>
                                </div>
                            </div>

                            {/* Performance Tickers */}
                            <div className="flex justify-between items-center text-sm font-mono border-t border-gray-800 pt-3">
                                <div className="flex flex-col items-center">
                                    <span className="text-[10px] text-gray-600 uppercase">5m</span>
                                    <span className={pair.priceChange.m5 >= 0 ? 'text-green-400' : 'text-red-400'}>
                                        {pair.priceChange.m5}%
                                    </span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <span className="text-[10px] text-gray-600 uppercase">1h</span>
                                    <span className={pair.priceChange.h1 >= 0 ? 'text-green-400' : 'text-red-400'}>
                                        {pair.priceChange.h1}%
                                    </span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <span className="text-[10px] text-gray-600 uppercase">6h</span>
                                    <span className={pair.priceChange.h6 >= 0 ? 'text-green-400' : 'text-red-400'}>
                                        {pair.priceChange.h6}%
                                    </span>
                                </div>
                                <div className="flex flex-col items-center">
                                    <span className="text-[10px] text-gray-600 uppercase">24h</span>
                                    <span className={pair.priceChange.h24 >= 0 ? 'text-green-400' : 'text-red-400'}>
                                        {pair.priceChange.h24}%
                                    </span>
                                </div>
                            </div>

                            {/* Alert/Badge if Moonshot */}
                            {score > 80 && (
                                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full text-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg shadow-red-600/50 animate-pulse">
                                        5X POTENTIAL
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
      )}
    </div>
  );
};