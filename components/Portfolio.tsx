import React from 'react';
import { User, CoinAnalysis } from '../types';
import { MonetizeSpace } from './MonetizeSpace';

interface PortfolioProps {
  user: User;
  coins: CoinAnalysis[];
  onTrade: (coin: CoinAnalysis) => void;
}

export const Portfolio: React.FC<PortfolioProps> = ({ user, coins, onTrade }) => {
  const getCoinPrice = (symbol: string) => coins.find(c => c.symbol === symbol)?.price || 0;
  
  const portfolioValue = user.portfolio.reduce((acc, item) => {
    return acc + (item.amount * getCoinPrice(item.symbol));
  }, 0);

  const totalBalance = user.balance + portfolioValue;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Card */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-8 border border-gray-700 mb-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-32 bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none"></div>
            
            <h2 className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-1">Total Net Worth</h2>
            <div className="text-4xl md:text-5xl font-bold text-white mb-6 font-mono">
                ${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-black/20 rounded-lg p-4 backdrop-blur-sm">
                    <div className="text-gray-400 text-xs mb-1">Available Cash (USD)</div>
                    <div className="text-xl font-bold text-green-400 font-mono">${user.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                </div>
                <div className="bg-black/20 rounded-lg p-4 backdrop-blur-sm">
                    <div className="text-gray-400 text-xs mb-1">Asset Value</div>
                    <div className="text-xl font-bold text-cyan-400 font-mono">${portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                </div>
            </div>
        </div>

        <MonetizeSpace slotId="portfolio_main" />

        {/* Holdings List */}
        <h3 className="text-xl font-bold text-white mb-4">Your Assets</h3>
        
        {user.portfolio.length === 0 ? (
            <div className="text-center py-12 bg-gray-900/50 rounded-xl border border-dashed border-gray-800 mb-12">
                <p className="text-gray-500">You don't hold any assets yet.</p>
                <button className="mt-4 text-cyan-400 hover:underline">Go to Market</button>
            </div>
        ) : (
            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden mb-12">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-950 text-gray-400 text-xs uppercase">
                            <tr>
                                <th className="px-6 py-4">Asset</th>
                                <th className="px-6 py-4">Balance</th>
                                <th className="px-6 py-4">Avg Buy Price</th>
                                <th className="px-6 py-4">Current Price</th>
                                <th className="px-6 py-4">Value</th>
                                <th className="px-6 py-4">P/L</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {user.portfolio.map((item) => {
                                const currentPrice = getCoinPrice(item.symbol);
                                const value = item.amount * currentPrice;
                                const costBasis = item.amount * item.avgBuyPrice;
                                const pl = value - costBasis;
                                const plPercent = costBasis > 0 ? (pl / costBasis) * 100 : 0;
                                const isProfit = pl >= 0;

                                return (
                                    <tr key={item.symbol} className="hover:bg-gray-800/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-white">{item.symbol}</div>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-gray-300">
                                            {item.amount.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-gray-300">
                                            ${item.avgBuyPrice.toLocaleString(undefined, { minimumFractionDigits: 7, maximumFractionDigits: 7 })}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-gray-300">
                                            ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 7, maximumFractionDigits: 7 })}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-white font-medium">
                                            ${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                        </td>
                                        <td className={`px-6 py-4 font-mono font-medium ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
                                            {isProfit ? '+' : ''}{pl.toLocaleString(undefined, { maximumFractionDigits: 2 })} ({plPercent.toFixed(2)}%)
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button 
                                                onClick={() => {
                                                    const coin = coins.find(c => c.symbol === item.symbol);
                                                    if (coin) onTrade(coin);
                                                }}
                                                className="text-xs bg-gray-800 hover:bg-gray-700 text-white px-3 py-1.5 rounded transition"
                                            >
                                                Trade
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* Transaction History */}
        <h3 className="text-xl font-bold text-white mb-4">Transaction History</h3>
        {(!user.transactions || user.transactions.length === 0) ? (
             <div className="text-center py-8 text-gray-500 text-sm">No recent transactions</div>
        ) : (
            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-950 text-gray-400 text-xs uppercase">
                            <tr>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4">Asset</th>
                                <th className="px-6 py-4">Amount</th>
                                <th className="px-6 py-4">Price</th>
                                <th className="px-6 py-4 text-right">Total Value</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800 text-sm">
                            {user.transactions.slice(0, 50).map((tx) => (
                                <tr key={tx.id} className="hover:bg-gray-800/50 transition-colors">
                                    <td className="px-6 py-4 text-gray-400 font-mono text-xs">
                                        {new Date(tx.date).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`font-bold text-xs px-2 py-0.5 rounded ${tx.type === 'BUY' ? 'bg-green-900/30 text-green-400 border border-green-800' : 'bg-red-900/30 text-red-400 border border-red-800'}`}>
                                            {tx.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-gray-200">
                                        {tx.symbol}
                                    </td>
                                    <td className="px-6 py-4 font-mono text-gray-300">
                                        {tx.amount.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 font-mono text-gray-300">
                                        ${tx.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 7 })}
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono text-white font-medium">
                                        ${(tx.amount * tx.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

    </div>
  );
};