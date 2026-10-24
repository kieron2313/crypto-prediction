import React, { useState } from 'react';
import { User, Transaction } from '../types';
import { MonetizeSpace } from './MonetizeSpace';

interface UserProfileProps {
  user: User;
  onUpdateUser: (updatedUser: User) => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ user, onUpdateUser }) => {
  const [amount, setAmount] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);

  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) return;

    setIsDepositing(true);

    // Simulate API delay
    setTimeout(() => {
        const newTransaction: Transaction = {
            id: crypto.randomUUID(),
            type: 'BUY', // Using BUY type for deposit logic simplicity in this demo context, or could be a new type
            symbol: 'USD (Deposit)',
            amount: val,
            price: 1,
            date: new Date().toISOString()
        };

        const updatedUser = {
            ...user,
            balance: user.balance + val,
            transactions: [newTransaction, ...user.transactions]
        };

        onUpdateUser(updatedUser);
        setAmount('');
        setIsDepositing(false);
        alert(`Successfully deposited $${val.toLocaleString()}`);
    }, 1000);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: User Card */}
        <div className="lg:col-span-1 space-y-6">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center shadow-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-cyan-900/20 to-transparent"></div>
                
                <div className="relative z-10 w-24 h-24 mx-auto bg-gray-800 rounded-full border-4 border-gray-900 flex items-center justify-center text-3xl font-bold text-white mb-4 shadow-xl">
                    {user.name[0].toUpperCase()}
                </div>
                
                <h2 className="text-xl font-bold text-white">{user.name}</h2>
                <p className="text-sm text-gray-500 mb-4">{user.email}</p>
                
                <div className="flex justify-center gap-2 mb-6">
                    {user.isAdmin && (
                        <span className="px-3 py-1 bg-cyan-900/30 text-cyan-400 text-xs font-bold uppercase rounded-full border border-cyan-800">
                            Admin
                        </span>
                    )}
                    <span className="px-3 py-1 bg-gray-800 text-gray-300 text-xs font-bold uppercase rounded-full border border-gray-700">
                        Pro Member
                    </span>
                </div>

                <div className="border-t border-gray-800 pt-6 text-left">
                    <div className="flex justify-between items-center mb-2">
                         <span className="text-xs text-gray-500 uppercase">User ID</span>
                         <span className="text-xs text-gray-300 font-mono">#882910</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                         <span className="text-xs text-gray-500 uppercase">Joined</span>
                         <span className="text-xs text-gray-300">Oct 2023</span>
                    </div>
                    <div className="flex justify-between items-center">
                         <span className="text-xs text-gray-500 uppercase">Region</span>
                         <span className="text-xs text-gray-300">Global</span>
                    </div>
                </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <h3 className="text-gray-400 text-xs font-bold uppercase mb-4">Account Security</h3>
                <button className="w-full text-left flex items-center justify-between p-3 rounded-lg hover:bg-gray-800 transition mb-2">
                    <span className="text-sm text-gray-300">Change Password</span>
                    <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
                <button className="w-full text-left flex items-center justify-between p-3 rounded-lg hover:bg-gray-800 transition mb-2">
                    <span className="text-sm text-gray-300">Two-Factor Auth</span>
                    <span className="text-xs text-green-400 bg-green-900/20 px-2 py-0.5 rounded">Enabled</span>
                </button>
                <button className="w-full text-left flex items-center justify-between p-3 rounded-lg hover:bg-gray-800 transition">
                    <span className="text-sm text-gray-300">API Keys</span>
                    <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
            </div>
        </div>

        {/* Right Column: Wallet & Settings */}
        <div className="lg:col-span-2 space-y-6">
            
            {/* Balance Card */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 border border-gray-700 rounded-2xl p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-32 bg-cyan-500/5 blur-[80px] rounded-full pointer-events-none"></div>
                
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative z-10">
                    <div>
                        <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-1">Total Balance</h3>
                        <div className="text-4xl font-bold text-white font-mono">
                            ${user.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Available for trading</p>
                    </div>
                    
                    <form onSubmit={handleDeposit} className="flex flex-col gap-2 w-full sm:w-auto">
                        <div className="flex items-center gap-2">
                             <div className="relative flex-grow">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                <input 
                                    type="number" 
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="Amount"
                                    className="bg-black/30 border border-gray-600 text-white text-sm rounded-lg pl-6 pr-4 py-2.5 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none w-full sm:w-32"
                                />
                             </div>
                             <button 
                                type="submit"
                                disabled={isDepositing || !amount}
                                className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2.5 px-4 rounded-lg text-sm transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                             >
                                {isDepositing ? 'Processing...' : 'Deposit Funds'}
                             </button>
                        </div>
                        <p className="text-[10px] text-gray-500 text-right">Instant deposit via Demo Bank</p>
                    </form>
                </div>
            </div>

            <MonetizeSpace />

            {/* Recent Activity Summary */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center">
                    <h3 className="text-white font-bold">Recent Account Activity</h3>
                    <button className="text-xs text-cyan-400 hover:text-cyan-300">View Full History</button>
                </div>
                <div className="divide-y divide-gray-800">
                    {user.transactions.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 text-sm">No transactions yet</div>
                    ) : (
                        user.transactions.slice(0, 5).map(tx => (
                            <div key={tx.id} className="px-6 py-4 flex justify-between items-center hover:bg-gray-800/50 transition">
                                <div className="flex items-center gap-4">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tx.type === 'BUY' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                                        {tx.type === 'BUY' ? (
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                                        ) : (
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                                        )}
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-white">{tx.type === 'BUY' ? 'Deposit / Buy' : 'Withdraw / Sell'}</div>
                                        <div className="text-xs text-gray-500">{new Date(tx.date).toLocaleDateString()} • {tx.symbol}</div>
                                    </div>
                                </div>
                                <div className={`text-sm font-mono font-bold ${tx.type === 'BUY' ? 'text-green-400' : 'text-white'}`}>
                                    {tx.type === 'BUY' ? '+' : '-'}${Math.abs(tx.amount * tx.price).toLocaleString()}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};