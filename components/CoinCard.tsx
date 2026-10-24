import React, { useState } from 'react';
import { CoinAnalysis, TrendDirection } from '../types';
import TrendChart from './TrendChart';

interface CoinCardProps {
  coin: CoinAnalysis;
  onTrade?: () => void;
  isWatched?: boolean;
  onToggleWatchlist?: () => void;
}

const CoinCard: React.FC<CoinCardProps> = ({ coin, onTrade, isWatched, onToggleWatchlist }) => {
  const [imgError, setImgError] = useState(false);
  const isPositive = coin.change24h >= 0;
  
  // Determine card border/glow based on prediction
  let glowClass = "border-gray-700";
  let trendColor = "text-gray-400";
  let TrendIcon = null;

  if (coin.prediction) {
    if (coin.prediction.trend === TrendDirection.BULLISH) {
      glowClass = "border-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.1)]";
      trendColor = "text-green-400";
      TrendIcon = (
        <svg aria-hidden="true" className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
      );
    } else if (coin.prediction.trend === TrendDirection.BEARISH) {
      glowClass = "border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.1)]";
      trendColor = "text-red-400";
      TrendIcon = (
        <svg aria-hidden="true" className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>
      );
    } else {
      glowClass = "border-yellow-500/30 shadow-[0_0_10px_rgba(234,179,8,0.1)]";
      trendColor = "text-yellow-400";
      TrendIcon = (
         <svg aria-hidden="true" className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" /></svg>
      );
    }
  }

  // Override Visuals if Watched
  if (isWatched) {
      glowClass += " ring-1 ring-yellow-400/50 border-yellow-400/40 bg-gradient-to-b from-yellow-900/10 to-gray-850";
  }

  const isLoading = coin.isAnalyzing;

  return (
    <div className={`
        relative rounded-xl border ${glowClass} p-3 
        flex flex-col gap-2 group h-full min-h-[200px]
        transition-all duration-300 ease-out
        bg-gray-850
        hover:scale-[1.03] hover:shadow-2xl hover:shadow-cyan-900/20 hover:z-20 
        hover:bg-gradient-to-br hover:from-gray-800 hover:via-gray-800 hover:to-cyan-800/40
    `}>
      
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-[2px] z-30 flex items-center justify-center rounded-xl transition-opacity duration-300" role="status" aria-label="Loading analysis">
           <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Watchlist Toggle */}
      {onToggleWatchlist && (
          <button 
            onClick={(e) => {
                e.stopPropagation();
                onToggleWatchlist();
            }}
            className="absolute top-2 right-2 z-20 text-gray-600 hover:text-yellow-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded p-1"
            aria-label={isWatched ? `Remove ${coin.name} from watchlist` : `Add ${coin.name} to watchlist`}
            aria-pressed={isWatched}
            title={isWatched ? "Remove from Watchlist" : "Add to Watchlist"}
          >
              {isWatched ? (
                  <svg className="w-3.5 h-3.5 text-yellow-400 fill-current drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
              ) : (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
              )}
          </button>
      )}

      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center bg-gray-750 overflow-hidden shrink-0 shadow-lg border border-gray-700">
                {!imgError ? (
                    <img 
                        src={`https://assets.coincap.io/assets/icons/${coin.symbol.toLowerCase()}@2x.png`} 
                        alt={`${coin.name} logo`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (target.src.includes('coincap')) {
                                target.src = `https://lcw.nyc3.cdn.digitaloceanspaces.com/production/currencies/64/${coin.symbol.toLowerCase()}.png`
                            } else {
                                setImgError(true);
                            }
                        }}
                    />
                ) : (
                    <span className="font-bold text-white text-[10px]">{coin.symbol[0]}</span>
                )}
            </div>
            <div>
                <h3 className="font-bold text-white text-sm leading-tight group-hover:text-cyan-300 transition-colors">{coin.name}</h3>
                <span className="text-[9px] text-gray-400 font-mono group-hover:text-gray-300 transition-colors">{coin.symbol}</span>
            </div>
        </div>
      </div>
      
      {/* Price Section */}
      <div className="flex items-end gap-1.5 mt-0">
          <div className="text-sm font-mono font-medium text-white group-hover:text-white transition-colors" aria-label={`Price: ${coin.price.toLocaleString()}`}>
              ${coin.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 7 })}
          </div>
          <div 
             className={`text-[10px] font-medium ${isPositive ? 'text-green-400' : 'text-red-400'} mb-0.5`}
             aria-label={`24h Change: ${isPositive ? '+' : ''}${coin.change24h}%`}
          >
              {isPositive ? '+' : ''}{coin.change24h.toFixed(2)}%
          </div>
      </div>

      {/* Chart & Stats */}
      <div className="flex justify-between items-center py-1 border-t border-b border-gray-800 group-hover:border-gray-700 transition-colors" aria-hidden="true">
        <div className="flex flex-col gap-0">
             <span className="text-[9px] text-gray-500 uppercase tracking-wider">Vol</span>
             <span className="text-[10px] text-gray-300 font-mono">{coin.volume24h}</span>
        </div>
        <TrendChart 
            data={coin.priceHistory} 
            color={isPositive ? '#4ade80' : '#f87171'} 
            className="h-8 w-16"
        />
      </div>

      {/* Sentiment Ticker */}
      <div className="bg-gray-900/50 rounded p-1 border border-gray-800 flex items-start gap-1.5 group-hover:bg-black/40 transition-colors" role="note" aria-label={`Sentiment Score: ${coin.sentiment.score}/100. Headline: ${coin.sentiment.headline}`}>
         <div className={`mt-1 w-1.5 h-1.5 rounded-full ${coin.sentiment.score > 60 ? 'bg-green-500' : coin.sentiment.score < 40 ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
         <div>
            <div className="text-[8px] text-gray-500 uppercase font-bold tracking-wider mb-0">Sentiment</div>
            <p className="text-[9px] text-gray-300 leading-tight line-clamp-1 group-hover:text-white transition-colors">"{coin.sentiment.headline}"</p>
         </div>
      </div>

      {/* Prediction Section */}
      <div className="min-h-[70px] flex-grow flex flex-col">
        {coin.prediction ? (
            <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-1">
                    <div className={`flex items-center text-[10px] font-bold ${trendColor} uppercase tracking-wide`}>
                        {TrendIcon}
                        {coin.prediction.trend}
                    </div>
                    
                    {/* CONFIDENCE SCORE with Tooltip */}
                    <div className="group/tooltip relative" tabIndex={0} role="button" aria-label={`Confidence Score: ${coin.prediction.confidence}%`}>
                        <div className={`
                            text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm cursor-help transition-all duration-300
                            ${coin.prediction.confidence >= 80 
                                ? 'bg-green-600 text-white shadow-green-900/50 ring-1 ring-green-400/50' 
                                : coin.prediction.confidence >= 50 
                                    ? 'bg-yellow-600 text-white shadow-yellow-900/50 ring-1 ring-yellow-400/50'
                                    : 'bg-red-600 text-white shadow-red-900/50 ring-1 ring-red-400/50'}
                        `}>
                            {coin.prediction.confidence}%
                        </div>
                        {/* Tooltip Content */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-black/95 text-[10px] text-gray-300 rounded border border-gray-700 opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-30 shadow-xl text-center group-focus/tooltip:opacity-100">
                             AI confidence in the short-term trend prediction based on current data
                             <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black/95"></div>
                        </div>
                    </div>
                </div>
                
                <p className="text-[10px] text-gray-300 leading-snug mb-1 flex-grow line-clamp-3 group-hover:text-gray-200 transition-colors">
                    {coin.prediction.reasoning}
                </p>
                <div className="flex items-center gap-2 text-[9px] text-gray-400 pt-1 border-t border-gray-800 border-dashed mt-auto group-hover:border-gray-700 transition-colors">
                    <span className="text-cyan-450">Key Lvl:</span>
                    <span className="font-mono text-white">{coin.prediction.keyLevel}</span>
                </div>
            </div>
        ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-600 gap-1">
                <svg className="w-4 h-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="text-[10px] italic opacity-50">Waiting...</span>
            </div>
        )}
      </div>

      {onTrade && (
          <button 
            onClick={onTrade}
            className="mt-1 w-full bg-gray-800 hover:bg-gray-700 text-cyan-400 hover:text-cyan-300 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-colors border border-gray-700 hover:border-cyan-500/30 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
            aria-label={`Trade ${coin.name}`}
            title={`Open trade dialog for ${coin.name}`}
          >
              Trade {coin.symbol}
          </button>
      )}
    </div>
  );
};

export default CoinCard;