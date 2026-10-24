import React, { useState, useRef, useEffect } from 'react';
import { User, AdSpaceConfig } from '../types';
import { analyzeDexScreenshot } from '../services/geminiService';
import { systemService, userService } from '../services/userService';

interface AdminDashboardProps {
  users?: number; 
}

interface AnalysisResult {
  id: string;
  timestamp: string;
  content: string;
  imageUrl?: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = () => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'USERS' | 'NOTIFICATIONS' | 'AI_ANALYZER' | 'MONETIZATION'>('OVERVIEW');
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastTitle, setBroadcastTitle] = useState('');
  
  // Real Data State
  const [realUsers, setRealUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userCount, setUserCount] = useState(0);

  // Edit User State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ name: '', balance: 0, isAdmin: false });

  // Image Analyzer State
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisResult[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Monetization State
  const [adSpaces, setAdSpaces] = useState<AdSpaceConfig[]>([]);
  const [editingAd, setEditingAd] = useState<AdSpaceConfig | null>(null);

  useEffect(() => {
      const unsubscribeAds = systemService.subscribeToAds((ads) => {
          setAdSpaces(ads);
      });
      
      const loadHistory = async () => {
          try {
              const hist = await systemService.getAnalysisHistory();
              setAnalysisHistory(hist);
          } catch(e) { console.error("Error loading history", e); }
      }
      
      loadHistory();
      fetchUsers(); // Initial fetch

      return () => unsubscribeAds();
  }, []);

  const fetchUsers = async () => {
      setLoadingUsers(true);
      const users = await userService.getAllUsers();
      const count = await userService.getUserCount();
      setUserCount(count);
      setRealUsers(users);
      setLoadingUsers(false);
  };

  const handleDeleteUser = async (uid: string) => {
      if (confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
          await userService.deleteUser(uid);
          fetchUsers(); // Refresh list
      }
  };

  const openEditModal = (user: User) => {
      setEditingUser(user);
      setEditForm({
          name: user.name,
          balance: user.balance,
          isAdmin: !!user.isAdmin
      });
  };

  const handleSaveUser = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingUser) return;
      
      const updatedUser: User = {
          ...editingUser,
          name: editForm.name,
          balance: editForm.balance,
          isAdmin: editForm.isAdmin
      };

      await userService.updateUser(updatedUser);
      setEditingUser(null);
      fetchUsers(); // Refresh list
      alert("User profile updated successfully.");
  };

  const sendBroadcast = async () => {
      if (!broadcastTitle || !broadcastMsg) return;
      await userService.sendNotification('BROADCAST', broadcastTitle, broadcastMsg);
      alert("Broadcast sent successfully!");
      setBroadcastTitle('');
      setBroadcastMsg('');
  };

  const saveAds = async (newSpaces: AdSpaceConfig[]) => {
      setAdSpaces(newSpaces);
      await systemService.saveAdSpaces(newSpaces);
  };

  const handleUpdateAd = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingAd) return;
      const updatedSpaces = adSpaces.map(sp => sp.id === editingAd.id ? editingAd : sp);
      await saveAds(updatedSpaces);
      setEditingAd(null);
      alert('Ad Space Updated Successfully');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setSelectedImage(reader.result as string);
        };
        reader.readAsDataURL(file);
    }
  };

  const runAnalysis = async () => {
      if (!selectedImage) return;
      setIsAnalyzing(true);
      const resultText = await analyzeDexScreenshot(selectedImage);
      const newEntry: AnalysisResult = {
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          content: resultText,
          imageUrl: selectedImage
      };
      const newHistory = [newEntry, ...analysisHistory];
      setAnalysisHistory(newHistory);
      await systemService.saveAnalysisHistory(newHistory);
      setIsAnalyzing(false);
      setSelectedImage(null);
  };

  const clearHistory = async () => {
      if (confirm('Clear analysis history?')) {
          setAnalysisHistory([]);
          await systemService.saveAnalysisHistory([]);
      }
  };

  const groupedHistory = analysisHistory.reduce((groups, result) => {
      const dateKey = new Date(result.timestamp).toLocaleDateString('en-US', { 
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
      });
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(result);
      return groups;
  }, {} as Record<string, AnalysisResult[]>);

  const totalImpressions = adSpaces.reduce((acc, curr) => acc + (curr.impressions || 0), 0);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h2 className="text-3xl font-bold text-white tracking-tight">Admin Dashboard</h2>
        <div className="flex bg-gray-900 rounded-lg p-1 border border-gray-800 overflow-x-auto max-w-full">
            {['OVERVIEW', 'USERS', 'NOTIFICATIONS', 'AI_ANALYZER', 'MONETIZATION'].map((tab) => (
                <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`px-4 py-2 rounded text-xs font-bold uppercase transition whitespace-nowrap ${activeTab === tab ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    {tab === 'AI_ANALYZER' ? 'AI Chart Analyzer' : tab}
                </button>
            ))}
        </div>
      </div>

      {activeTab === 'OVERVIEW' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in">
            <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl">
                <div className="text-gray-500 text-xs uppercase font-bold mb-2">Total Users</div>
                <div className="text-3xl font-bold text-white">{userCount > 0 ? userCount : 'Loading...'}</div>
                <div className="text-green-500 text-xs mt-2 flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                    Real-time
                </div>
            </div>
            
            <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl">
                <div className="text-gray-500 text-xs uppercase font-bold mb-2">Total Analysis Runs</div>
                <div className="text-3xl font-bold text-cyan-400">{analysisHistory.length}</div>
                <div className="text-gray-500 text-xs mt-2">Saved Records</div>
            </div>

            <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl">
                <div className="text-gray-500 text-xs uppercase font-bold mb-2">Ad Impressions</div>
                <div className="text-3xl font-bold text-white">{totalImpressions.toLocaleString()}</div>
                <div className="text-green-500 text-xs mt-2 flex items-center gap-1">
                    Live Tracking
                </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl">
                <div className="text-gray-500 text-xs uppercase font-bold mb-2">System Health</div>
                <div className="text-3xl font-bold text-green-500">99.9%</div>
                <div className="text-gray-500 text-xs mt-2">Operational</div>
            </div>
        </div>
      )}

      {activeTab === 'USERS' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden animate-in fade-in">
             <div className="p-4 flex justify-between items-center bg-gray-950 border-b border-gray-800">
                 <h3 className="text-white font-bold">Registered Users</h3>
                 <button onClick={fetchUsers} className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                     <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                     Refresh
                 </button>
             </div>
             {loadingUsers ? (
                 <div className="p-8 text-center text-gray-500">Loading users...</div>
             ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-950 text-gray-400 text-xs uppercase">
                            <tr>
                                <th className="px-6 py-4">UID</th>
                                <th className="px-6 py-4">Name / Email</th>
                                <th className="px-6 py-4">Balance</th>
                                <th className="px-6 py-4">Role</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800 text-sm">
                            {realUsers.map((u) => (
                                <tr key={u.uid} className="hover:bg-gray-800/50">
                                    <td className="px-6 py-4 text-gray-500 font-mono text-xs">{u.uid?.slice(0, 8)}...</td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-white">{u.name}</div>
                                        <div className="text-xs text-gray-500">{u.email}</div>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-gray-300">${u.balance.toLocaleString()}</td>
                                    <td className="px-6 py-4">
                                        {u.isAdmin ? (
                                            <span className="text-cyan-400 font-bold text-xs uppercase border border-cyan-800 bg-cyan-900/20 px-2 py-1 rounded">Admin</span>
                                        ) : (
                                            <span className="text-gray-400 text-xs">User</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                                        <button 
                                            onClick={() => openEditModal(u)}
                                            className="text-cyan-400 hover:text-cyan-300 text-xs font-bold border border-cyan-900/50 bg-cyan-900/10 px-3 py-1.5 rounded hover:bg-cyan-900/30 transition"
                                        >
                                            Edit
                                        </button>
                                        {!u.isAdmin && (
                                            <button 
                                                onClick={() => u.uid && handleDeleteUser(u.uid)}
                                                className="text-red-400 hover:text-red-300 text-xs font-bold border border-red-900/50 bg-red-900/10 px-3 py-1.5 rounded hover:bg-red-900/30 transition"
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
             )}
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md shadow-2xl p-6 animate-in zoom-in-95">
                <h3 className="text-xl font-bold text-white mb-4">Edit User Profile</h3>
                <form onSubmit={handleSaveUser} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name</label>
                        <input 
                            type="text" 
                            className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:border-cyan-500 outline-none"
                            value={editForm.name}
                            onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Wallet Balance ($)</label>
                        <input 
                            type="number" 
                            className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:border-cyan-500 outline-none font-mono"
                            value={editForm.balance}
                            onChange={(e) => setEditForm({...editForm, balance: parseFloat(e.target.value)})}
                        />
                    </div>
                    <div className="flex items-center gap-3 py-2">
                        <input 
                            type="checkbox" 
                            id="adminCheck"
                            checked={editForm.isAdmin}
                            onChange={(e) => setEditForm({...editForm, isAdmin: e.target.checked})}
                            className="w-5 h-5 rounded border-gray-700 text-cyan-600 focus:ring-cyan-500 bg-black"
                        />
                        <label htmlFor="adminCheck" className="text-sm font-bold text-white cursor-pointer select-none">
                            Grant Admin Privileges
                        </label>
                    </div>
                    
                    <div className="flex gap-3 mt-6 pt-4 border-t border-gray-800">
                        <button 
                            type="button" 
                            onClick={() => setEditingUser(null)}
                            className="flex-1 py-3 rounded-lg font-bold text-gray-400 hover:text-white hover:bg-gray-800 transition"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            className="flex-1 py-3 rounded-lg font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition shadow-lg shadow-cyan-900/20"
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {activeTab === 'NOTIFICATIONS' && (
          <div className="bg-gray-900 border border-gray-800 p-8 rounded-xl max-w-2xl mx-auto animate-in fade-in">
              <h3 className="text-lg font-bold text-white mb-4">Send Broadcast / Notification</h3>
              <p className="text-gray-400 text-sm mb-6">This message will appear in the notifications center for all users (last 7 days).</p>
              
              <div className="space-y-4">
                  <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Title</label>
                      <input 
                        type="text"
                        className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:border-cyan-500 outline-none"
                        placeholder="e.g. Market Alert: Bitcoin"
                        value={broadcastTitle}
                        onChange={(e) => setBroadcastTitle(e.target.value)}
                      />
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Message Content</label>
                      <textarea 
                        className="w-full bg-black border border-gray-700 rounded-lg p-4 text-white focus:border-cyan-500 outline-none h-32"
                        placeholder="e.g. Bitcoin has broken key resistance at $68k..."
                        value={broadcastMsg}
                        onChange={(e) => setBroadcastMsg(e.target.value)}
                      ></textarea>
                  </div>
                  <div className="flex justify-end">
                      <button 
                        className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-2 px-6 rounded-lg transition"
                        onClick={sendBroadcast}
                        disabled={!broadcastMsg || !broadcastTitle}
                      >
                          Send Broadcast
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* REUSED COMPONENTS FOR AI & MONETIZATION (Kept same logic, just re-rendering) */}
      {activeTab === 'AI_ANALYZER' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in">
            {/* ... Same AI Logic ... */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 flex flex-col items-center justify-center text-center h-fit">
                <input type="file" ref={fileInputRef} accept="image/*" onChange={handleImageUpload} className="hidden" />
                {selectedImage ? (
                    <div className="w-full mb-6">
                        <img src={selectedImage} alt="Preview" className="max-h-[300px] mx-auto rounded-lg border border-gray-700 shadow-xl" />
                        <button onClick={() => setSelectedImage(null)} className="mt-4 text-sm text-red-400 hover:text-red-300 underline">Remove</button>
                    </div>
                ) : (
                    <div onClick={() => fileInputRef.current?.click()} className="w-full h-64 border-2 border-dashed border-gray-700 hover:border-cyan-500/50 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors group bg-black/20">
                        <p className="text-gray-400 font-medium">Click to upload DexScreener Screenshot</p>
                    </div>
                )}
                <button onClick={runAnalysis} disabled={!selectedImage || isAnalyzing} className={`w-full py-4 rounded-lg font-bold text-lg uppercase tracking-wider transition-all ${!selectedImage || isAnalyzing ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'}`}>
                    {isAnalyzing ? 'Analyzing...' : 'Analyze Hidden Gem'}
                </button>
            </div>
            
            <div className="flex flex-col gap-8">
                 {Object.keys(groupedHistory).map((date) => (
                     <div key={date} className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-xl relative overflow-hidden">
                         <div className="border-b border-gray-800 pb-3 mb-6 flex items-center gap-3">
                             <h3 className="text-xl font-bold text-white tracking-tight">{date}</h3>
                         </div>
                         <div className="space-y-6">
                             {groupedHistory[date].map((item) => (
                                 <div key={item.id} className="bg-black/30 rounded-lg p-5 border border-gray-800">
                                     <div className="prose prose-invert prose-sm max-w-none text-gray-300" dangerouslySetInnerHTML={{ __html: item.content }} />
                                 </div>
                             ))}
                         </div>
                     </div>
                 ))}
                 {activeTab === 'AI_ANALYZER' && analysisHistory.length > 0 && (
                     <button onClick={clearHistory} className="text-xs text-red-400 hover:text-red-300 self-end">Clear History</button>
                 )}
            </div>
        </div>
      )}

      {activeTab === 'MONETIZATION' && (
          <div className="animate-in fade-in">
              {/* ... Same Monetization Logic ... */}
              {/* Layout Map Wireframe */}
              <div className="mb-10 bg-gray-950 border border-gray-800 rounded-xl p-8">
                  <h3 className="text-lg font-bold text-white mb-6">Interactive Ad Placement Map</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Scanner Template */}
                      <div className="border border-gray-800 rounded bg-gray-900 p-2 aspect-[9/16] relative group">
                          <div className="text-[10px] text-gray-500 text-center mb-1">Scanner Feed</div>
                          <div className="w-full h-4 bg-gray-800 mb-1"></div>
                          <div 
                             onClick={() => setEditingAd(adSpaces.find(s => s.id === 'scanner_feed') || null)}
                             className={`w-full h-8 border-2 border-dashed rounded flex items-center justify-center text-[9px] cursor-pointer hover:bg-cyan-900/20 transition ${editingAd?.id === 'scanner_feed' ? 'border-cyan-500 text-cyan-400' : 'border-gray-700 text-gray-600'}`}
                          >
                              {adSpaces.find(s => s.id === 'scanner_feed')?.active ? 'Active' : 'Empty'}
                          </div>
                          <div className="w-full h-20 bg-gray-800 mt-1"></div>
                      </div>

                      {/* Signals Template */}
                      <div className="border border-gray-800 rounded bg-gray-900 p-2 aspect-[9/16] relative group">
                          <div className="text-[10px] text-gray-500 text-center mb-1">Top Signals</div>
                          <div 
                             onClick={() => setEditingAd(adSpaces.find(s => s.id === 'signals_top') || null)}
                             className={`w-full h-10 border-2 border-dashed rounded flex items-center justify-center text-[9px] cursor-pointer hover:bg-cyan-900/20 transition mb-1 ${editingAd?.id === 'signals_top' ? 'border-cyan-500 text-cyan-400' : 'border-gray-700 text-gray-600'}`}
                          >
                              {adSpaces.find(s => s.id === 'signals_top')?.active ? 'Active' : 'Empty'}
                          </div>
                          <div className="grid grid-cols-2 gap-1">
                             <div className="h-10 bg-gray-800"></div>
                             <div className="h-10 bg-gray-800"></div>
                          </div>
                      </div>
                      
                      {/* Gem Hunter Template */}
                      <div className="border border-gray-800 rounded bg-gray-900 p-2 aspect-[9/16] relative group">
                          <div className="text-[10px] text-gray-500 text-center mb-1">Gem Hunter</div>
                          <div 
                             onClick={() => setEditingAd(adSpaces.find(s => s.id === 'gem_hunter_top') || null)}
                             className={`w-full h-8 border-2 border-dashed rounded flex items-center justify-center text-[9px] cursor-pointer hover:bg-cyan-900/20 transition mb-1 ${editingAd?.id === 'gem_hunter_top' ? 'border-cyan-500 text-cyan-400' : 'border-gray-700 text-gray-600'}`}
                          >
                              {adSpaces.find(s => s.id === 'gem_hunter_top')?.active ? 'Active' : 'Empty'}
                          </div>
                          <div className="w-full h-24 bg-gray-800"></div>
                      </div>

                       {/* Portfolio Template */}
                       <div className="border border-gray-800 rounded bg-gray-900 p-2 aspect-[9/16] relative group flex flex-col">
                          <div className="text-[10px] text-gray-500 text-center mb-1">Portfolio</div>
                          <div className="w-full h-20 bg-gray-800 mb-auto"></div>
                          <div 
                             onClick={() => setEditingAd(adSpaces.find(s => s.id === 'portfolio_main') || null)}
                             className={`w-full h-8 border-2 border-dashed rounded flex items-center justify-center text-[9px] cursor-pointer hover:bg-cyan-900/20 transition mt-1 ${editingAd?.id === 'portfolio_main' ? 'border-cyan-500 text-cyan-400' : 'border-gray-700 text-gray-600'}`}
                          >
                              {adSpaces.find(s => s.id === 'portfolio_main')?.active ? 'Active' : 'Empty'}
                          </div>
                      </div>
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  {adSpaces.map(space => (
                      <div key={space.id} onClick={() => setEditingAd(space)} className={`border rounded-xl p-5 cursor-pointer transition-all ${space.active ? 'bg-gray-900 border-gray-800' : 'bg-gray-900/50 border-gray-800 opacity-60'} ${editingAd?.id === space.id ? 'ring-2 ring-cyan-500 border-transparent' : ''}`}>
                          <h4 className="font-bold text-white text-lg mb-1">{space.name}</h4>
                          <div className="text-xs text-cyan-400 font-mono">{(space.impressions || 0).toLocaleString()} views</div>
                      </div>
                  ))}
              </div>
              {editingAd && (
                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 shadow-2xl">
                      <div className="flex justify-between items-center mb-6">
                          <h3 className="text-xl font-bold text-white">Edit: <span className="text-cyan-400">{editingAd.name}</span></h3>
                          <button onClick={() => setEditingAd(null)} className="text-gray-500 hover:text-white">Close</button>
                      </div>
                      <form onSubmit={handleUpdateAd} className="space-y-6 max-w-3xl">
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                               <div>
                                   <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Ad Type</label>
                                   <select 
                                        className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:border-cyan-500 outline-none"
                                        value={editingAd.type}
                                        onChange={(e) => setEditingAd({...editingAd, type: e.target.value as any})}
                                   >
                                       <option value="DEFAULT">Default Placeholder</option>
                                       <option value="BANNER">Image Banner</option>
                                       <option value="CODE">Custom HTML/Script</option>
                                   </select>
                               </div>
                           </div>

                           {editingAd.type === 'BANNER' && (
                               <>
                                   <div>
                                       <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Banner Image URL</label>
                                       <input 
                                            type="text"
                                            className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:border-cyan-500 outline-none"
                                            placeholder="https://example.com/banner.jpg"
                                            value={editingAd.bannerUrl || ''}
                                            onChange={(e) => setEditingAd({...editingAd, bannerUrl: e.target.value})}
                                       />
                                   </div>
                                   <div>
                                       <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Destination Link</label>
                                       <input 
                                            type="text"
                                            className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:border-cyan-500 outline-none"
                                            placeholder="https://mysponsor.com"
                                            value={editingAd.linkUrl || ''}
                                            onChange={(e) => setEditingAd({...editingAd, linkUrl: e.target.value})}
                                       />
                                   </div>
                               </>
                           )}

                           {editingAd.type === 'CODE' && (
                               <div>
                                   <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Custom HTML / Script Code</label>
                                   <textarea 
                                        className="w-full bg-black border border-gray-700 rounded-lg p-4 text-white font-mono text-xs focus:border-cyan-500 outline-none h-40"
                                        placeholder="<script>...</script> or <iframe ...></iframe>"
                                        value={editingAd.customCode || ''}
                                        onChange={(e) => setEditingAd({...editingAd, customCode: e.target.value})}
                                   ></textarea>
                               </div>
                           )}

                           <div className="flex items-center gap-4">
                               <button type="button" onClick={() => setEditingAd({...editingAd, active: !editingAd.active})} className={`px-4 py-2 rounded-lg text-sm font-bold ${editingAd.active ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-400'}`}>{editingAd.active ? 'ACTIVE' : 'INACTIVE'}</button>
                           </div>
                           <div className="pt-4 border-t border-gray-800 flex justify-end">
                               <button type="submit" className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-8 rounded-lg">Save Changes</button>
                           </div>
                      </form>
                  </div>
              )}
          </div>
      )}
    </div>
  );
};