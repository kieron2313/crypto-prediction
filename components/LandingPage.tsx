import React, { useEffect, useState } from 'react';
import { CoinAnalysis } from '../types';

interface LandingProps {
  onGetStarted: () => void;
  coins: CoinAnalysis[];
}

export const LandingPage: React.FC<LandingProps> = ({ onGetStarted, coins }) => {
  const [featuredSignals, setFeaturedSignals] = useState<CoinAnalysis[]>([]);

  useEffect(() => {
    if (coins.length > 0) {
        // Filter: Must have prediction AND be strictly BULLISH
        const candidates = coins.filter(c => c.prediction && c.prediction.trend === 'BULLISH');
        
        if (candidates.length > 0) {
            // Randomize and pick top 2
            const shuffled = [...candidates].sort(() => 0.5 - Math.random());
            setFeaturedSignals(shuffled.slice(0, 2));
        } else {
            setFeaturedSignals([]);
        }
    }
  }, []); // Run once on mount to keep signals stable

  return (
    <div className="relative isolate overflow-hidden">
        {/* Reduced padding top (pt-10 -> pt-6), reduced lg padding (lg:py-40 -> lg:py-20) to move content up */}
        <div className="mx-auto max-w-7xl px-6 pb-24 pt-6 sm:pb-32 lg:flex lg:px-8 lg:py-20">
            <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-xl lg:flex-shrink-0 lg:pt-8">
                {/* Reduced margins (mt-24 -> mt-8) to reduce whitespace */}
                <div className="mt-8 sm:mt-16 lg:mt-8">
                    <span className="inline-flex items-center rounded-full bg-cyan-400/10 px-3 py-1 text-sm font-medium text-cyan-400 ring-1 ring-inset ring-cyan-400/20">
                        AI Powered
                    </span>
                </div>
                <h1 className="mt-10 text-4xl font-bold tracking-tight text-white sm:text-6xl">
                    Predict Crypto Trends with <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">AI Precision</span>
                </h1>
                <p className="mt-6 text-lg leading-8 text-gray-300">
                    Stop guessing. Our advanced neural engine analyzes technical indicators, market sentiment, and 50+ data points to give you actionable buy/sell signals on 60+ cryptocurrencies.
                </p>
                
                {/* Live Signal Preview Section */}
                {featuredSignals.length > 0 && (
                    <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-6 duration-700">
                        {featuredSignals.map((coin) => (
                            <div key={coin.symbol} className="bg-gray-900/60 backdrop-blur-md border border-green-500/30 rounded-xl p-4 flex items-start gap-4 hover:border-green-400/50 transition-colors shadow-lg shadow-green-900/10">
                                <img 
                                    src={`https://assets.coincap.io/assets/icons/${coin.symbol.toLowerCase()}@2x.png`} 
                                    className="w-10 h-10 rounded-full"
                                    alt={coin.symbol}
                                    onError={(e) => { (e.target as HTMLImageElement).src = `https://lcw.nyc3.cdn.digitaloceanspaces.com/production/currencies/64/${coin.symbol.toLowerCase()}.png` }}
                                />
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-bold text-white">{coin.name}</span>
                                        <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase bg-green-900/30 text-green-400 border border-green-800">
                                            BULLISH
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-400 leading-snug line-clamp-2">
                                        {coin.prediction?.reasoning || "AI Analysis pending..."}
                                    </div>
                                    <div className="mt-2 text-[10px] text-green-400 flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
                                        Strong Buy Signal
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="mt-10 flex items-center gap-x-6">
                    <button
                        onClick={onGetStarted}
                        className="rounded-md bg-cyan-600 px-6 py-3.5 text-base font-semibold text-white shadow-sm hover:bg-cyan-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600 transition-all hover:scale-105"
                    >
                        Start Scanning Now
                    </button>
                </div>
                
                {/* Stats */}
                <div className="mt-14 flex items-center gap-8 border-t border-gray-800 pt-8">
                    <div>
                        <div className="text-2xl font-bold text-white">60+</div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide">Assets Tracked</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-white">24/7</div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide">Real-time Analysis</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-white">92%</div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide">Signal Accuracy</div>
                    </div>
                </div>
            </div>

            {/* Visual Graphic */}
            <div className="mx-auto mt-16 flex max-w-2xl sm:mt-24 lg:ml-10 lg:mt-0 lg:mr-0 lg:max-w-none lg:flex-none xl:ml-32">
                <div className="max-w-3xl flex-none sm:max-w-5xl lg:max-w-none">
                    <div className="-m-2 rounded-xl bg-gray-900/50 p-2 ring-1 ring-inset ring-gray-900/10 lg:-m-4 lg:rounded-2xl lg:p-4 border border-gray-800 backdrop-blur-sm shadow-2xl relative">
                         <img 
                            src="https://img.freepik.com/free-vector/gradient-stock-market-concept_23-2149166910.jpg" // Placeholder abstract tech image
                            alt="App Screenshot"
                            className="w-[76rem] rounded-md shadow-2xl ring-1 ring-gray-900/10 opacity-80 grayscale hover:grayscale-0 transition-all duration-1000"
                            width={2432}
                            height={1442}
                            style={{ maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)' }}
                         />
                         
                         {/* Floating Cards Overlay */}
                         
                         {/* Bitcoin */}
                         <div className="absolute top-[20%] left-[10%] bg-gray-800 p-3 rounded-lg border border-gray-700 shadow-xl animate-pulse z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center font-bold text-white">₿</div>
                                <div>
                                    <div className="text-white font-bold text-sm">Bitcoin</div>
                                    <div className="text-green-400 text-xs">+2.4%</div>
                                </div>
                            </div>
                         </div>

                         {/* Solana */}
                         <div className="absolute top-[60%] left-[5%] bg-gray-800 p-3 rounded-lg border border-gray-700 shadow-xl z-10 animate-pulse" style={{ animationDelay: '0.5s' }}>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center font-bold text-white">S</div>
                                <div>
                                    <div className="text-white font-bold text-sm">Solana</div>
                                    <div className="text-cyan-400 text-xs">High Vol</div>
                                </div>
                            </div>
                         </div>

                         {/* Ethereum */}
                         <div className="absolute top-[15%] right-[20%] bg-gray-800 p-3 rounded-lg border border-gray-700 shadow-xl animate-pulse z-10" style={{ animationDelay: '1.2s' }}>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-white">E</div>
                                <div className="hidden sm:block">
                                    <div className="text-white font-bold text-sm">Ethereum</div>
                                    <div className="text-blue-400 text-xs">Accumulation</div>
                                </div>
                            </div>
                         </div>

                         {/* XRP */}
                         <div className="absolute bottom-[20%] left-[20%] bg-gray-800 p-3 rounded-lg border border-gray-700 shadow-xl animate-pulse z-10" style={{ animationDelay: '2s' }}>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-200 text-black flex items-center justify-center font-bold">X</div>
                                <div>
                                    <div className="text-white font-bold text-sm">XRP</div>
                                    <div className="text-green-400 text-xs">+5.2%</div>
                                </div>
                            </div>
                         </div>

                         {/* ADA */}
                         <div className="absolute top-[40%] right-[10%] bg-gray-800 p-3 rounded-lg border border-gray-700 shadow-xl animate-pulse z-10" style={{ animationDelay: '1.5s' }}>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center font-bold text-white">A</div>
                                <div>
                                    <div className="text-white font-bold text-sm">ADA</div>
                                    <div className="text-gray-400 text-xs">Neutral</div>
                                </div>
                            </div>
                         </div>

                         {/* DOGE */}
                         <div className="absolute bottom-[10%] right-[30%] bg-gray-800 p-3 rounded-lg border border-gray-700 shadow-xl animate-pulse z-10" style={{ animationDelay: '2.5s' }}>
                             <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center font-bold text-black">D</div>
                                <div className="hidden sm:block">
                                    <div className="text-white font-bold text-sm">DOGE</div>
                                    <div className="text-green-400 text-xs">Pump</div>
                                </div>
                            </div>
                         </div>

                         {/* DOT */}
                         <div className="absolute top-[30%] left-[40%] bg-gray-800 p-3 rounded-lg border border-gray-700 shadow-xl animate-pulse z-10" style={{ animationDelay: '0.8s' }}>
                             <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-pink-500 flex items-center justify-center font-bold text-white">P</div>
                                <div className="hidden sm:block">
                                    <div className="text-white font-bold text-sm">DOT</div>
                                    <div className="text-red-400 text-xs">-1.2%</div>
                                </div>
                            </div>
                         </div>

                         {/* LINK */}
                         <div className="absolute bottom-[40%] right-[5%] bg-gray-800 p-3 rounded-lg border border-gray-700 shadow-xl animate-pulse z-10" style={{ animationDelay: '1.8s' }}>
                             <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white">L</div>
                                <div>
                                    <div className="text-white font-bold text-sm">LINK</div>
                                    <div className="text-green-400 text-xs">Breakout</div>
                                </div>
                            </div>
                         </div>

                         {/* AVAX */}
                         <div className="absolute top-[5%] left-[30%] bg-gray-800 p-3 rounded-lg border border-gray-700 shadow-xl animate-pulse z-10" style={{ animationDelay: '3s' }}>
                             <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center font-bold text-white">A</div>
                                <div className="hidden sm:block">
                                    <div className="text-white font-bold text-sm">AVAX</div>
                                    <div className="text-gray-400 text-xs">Consolidating</div>
                                </div>
                            </div>
                         </div>

                         {/* SHIB */}
                         <div className="absolute bottom-[5%] right-[5%] bg-gray-800 p-3 rounded-lg border border-gray-700 shadow-xl animate-pulse z-10" style={{ animationDelay: '0.3s' }}>
                             <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-red-700 flex items-center justify-center font-bold text-white text-[10px]">SH</div>
                                <div>
                                    <div className="text-white font-bold text-sm">SHIB</div>
                                    <div className="text-green-400 text-xs">Vol Spike</div>
                                </div>
                            </div>
                         </div>

                         {/* --- NEW 8 CARDS --- */}

                         {/* LTC */}
                         <div className="absolute top-[50%] left-[50%] bg-gray-800 p-3 rounded-lg border border-gray-700 shadow-xl animate-pulse z-10" style={{ animationDelay: '1.1s' }}>
                             <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center font-bold text-white">L</div>
                                <div>
                                    <div className="text-white font-bold text-sm">LTC</div>
                                    <div className="text-gray-400 text-xs">Steady</div>
                                </div>
                            </div>
                         </div>

                         {/* UNI */}
                         <div className="absolute top-[70%] left-[35%] bg-gray-800 p-3 rounded-lg border border-gray-700 shadow-xl animate-pulse z-10" style={{ animationDelay: '2.2s' }}>
                             <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-pink-600 flex items-center justify-center font-bold text-white">U</div>
                                <div className="hidden sm:block">
                                    <div className="text-white font-bold text-sm">UNI</div>
                                    <div className="text-green-400 text-xs">+3.1%</div>
                                </div>
                            </div>
                         </div>

                         {/* TRX */}
                         <div className="absolute top-[10%] right-[40%] bg-gray-800 p-3 rounded-lg border border-gray-700 shadow-xl animate-pulse z-10" style={{ animationDelay: '1.9s' }}>
                             <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center font-bold text-white">T</div>
                                <div>
                                    <div className="text-white font-bold text-sm">TRX</div>
                                    <div className="text-green-400 text-xs">Trending</div>
                                </div>
                            </div>
                         </div>

                         {/* BCH */}
                         <div className="absolute top-[85%] left-[15%] bg-gray-800 p-3 rounded-lg border border-gray-700 shadow-xl animate-pulse z-10" style={{ animationDelay: '2.8s' }}>
                             <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center font-bold text-white">B</div>
                                <div className="hidden sm:block">
                                    <div className="text-white font-bold text-sm">BCH</div>
                                    <div className="text-gray-400 text-xs">Low Vol</div>
                                </div>
                            </div>
                         </div>

                         {/* XLM */}
                         <div className="absolute bottom-[60%] right-[45%] bg-gray-800 p-3 rounded-lg border border-gray-700 shadow-xl animate-pulse z-10" style={{ animationDelay: '1.4s' }}>
                             <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-200 text-black flex items-center justify-center font-bold">X</div>
                                <div>
                                    <div className="text-white font-bold text-sm">XLM</div>
                                    <div className="text-green-400 text-xs">Bounce</div>
                                </div>
                            </div>
                         </div>

                         {/* PEPE */}
                         <div className="absolute top-[45%] right-[25%] bg-gray-800 p-3 rounded-lg border border-gray-700 shadow-xl animate-pulse z-10" style={{ animationDelay: '0.9s' }}>
                             <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center font-bold text-white text-[10px]">PE</div>
                                <div>
                                    <div className="text-white font-bold text-sm">PEPE</div>
                                    <div className="text-green-400 text-xs">Meme Rally</div>
                                </div>
                            </div>
                         </div>

                         {/* FET */}
                         <div className="absolute top-[5%] left-[60%] bg-gray-800 p-3 rounded-lg border border-gray-700 shadow-xl animate-pulse z-10" style={{ animationDelay: '3.2s' }}>
                             <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-900 flex items-center justify-center font-bold text-white">F</div>
                                <div className="hidden sm:block">
                                    <div className="text-white font-bold text-sm">FET</div>
                                    <div className="text-cyan-400 text-xs">AI Surge</div>
                                </div>
                            </div>
                         </div>

                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};