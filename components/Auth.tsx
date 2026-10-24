import React, { useState } from 'react';
import { User } from '../types';
import { userService } from '../services/userService';

interface AuthProps {
  onLogin: (user: User) => void;
  onBack: () => void;
  initialLoginMode?: boolean;
}

export const Auth: React.FC<AuthProps> = ({ onLogin, onBack, initialLoginMode = true }) => {
  const [isLogin, setIsLogin] = useState(initialLoginMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let user;
      if (isLogin) {
        user = await userService.login(email, password);
      } else {
        user = await userService.register(email, password, name);
      }
      onLogin(user);
    } catch (err: any) {
      console.error(err);
      let msg = "Authentication failed.";
      
      // Map Firebase error codes to user-friendly messages
      const errorMsg = err.message || "";
      if (errorMsg.includes("auth/invalid-credential") || errorMsg.includes("auth/user-not-found") || errorMsg.includes("auth/wrong-password")) {
          msg = "Invalid email or password.";
      } else if (errorMsg.includes("auth/email-already-in-use")) {
          msg = "This email is already registered.";
      } else if (errorMsg.includes("auth/weak-password")) {
          msg = "Password should be at least 6 characters.";
      } else if (errorMsg.includes("auth/user-disabled")) {
          msg = "This account has been disabled.";
      } else if (errorMsg.includes("API key not valid")) {
          msg = "Configuration Error: Check API Keys in services/firebase.ts";
      } else if (errorMsg.includes("network-request-failed")) {
          msg = "Network Error. Check your internet connection.";
      } else if (errorMsg.includes("auth/unauthorized-domain")) {
          const currentDomain = window.location.hostname;
          msg = `Domain not authorized. Go to Firebase Console > Authentication > Settings > Authorized Domains and add: ${currentDomain}`;
      } else if (errorMsg.includes("client is offline") || errorMsg.includes("not-found")) {
          msg = "Setup Required: Firestore Database not found. Go to Firebase Console > Build > Firestore Database and click 'Create Database'.";
      } else {
          msg = `Error: ${errorMsg}`;
      }
      
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 relative">
        
        {/* Back Button */}
        <button 
            onClick={onBack}
            className="absolute top-4 left-4 sm:top-8 sm:left-8 flex items-center gap-2 text-gray-400 hover:text-cyan-400 transition-colors group"
        >
            <div className="w-8 h-8 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center group-hover:border-cyan-500/50 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
            </div>
            <span className="text-sm font-medium">Back to Home</span>
        </button>

        <div className="w-full max-w-md bg-gray-900/80 backdrop-blur-xl border border-gray-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            {/* Decorative Gradient */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500"></div>
            
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">
                    {isLogin ? 'Welcome Back' : 'Create Account'}
                </h2>
                <p className="text-gray-400 text-sm">
                    {isLogin ? 'Enter your credentials to access the scanner' : 'Join the CryptoMind community today'}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                {!isLogin && (
                    <div className="space-y-1 animate-in fade-in slide-in-from-bottom-2">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Full Name</label>
                        <input 
                            type="text" 
                            required={!isLogin}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-gray-950/50 border border-gray-700 rounded-xl p-3.5 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all outline-none placeholder:text-gray-700"
                            placeholder="John Doe"
                        />
                    </div>
                )}

                <div className="space-y-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Email Address</label>
                    <input 
                        type="email" 
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-gray-950/50 border border-gray-700 rounded-xl p-3.5 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all outline-none placeholder:text-gray-700"
                        placeholder="you@example.com"
                    />
                </div>

                <div className="space-y-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Password</label>
                    <input 
                        type="password" 
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-gray-950/50 border border-gray-700 rounded-xl p-3.5 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all outline-none placeholder:text-gray-700"
                        placeholder="••••••••"
                    />
                </div>

                {error && (
                    <div className="text-red-400 text-sm text-center bg-red-900/20 py-2 rounded-lg border border-red-900/30 flex items-center justify-center gap-2 px-2">
                        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span className="break-words w-full text-xs">{error}</span>
                    </div>
                )}

                <button 
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-cyan-900/20 hover:shadow-cyan-500/30 transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none mt-2"
                >
                    {loading ? (
                        <span className="flex items-center justify-center gap-2">
                             <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            {isLogin ? 'Signing In...' : 'Creating Account...'}
                        </span>
                    ) : (
                        isLogin ? 'Sign In' : 'Create Free Account'
                    )}
                </button>
            </form>

            <div className="mt-6 text-center">
                <p className="text-gray-500 text-sm">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}
                    <button 
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setError('');
                        }}
                        className="ml-2 text-cyan-400 font-bold hover:text-cyan-300 transition-colors"
                    >
                        {isLogin ? 'Register Now' : 'Sign In'}
                    </button>
                </p>
            </div>
        </div>
    </div>
  );
};