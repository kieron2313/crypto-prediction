import React from 'react';
import { CoinAnalysis, TrendDirection } from '../types';
import CoinCard from './CoinCard';
import { MonetizeSpace } from './MonetizeSpace';

interface SignalsProps {
  coins: CoinAnalysis[];
  onTrade: (coin: CoinAnalysis) => void;
}

export const Signals: React.FC<SignalsProps> = ({ coins, onTrade }) => {
  // Logic to determine "Top 9 Market Signals"
  // Constraint: STRICTLY BULLISH AND Confidence > 87%
  const topSignals = coins
    .filter(c => 
        c.prediction?.trend === TrendDirection.BULLISH && 
        (c.prediction?.confidence || 0) > 87
    )
    .sort((a, b) => {
      const confA = a.prediction?.confidence || 0;
      const confB = b.prediction?.confidence || 0;
      
      // Sort by confidence first
      if (confB !== confA) return confB - confA;
      
      // Then by sentiment
      return b.sentiment.score - a.sentiment.score;
    })
    .slice(0, 9);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                Top 9 Market Signals
            </h2>
            <p className="text-gray-400">
                Ultra-high conviction opportunities (<span className="text-green-400 font-bold">BULLISH</span> &gt; 87% Confidence) identified by Gemini 3 Pro.
            </p>
        </div>

        <MonetizeSpace slotId="signals_top" />

        {topSignals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {topSignals.map((coin, idx) => (
                    <div key={coin.id} className="relative">
                        {/* Rank Badge */}
                        <div className="absolute -top-3 -left-3 z-10 w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold flex items-center justify-center shadow-lg border-2 border-gray-900">
                            #{idx + 1}
                        </div>
                        <CoinCard coin={coin} onTrade={() => onTrade(coin)} />
                    </div>
                ))}
            </div>
        ) : (
             <div className="text-center py-20 bg-gray-900/50 rounded-xl border border-dashed border-gray-800 flex flex-col items-center justify-center">
                 <svg className="w-16 h-16 text-gray-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                 </svg>
                 <h3 className="text-xl font-bold text-white mb-2">No Super-High Confidence Signals</h3>
                 <p className="text-gray-500 max-w-md mx-auto">
                     The AI is currently cautious. No bullish signals met the strict 87% confidence threshold. 
                     Check back after the next scan cycle or view the main prediction feed for standard opportunities.
                 </p>
             </div>
        )}
    </div>
  );
};