import React, { useState, useEffect } from 'react';
import { CoinAnalysis } from '../types';

interface TradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  coin: CoinAnalysis;
  currentBalance: number;
  currentHolding: number;
  onConfirm: (amount: number, type: 'BUY' | 'SELL') => void;
}

export const TradeModal: React.FC<TradeModalProps> = ({ 
  isOpen, onClose, coin, currentBalance, currentHolding, onConfirm 
}) => {
  const [type, setType] = useState<'BUY' | 'SELL'>('BUY');
  const [amount, setAmount] = useState<string>(''); // Amount in COINS
  const [usdValue, setUsdValue] = useState<number>(0);

  useEffect(() => {
    if (isOpen) {
        setAmount('');
        setUsdValue(0);
        setType('BUY');
    }
  }, [isOpen]);

  useEffect(() => {
    const val = parseFloat(amount);
    if (!isNaN(val)) {
        setUsdValue(val * coin.price);
    } else {
        setUsdValue(0);
    }
  }, [amount, coin.price]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (val > 0) {
        onConfirm(val, type);
        onClose();
    }
  };

  const setMax = () => {
    if (type === 'BUY') {
        const maxCoins = currentBalance / coin.price;
        setAmount(maxCoins.toFixed(6));
    } else {
        setAmount(currentHolding.toString());
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-gray-900 border-t sm:border border-gray-700 rounded-t-2xl sm:rounded-2xl w-full max-w-md shadow-2xl overflow-hidden pb-4 sm:pb-0">
            {/* Header */}
            <div className="bg-gray-800 p-4 border-b border-gray-700 flex justify-between items-center">
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                    Trade {coin.name} <span className="text-gray-500 text-sm">({coin.symbol})</span>
                </h3>
                <button onClick={onClose} className="p-2 -mr-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-700 transition-colors">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-700">
                <button 
                    onClick={() => setType('BUY')}
                    className={`flex-1 py-4 font-bold text-base transition-colors ${type === 'BUY' ? 'bg-green-500/10 text-green-400 border-b-2 border-green-500' : 'text-gray-400 hover:bg-gray-800'}`}
                >
                    BUY
                </button>
                <button 
                    onClick={() => setType('SELL')}
                    className={`flex-1 py-4 font-bold text-base transition-colors ${type === 'SELL' ? 'bg-red-500/10 text-red-400 border-b-2 border-red-500' : 'text-gray-400 hover:bg-gray-800'}`}
                >
                    SELL
                </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="flex justify-between text-base text-gray-400">
                    <span>Current Price:</span>
                    <span className="text-white font-mono">${coin.price.toLocaleString()}</span>
                </div>

                <div className="flex justify-between text-base text-gray-400">
                    <span>Available:</span>
                    <span className="text-white font-mono">
                        {type === 'BUY' ? `$${currentBalance.toLocaleString()}` : `${currentHolding} ${coin.symbol}`}
                    </span>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">Amount ({coin.symbol})</label>
                    <div className="relative">
                        <input 
                            type="number" 
                            inputMode="decimal"
                            step="any"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full bg-gray-950 border border-gray-700 rounded-xl p-4 text-xl text-white font-mono focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
                            placeholder="0.00"
                        />
                        <button 
                            type="button"
                            onClick={setMax}
                            className="absolute right-3 top-3 bottom-3 text-xs bg-gray-800 hover:bg-gray-700 text-cyan-400 px-3 rounded-lg transition-colors font-bold uppercase tracking-wider"
                        >
                            MAX
                        </button>
                    </div>
                </div>

                <div className="bg-gray-950/50 rounded-xl p-4 border border-gray-800 flex justify-between items-center">
                    <span className="text-sm text-gray-400">Estimated Total</span>
                    <span className="text-xl font-bold text-white font-mono">${usdValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                </div>

                <button 
                    type="submit"
                    className={`w-full py-4 rounded-xl font-bold text-lg text-white shadow-lg transition-all transform active:scale-95 ${type === 'BUY' ? 'bg-green-600 hover:bg-green-500 shadow-green-900/20' : 'bg-red-600 hover:bg-red-500 shadow-red-900/20'}`}
                >
                    {type} {coin.symbol}
                </button>
            </form>
        </div>
    </div>
  );
};